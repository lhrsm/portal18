-- ============================================================================
-- MIGRATION 00031: Phase 28F — Refunds, Disputes, Chargebacks & Financial Reconciliation
-- ============================================================================

-- 1. Add Columns to payment_refunds for Idempotency and Order Reference
ALTER TABLE public.payment_refunds
    ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS idempotency_key text,
    ADD COLUMN IF NOT EXISTS entitlement_policy text DEFAULT 'NO_ENTITLEMENT_CHANGE'
        CHECK (entitlement_policy IN ('NO_ENTITLEMENT_CHANGE', 'END_AT_PERIOD', 'REVOKE_REMAINING_PERIOD', 'MANUAL_REVIEW'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_refunds_idempotency
    ON public.payment_refunds(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_refunds_order ON public.payment_refunds(order_id);

-- 2. Add Columns to payment_chargebacks for Dispute Lifecycle & Evidence
ALTER TABLE public.payment_chargebacks
    ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS dispute_status text DEFAULT 'opened'
        CHECK (dispute_status IN ('opened', 'under_review', 'evidence_required', 'evidence_prepared', 'submitted', 'provider_review', 'won', 'lost', 'closed')),
    ADD COLUMN IF NOT EXISTS reason_category text DEFAULT 'other'
        CHECK (reason_category IN ('fraud', 'not_recognized', 'duplicate', 'service_not_received', 'cancelled_subscription', 'processing_error', 'other')),
    ADD COLUMN IF NOT EXISTS financial_hold boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS evidence_pack jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_chargebacks_dispute_status ON public.payment_chargebacks(dispute_status);
CREATE INDEX IF NOT EXISTS idx_chargebacks_order ON public.payment_chargebacks(order_id);

-- 3. Add Severity & Category Columns to payment_reconciliation_logs
ALTER TABLE public.payment_reconciliation_logs
    ADD COLUMN IF NOT EXISTS severity text DEFAULT 'normal'
        CHECK (severity IN ('critical', 'high', 'normal', 'low')),
    ADD COLUMN IF NOT EXISTS discrepancy_category text DEFAULT 'STATUS_MISMATCH'
        CHECK (discrepancy_category IN (
            'POTENTIAL_DOUBLE_CHARGE',
            'AMOUNT_MISMATCH',
            'CURRENCY_MISMATCH',
            'MISSING_WEBHOOK',
            'UNKNOWN_PROVIDER_REFERENCE',
            'REFUND_MISMATCH',
            'CHARGEBACK_MISMATCH',
            'SUBSCRIPTION_STATE_MISMATCH',
            'STATUS_MISMATCH'
        ));

CREATE INDEX IF NOT EXISTS idx_reconciliation_severity ON public.payment_reconciliation_logs(severity, resolved);

-- 4. Atomic RPC: Process Canonical Full / Partial Refund with Strict Limits & Row Lock
CREATE OR REPLACE FUNCTION public.process_canonical_refund(
    p_order_id uuid,
    p_amount_cents integer,
    p_reason text,
    p_entitlement_policy text,
    p_requested_by uuid,
    p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_payment public.payments%ROWTYPE;
    v_total_paid integer := 0;
    v_total_refunded integer := 0;
    v_remaining_refundable integer := 0;
    v_refund_id uuid;
    v_is_full_refund boolean := false;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_refund_id
        FROM public.payment_refunds
        WHERE idempotency_key = p_idempotency_key;

        IF v_refund_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', true,
                'refund_id', v_refund_id,
                'already_processed', true,
                'message', 'Reembolso já processado anteriormente com esta chave de idempotência.'
            );
        END IF;
    END IF;

    -- Row lock order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado.');
    END IF;

    -- Find associated payment
    SELECT * INTO v_payment
    FROM public.payments
    WHERE order_id = p_order_id
    ORDER BY created_at DESC
    LIMIT 1;

    v_total_paid := COALESCE(v_order.total_minor, v_order.total_amount, 0);

    -- Calculate already refunded sum
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_refunded
    FROM public.payment_refunds
    WHERE order_id = p_order_id AND status = 'completed';

    v_remaining_refundable := v_total_paid - v_total_refunded;

    -- P0 Refund Amount Validation
    IF p_amount_cents <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'O valor do estorno deve ser maior que zero.');
    END IF;

    IF p_amount_cents > v_remaining_refundable THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Valor solicitado (R$ %s) excede o saldo reembolsável restante (R$ %s).', (p_amount_cents / 100.0), (v_remaining_refundable / 100.0))
        );
    END IF;

    v_is_full_refund := (v_total_refunded + p_amount_cents) >= v_total_paid;

    -- Insert Refund Record (Immutable Ledger)
    INSERT INTO public.payment_refunds (
        payment_id,
        order_id,
        provider_code,
        provider_refund_id,
        refund_type,
        amount_cents,
        currency,
        reason,
        status,
        requested_by,
        entitlement_policy,
        idempotency_key,
        metadata
    ) VALUES (
        COALESCE(v_payment.id, gen_random_uuid()),
        v_order.id,
        COALESCE(v_order.provider_code, 'internal_driver'),
        'ref_' || substr(gen_random_uuid()::text, 1, 8),
        CASE WHEN v_is_full_refund THEN 'full' ELSE 'partial' END,
        p_amount_cents,
        v_order.currency,
        p_reason,
        'completed',
        p_requested_by,
        p_entitlement_policy,
        p_idempotency_key,
        jsonb_build_object(
            'total_order_minor', v_total_paid,
            'refunded_before_minor', v_total_refunded,
            'refunded_now_minor', p_amount_cents,
            'remaining_balance_minor', (v_remaining_refundable - p_amount_cents)
        )
    )
    RETURNING id INTO v_refund_id;

    -- Update Order Status
    UPDATE public.orders
    SET
        status = CASE WHEN v_is_full_refund THEN 'refunded' ELSE 'partially_refunded' END,
        payment_status = CASE WHEN v_is_full_refund THEN 'refunded' ELSE 'partially_refunded' END,
        updated_at = now()
    WHERE id = v_order.id;

    -- Apply Entitlement Policy if Full Refund or Explicit Policy
    IF p_entitlement_policy = 'REVOKE_REMAINING_PERIOD' OR v_is_full_refund THEN
        IF v_order.product_type = 'advertiser_subscription' AND v_order.advertiser_id IS NOT NULL THEN
            UPDATE public.subscriptions
            SET status = 'limited', updated_at = now()
            WHERE advertiser_id = v_order.advertiser_id AND status = 'active';

            UPDATE public.advertiser_profiles
            SET commercial_status = 'limited', updated_at = now()
            WHERE id = v_order.advertiser_id;

        ELSIF v_order.product_type = 'consumer_subscription' AND v_order.profile_id IS NOT NULL THEN
            UPDATE public.consumer_subscriptions
            SET status = 'expired', updated_at = now()
            WHERE user_profile_id = v_order.profile_id AND status = 'active';

        ELSIF v_order.product_type = 'boost' AND v_order.advertiser_id IS NOT NULL THEN
            -- If boost hasn't started, release inventory reservation
            UPDATE public.boost_inventory_reservations
            SET status = 'released', updated_at = now()
            WHERE order_id = v_order.id AND status = 'confirmed';
        END IF;
    END IF;

    -- Insert Audit Event
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        new_data
    ) VALUES (
        p_requested_by,
        'payment_refund_processed',
        'orders',
        v_order.id,
        jsonb_build_object(
            'refund_id', v_refund_id,
            'amount_cents', p_amount_cents,
            'policy', p_entitlement_policy,
            'is_full', v_is_full_refund
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'refund_type', CASE WHEN v_is_full_refund THEN 'full' ELSE 'partial' END,
        'amount_cents', p_amount_cents,
        'remaining_refundable_cents', (v_remaining_refundable - p_amount_cents),
        'order_status', CASE WHEN v_is_full_refund THEN 'refunded' ELSE 'partially_refunded' END
    );
END;
$$;

-- 5. Atomic RPC: Record Dispute Event
CREATE OR REPLACE FUNCTION public.record_dispute_event(
    p_order_id uuid,
    p_provider_code text,
    p_provider_dispute_id text,
    p_amount_cents integer,
    p_reason_category text,
    p_dispute_status text,
    p_evidence jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment_id uuid;
    v_chargeback_id uuid;
BEGIN
    SELECT id INTO v_payment_id
    FROM public.payments
    WHERE order_id = p_order_id
    LIMIT 1;

    INSERT INTO public.payment_chargebacks (
        payment_id,
        order_id,
        provider_code,
        provider_dispute_id,
        amount_cents,
        currency,
        reason_category,
        dispute_status,
        financial_hold,
        evidence_pack,
        metadata
    ) VALUES (
        COALESCE(v_payment_id, gen_random_uuid()),
        p_order_id,
        p_provider_code,
        p_provider_dispute_id,
        p_amount_cents,
        'BRL',
        p_reason_category,
        p_dispute_status,
        CASE WHEN p_dispute_status IN ('opened', 'under_review', 'evidence_required') THEN true ELSE false END,
        p_evidence,
        jsonb_build_object('recorded_at', now())
    )
    ON CONFLICT (provider_code, provider_dispute_id) DO UPDATE SET
        dispute_status = p_dispute_status,
        evidence_pack = COALESCE(p_evidence, public.payment_chargebacks.evidence_pack),
        financial_hold = CASE WHEN p_dispute_status IN ('opened', 'under_review', 'evidence_required') THEN true ELSE false END,
        updated_at = now()
    RETURNING id INTO v_chargeback_id;

    RETURN jsonb_build_object(
        'success', true,
        'chargeback_id', v_chargeback_id,
        'dispute_status', p_dispute_status
    );
END;
$$;

-- 6. Atomic RPC: Resolve Reconciliation Discrepancy
CREATE OR REPLACE FUNCTION public.resolve_reconciliation_discrepancy(
    p_discrepancy_id uuid,
    p_resolution_notes text,
    p_resolved_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.payment_reconciliation_logs
    SET
        resolved = true,
        resolution_notes = p_resolution_notes,
        resolved_by = p_resolved_by,
        updated_at = now()
    WHERE id = p_discrepancy_id;

    RETURN jsonb_build_object('success', true, 'discrepancy_id', p_discrepancy_id);
END;
$$;
