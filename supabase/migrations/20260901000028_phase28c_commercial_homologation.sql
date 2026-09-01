-- ============================================================================
-- MIGRATION 00028: Phase 28C — Commercial Homologation, Provider Onboarding & Compliance Readiness
-- ============================================================================

-- 1. Add Commercial Homologation Fields to payment_providers Table
ALTER TABLE public.payment_providers
    ADD COLUMN IF NOT EXISTS contact_status text NOT NULL DEFAULT 'not_contacted'
        CHECK (contact_status IN (
            'not_contacted',
            'contacted',
            'awaiting_response',
            'additional_information_requested',
            'underwriting',
            'approved',
            'approved_with_restrictions',
            'rejected',
            'suspended'
        )),
    ADD COLUMN IF NOT EXISTS product_approvals jsonb NOT NULL DEFAULT '{
        "advertiser_subscription": { "pix": "not_requested", "credit_card": "not_requested", "recurring_card": "not_requested" },
        "consumer_subscription": { "pix": "not_requested", "credit_card": "not_requested", "recurring_card": "not_requested" },
        "boost": { "pix": "not_requested", "credit_card": "not_requested", "recurring_card": "not_requested" }
    }'::jsonb,
    ADD COLUMN IF NOT EXISTS mcc_classification jsonb NOT NULL DEFAULT '{
        "requested_mcc": "7273",
        "requested_description": "Serviços de Publicidade e Classificados Online",
        "assigned_mcc": null,
        "assigned_description": null,
        "notes": null
    }'::jsonb,
    ADD COLUMN IF NOT EXISTS approval_evidence jsonb NOT NULL DEFAULT '{
        "protocol_number": null,
        "contact_date": null,
        "last_interaction": null,
        "reviewer_name": null,
        "evidence_document_url": null,
        "restrictions_notes": null
    }'::jsonb,
    ADD COLUMN IF NOT EXISTS external_actions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Update Seed Data for Canonical Adapters with Phase 28C Commercial Metadata
UPDATE public.payment_providers
SET
    contact_status = 'not_contacted',
    mcc_classification = jsonb_build_object(
        'requested_mcc', '7273',
        'requested_description', 'Classificados de Serviços e Publicidade Online 18+',
        'assigned_mcc', null,
        'assigned_description', null,
        'notes', 'Pendente de envio formal do dossiê de compliance.'
    ),
    product_approvals = jsonb_build_object(
        'advertiser_subscription', jsonb_build_object('pix', 'not_requested', 'credit_card', 'not_requested', 'recurring_card', 'not_requested'),
        'consumer_subscription', jsonb_build_object('pix', 'not_requested', 'credit_card', 'not_requested', 'recurring_card', 'not_requested'),
        'boost', jsonb_build_object('pix', 'not_requested', 'credit_card', 'not_requested', 'recurring_card', 'not_requested')
    )
WHERE code IN ('mercadopago', 'pagbank', 'pagarme', 'asaas', 'adyen');

UPDATE public.payment_providers
SET
    contact_status = 'rejected',
    overall_status = 'rejected',
    technical_status = 'rejected',
    commercial_status = 'rejected',
    compliance_status = 'rejected',
    approval_evidence = jsonb_build_object(
        'protocol_number', 'POLICY-RESTRICTED-ADULT',
        'contact_date', '2026-09-01T00:00:00Z',
        'last_interaction', '2026-09-01T00:00:00Z',
        'reviewer_name', 'Portal18 Compliance Team',
        'evidence_document_url', 'https://stripe.com/restricted-businesses',
        'restrictions_notes', 'Stripe proíbe explicitamente publicidade, conteúdo e classificados voltados a adultos.'
    )
WHERE code = 'stripe';

-- 3. Update get_payment_providers() Function to Return Granular Commercial Data
CREATE OR REPLACE FUNCTION public.get_payment_providers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_providers jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'code', code,
            'name', name,
            'description', description,
            'website', website,
            'technical_status', technical_status,
            'commercial_status', commercial_status,
            'compliance_status', compliance_status,
            'overall_status', overall_status,
            'contact_status', contact_status,
            'is_sandbox_enabled', is_sandbox_enabled,
            'is_production_enabled', is_production_enabled,
            'priority', priority,
            'supported_methods', supported_methods,
            'capabilities', capabilities,
            'product_approvals', product_approvals,
            'mcc_classification', mcc_classification,
            'approval_evidence', approval_evidence,
            'external_actions', external_actions,
            'business_model_review', business_model_review,
            'health_status', health_status,
            'last_health_check', last_health_check,
            'created_at', created_at,
            'updated_at', updated_at
        ) ORDER BY priority ASC
    ) INTO v_providers
    FROM public.payment_providers;

    RETURN jsonb_build_object(
        'success', true,
        'providers', COALESCE(v_providers, '[]'::jsonb)
    );
END;
$$;
