-- ============================================================================
-- MIGRATION 00008: Phase 5 — Identity & Age Verification (KYC) Architecture
-- ============================================================================

-- 1. Extend Verification Requests Table (Section 7, 8, 9)
ALTER TABLE public.verification_requests
    ADD COLUMN IF NOT EXISTS verification_type text NOT NULL DEFAULT 'identity_and_age',
    ADD COLUMN IF NOT EXISTS age_verified boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS result_code text,
    ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE,
    ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS retry_available_at timestamptz,
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verif_req_adv_status ON public.verification_requests(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_verif_req_provider_ref ON public.verification_requests(provider, provider_reference);
CREATE INDEX IF NOT EXISTS idx_verif_req_expires_at ON public.verification_requests(expires_at);

-- 2. Webhook Events Table (Replay Protection - Section 28 & 29)
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    event_id text NOT NULL,
    event_type text NOT NULL,
    payload_hash text NOT NULL,
    status text NOT NULL DEFAULT 'processed',
    received_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_webhook_provider_event UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON public.webhook_events(received_at DESC);

-- 3. Storage Bucket: verification-private (Section 11 & 12)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-private',
    'verification-private',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- RLS for verification-private bucket (Server & Super Admin only)
DROP POLICY IF EXISTS "verification_private_super_admin_select" ON storage.objects;
CREATE POLICY "verification_private_super_admin_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'verification-private' AND public.is_super_admin());

-- 4. Secure RPC: create_identity_verification_session (Section 21, 22, 23, 53)
CREATE OR REPLACE FUNCTION public.create_identity_verification_session(
    p_verification_type text DEFAULT 'identity_and_age'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv_id uuid;
    v_current_status text;
    v_req_id uuid;
    v_idempotency_key text;
    v_retry_count integer;
    v_retry_available_at timestamptz;
    v_session_token text;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    -- Identify advertiser profile owned by user (Requirement 22)
    SELECT id, verification_status INTO v_adv_id, v_current_status
    FROM public.advertiser_profiles
    WHERE profile_id = v_profile_id AND deleted_at IS NULL;

    IF v_adv_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado para este usuário.';
    END IF;

    -- If already verified and valid, return current verified status
    IF v_current_status = 'verified' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'verified',
            'message', 'Sua identidade já se encontra verificada e ativa.'
        );
    END IF;

    -- Check rate limiting & cooldown
    SELECT id, retry_count, retry_available_at
    INTO v_req_id, v_retry_count, v_retry_available_at
    FROM public.verification_requests
    WHERE advertiser_id = v_adv_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_retry_available_at IS NOT NULL AND v_retry_available_at > now() THEN
        RAISE EXCEPTION 'Limite de tentativas atingido. Nova tentativa disponível em %', v_retry_available_at;
    END IF;

    v_idempotency_key := 'verif_' || v_adv_id || '_' || to_char(now(), 'YYYYMMDDHH24MISS');
    v_session_token := 'sess_' || gen_random_uuid()::text;

    -- Create or update verification record
    INSERT INTO public.verification_requests (
        advertiser_id,
        provider,
        provider_reference,
        status,
        verification_type,
        idempotency_key,
        started_at,
        metadata
    )
    VALUES (
        v_adv_id,
        'unconfigured',
        v_session_token,
        'pending',
        p_verification_type,
        v_idempotency_key,
        now(),
        jsonb_build_object('client_platform', 'web')
    )
    RETURNING id INTO v_req_id;

    -- Update advertiser verification_status to pending
    UPDATE public.advertiser_profiles
    SET verification_status = 'pending',
        updated_at = now()
    WHERE id = v_adv_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'verification_started',
        'verification_requests',
        v_req_id,
        jsonb_build_object('advertiser_id', v_adv_id, 'type', p_verification_type)
    );

    RETURN jsonb_build_object(
        'success', true,
        'verification_id', v_req_id,
        'status', 'pending',
        'session_token', v_session_token,
        'redirect_url', '/advertiser/verification/return?session=' || v_session_token
    );
END;
$$;

