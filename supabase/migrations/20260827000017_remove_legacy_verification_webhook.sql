-- ============================================================================
-- MIGRATION 00017: Phase 13D — Remove Legacy Verification Webhook Overloads
-- ============================================================================

-- 1. Explicitly drop all legacy and conflicting overloads of process_verification_webhook
DROP FUNCTION IF EXISTS public.process_verification_webhook(text, text, text, text, text, boolean, boolean, text);
DROP FUNCTION IF EXISTS public.process_verification_webhook(text, text, text, text, text, boolean, boolean, text, jsonb);
DROP FUNCTION IF EXISTS public.process_verification_webhook(text, text, text, text, text, boolean, boolean, text, text);
DROP FUNCTION IF EXISTS public.process_verification_webhook(text, text, text, text, text, boolean, boolean, text, text, jsonb);

-- 2. Create the Single Canonical Function Definition
CREATE OR REPLACE FUNCTION public.process_verification_webhook(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_provider_reference text,
    p_status text,
    p_age_verified boolean,
    p_identity_verified boolean,
    p_result_code text,
    p_payload_hash text DEFAULT '00000000',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_verif public.verification_requests%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_new_status text;
    v_expires_at timestamptz;
BEGIN
    -- 1. Replay Attack & Duplicate Protection
    IF EXISTS (
        SELECT 1 FROM public.webhook_events
        WHERE provider = p_provider AND event_id = p_event_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Webhook duplicado já processado.');
    END IF;

    -- 2. Find associated verification request by provider reference
    SELECT * INTO v_verif
    FROM public.verification_requests
    WHERE provider_reference = p_provider_reference
    FOR UPDATE;

    IF v_verif.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referência de provedor não encontrada.');
    END IF;

    -- Validate State Machine Transition
    v_new_status := p_status;
    IF v_verif.status = 'verified' AND p_status IN ('pending', 'processing') THEN
        v_new_status := 'verified';
    END IF;

    IF v_new_status NOT IN ('not_started', 'pending', 'processing', 'verified', 'rejected', 'requires_review', 'expired') THEN
        v_new_status := 'requires_review';
    END IF;

    -- Expiration calculation: 1 year validity for approved KYC
    IF v_new_status = 'verified' THEN
        v_expires_at := now() + INTERVAL '365 days';
    END IF;

    -- Update verification record using validated text status, reviewed_at and metadata
    UPDATE public.verification_requests
    SET status = v_new_status,
        age_verified = p_age_verified,
        identity_verified = p_identity_verified,
        result_code = p_result_code,
        reviewed_at = CASE WHEN v_new_status IN ('verified', 'rejected') THEN now() ELSE reviewed_at END,
        expires_at = COALESCE(v_expires_at, expires_at),
        metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
        updated_at = now()
    WHERE id = v_verif.id;

    -- Sync advertiser profile status
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_verif.advertiser_id;

    -- Underage Protection Guard: Immediate profile suspension if age verification fails
    IF p_age_verified = false OR (v_new_status = 'rejected' AND p_result_code = 'underage_detected') THEN
        UPDATE public.advertiser_profiles
        SET verification_status = 'rejected',
            profile_status = 'suspended',
            visibility = 'hidden',
            rejection_reason = 'Suspensão preventiva: falha na comprovação de maioridade 18+ pelo provedor de identidade.',
            updated_at = now()
        WHERE id = v_verif.advertiser_id;

        INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
        VALUES (
            NULL,
            'verification_critical_age_failure',
            'advertiser_profiles',
            v_verif.advertiser_id,
            jsonb_build_object('reason', 'underage_detected', 'provider', p_provider)
        );
    ELSE
        UPDATE public.advertiser_profiles
        SET verification_status = v_new_status,
            updated_at = now()
        WHERE id = v_verif.advertiser_id;
    END IF;

    -- Insert Notification to Advertiser
    IF v_new_status = 'verified' THEN
        INSERT INTO public.notifications (profile_id, type, title, message)
        VALUES (
            v_adv.profile_id,
            'verification_verified',
            'Identidade Verificada com Sucesso! 🛡️',
            'Seu perfil recebeu o selo de Identidade Verificada 18+.'
        );
    ELSIF v_new_status = 'rejected' THEN
        INSERT INTO public.notifications (profile_id, type, title, message)
        VALUES (
            v_adv.profile_id,
            'verification_rejected',
            'Verificação Não Concluída',
            'Não foi possível concluir a verificação. Consulte seu painel para tentar novamente.'
        );
    END IF;

    -- Record webhook event for replay protection
    INSERT INTO public.webhook_events (provider, event_id, event_type, payload_hash, status)
    VALUES (p_provider, p_event_id, p_event_type, COALESCE(p_payload_hash, '00000000'), 'processed');

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        NULL,
        'verification_' || v_new_status,
        'verification_requests',
        v_verif.id,
        jsonb_build_object('provider', p_provider, 'age_verified', p_age_verified, 'result_code', p_result_code, 'metadata', p_metadata)
    );

    RETURN jsonb_build_object('success', true, 'status', v_new_status);
END;
$$;
