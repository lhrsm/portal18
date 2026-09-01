-- ============================================================================
-- MIGRATION 00032: Phase 28G — Finance Operations, Fiscal Readiness & Production Go/No-Go
-- ============================================================================

-- 1. Create Payment Settlements Table
CREATE TABLE IF NOT EXISTS public.payment_settlements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code text NOT NULL,
    settlement_reference text NOT NULL,
    settlement_date date NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    gross_minor integer NOT NULL, -- in cents BRL
    fees_minor integer NOT NULL DEFAULT 0,
    refunds_minor integer NOT NULL DEFAULT 0,
    chargebacks_minor integer NOT NULL DEFAULT 0,
    adjustments_minor integer NOT NULL DEFAULT 0,
    net_minor integer NOT NULL,
    status text NOT NULL DEFAULT 'expected'
        CHECK (status IN ('expected', 'pending', 'received', 'reconciled', 'mismatch', 'requires_review', 'closed')),
    environment text NOT NULL DEFAULT 'test'
        CHECK (environment IN ('test', 'sandbox', 'production')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_settlement_provider_ref UNIQUE(provider_code, settlement_reference)
);

CREATE INDEX IF NOT EXISTS idx_settlements_status ON public.payment_settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON public.payment_settlements(settlement_date);

-- 2. Create Payment Settlement Items Table
CREATE TABLE IF NOT EXISTS public.payment_settlement_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id uuid NOT NULL REFERENCES public.payment_settlements(id) ON DELETE CASCADE,
    item_type text NOT NULL CHECK (item_type IN ('payment', 'refund', 'chargeback', 'provider_fee', 'adjustment')),
    item_id uuid,
    amount_minor integer NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlement_items_parent ON public.payment_settlement_items(settlement_id);

-- 3. Create Financial Periods Table
CREATE TABLE IF NOT EXISTS public.financial_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period_key text UNIQUE NOT NULL, -- e.g. '2026-09'
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closing', 'closed', 'reopened')),
    closed_at timestamptz,
    closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reopen_reason text,
    snapshot jsonb NOT NULL DEFAULT '{
        "gross_charges_minor": 0,
        "refunds_minor": 0,
        "chargebacks_minor": 0,
        "provider_fees_minor": 0,
        "adjustments_minor": 0,
        "net_settlement_minor": 0,
        "unresolved_discrepancies_count": 0,
        "environment": "homologation"
    }'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_periods_status ON public.financial_periods(status);

-- 4. Create Fiscal Documents Table (Abstraction — Zero Real Invoices Issued)
CREATE TABLE IF NOT EXISTS public.fiscal_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    document_type text NOT NULL DEFAULT 'service_invoice'
        CHECK (document_type IN ('service_invoice', 'other')),
    provider_code text NOT NULL DEFAULT 'unconfigured',
    external_reference text,
    status text NOT NULL DEFAULT 'not_required_review'
        CHECK (status IN ('not_required_review', 'pending', 'issuing', 'issued', 'failed', 'cancel_requested', 'cancelled', 'requires_review')),
    environment text NOT NULL DEFAULT 'test'
        CHECK (environment IN ('test', 'sandbox', 'production')),
    review_flags jsonb NOT NULL DEFAULT '{
        "accounting_review": "ACCOUNTING_REVIEW_REQUIRED",
        "legal_review": "LEGAL_REVIEW_REQUIRED",
        "fiscal_provider": "FISCAL_PROVIDER_NOT_CONFIGURED",
        "business_tax_classification": "UNVERIFIED",
        "nfs_e_active": false
    }'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_documents_status ON public.fiscal_documents(status);

