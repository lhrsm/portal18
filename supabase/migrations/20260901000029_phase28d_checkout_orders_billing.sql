-- ============================================================================
-- MIGRATION 00029: Phase 28D — Canonical Orders, Checkout, Billing & Operations Foundation
-- ============================================================================

-- 1. Enhance Orders Table with Canonical Multi-Gateway and Commercial Snapshot Fields
ALTER TABLE public.orders
    ALTER COLUMN advertiser_id DROP NOT NULL;

DO $$ BEGIN
    ALTER TABLE public.orders
        ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS consumer_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'advertiser_subscription'
            CHECK (product_type IN ('advertiser_subscription', 'consumer_subscription', 'boost', 'campaign')),
        ADD COLUMN IF NOT EXISTS product_id uuid,
        ADD COLUMN IF NOT EXISTS billing_period_id uuid REFERENCES public.billing_periods(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS subtotal_minor integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS discount_minor integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_minor integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'created'
            CHECK (payment_status IN ('created', 'pending', 'processing', 'authorized', 'paid', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded', 'chargeback', 'disputed')),
        ADD COLUMN IF NOT EXISTS selected_payment_method text
            CHECK (selected_payment_method IN ('pix', 'credit_card', 'recurring_card', 'boost_instant')),
        ADD COLUMN IF NOT EXISTS provider_code text,
        ADD COLUMN IF NOT EXISTS provider_payment_reference text,
        ADD COLUMN IF NOT EXISTS commercial_snapshot jsonb NOT NULL DEFAULT '{
            "product_name": "",
            "plan_name": "",
            "billing_period": "",
            "duration_days": 30,
            "unit_price_minor": 0,
            "discount_minor": 0,
            "total_minor": 0,
            "currency": "BRL",
            "pricing_policy_version": "v1",
            "entitlement_policy_version": "v1"
        }'::jsonb,
        ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '2 hours'),
        ADD COLUMN IF NOT EXISTS completed_at timestamptz,
        ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON public.orders(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_consumer_id ON public.orders(consumer_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 2. Boost Inventory Reservation Table (Prevents Concurrency Overselling with TTL)
CREATE TABLE IF NOT EXISTS public.boost_inventory_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.promotion_products(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    placement public.promotion_placement NOT NULL,
    target_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'released', 'expired')),
    reserved_until timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boost_res_placement_date ON public.boost_inventory_reservations(placement, target_date, status);
CREATE INDEX IF NOT EXISTS idx_boost_res_order ON public.boost_inventory_reservations(order_id);

-- 3. Atomic RPC: Create Canonical Order with Server-Authoritative Pricing Calculation
CREATE OR REPLACE FUNCTION public.create_canonical_order(
    p_profile_id uuid,
    p_product_type text,
    p_product_id uuid,
    p_billing_period_id uuid DEFAULT NULL,
    p_coupon_code text DEFAULT NULL,
    p_selected_payment_method text DEFAULT 'pix'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_subtotal integer := 0;
    v_discount integer := 0;
    v_total integer := 0;
    v_product_name text := '';
    v_plan_name text := '';
    v_billing_period_name text := '';
    v_duration_days integer := 30;
    v_currency text := 'BRL';
    v_pricing_policy text := 'v1';
    v_advertiser_id uuid := NULL;
    v_consumer_profile_id uuid := NULL;
    v_coupon_id uuid := NULL;
    v_snapshot jsonb;
BEGIN
    -- 1. Resolve product details and server-authoritative price
    IF p_product_type = 'advertiser_subscription' THEN
        -- Verify advertiser profile belongs to user
        SELECT id INTO v_advertiser_id FROM public.advertiser_profiles WHERE user_id = p_profile_id LIMIT 1;
        IF v_advertiser_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Perfil de anunciante não encontrado.');
        END IF;

        -- Fetch plan & pricing matrix
        SELECT p.name, bp.name, bp.duration_days, ppm.price_cents
        INTO v_plan_name, v_billing_period_name, v_duration_days, v_subtotal
        FROM public.plans p
        JOIN public.plan_pricing_matrix ppm ON ppm.plan_id = p.id
        JOIN public.billing_periods bp ON bp.id = ppm.billing_period_id
        WHERE p.id = p_product_id AND bp.id = p_billing_period_id AND ppm.is_active = true
        LIMIT 1;

        IF v_subtotal IS NULL OR v_subtotal <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Preço do plano não encontrado para o período.');
        END IF;
        v_product_name := 'Plano de Anunciante — ' || v_plan_name;

    ELSIF p_product_type = 'consumer_subscription' THEN
        v_consumer_profile_id := p_profile_id;

        -- Fetch consumer plan pricing
        SELECT cp.name, bp.name, bp.duration_days, cpp.price_cents
        INTO v_plan_name, v_billing_period_name, v_duration_days, v_subtotal
        FROM public.consumer_plans cp
        JOIN public.consumer_plan_pricing cpp ON cpp.plan_id = cp.id
        JOIN public.billing_periods bp ON bp.id = cpp.billing_period_id
        WHERE cp.id = p_product_id AND bp.id = p_billing_period_id AND cpp.is_active = true
        LIMIT 1;

        IF v_subtotal IS NULL OR v_subtotal <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Preço do plano Consumer Premium não encontrado.');
        END IF;
        v_product_name := 'Assinatura — ' || v_plan_name;

    ELSIF p_product_type IN ('boost', 'campaign') THEN
        SELECT id INTO v_advertiser_id FROM public.advertiser_profiles WHERE user_id = p_profile_id LIMIT 1;
        IF v_advertiser_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Perfil de anunciante não encontrado.');
        END IF;

        SELECT pp.name, pp.price_amount, (pp.duration_hours / 24)
        INTO v_product_name, v_subtotal, v_duration_days
        FROM public.promotion_products pp
        WHERE pp.id = p_product_id AND pp.status = 'active'
        LIMIT 1;

        IF v_subtotal IS NULL OR v_subtotal <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Produto de impulsionamento não encontrado.');
        END IF;
        v_billing_period_name := 'Instantâneo';
        v_plan_name := v_product_name;

    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Tipo de produto inválido.');
    END IF;

    -- 2. Validate Coupon Server-Side (if provided)
    IF p_coupon_code IS NOT NULL AND btrim(p_coupon_code) <> '' THEN
        SELECT id, discount_value, discount_type INTO v_coupon_id, v_discount, v_pricing_policy
        FROM public.coupons
        WHERE code = upper(btrim(p_coupon_code))
          AND status = 'active'
          AND (expires_at IS NULL OR expires_at > now())
          AND (usage_limit IS NULL OR usage_count < usage_limit)
        LIMIT 1;

        IF v_coupon_id IS NOT NULL THEN
            -- Calculate discount
            IF v_pricing_policy = 'percentage' THEN
                v_discount := (v_subtotal * v_discount) / 100;
            END IF;
            IF v_discount > v_subtotal THEN
                v_discount := v_subtotal;
            END IF;
        ELSE
            v_discount := 0;
        END IF;
    END IF;

    v_total := v_subtotal - v_discount;
    IF v_total < 0 THEN v_total := 0; END IF;

    -- 3. Build Immutable Commercial Snapshot
    v_snapshot := jsonb_build_object(
        'product_name', v_product_name,
        'plan_name', v_plan_name,
        'billing_period', v_billing_period_name,
        'duration_days', v_duration_days,
        'unit_price_minor', v_subtotal,
        'discount_minor', v_discount,
        'total_minor', v_total,
        'currency', v_currency,
        'pricing_policy_version', 'v1',
        'entitlement_policy_version', 'v1',
        'created_at', now()
    );

    -- 4. Generate Unique Human-Readable Order Number
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 6));

    -- 5. Insert Order
    INSERT INTO public.orders (
        profile_id,
        advertiser_id,
        consumer_profile_id,
        order_number,
        product_type,
        product_id,
        billing_period_id,
        subtotal,
        discount_amount,
        total_amount,
        subtotal_minor,
        discount_minor,
        total_minor,
        currency,
        coupon_id,
        status,
        payment_status,
        selected_payment_method,
        commercial_snapshot,
        expires_at
    ) VALUES (
        p_profile_id,
        v_advertiser_id,
        v_consumer_profile_id,
        v_order_number,
        p_product_type,
        p_product_id,
        p_billing_period_id,
        v_subtotal,
        v_discount,
        v_total,
        v_subtotal,
        v_discount,
        v_total,
        v_currency,
        v_coupon_id,
        'pending',
        'created',
        p_selected_payment_method,
        v_snapshot,
        now() + interval '2 hours'
    ) RETURNING id INTO v_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal_minor', v_subtotal,
        'discount_minor', v_discount,
        'total_minor', v_total,
        'currency', v_currency,
        'commercial_snapshot', v_snapshot,
        'expires_at', (now() + interval '2 hours')
    );
