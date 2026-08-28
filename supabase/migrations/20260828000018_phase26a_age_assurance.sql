-- ============================================================================
-- PHASE 26A: ECA DIGITAL AGE ASSURANCE & PRIVACY-PRESERVING AGE GATE
-- ============================================================================

-- 1. Table for storing privacy-preserving visitor age assurance credentials
CREATE TABLE IF NOT EXISTS public.age_verification_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider text NOT NULL DEFAULT 'unconfigured',
    provider_subject_hash text NOT NULL, -- SHA-256 / HMAC keyed hash, never raw PII or CPF
    age_band text NOT NULL DEFAULT '18_plus', -- '18_plus', 'under_18', 'unknown'
    assurance_level text NOT NULL DEFAULT 'high', -- 'low', 'medium', 'high', 'very_high'
    credential_reference text, -- Opaque reference from external provider
    status text NOT NULL DEFAULT 'active', -- 'active', 'expired', 'revoked'
    verified_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for lookup by subject hash and active status
CREATE INDEX IF NOT EXISTS idx_age_cred_subject_hash ON public.age_verification_credentials(provider_subject_hash, status);
CREATE INDEX IF NOT EXISTS idx_age_cred_profile_id ON public.age_verification_credentials(profile_id);

-- Enable RLS
ALTER TABLE public.age_verification_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own age verification status
CREATE POLICY age_credentials_select_own
    ON public.age_verification_credentials FOR SELECT
    TO authenticated
    USING (profile_id = public.current_profile_id() OR public.is_admin());

-- Policy: Admin can view for auditing (without exposing PII)
CREATE POLICY age_credentials_admin_all
    ON public.age_verification_credentials FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Secure RPC to record an age assurance result server-side
CREATE OR REPLACE FUNCTION public.record_age_assurance_credential(
    p_provider text,
    p_provider_subject_hash text,
    p_age_band text DEFAULT '18_plus',
    p_assurance_level text DEFAULT 'high',
    p_credential_reference text DEFAULT NULL,
    p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_cred_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();

    INSERT INTO public.age_verification_credentials (
        profile_id,
        provider,
        provider_subject_hash,
        age_band,
        assurance_level,
        credential_reference,
        status,
        verified_at,
        expires_at,
        created_at,
        updated_at
    )
    VALUES (
        v_profile_id,
        p_provider,
        p_provider_subject_hash,
        p_age_band,
        p_assurance_level,
        p_credential_reference,
        CASE WHEN p_age_band = 'under_18' THEN 'revoked' ELSE 'active' END,
        now(),
        p_expires_at,
        now(),
        now()
    )
    RETURNING id INTO v_cred_id;

    RETURN v_cred_id;
END;
$$;

-- 3. Secure RPC to check if current user or profile has valid age assurance
CREATE OR REPLACE FUNCTION public.check_user_age_assurance(p_profile_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_profile uuid;
    v_cred public.age_verification_credentials%ROWTYPE;
BEGIN
    v_target_profile := COALESCE(p_profile_id, public.current_profile_id());

    IF v_target_profile IS NULL THEN
        RETURN jsonb_build_object(
            'has_assurance', false,
            'age_band', 'unknown',
            'status', 'not_verified'
        );
    END IF;

    SELECT * INTO v_cred
    FROM public.age_verification_credentials
    WHERE profile_id = v_target_profile
      AND status = 'active'
      AND age_band = '18_plus'
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY verified_at DESC
    LIMIT 1;

    IF v_cred.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'has_assurance', true,
            'age_band', v_cred.age_band,
            'assurance_level', v_cred.assurance_level,
            'provider', v_cred.provider,
            'verified_at', v_cred.verified_at,
            'expires_at', v_cred.expires_at,
            'status', 'verified'
        );
    ELSE
        RETURN jsonb_build_object(
            'has_assurance', false,
            'age_band', 'unknown',
            'status', 'not_verified'
        );
    END IF;
END;
$$;
