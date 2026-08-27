-- ============================================================================
-- MIGRATION 00009: Phase 6 — Plans, Subscriptions, Payments & Promotions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.billing_interval AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('incomplete', 'pending', 'active', 'past_due', 'cancelled', 'expired', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'chargeback', 'disputed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_type AS ENUM ('subscription', 'boost', 'featured_placement', 'campaign', 'other_platform_product');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.campaign_status AS ENUM ('pending_payment', 'scheduled', 'active', 'completed', 'cancelled', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.promotion_placement AS ENUM ('homepage_featured', 'city_top', 'category_top', 'search_sponsored', 'profile_recommendation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Subscription Plans Table (Section 9, 10, 11, 12)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    price_amount integer NOT NULL, -- in integer cents BRL (e.g. 4990 = R$ 49,90)
    currency text NOT NULL DEFAULT 'BRL',
    billing_interval public.billing_interval NOT NULL DEFAULT 'monthly',
    status text NOT NULL DEFAULT 'active',
    sort_order integer NOT NULL DEFAULT 0,
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    media_limit integer NOT NULL DEFAULT 10,
    video_limit integer NOT NULL DEFAULT 0,
    boost_allowance integer NOT NULL DEFAULT 0,
    analytics_level text NOT NULL DEFAULT 'basic',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_plans_status_sort ON public.subscription_plans(status, sort_order);

-- 3. Subscriptions Table (Section 15, 16, 17)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
    provider text NOT NULL DEFAULT 'unconfigured',
    provider_customer_reference text,
    provider_subscription_reference text,
    status public.subscription_status NOT NULL DEFAULT 'pending',
    billing_interval public.billing_interval NOT NULL DEFAULT 'monthly',
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    cancelled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_adv_status ON public.subscriptions(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_subs_provider_ref ON public.subscriptions(provider, provider_subscription_reference);

-- 4. Coupons Table (Section 60, 61, 62)
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    description text,
    discount_type public.discount_type NOT NULL DEFAULT 'percentage',
    discount_value integer NOT NULL, -- e.g. 20 for 20% or 1000 for R$ 10,00 off
    starts_at timestamptz,
    expires_at timestamptz,
    usage_limit integer,
    usage_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active',
    applicable_product_type public.payment_type,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Orders & Order Items Tables (Section 21, 22, 23)
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    order_number text NOT NULL UNIQUE,
    status public.order_status NOT NULL DEFAULT 'pending',
    subtotal integer NOT NULL,
    discount_amount integer NOT NULL DEFAULT 0,
    total_amount integer NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
    idempotency_key text UNIQUE,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_adv_status ON public.orders(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_type public.payment_type NOT NULL,
    product_id uuid NOT NULL,
    description_snapshot text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_amount integer NOT NULL,
    total_amount integer NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 6. Payments Table (Section 18, 19, 20)
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    provider text NOT NULL DEFAULT 'unconfigured',
    provider_payment_reference text,
    payment_type public.payment_type NOT NULL,
    amount integer NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    status public.payment_status NOT NULL DEFAULT 'pending',
    paid_at timestamptz,
    failed_at timestamptz,
    refunded_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_adv_status ON public.payments(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON public.payments(provider, provider_payment_reference);

-- 7. Promotion Products & Campaigns Tables (Section 45, 46, 47, 48, 57)
CREATE TABLE IF NOT EXISTS public.promotion_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    type public.payment_type NOT NULL DEFAULT 'boost',
    description text,
    duration_hours integer NOT NULL DEFAULT 24,
    price_amount integer NOT NULL, -- in integer cents BRL
    currency text NOT NULL DEFAULT 'BRL',
    status text NOT NULL DEFAULT 'active',
    placement public.promotion_placement NOT NULL DEFAULT 'homepage_featured',
    priority integer NOT NULL DEFAULT 10,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_products_status ON public.promotion_products(status, placement);

CREATE TABLE IF NOT EXISTS public.advertiser_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.promotion_products(id),
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    status public.campaign_status NOT NULL DEFAULT 'pending_payment',
    starts_at timestamptz,
    ends_at timestamptz,
    placement public.promotion_placement NOT NULL,
    impressions integer NOT NULL DEFAULT 0,
    clicks integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_adv_status ON public.advertiser_campaigns(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_active_placement ON public.advertiser_campaigns(placement, status, ends_at);

CREATE TABLE IF NOT EXISTS public.campaign_daily_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.advertiser_campaigns(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    impressions integer NOT NULL DEFAULT 0,
    clicks integer NOT NULL DEFAULT 0,
    profile_views integer NOT NULL DEFAULT 0,
    contact_clicks integer NOT NULL DEFAULT 0,
    CONSTRAINT uq_campaign_daily_stats UNIQUE (campaign_id, date)
);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_amount integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Seed Initial Plans (Section 12)
INSERT INTO public.subscription_plans (name, slug, description, price_amount, currency, billing_interval, status, sort_order, features, media_limit, video_limit, boost_allowance, analytics_level)
VALUES
    ('Essencial', 'essencial', 'Ideal para começar com presença garantida nas buscas da sua cidade.', 4990, 'BRL', 'monthly', 'active', 1, '["Presença na busca da cidade", "Até 10 fotos na galeria", "Métricas básicas de visualização", "Contato direto via WhatsApp"]'::jsonb, 10, 0, 0, 'basic'),
    ('Destaque', 'destaque', 'Maior visibilidade e ferramentas para profissionais consolidados.', 8990, 'BRL', 'monthly', 'active', 2, '["Prioridade média nas buscas", "Até 15 fotos em alta resolução", "1 Impulsionamento incluído/mês", "Estatísticas ampliadas de cliques"]'::jsonb, 15, 0, 1, 'advanced'),
    ('Premium', 'premium', 'Máxima atratividade com suporte a mídia avançada e mais destaque.', 14990, 'BRL', 'monthly', 'active', 3, '["Alta prioridade nas buscas", "Até 20 fotos na galeria", "2 Impulsionamentos incluídos/mês", "Selo Perfil Premium", "Analytics avançado diário"]'::jsonb, 20, 1, 2, 'advanced'),
    ('VIP', 'vip', 'Visibilidade de topo com pacote promocional completo e vitrine exclusiva.', 24990, 'BRL', 'monthly', 'active', 4, '["Posição de topo na categoria", "Até 30 fotos na galeria", "4 Impulsionamentos incluídos/mês", "Vitrine rotativa VIP", "Analytics completo em tempo real"]'::jsonb, 30, 3, 4, 'premium')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price_amount = EXCLUDED.price_amount,
    media_limit = EXCLUDED.media_limit,
    features = EXCLUDED.features;

-- 9. Seed Initial Promotion Products (Section 45)
INSERT INTO public.promotion_products (name, slug, type, description, duration_hours, price_amount, currency, status, placement, priority)
VALUES
    ('Destaque 24 Horas', 'destaque-24h', 'boost', 'Posicione seu anúncio no topo da página inicial por 24 horas.', 24, 1990, 'BRL', 'active', 'homepage_featured', 10),
    ('Destaque 3 Dias', 'destaque-3-dias', 'boost', 'Destaque contínuo na home e buscas durante 3 dias.', 72, 4990, 'BRL', 'active', 'homepage_featured', 20),
    ('Destaque 7 Dias', 'destaque-7-dias', 'boost', 'Uma semana inteira de alta visibilidade e prioridade máxima.', 168, 9990, 'BRL', 'active', 'homepage_featured', 30),
    ('Topo da Cidade 7 Dias', 'topo-cidade-7-dias', 'featured_placement', 'Garanta uma das primeiras posições nas buscas da sua cidade por 7 dias.', 168, 12990, 'BRL', 'active', 'city_top', 40),
    ('Destaque da Categoria 7 Dias', 'destaque-categoria-7-dias', 'featured_placement', 'Seja o destaque principal na sua categoria por uma semana.', 168, 7990, 'BRL', 'active', 'category_top', 35)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price_amount = EXCLUDED.price_amount,
    duration_hours = EXCLUDED.duration_hours;

-- 10. RPC: create_advertiser_checkout (Section 23, 24, 25, 62, 64)
CREATE OR REPLACE FUNCTION public.create_advertiser_checkout(
    p_product_type text,
    p_product_id uuid,
    p_coupon_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv_id uuid;
    v_adv_status text;
    v_subtotal integer;
    v_discount integer := 0;
    v_total integer;
    v_product_name text;
    v_coupon public.coupons%ROWTYPE;
    v_order_id uuid;
    v_order_num text;
    v_idempotency_key text;
    v_session_token text;
    v_payment_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    -- Resolve advertiser profile owned by user
    SELECT id, profile_status INTO v_adv_id, v_adv_status
    FROM public.advertiser_profiles
    WHERE profile_id = v_profile_id AND deleted_at IS NULL;

    IF v_adv_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Fetch trusted server price (Requirement 23: NEVER trust frontend amount)
    IF p_product_type = 'subscription' THEN
        SELECT price_amount, name INTO v_subtotal, v_product_name
        FROM public.subscription_plans
        WHERE id = p_product_id AND status = 'active';
    ELSE
        SELECT price_amount, name INTO v_subtotal, v_product_name
        FROM public.promotion_products
        WHERE id = p_product_id AND status = 'active';
    END IF;

    IF v_subtotal IS NULL THEN
        RAISE EXCEPTION 'Produto não encontrado ou indisponível.';
    END IF;

    -- Validate coupon atomically if provided (Section 62 & 64)
    IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
        SELECT * INTO v_coupon
        FROM public.coupons
        WHERE code = upper(trim(p_coupon_code))
          AND status = 'active'
          AND (starts_at IS NULL OR starts_at <= now())
          AND (expires_at IS NULL OR expires_at >= now())
          AND (usage_limit IS NULL OR usage_count < usage_limit)
        FOR UPDATE; -- Atomic row lock

        IF v_coupon.id IS NOT NULL THEN
            IF v_coupon.discount_type = 'percentage' THEN
                v_discount := (v_subtotal * v_coupon.discount_value) / 100;
            ELSE
                v_discount := LEAST(v_subtotal, v_coupon.discount_value);
            END IF;
        END IF;
    END IF;

    v_total := GREATEST(0, v_subtotal - v_discount);
    v_order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 8));
    v_idempotency_key := 'chk_' || v_adv_id || '_' || p_product_id || '_' || to_char(now(), 'YYYYMMDDHH24MISS');
    v_session_token := 'sess_pay_' || gen_random_uuid()::text;

    -- Insert Order
    INSERT INTO public.orders (
        advertiser_id,
        order_number,
        status,
        subtotal,
        discount_amount,
        total_amount,
        currency,
        coupon_id,
        idempotency_key,
        metadata
    )
    VALUES (
        v_adv_id,
        v_order_num,
        'pending',
        v_subtotal,
        v_discount,
        v_total,
        'BRL',
        v_coupon.id,
        v_idempotency_key,
        jsonb_build_object('product_name', v_product_name, 'product_type', p_product_type)
    )
    RETURNING id INTO v_order_id;

    -- Insert Order Item
    INSERT INTO public.order_items (
        order_id,
        product_type,
        product_id,
        description_snapshot,
        quantity,
        unit_amount,
        total_amount
    )
    VALUES (
        v_order_id,
        p_product_type::public.payment_type,
        p_product_id,
        v_product_name,
        1,
        v_subtotal,
        v_total
    );

    -- Increment Coupon Usage if applied
    IF v_coupon.id IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = usage_count + 1, updated_at = now()
        WHERE id = v_coupon.id;

        INSERT INTO public.coupon_redemptions (coupon_id, advertiser_id, order_id, discount_amount)
        VALUES (v_coupon.id, v_adv_id, v_order_id, v_discount);
    END IF;

    -- Insert Pending Payment Record
    INSERT INTO public.payments (
        advertiser_id,
        order_id,
        provider,
        provider_payment_reference,
        payment_type,
        amount,
        currency,
        status
    )
    VALUES (
        v_adv_id,
        v_order_id,
        'unconfigured',
        v_session_token,
        p_product_type::public.payment_type,
        v_total,
        'BRL',
        'pending'
    )
    RETURNING id INTO v_payment_id;

    -- If subscription, create or update pending subscription
    IF p_product_type = 'subscription' THEN
        INSERT INTO public.subscriptions (
            advertiser_id,
            plan_id,
            provider,
            provider_subscription_reference,
            status,
            billing_interval
        )
        VALUES (
            v_adv_id,
            p_product_id,
            'unconfigured',
            v_session_token,
            'pending',
            'monthly'
        );
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'checkout_created',
        'orders',
        v_order_id,
        jsonb_build_object('order_number', v_order_num, 'total_amount', v_total, 'product_type', p_product_type)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_num,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'total_amount', v_total,
        'session_token', v_session_token,
        'redirect_url', '/payment/success?order=' || v_order_num
    );
END;
$$;

-- 11. RPC: process_payment_webhook (Section 28, 29, 30, 31, 33, 34, 49)
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_provider_reference text,
    p_status text,
    p_amount integer,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_order_item public.order_items%ROWTYPE;
    v_promo public.promotion_products%ROWTYPE;
    v_sub public.subscriptions%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_new_payment_status public.payment_status;
BEGIN
    -- Replay Protection Check (Requirement 29)
    IF EXISTS (
        SELECT 1 FROM public.webhook_events
        WHERE provider = p_provider AND event_id = p_event_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Evento já processado anteriormente (Idempotente).');
    END IF;

    -- Locate Payment Record
    SELECT * INTO v_payment
    FROM public.payments
    WHERE provider_payment_reference = p_provider_reference
       OR id::text = p_provider_reference;

    IF v_payment.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pagamento não encontrado.');
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id;
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_payment.advertiser_id;

    v_new_payment_status := p_status::public.payment_status;

    -- Update Payment
    UPDATE public.payments
    SET status = v_new_payment_status,
        paid_at = CASE WHEN v_new_payment_status = 'paid' THEN now() ELSE paid_at END,
        failed_at = CASE WHEN v_new_payment_status = 'failed' THEN now() ELSE failed_at END,
        refunded_at = CASE WHEN v_new_payment_status = 'refunded' THEN now() ELSE refunded_at END,
        updated_at = now()
    WHERE id = v_payment.id;

    -- If Paid: Activate Order, Subscription, or Campaign
    IF v_new_payment_status = 'paid' THEN
        -- Update Order
        UPDATE public.orders
        SET status = 'completed', updated_at = now()
        WHERE id = v_payment.order_id;

        -- Process each order item
        FOR v_order_item IN SELECT * FROM public.order_items WHERE order_id = v_payment.order_id LOOP
            IF v_order_item.product_type = 'subscription' THEN
                -- Activate Subscription
                UPDATE public.subscriptions
                SET status = 'active',
                    current_period_start = now(),
                    current_period_end = now() + INTERVAL '30 days',
                    updated_at = now()
                WHERE advertiser_id = v_payment.advertiser_id
                  AND (plan_id = v_order_item.product_id OR provider_subscription_reference = v_payment.provider_payment_reference);

                -- Notification
                INSERT INTO public.notifications (profile_id, type, title, message)
                VALUES (
                    v_adv.profile_id,
                    'subscription_activated',
                    'Assinatura Ativada! 🎉',
                    'Seu plano foi ativado com sucesso e seus benefícios já estão disponíveis.'
                );
            ELSE
                -- Promotion / Boost: Create and activate campaign
                SELECT * INTO v_promo FROM public.promotion_products WHERE id = v_order_item.product_id;

                INSERT INTO public.advertiser_campaigns (
                    advertiser_id,
                    product_id,
                    order_id,
                    status,
                    starts_at,
                    ends_at,
                    placement
                )
                VALUES (
                    v_payment.advertiser_id,
                    v_order_item.product_id,
                    v_payment.order_id,
                    'active',
                    now(),
                    now() + (v_promo.duration_hours || ' hours')::interval,
                    v_promo.placement
                );

                -- Notification
                INSERT INTO public.notifications (profile_id, type, title, message)
                VALUES (
                    v_adv.profile_id,
                    'promotion_activated',
                    'Destaque Ativado! 🚀',
                    'Sua campanha promocional está ativa e gerando mais visibilidade para o seu perfil.'
                );
            END IF;
        END LOOP;
    ELSIF v_new_payment_status = 'failed' THEN
        UPDATE public.orders SET status = 'failed', updated_at = now() WHERE id = v_payment.order_id;
    END IF;

    -- Record webhook event for replay protection
    INSERT INTO public.webhook_events (
        provider,
        event_id,
        event_type,
        payload_hash,
        status
    )
    VALUES (
        p_provider,
        p_event_id,
        p_event_type,
        encode(
            digest(
                p_provider
                || ':' ||
                p_event_id
                || ':' ||
                p_event_type
                || ':' ||
                COALESCE(p_metadata, '{}'::jsonb)::text,
                'sha256'
            ),
            'hex'
        ),
        'processed'
    );

    -- Audit Log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        NULL,
        'payment_' || v_new_payment_status,
        'payments',
        v_payment.id,
        jsonb_build_object('amount', p_amount, 'provider', p_provider, 'order_id', v_payment.order_id)
    );

    RETURN jsonb_build_object('success', true, 'status', v_new_payment_status);
END;
$$;

-- 12. RPC: cancel_advertiser_subscription (Section 35 & 36)
CREATE OR REPLACE FUNCTION public.cancel_advertiser_subscription(
    p_subscription_id uuid,
    p_cancel_at_period_end boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_sub public.subscriptions%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_sub FROM public.subscriptions WHERE id = p_subscription_id;
    IF v_sub.id IS NULL THEN
        RAISE EXCEPTION 'Assinatura não encontrada.';
    END IF;

    -- Verify ownership
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_sub.advertiser_id;
    IF v_adv.profile_id <> v_profile_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Você não é proprietário desta assinatura.';
    END IF;

    IF p_cancel_at_period_end THEN
        UPDATE public.subscriptions
        SET cancel_at_period_end = true,
            cancelled_at = now(),
            updated_at = now()
        WHERE id = p_subscription_id;
    ELSE
        UPDATE public.subscriptions
        SET status = 'cancelled',
            cancel_at_period_end = true,
            cancelled_at = now(),
            updated_at = now()
        WHERE id = p_subscription_id;
    END IF;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'subscription_cancelled',
        'subscriptions',
        p_subscription_id,
        jsonb_build_object('cancel_at_period_end', p_cancel_at_period_end)
    );

    RETURN jsonb_build_object('success', true, 'cancel_at_period_end', p_cancel_at_period_end);
END;
$$;

-- 13. RPC: refund_payment (Section 75 & 76)
CREATE OR REPLACE FUNCTION public.refund_payment(
    p_payment_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_pay public.payments%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores autorizados podem realizar estornos.';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN
        RAISE EXCEPTION 'Justificativa obrigatória para realização do estorno.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_pay FROM public.payments WHERE id = p_payment_id;
    IF v_pay.id IS NULL THEN
        RAISE EXCEPTION 'Pagamento não encontrado.';
    END IF;

    IF v_pay.status = 'refunded' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Pagamento já se encontra estornado.');
    END IF;

    UPDATE public.payments
    SET status = 'refunded',
        refunded_at = now(),
        updated_at = now()
    WHERE id = p_payment_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'refund_processed',
        'payments',
        p_payment_id,
        jsonb_build_object('amount', v_pay.amount, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'status', 'refunded');
END;
$$;

-- 14. RPC: get_advertiser_entitlements (Section 13 & 107)
CREATE OR REPLACE FUNCTION public.get_advertiser_entitlements(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan public.subscription_plans%ROWTYPE;
BEGIN
    -- Query active plan
    SELECT p.* INTO v_plan
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.advertiser_id = p_advertiser_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
    ORDER BY p.price_amount DESC
    LIMIT 1;

    -- Default baseline entitlements if no active paid subscription
    IF v_plan.id IS NULL THEN
        RETURN jsonb_build_object(
            'has_active_subscription', false,
            'plan_name', 'Gratuito / Básico',
            'plan_slug', 'free',
            'media_limit', 10,
            'video_limit', 0,
            'boost_allowance', 0,
            'analytics_level', 'basic'
        );
    END IF;

    RETURN jsonb_build_object(
        'has_active_subscription', true,
        'plan_name', v_plan.name,
        'plan_slug', v_plan.slug,
        'media_limit', v_plan.media_limit,
        'video_limit', v_plan.video_limit,
        'boost_allowance', v_plan.boost_allowance,
        'analytics_level', v_plan.analytics_level
    );
END;
$$;

-- 15. RLS Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Plans: Public read for active plans; Admin full management
CREATE POLICY "sub_plans_public_select"
    ON public.subscription_plans FOR SELECT
    TO public
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "sub_plans_admin_manage"
    ON public.subscription_plans FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Subscriptions: Owner can select own subscriptions; Admin can select all
CREATE POLICY "subs_owner_select"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

-- Orders & Items: Owner can select own orders; Admin can select all
CREATE POLICY "orders_owner_select"
    ON public.orders FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

CREATE POLICY "order_items_owner_select"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id AND (public.owns_advertiser(o.advertiser_id) OR public.is_admin())
    ));

-- Payments: Owner can select own payments; Admin can select all
CREATE POLICY "payments_owner_select"
    ON public.payments FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

-- Promotion Products: Public read active
CREATE POLICY "promo_products_public_select"
    ON public.promotion_products FOR SELECT
    TO public
    USING (status = 'active' OR public.is_admin());

-- Campaigns: Owner can select own campaigns; Public can select active campaigns for discovery
CREATE POLICY "campaigns_owner_select"
    ON public.advertiser_campaigns FOR SELECT
    TO public
    USING (
        (status = 'active' AND starts_at <= now() AND ends_at >= now())
        OR (auth.role() = 'authenticated' AND (public.owns_advertiser(advertiser_id) OR public.is_admin()))
    );

-- Coupons: Public read for code lookup
CREATE POLICY "coupons_public_select"
    ON public.coupons FOR SELECT
    TO public
    USING (status = 'active' OR public.is_admin());