-- 5. Secure RPC: process_verification_webhook (Section 26, 28, 30, 31, 32, 33, 34)
CREATE OR REPLACE FUNCTION public.process_verification_webhook(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_provider_reference text,
    p_status text,
    p_age_verified boolean,
    p_identity_verified boolean,
    p_result_code text,
    p_payload_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_verif public.verification_requests%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_expires_at timestamptz;
    v_new_status text;
BEGIN
    -- Replay Protection Check (Requirement 28)
    IF EXISTS (
        SELECT 1 FROM public.webhook_events
        WHERE provider = p_provider AND event_id = p_event_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Evento já processado anteriormente (Idempotente).');
    END IF;

    -- Find matching verification request
    SELECT * INTO v_verif
    FROM public.verification_requests
    WHERE provider_reference = p_provider_reference;

    IF v_verif.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referência de provedor não encontrada.');
    END IF;

    -- Validate State Machine Transition (Requirement 31)
    v_new_status := p_status;
    IF v_verif.status = 'verified' AND p_status IN ('pending', 'processing') THEN
        -- Ignore backwards transition from verified to pending
        v_new_status := 'verified';
    END IF;

    -- Expiration calculation: 1 year validity for approved KYC
    IF v_new_status = 'verified' THEN
        v_expires_at := now() + INTERVAL '365 days';
    END IF;

    -- Update verification record
    UPDATE public.verification_requests
    SET status = v_new_status::public.verification_status,
        age_verified = p_age_verified,
        identity_verified = p_identity_verified,
        result_code = p_result_code,
        completed_at = CASE WHEN v_new_status IN ('verified', 'rejected') THEN now() ELSE completed_at END,
        expires_at = COALESCE(v_expires_at, expires_at),
        updated_at = now()
    WHERE id = v_verif.id;

    -- Sync advertiser profile status
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_verif.advertiser_id;

    -- CRITICAL SAFETY MECHANISM: Underage Protection (Section 32, 33, 34)
    IF p_age_verified = false OR v_new_status = 'rejected' AND p_result_code = 'underage_detected' THEN
        UPDATE public.advertiser_profiles
        SET verification_status = 'rejected',
            profile_status = 'suspended',
            visibility = 'hidden',
            rejection_reason = 'Suspensão preventiva: falha na comprovação de maioridade 18+ pelo provedor de identidade.',
            updated_at = now()
        WHERE id = v_verif.advertiser_id;

        -- Critical audit log
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
        SET verification_status = v_new_status::public.verification_status,
            updated_at = now()
        WHERE id = v_verif.advertiser_id;
    END IF;

    -- Insert Notification to Advertiser (Section 51)
    IF v_new_status = 'verified' THEN
        INSERT INTO public.notifications (profile_id, type, title, message, metadata)
        VALUES (
            v_adv.profile_id,
            'verification_verified',
            'Identidade Verificada com Sucesso! 🛡️',
            'Seu perfil recebeu o selo de Identidade Verificada 18+.',
            jsonb_build_object('verification_id', v_verif.id)
        );
    ELSIF v_new_status = 'rejected' THEN
        INSERT INTO public.notifications (profile_id, type, title, message, metadata)
        VALUES (
            v_adv.profile_id,
            'verification_rejected',
            'Verificação Não Concluída',
            'Não foi possível concluir a verificação. Consulte seu painel para tentar novamente.',
            jsonb_build_object('verification_id', v_verif.id, 'result_code', p_result_code)
        );
    END IF;

    -- Record webhook event for replay protection
    INSERT INTO public.webhook_events (provider, event_id, event_type, payload_hash, status)
    VALUES (p_provider, p_event_id, p_event_type, p_payload_hash, 'processed');

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        NULL,
        'verification_' || v_new_status,
        'verification_requests',
        v_verif.id,
        jsonb_build_object('provider', p_provider, 'age_verified', p_age_verified, 'result_code', p_result_code)
    );

    RETURN jsonb_build_object('success', true, 'status', v_new_status);
END;
$$;

-- 6. Secure Super Admin Override RPC (Section 48, 49, 86)
CREATE OR REPLACE FUNCTION public.override_verification_status(
    p_verification_id uuid,
    p_new_status text,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_verif public.verification_requests%ROWTYPE;
BEGIN
    -- Strict Super Admin only permission (Requirement 47 & 86)
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas Super Administradores podem realizar override manual de verificação.';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'Justificativa administrativa obrigatória para override de KYC.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_verif FROM public.verification_requests WHERE id = p_verification_id;
    IF v_verif.id IS NULL THEN
        RAISE EXCEPTION 'Registro de verificação não encontrado.';
    END IF;

    UPDATE public.verification_requests
    SET status = p_new_status::public.verification_status,
        age_verified = CASE WHEN p_new_status = 'verified' THEN true ELSE age_verified END,
        identity_verified = CASE WHEN p_new_status = 'verified' THEN true ELSE identity_verified END,
        completed_at = now(),
        expires_at = CASE WHEN p_new_status = 'verified' THEN now() + INTERVAL '365 days' ELSE expires_at END,
        metadata = metadata || jsonb_build_object('manual_override', true, 'override_by', v_actor_id, 'reason', p_reason),
        updated_at = now()
    WHERE id = p_verification_id;

    UPDATE public.advertiser_profiles
    SET verification_status = p_new_status::public.verification_status,
        updated_at = now()
    WHERE id = v_verif.advertiser_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'verification_manual_override',
        'verification_requests',
        p_verification_id,
        jsonb_build_object('new_status', p_new_status, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;

-- 7. Expiration Cron RPC (Section 38, 39, 40)
CREATE OR REPLACE FUNCTION public.expire_stale_verifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer := 0;
    r RECORD;
BEGIN
    FOR r IN
        SELECT id, advertiser_id
        FROM public.verification_requests
        WHERE status = 'verified' AND expires_at < now()
    LOOP
        UPDATE public.verification_requests
        SET status = 'expired', updated_at = now()
        WHERE id = r.id;

        UPDATE public.advertiser_profiles
        SET verification_status = 'expired', updated_at = now()
        WHERE id = r.advertiser_id;

        INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
        VALUES (NULL, 'verification_expired', 'verification_requests', r.id, '{}'::jsonb);

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- 8. RLS Policies
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_staff_select"
    ON public.webhook_events FOR SELECT
    TO authenticated
    USING (public.is_staff());

CREATE POLICY "verif_requests_adv_select"
    ON public.verification_requests FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_staff());
