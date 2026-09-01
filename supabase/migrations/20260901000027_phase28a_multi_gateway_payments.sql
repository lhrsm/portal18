-- ============================================================================
-- MIGRATION 00027: Phase 28A — Multi-Gateway Payment Architecture, Provider Evaluation & Homologation Foundation
-- ============================================================================

-- 1. Enums for Provider Lifecycle and Homologation
DO $$ BEGIN
    CREATE TYPE public.provider_homologation_status AS ENUM (
        'candidate',
        'technical_review',
        'commercial_review',
        'compliance_review',
        'sandbox_ready',
        'homologating',
        'approved',
        'rejected',
        'suspended',
        'deprecated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_failure_category AS ENUM (
        'insufficient_funds',
        'card_declined',
        'expired_card',
        'invalid_payment_method',
        'fraud_suspected',
        'provider_error',
        'network_error',
        'timeout',
        'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.chargeback_status AS ENUM (
        'received',
        'under_review',
        'evidence_required',
        'submitted',
        'won',
        'lost',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Payment Providers Registry Table
CREATE TABLE IF NOT EXISTS public.payment_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE, -- e.g. 'mercadopago', 'pagbank', 'pagarme', 'asaas', 'adyen', 'stripe', 'unconfigured'
    name text NOT NULL,
    description text,
    website text,
    technical_status public.provider_homologation_status NOT NULL DEFAULT 'candidate',
    commercial_status public.provider_homologation_status NOT NULL DEFAULT 'candidate',
    compliance_status public.provider_homologation_status NOT NULL DEFAULT 'candidate',
    overall_status public.provider_homologation_status NOT NULL DEFAULT 'candidate',
    is_sandbox_enabled boolean NOT NULL DEFAULT false,
    is_production_enabled boolean NOT NULL DEFAULT false,
    priority integer NOT NULL DEFAULT 100, -- lower number = higher priority
    supported_methods jsonb NOT NULL DEFAULT '["pix", "credit_card"]'::jsonb,
    capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
    business_model_review jsonb NOT NULL DEFAULT '{
        "adult_platform_disclosed": false,
        "subscriptions_disclosed": false,
        "consumer_premium_disclosed": false,
        "boost_products_disclosed": false,
        "reviewed_at": null,
        "reviewed_by": null,
        "reference_number": null,
        "notes": null,
        "approved_products": []
    }'::jsonb,
    health_status text NOT NULL DEFAULT 'unknown' CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'unavailable')),
    last_health_check timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_providers_code ON public.payment_providers(code);
CREATE INDEX IF NOT EXISTS idx_payment_providers_status ON public.payment_providers(overall_status, is_production_enabled);

-- 3. Provider Homologation Audit History Table
CREATE TABLE IF NOT EXISTS public.provider_homologations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid NOT NULL REFERENCES public.payment_providers(id) ON DELETE CASCADE,
    stage public.provider_homologation_status NOT NULL,
    action text NOT NULL, -- e.g. 'submitted_dossier', 'compliance_approved', 'sandbox_tested', 'commercial_signed'
    staff_member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reference_number text,
    notes text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prov_homologations_provider ON public.provider_homologations(provider_id, created_at DESC);

-- 4. Payment Attempts Table
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
    provider_code text NOT NULL,
    payment_method text NOT NULL, -- 'pix', 'credit_card', 'recurring_card'
    amount_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    status public.payment_status NOT NULL DEFAULT 'pending',
    failure_category public.payment_failure_category,
    provider_request_id text,
    provider_transaction_id text,
    idempotency_key text UNIQUE,
    environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pay_attempts_order ON public.payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_pay_attempts_idempotency ON public.payment_attempts(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_pay_attempts_provider_tx ON public.payment_attempts(provider_code, provider_transaction_id);

-- 5. Payment Method Routing Configuration Table
CREATE TABLE IF NOT EXISTS public.payment_method_routes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method text NOT NULL, -- 'pix', 'credit_card', 'recurring_card', 'boost_instant'
    product_scope text NOT NULL DEFAULT 'all', -- 'all', 'advertiser_subscription', 'consumer_subscription', 'boost'
    primary_provider_id uuid NOT NULL REFERENCES public.payment_providers(id),
    secondary_provider_id uuid REFERENCES public.payment_providers(id),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_method_product_scope UNIQUE (payment_method, product_scope)
);

-- 6. Payment Chargebacks Table
CREATE TABLE IF NOT EXISTS public.payment_chargebacks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    provider_code text NOT NULL,
    provider_dispute_id text NOT NULL,
    amount_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    reason_code text,
    status public.chargeback_status NOT NULL DEFAULT 'received',
    evidence_due_date timestamptz,
    evidence_submitted_at timestamptz,
    resolved_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_chargeback_provider_dispute UNIQUE (provider_code, provider_dispute_id)
);