-- 5. Atomic RPC: Close Financial Period with P0 Blocker Checks
CREATE OR REPLACE FUNCTION public.close_financial_period(
    p_period_key text,
    p_closed_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period public.financial_periods%ROWTYPE;
    v_unresolved_count integer := 0;
    v_gross_minor bigint := 0;
    v_refunds_minor bigint := 0;
    v_chargebacks_minor bigint := 0;
    v_fees_minor bigint := 0;
    v_adjustments_minor bigint := 0;
    v_net_minor bigint := 0;
    v_snapshot jsonb;
BEGIN
    SELECT * INTO v_period
    FROM public.financial_periods
    WHERE period_key = p_period_key
    FOR UPDATE;

    IF v_period.id IS NULL THEN
        -- Auto initialize period if not exists
        INSERT INTO public.financial_periods (
            period_key,
            start_date,
            end_date,
            status
        ) VALUES (
            p_period_key,
            (p_period_key || '-01')::date,
            ((p_period_key || '-01')::date + interval '1 month' - interval '1 day')::date,
            'open'
        )
        RETURNING * INTO v_period;
    END IF;

    IF v_period.status = 'closed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Período contábil já se encontra encerrado.');
    END IF;

    -- P0 Check: Block if there are unresolved critical/high reconciliation discrepancies
    SELECT COUNT(*) INTO v_unresolved_count
    FROM public.payment_reconciliation_logs
    WHERE resolved = false AND severity IN ('critical', 'high');

    IF v_unresolved_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Fechamento bloqueado: existem %s discrepâncias críticas/altas não resolvidas na conciliação.', v_unresolved_count),
            'unresolved_count', v_unresolved_count
        );
    END IF;

    -- Aggregate totals from orders created within the period
    SELECT COALESCE(SUM(total_minor), 0) INTO v_gross_minor
    FROM public.orders
    WHERE status IN ('fulfilled', 'paid', 'refunded', 'partially_refunded')
      AND created_at >= v_period.start_date::timestamptz
      AND created_at <= (v_period.end_date || ' 23:59:59')::timestamptz;

    -- Aggregate refunds
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_refunds_minor
    FROM public.payment_refunds
    WHERE status = 'completed'
      AND created_at >= v_period.start_date::timestamptz
      AND created_at <= (v_period.end_date || ' 23:59:59')::timestamptz;

    -- Aggregate chargebacks
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_chargebacks_minor
    FROM public.payment_chargebacks
    WHERE dispute_status = 'lost'
      AND created_at >= v_period.start_date::timestamptz
      AND created_at <= (v_period.end_date || ' 23:59:59')::timestamptz;

    v_fees_minor := 0;
    v_adjustments_minor := 0;
    v_net_minor := v_gross_minor - v_refunds_minor - v_chargebacks_minor;

    v_snapshot := jsonb_build_object(
        'period_key', p_period_key,
        'gross_charges_minor', v_gross_minor,
        'refunds_minor', v_refunds_minor,
        'chargebacks_minor', v_chargebacks_minor,
        'provider_fees_minor', v_fees_minor,
        'adjustments_minor', v_adjustments_minor,
        'net_settlement_minor', v_net_minor,
        'unresolved_discrepancies_count', 0,
        'closed_at', now(),
        'environment', 'homologation'
    );

    UPDATE public.financial_periods
    SET
        status = 'closed',
        closed_at = now(),
        closed_by = p_closed_by,
        snapshot = v_snapshot,
        updated_at = now()
    WHERE id = v_period.id;

    -- Log audit
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        new_data
    ) VALUES (
        p_closed_by,
        'financial_period_closed',
        'financial_periods',
        v_period.id,
        v_snapshot
    );

    RETURN jsonb_build_object(
        'success', true,
        'period_key', p_period_key,
        'status', 'closed',
        'snapshot', v_snapshot
    );
END;
$$;

-- 6. Atomic RPC: Reopen Financial Period
CREATE OR REPLACE FUNCTION public.reopen_financial_period(
    p_period_key text,
    p_reopened_by uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_period public.financial_periods%ROWTYPE;
BEGIN
    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabertura de período contábil.');
    END IF;

    SELECT * INTO v_period
    FROM public.financial_periods
    WHERE period_key = p_period_key
    FOR UPDATE;

    IF v_period.id IS NULL OR v_period.status != 'closed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Período não encontrado ou não está encerrado.');
    END IF;

    UPDATE public.financial_periods
    SET
        status = 'reopened',
        reopen_reason = p_reason,
        updated_at = now()
    WHERE id = v_period.id;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        new_data
    ) VALUES (
        p_reopened_by,
        'financial_period_reopened',
        'financial_periods',
        v_period.id,
        jsonb_build_object('reason', p_reason, 'reopened_at', now())
    );

    RETURN jsonb_build_object('success', true, 'period_key', p_period_key, 'status', 'reopened');
END;
$$;
