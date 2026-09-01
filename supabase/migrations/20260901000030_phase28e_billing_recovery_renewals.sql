-- ============================================================================
-- MIGRATION 00030: Phase 28E — Billing Recovery, Renewals, Grace Periods & Failure Handling
-- ============================================================================

-- 1. Create Billing Cycles Table
CREATE TABLE IF NOT EXISTS public.billing_cycles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_type text NOT NULL CHECK (subscription_type IN ('advertiser', 'consumer')),
    subscription_id uuid NOT NULL,
    advertiser_id uuid REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    user_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    cycle_number integer NOT NULL DEFAULT 1,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    amount_minor integer NOT NULL, -- in cents BRL
    currency text NOT NULL DEFAULT 'BRL',
    pricing_snapshot jsonb NOT NULL DEFAULT '{
        "plan_name": "",
        "billing_period": "",
        "duration_days": 30,
        "unit_price_minor": 0,
        "discount_minor": 0,
        "total_minor": 0
    }'::jsonb,
    status text NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'due', 'processing', 'paid', 'failed', 'grace_period', 'expired', 'cancelled', 'requires_reconciliation')),
    payment_due_at timestamptz NOT NULL,
    grace_ends_at timestamptz,
    paid_at timestamptz,
    failed_at timestamptz,
    failure_category text CHECK (failure_category IN ('insufficient_funds', 'card_declined', 'expired_card', 'invalid_payment_method', 'fraud_suspected', 'provider_error', 'network_error', 'timeout', 'unknown')),
    failure_message text,
    retry_count integer NOT NULL DEFAULT 0,
    next_retry_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_subscription_cycle UNIQUE(subscription_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_status_due ON public.billing_cycles(status, payment_due_at);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_grace ON public.billing_cycles(status, grace_ends_at);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_retry ON public.billing_cycles(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_adv ON public.billing_cycles(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_user ON public.billing_cycles(user_profile_id, status);

-- 2. Create Billing Recovery Events & Audit Log Table
CREATE TABLE IF NOT EXISTS public.billing_recovery_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_cycle_id uuid REFERENCES public.billing_cycles(id) ON DELETE CASCADE,
    subscription_id uuid NOT NULL,
    subscription_type text NOT NULL,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type text NOT NULL CHECK (event_type IN (
        'cycle_created',
        'renewal_attempt_started',
        'renewal_paid',
        'renewal_failed',
        'retry_scheduled',
        'grace_started',
        'payment_method_updated',
        'renewal_recovered',
        'grace_expired',
        'subscription_expired',
        'subscription_reactivated',
        'cancel_at_period_end_set',
        'cancel_at_period_end_removed',
        'reconciliation_required'
    )),
    failure_category text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_recovery_sub ON public.billing_recovery_events(subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_recovery_type ON public.billing_recovery_events(event_type);

-- 3. Atomic RPC: Generate Next Deterministic Billing Cycle
CREATE OR REPLACE FUNCTION public.generate_subscription_billing_cycle(
    p_subscription_type text,
    p_subscription_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub record;
    v_plan_name text;
    v_period_name text;
    v_duration_days integer := 30;
    v_price_cents integer := 0;
    v_last_cycle record;
    v_next_cycle_num integer := 1;
    v_period_start timestamptz;
    v_period_end timestamptz;
    v_cycle_id uuid;
    v_snapshot jsonb;
BEGIN
    IF p_subscription_type = 'advertiser' THEN
        SELECT s.*, ap.user_id INTO v_sub
        FROM public.subscriptions s
        JOIN public.advertiser_profiles ap ON ap.id = s.advertiser_id
        WHERE s.id = p_subscription_id;

        IF v_sub.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Assinatura de anunciante não encontrada.');
        END IF;

        -- If cancelled at period end, do not generate new renewal cycle
        IF v_sub.cancel_at_period_end = true THEN
            RETURN jsonb_build_object('success', false, 'error', 'Assinatura com cancelamento agendado para o fim do ciclo.');
        END IF;

        -- Fetch plan & period pricing
        SELECT p.name, bp.name, bp.duration_days, ppm.price_cents
        INTO v_plan_name, v_period_name, v_duration_days, v_price_cents
        FROM public.plans p
        JOIN public.plan_pricing_matrix ppm ON ppm.plan_id = p.id
        JOIN public.billing_periods bp ON bp.id = ppm.billing_period_id
        WHERE p.id = v_sub.plan_id AND bp.id = v_sub.billing_period_id AND ppm.is_active = true
        LIMIT 1;

    ELSIF p_subscription_type = 'consumer' THEN
        SELECT cs.*, cs.user_profile_id as user_id INTO v_sub
        FROM public.consumer_subscriptions cs
        WHERE cs.id = p_subscription_id;

        IF v_sub.id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Assinatura Consumer Premium não encontrada.');
        END IF;

        IF v_sub.cancel_at_period_end = true THEN
            RETURN jsonb_build_object('success', false, 'error', 'Assinatura com cancelamento agendado para o fim do ciclo.');
        END IF;

        SELECT cp.name, bp.name, bp.duration_days, cpp.price_cents
        INTO v_plan_name, v_period_name, v_duration_days, v_price_cents
        FROM public.consumer_plans cp
        JOIN public.consumer_plan_pricing cpp ON cpp.plan_id = cp.id
        JOIN public.billing_periods bp ON bp.id = cpp.billing_period_id
        WHERE cp.id = v_sub.plan_id AND cpp.is_active = true
        LIMIT 1;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Tipo de assinatura inválido.');
    END IF;

    -- Calculate Cycle Number & Timestamps
    SELECT * INTO v_last_cycle
    FROM public.billing_cycles
    WHERE subscription_id = p_subscription_id
    ORDER BY cycle_number DESC
    LIMIT 1;

    IF v_last_cycle.id IS NOT NULL THEN
        v_next_cycle_num := v_last_cycle.cycle_number + 1;
        v_period_start := v_last_cycle.period_end;
    ELSE
        v_period_start := COALESCE(v_sub.current_period_end, now());
    END IF;

    v_period_end := v_period_start + (v_duration_days || ' days')::interval;

    v_snapshot := jsonb_build_object(
        'plan_name', v_plan_name,
        'billing_period', v_period_name,
        'duration_days', v_duration_days,
        'unit_price_minor', v_price_cents,
        'discount_minor', 0,
        'total_minor', v_price_cents,
        'currency', 'BRL'
    );

    INSERT INTO public.billing_cycles (
        subscription_type,
        subscription_id,
        advertiser_id,
        user_profile_id,
        cycle_number,
        period_start,
        period_end,
        amount_minor,
        currency,
        pricing_snapshot,
        status,
        payment_due_at
    ) VALUES (
        p_subscription_type,
        p_subscription_id,
        v_sub.advertiser_id,
        v_sub.user_id,
        v_next_cycle_num,
        v_period_start,
        v_period_end,
        v_price_cents,
        'BRL',
        v_snapshot,
        'scheduled',
        v_period_start
    )
    ON CONFLICT (subscription_id, cycle_number) DO UPDATE SET
        updated_at = now()
    RETURNING id INTO v_cycle_id;

    RETURN jsonb_build_object(
        'success', true,
        'billing_cycle_id', v_cycle_id,
        'cycle_number', v_next_cycle_num,
        'amount_minor', v_price_cents,
        'payment_due_at', v_period_start
    );
END;
$$;

-- 4. Atomic RPC: Process Due Cycles with Lock
CREATE OR REPLACE FUNCTION public.process_due_billing_cycles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cycle record;
    v_processed_count integer := 0;
BEGIN
    FOR v_cycle IN
        SELECT * FROM public.billing_cycles
        WHERE status IN ('scheduled', 'due')
          AND payment_due_at <= now()
        ORDER BY payment_due_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Mark as due for processing
        UPDATE public.billing_cycles
        SET status = 'due', updated_at = now()
        WHERE id = v_cycle.id;

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'cycles_due_count', v_processed_count);
END;
$$;

-- 5. Atomic RPC: Process Grace Period Expirations
CREATE OR REPLACE FUNCTION public.process_grace_expirations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cycle record;
    v_expired_count integer := 0;
BEGIN
    FOR v_cycle IN
        SELECT * FROM public.billing_cycles
        WHERE status = 'grace_period'
          AND grace_ends_at IS NOT NULL
          AND grace_ends_at <= now()
        ORDER BY grace_ends_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
    LOOP
        -- 1. Expire billing cycle
        UPDATE public.billing_cycles
        SET status = 'expired', updated_at = now()
        WHERE id = v_cycle.id;

        -- 2. Transition subscription
        IF v_cycle.subscription_type = 'advertiser' THEN
            UPDATE public.subscriptions
            SET status = 'limited',
                updated_at = now()
            WHERE id = v_cycle.subscription_id;

            UPDATE public.advertiser_profiles
            SET commercial_status = 'limited',
                updated_at = now()
            WHERE id = v_cycle.advertiser_id;

        ELSIF v_cycle.subscription_type = 'consumer' THEN
            UPDATE public.consumer_subscriptions
            SET status = 'expired',
                updated_at = now()
            WHERE id = v_cycle.subscription_id;
        END IF;

        -- 3. Log recovery event
        INSERT INTO public.billing_recovery_events (
            billing_cycle_id,
            subscription_id,
            subscription_type,
            profile_id,
            event_type,
            metadata
        ) VALUES (
            v_cycle.id,
            v_cycle.subscription_id,
            v_cycle.subscription_type,
            v_cycle.user_profile_id,
            'grace_expired',
            jsonb_build_object('expired_at', now())
        );

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'grace_expired_count', v_expired_count);
END;
$$;