CREATE INDEX IF NOT EXISTS idx_chargebacks_status ON public.payment_chargebacks(status);
CREATE INDEX IF NOT EXISTS idx_chargebacks_payment ON public.payment_chargebacks(payment_id);

-- 7. Payment Refunds Table
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    provider_code text NOT NULL,
    provider_refund_id text,
    refund_type text NOT NULL DEFAULT 'full' CHECK (refund_type IN ('full', 'partial')),
    amount_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'BRL',
    reason text,
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('requested', 'processing', 'completed', 'failed')),
    requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.payment_refunds(payment_id);

-- 8. Payment Reconciliation Discrepancy Logs Table
CREATE TABLE IF NOT EXISTS public.payment_reconciliation_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code text NOT NULL,
    discrepancy_type text NOT NULL, -- 'missing_local', 'missing_provider', 'amount_mismatch', 'status_mismatch'
    provider_reference text,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    local_amount_cents integer,
    provider_amount_cents integer,
    local_status text,
    provider_status text,
    resolved boolean NOT NULL DEFAULT false,
    resolution_notes text,
    resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_resolved ON public.payment_reconciliation_logs(resolved, discrepancy_type);

-- 9. Seed Evaluated Payment Providers (Non-Negotiable Invariants)
INSERT INTO public.payment_providers (
    code,
    name,
    description,
    website,
    technical_status,
    commercial_status,
    compliance_status,
    overall_status,
    is_sandbox_enabled,
    is_production_enabled,
    priority,
    supported_methods,
    capabilities,
    business_model_review
)
VALUES
    (
        'unconfigured',
        'Unconfigured Mock Adapter (Kill Switch)',
        'Ambiente controlado seguro para testes de homologação com Kill Switch 100% ativo.',
        'https://portal18.com.br',
        'approved',
        'approved',
        'approved',
        'approved',
        true,
        false,
        999,
        '["pix", "credit_card", "recurring_card"]'::jsonb,
        '{
            "pix": "supported",
            "pix_qr_code": "supported",
            "pix_copy_paste": "supported",
            "credit_card": "supported",
            "tokenization": "supported",
            "recurring_card": "supported",
            "recurring_pix": "supported",
            "refund": "supported",
            "partial_refund": "supported",
            "chargeback_webhook": "supported",
            "subscription_webhook": "supported",
            "payment_webhook": "supported",
            "split": "unsupported",
            "antifraud": "supported",
            "3ds": "supported",
            "idempotency": "supported",
            "sandbox": "supported",
            "webhook_signature": "supported",
            "reconciliation": "supported",
            "settlement_reports": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": true,
            "subscriptions_disclosed": true,
            "consumer_premium_disclosed": true,
            "boost_products_disclosed": true,
            "reviewed_at": "2026-09-01T00:00:00Z",
            "reviewed_by": "Architecture Lead",
            "reference_number": "MOCK-SAFE-01",
            "notes": "Driver simulado seguro com Kill Switch obrigatório.",
            "approved_products": ["plans_7_30_90", "consumer_premium", "boosts"]
        }'::jsonb
    ),
    (
        'mercadopago',
        'Mercado Pago',
        'PSP líder na América Latina com forte aceitação de PIX Instantâneo e Checkout Transparente.',
        'https://www.mercadopago.com.br',
        'technical_review',
        'commercial_review',
        'compliance_review',
        'candidate',
        false,
        false,
        10,
        '["pix", "credit_card", "recurring_card"]'::jsonb,
        '{
            "pix": "supported",
            "pix_qr_code": "supported",
            "pix_copy_paste": "supported",
            "credit_card": "supported",
            "tokenization": "supported",
            "recurring_card": "supported",
            "recurring_pix": "unknown",
            "refund": "supported",
            "partial_refund": "supported",
            "chargeback_webhook": "supported",
            "subscription_webhook": "supported",
            "payment_webhook": "supported",
            "split": "supported",
            "antifraud": "supported",
            "3ds": "supported",
            "idempotency": "supported",
            "sandbox": "supported",
            "webhook_signature": "supported",
            "reconciliation": "supported",
            "settlement_reports": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": false,
            "subscriptions_disclosed": false,
            "consumer_premium_disclosed": false,
            "boost_products_disclosed": false,
            "reviewed_at": null,
            "reviewed_by": null,
            "reference_number": null,
            "notes": "Requer submissão formal de dossiê de publicidade adulta e análise de risco MCC 7273/5967.",
            "approved_products": []
        }'::jsonb
    ),
    (
        'pagbank',
        'PagBank (PagSeguro)',
        'Ecossistema brasileiro com suporte consolidado a cartões e PIX dinâmico.',
        'https://pagbank.com.br',
        'technical_review',
        'commercial_review',
        'compliance_review',
        'candidate',
        false,
        false,
        20,
        '["pix", "credit_card", "recurring_card"]'::jsonb,
        '{
            "pix": "supported",
            "pix_qr_code": "supported",
            "pix_copy_paste": "supported",
            "credit_card": "supported",
            "tokenization": "supported",
            "recurring_card": "supported",
            "recurring_pix": "unknown",
            "refund": "supported",
            "partial_refund": "supported",
            "chargeback_webhook": "supported",
            "subscription_webhook": "supported",
            "payment_webhook": "supported",
            "split": "supported",
            "antifraud": "supported",
            "3ds": "supported",
            "idempotency": "supported",
            "sandbox": "supported",
            "webhook_signature": "supported",
            "reconciliation": "supported",
            "settlement_reports": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": false,
            "subscriptions_disclosed": false,
            "consumer_premium_disclosed": false,
            "boost_products_disclosed": false,
            "reviewed_at": null,
            "reviewed_by": null,
            "reference_number": null,
            "notes": "Necessário alinhamento com compliance comercial sobre marketplace de classificados adultos.",
            "approved_products": []
        }'::jsonb
    ),
    (
        'pagarme',
        'Pagar.me (StoneCo)',
        'Gateway especializado em desenvolvedores com alta taxa de aprovação e infraestrutura modular de split.',
        'https://pagar.me',
        'technical_review',
        'commercial_review',
        'compliance_review',
        'candidate',
        false,
        false,
        30,
        '["pix", "credit_card", "recurring_card"]'::jsonb,
        '{
            "pix": "supported",
            "pix_qr_code": "supported",
            "pix_copy_paste": "supported",
            "credit_card": "supported",
            "tokenization": "supported",
            "recurring_card": "supported",
            "recurring_pix": "unknown",
            "refund": "supported",
            "partial_refund": "supported",
            "chargeback_webhook": "supported",
            "subscription_webhook": "supported",
            "payment_webhook": "supported",
            "split": "supported",
            "antifraud": "supported",
            "3ds": "supported",
            "idempotency": "supported",
            "sandbox": "supported",
            "webhook_signature": "supported",
            "reconciliation": "supported",
            "settlement_reports": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": false,
            "subscriptions_disclosed": false,
            "consumer_premium_disclosed": false,
            "boost_products_disclosed": false,
            "reviewed_at": null,
            "reviewed_by": null,
            "reference_number": null,
            "notes": "Contrato Stone requer validação de underwriting e KYC do Portal18.",
            "approved_products": []
        }'::jsonb
    ),
    (
        'asaas',
        'Asaas',
        'Plataforma de gestão financeira e automação de cobranças com automação de PIX e régua de cobrança.',
        'https://asaas.com',
        'technical_review',
        'commercial_review',
        'compliance_review',
        'candidate',
        false,
        false,
        40,
        '["pix", "credit_card", "recurring_card"]'::jsonb,
        '{
            "pix": "supported",
            "pix_qr_code": "supported",
            "pix_copy_paste": "supported",
            "credit_card": "supported",
            "tokenization": "supported",
            "recurring_card": "supported",
            "recurring_pix": "supported",
            "refund": "supported",
            "partial_refund": "supported",
            "chargeback_webhook": "supported",
            "subscription_webhook": "supported",
            "payment_webhook": "supported",
            "split": "supported",
            "antifraud": "supported",
            "3ds": "unknown",
            "idempotency": "supported",
            "sandbox": "supported",
            "webhook_signature": "supported",
            "reconciliation": "supported",
            "settlement_reports": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": false,
            "subscriptions_disclosed": false,
            "consumer_premium_disclosed": false,
            "boost_products_disclosed": false,
            "reviewed_at": null,
            "reviewed_by": null,
            "reference_number": null,
            "notes": "Análise de termos de uso de serviços de intermediação para conteúdo digital 18+.",
            "approved_products": []
        }'::jsonb
    ),
    (
        'adyen',
        'Adyen',
        'Plataforma global de pagamentos de alto volume com suporte a antifraude avançado e múltiplos adquirentes.',
        'https://adyen.com',
        'technical_review',
        'commercial_review',
        'compliance_review',
        'candidate',
        false,
        false,
        50,
        '["pix", "credit_card", "recurring_card"]'::jsonb,
        '{
            "pix": "supported",
            "pix_qr_code": "supported",
            "pix_copy_paste": "supported",
            "credit_card": "supported",
            "tokenization": "supported",
            "recurring_card": "supported",
            "recurring_pix": "unknown",
            "refund": "supported",
            "partial_refund": "supported",
            "chargeback_webhook": "supported",
            "subscription_webhook": "supported",
            "payment_webhook": "supported",
            "split": "supported",
            "antifraud": "supported",
            "3ds": "supported",
            "idempotency": "supported",
            "sandbox": "supported",
            "webhook_signature": "supported",
            "reconciliation": "supported",
            "settlement_reports": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": false,
            "subscriptions_disclosed": false,
            "consumer_premium_disclosed": false,
            "boost_products_disclosed": false,
            "reviewed_at": null,
            "reviewed_by": null,
            "reference_number": null,
            "notes": "Requer faturamento mínimo elevado e comitê de risco de conteúdo adulto internacional.",
            "approved_products": []
        }'::jsonb
    ),
    (
        'stripe',
        'Stripe',
        'Provedor internacional de pagamentos. POLÍTICA ATUAL PROÍBE PRODUTOS OU SERVIÇOS ADULTOS.',
        'https://stripe.com',
        'rejected',
        'rejected',
        'rejected',
        'rejected',
        false,
        false,
        9999,
        '[]'::jsonb,
        '{
            "pix": "supported",
            "credit_card": "supported",
            "recurring_card": "supported",
            "refund": "supported",
            "chargeback_webhook": "supported"
        }'::jsonb,
        '{
            "adult_platform_disclosed": true,
            "subscriptions_disclosed": true,
            "consumer_premium_disclosed": true,
            "boost_products_disclosed": true,
            "reviewed_at": "2026-09-01T00:00:00Z",
            "reviewed_by": "Compliance Lead",
            "reference_number": "POLICY-RESTRICTED-ADULT",
            "notes": "INCOMPATÍVEL: Stripe Restricted Business Policy proíbe expressamente conteúdo, anúncios e serviços adultos.",
            "approved_products": []
        }'::jsonb
    )
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    capabilities = EXCLUDED.capabilities;