END;
$$;

-- 4. Atomic RPC: Process Idempotent Order Fulfillment
CREATE OR REPLACE FUNCTION public.process_order_fulfillment(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order record;
    v_duration_days integer;
    v_current_end timestamptz;
    v_new_end timestamptz;
    v_sub_id uuid;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF v_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado.');
    END IF;

    -- Already fulfilled check (Idempotency)
    IF v_order.status = 'fulfilled' THEN
        RETURN jsonb_build_object('success', true, 'already_fulfilled', true, 'order_id', p_order_id);
    END IF;

    v_duration_days := COALESCE((v_order.commercial_snapshot->>'duration_days')::integer, 30);

    -- 1. Fulfill Advertiser Subscription
    IF v_order.product_type = 'advertiser_subscription' THEN
        SELECT id, current_period_end INTO v_sub_id, v_current_end
        FROM public.subscriptions
        WHERE advertiser_id = v_order.advertiser_id
        LIMIT 1;

        IF v_current_end IS NOT NULL AND v_current_end > now() THEN
            v_new_end := v_current_end + (v_duration_days || ' days')::interval;
        ELSE
            v_new_end := now() + (v_duration_days || ' days')::interval;
        END IF;

        IF v_sub_id IS NOT NULL THEN
            UPDATE public.subscriptions
            SET plan_id = v_order.product_id,
                billing_period_id = v_order.billing_period_id,
                status = 'active',
                current_period_start = now(),
                current_period_end = v_new_end,
                cancel_at_period_end = false,
                updated_at = now()
            WHERE id = v_sub_id;
        ELSE
            INSERT INTO public.subscriptions (
                advertiser_id,
                plan_id,
                billing_period_id,
                status,
                current_period_start,
                current_period_end
            ) VALUES (
                v_order.advertiser_id,
                v_order.product_id,
                v_order.billing_period_id,
                'active',
                now(),
                v_new_end
            );
        END IF;

        -- Update advertiser profile commercial status
        UPDATE public.advertiser_profiles
        SET commercial_status = 'active',
            updated_at = now()
        WHERE id = v_order.advertiser_id;

    -- 2. Fulfill Consumer Subscription
    ELSIF v_order.product_type = 'consumer_subscription' THEN
        SELECT id, current_period_end INTO v_sub_id, v_current_end
        FROM public.consumer_subscriptions
        WHERE user_profile_id = v_order.consumer_profile_id
        LIMIT 1;

        IF v_current_end IS NOT NULL AND v_current_end > now() THEN
            v_new_end := v_current_end + (v_duration_days || ' days')::interval;
        ELSE
            v_new_end := now() + (v_duration_days || ' days')::interval;
        END IF;

        IF v_sub_id IS NOT NULL THEN
            UPDATE public.consumer_subscriptions
            SET plan_id = v_order.product_id,
                status = 'active',
                current_period_start = now(),
                current_period_end = v_new_end,
                cancel_at_period_end = false,
                updated_at = now()
            WHERE id = v_sub_id;
        ELSE
            INSERT INTO public.consumer_subscriptions (
                user_profile_id,
                plan_id,
                status,
                current_period_start,
                current_period_end
            ) VALUES (
                v_order.consumer_profile_id,
                v_order.product_id,
                'active',
                now(),
                v_new_end
            );
        END IF;

    -- 3. Fulfill Boost / Campaign
    ELSIF v_order.product_type IN ('boost', 'campaign') THEN
        INSERT INTO public.advertiser_campaigns (
            advertiser_id,
            product_id,
            order_id,
            status,
            starts_at,
            ends_at,
            placement
        ) VALUES (
            v_order.advertiser_id,
            v_order.product_id,
            v_order.id,
            'active',
            now(),
            now() + (v_duration_days || ' days')::interval,
            'homepage_featured'
        );

        -- Confirm boost reservation
        UPDATE public.boost_inventory_reservations
        SET status = 'confirmed', updated_at = now()
        WHERE order_id = v_order.id;
    END IF;

    -- Mark order as fulfilled
    UPDATE public.orders
    SET status = 'fulfilled',
        payment_status = 'paid',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', 'fulfilled',
        'fulfilled_at', now()
    );
END;
$$;