-- 10. Seed Initial Payment Routes
DO $$
DECLARE
    v_unconfigured_id uuid;
BEGIN
    SELECT id INTO v_unconfigured_id FROM public.payment_providers WHERE code = 'unconfigured' LIMIT 1;
    IF v_unconfigured_id IS NOT NULL THEN
        INSERT INTO public.payment_method_routes (payment_method, product_scope, primary_provider_id, is_active)
        VALUES
            ('pix', 'all', v_unconfigured_id, true),
            ('credit_card', 'all', v_unconfigured_id, true),
            ('recurring_card', 'all', v_unconfigured_id, true)
        ON CONFLICT (payment_method, product_scope) DO NOTHING;
    END IF;
END $$;

-- 11. RPC: Get Payment Providers Overview
CREATE OR REPLACE FUNCTION public.get_payment_providers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_providers jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'code', p.code,
            'name', p.name,
            'description', p.description,
            'website', p.website,
            'technical_status', p.technical_status,
            'commercial_status', p.commercial_status,
            'compliance_status', p.compliance_status,
            'overall_status', p.overall_status,
            'is_sandbox_enabled', p.is_sandbox_enabled,
            'is_production_enabled', p.is_production_enabled,
            'priority', p.priority,
            'supported_methods', p.supported_methods,
            'capabilities', p.capabilities,
            'business_model_review', p.business_model_review,
            'health_status', p.health_status,
            'last_health_check', p.last_health_check,
            'created_at', p.created_at,
            'updated_at', p.updated_at
        ) ORDER BY p.priority ASC
    )
    INTO v_providers
    FROM public.payment_providers p;

    RETURN jsonb_build_object(
        'success', true,
        'providers', COALESCE(v_providers, '[]'::jsonb),
        'timestamp', now()
    );
END;
$$;

-- 12. RPC: Record Provider Homologation Step
CREATE OR REPLACE FUNCTION public.record_provider_homologation_step(
    p_provider_code text,
    p_stage public.provider_homologation_status,
    p_action text,
    p_reference_number text DEFAULT NULL,
    p_notes text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prov_id uuid;
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();

    SELECT id INTO v_prov_id FROM public.payment_providers WHERE code = p_provider_code LIMIT 1;
    IF v_prov_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Provedor não encontrado.');
    END IF;

    INSERT INTO public.provider_homologations (
        provider_id,
        stage,
        action,
        staff_member_id,
        reference_number,
        notes,
        metadata
    ) VALUES (
        v_prov_id,
        p_stage,
        p_action,
        v_user_id,
        p_reference_number,
        p_notes,
        p_metadata
    );

    -- Update provider status if appropriate
    UPDATE public.payment_providers
    SET
        overall_status = p_stage,
        updated_at = now()
    WHERE id = v_prov_id;

    RETURN jsonb_build_object('success', true, 'stage', p_stage);
END;
$$;
