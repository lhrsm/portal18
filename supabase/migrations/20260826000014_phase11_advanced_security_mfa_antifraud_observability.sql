-- ============================================================================
-- MIGRATION 00014: Phase 11 — Advanced Security, MFA, Antifraud, Sessions, Rate Limiting, Observability & Incident Response
-- ============================================================================

-- 1. User MFA Factors Table (Section 4 & 5)
CREATE TABLE IF NOT EXISTS public.user_mfa_factors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    factor_type text NOT NULL CHECK (factor_type IN ('totp', 'phone', 'recovery_code')),
    status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified', 'verified', 'disabled')),
    secret_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_mfa_profile_type UNIQUE (profile_id, factor_type)
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_profile ON public.user_mfa_factors(profile_id);

-- 2. Recovery Codes Table (Section 8)
CREATE TABLE IF NOT EXISTS public.user_recovery_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    code_hash text NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_profile ON public.user_recovery_codes(profile_id);

-- 3. User Sessions Table (Section 12)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_reference_hash text NOT NULL,
    device_id text NOT NULL,
    user_agent_summary text NOT NULL,
    ip_hash text NOT NULL,
    country text,
    region text,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_profile ON public.user_sessions(profile_id, revoked_at);

-- 4. Trusted Devices Table (Section 14)
CREATE TABLE IF NOT EXISTS public.trusted_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_token_hash text NOT NULL,
    device_name text NOT NULL,
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    trusted_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    CONSTRAINT uq_trusted_devices UNIQUE (profile_id, device_token_hash)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_profile ON public.trusted_devices(profile_id);

-- 5. Security Events Table (Section 17 & 18)
CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    risk_score integer NOT NULL DEFAULT 0,
    ip_hash text NOT NULL,
    device_id text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_security_events_profile ON public.security_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity, created_at DESC);

-- 6. Risk Events Table (Section 22 & 23)
CREATE TABLE IF NOT EXISTS public.risk_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    advertiser_id uuid REFERENCES public.advertiser_profiles(id) ON DELETE SET NULL,
    risk_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    score_delta integer NOT NULL DEFAULT 0,
    source text NOT NULL DEFAULT 'rule',
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'false_positive', 'confirmed')),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_events_profile ON public.risk_events(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_risk_events_advertiser ON public.risk_events(advertiser_id, status);

-- 7. Account Risk Scores Table (Section 24)
CREATE TABLE IF NOT EXISTS public.account_risk_scores (
    profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    last_calculated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Risk Rules Table (Section 29)
CREATE TABLE IF NOT EXISTS public.risk_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    event_type text NOT NULL,
    score_delta integer NOT NULL,
    threshold integer NOT NULL DEFAULT 50,
    action text NOT NULL CHECK (action IN ('log', 'notify', 'challenge', 'rate_limit', 'manual_review', 'temporary_block', 'suspend')),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default risk rules
INSERT INTO public.risk_rules (code, event_type, score_delta, threshold, action, enabled)
VALUES 
    ('RULE_CREDENTIAL_STUFFING', 'credential_stuffing_suspected', 35, 60, 'challenge', true),
    ('RULE_MULTIPLE_FAILED_LOGINS', 'login_failed', 10, 40, 'rate_limit', true),
    ('RULE_ACCOUNT_TAKEOVER', 'account_takeover_suspected', 45, 70, 'manual_review', true),
    ('RULE_SUSPICIOUS_LOGIN', 'suspicious_login', 20, 50, 'notify', true),
    ('RULE_MEDIA_ABUSE', 'media_abuse', 30, 60, 'manual_review', true),
    ('RULE_REPORT_FLOOD', 'report_abuse', 15, 50, 'rate_limit', true)
ON CONFLICT (code) DO NOTHING;

-- 9. Incidents Table (Section 112 & 113)
CREATE TABLE IF NOT EXISTS public.incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
    status text NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    started_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    public_message text NOT NULL,
    internal_summary text NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status, started_at DESC);

-- 10. Platform Kill Switches Table (Section 117)
CREATE TABLE IF NOT EXISTS public.platform_kill_switches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    switch_key text UNIQUE NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    reason text,
    updated_by uuid REFERENCES public.profiles(id),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default kill switches
INSERT INTO public.platform_kill_switches (switch_key, enabled, reason)
VALUES 
    ('disable_signup', false, 'Bloqueio emergencial de novos cadastros'),
    ('disable_login_except_admin', false, 'Bloqueio emergencial de login de usuários'),
    ('disable_uploads', false, 'Bloqueio emergencial de novos uploads de mídia'),
    ('disable_video', false, 'Bloqueio emergencial de envio de vídeos'),
    ('disable_public_profiles', false, 'Modo seguro: ocultação de perfis públicos'),
    ('disable_new_checkouts', false, 'Bloqueio emergencial de novos pagamentos'),
    ('disable_promotions', false, 'Bloqueio emergencial de criação de promoções'),
    ('disable_push', false, 'Bloqueio emergencial de envio de push notifications')
ON CONFLICT (switch_key) DO NOTHING;

-- 11. RPC: revoke_user_session
CREATE OR REPLACE FUNCTION public.revoke_user_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    UPDATE public.user_sessions
    SET revoked_at = now()
    WHERE id = p_session_id AND profile_id = v_profile_id;

    RETURN jsonb_build_object('success', true, 'message', 'Sessão encerrada com sucesso.');
END;
$$;

-- 12. RPC: revoke_all_other_sessions
CREATE OR REPLACE FUNCTION public.revoke_all_other_sessions(p_current_session_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    UPDATE public.user_sessions
    SET revoked_at = now()
    WHERE profile_id = v_profile_id 
      AND (p_current_session_id IS NULL OR id <> p_current_session_id)
      AND revoked_at IS NULL;

    RETURN jsonb_build_object('success', true, 'message', 'Todas as outras sessões foram encerradas.');
END;
$$;

-- 13. RPC: record_security_event
CREATE OR REPLACE FUNCTION public.record_security_event(
    p_event_type text,
    p_severity text,
    p_risk_score integer DEFAULT 0,
    p_ip_hash text DEFAULT '00000000',
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_event_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();

    INSERT INTO public.security_events (profile_id, event_type, severity, risk_score, ip_hash, metadata)
    VALUES (v_profile_id, p_event_type, p_severity, p_risk_score, p_ip_hash, p_metadata)
    RETURNING id INTO v_event_id;

    RETURN jsonb_build_object('success', true, 'event_id', v_event_id);
END;
$$;

-- 14. RPC: update_kill_switch (Section 118)
CREATE OR REPLACE FUNCTION public.update_kill_switch(
    p_switch_key text,
    p_enabled boolean,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar kill switches.';
    END IF;

    UPDATE public.platform_kill_switches
    SET enabled = p_enabled, reason = p_reason, updated_by = v_profile_id, updated_at = now()
    WHERE switch_key = p_switch_key;

    RETURN jsonb_build_object('success', true, 'switch_key', p_switch_key, 'enabled', p_enabled);
END;
$$;

-- 15. RLS Policies
ALTER TABLE public.user_mfa_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_kill_switches ENABLE ROW LEVEL SECURITY;

-- MFA & Recovery (Owner only)
CREATE POLICY "mfa_owner_all" ON public.user_mfa_factors FOR ALL TO authenticated 
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "recovery_owner_all" ON public.user_recovery_codes FOR ALL TO authenticated 
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- Sessions & Devices (Owner read/revoke)
CREATE POLICY "sessions_owner_select" ON public.user_sessions FOR SELECT TO authenticated USING (profile_id = public.current_profile_id());
CREATE POLICY "sessions_owner_update" ON public.user_sessions FOR UPDATE TO authenticated USING (profile_id = public.current_profile_id());
CREATE POLICY "devices_owner_all" ON public.trusted_devices FOR ALL TO authenticated 
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- Security Events (Owner read non-internal, Admin all)
CREATE POLICY "sec_events_owner_select" ON public.security_events FOR SELECT TO authenticated USING (profile_id = public.current_profile_id() OR public.is_admin());
CREATE POLICY "sec_events_admin" ON public.security_events FOR ALL TO authenticated USING (public.is_admin());

-- Risk Events & Risk Scores (Staff & Admin only)
CREATE POLICY "risk_events_staff" ON public.risk_events FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "risk_scores_staff" ON public.account_risk_scores FOR ALL TO authenticated USING (public.is_staff());
CREATE POLICY "risk_rules_admin" ON public.risk_rules FOR ALL TO authenticated USING (public.is_admin());

-- Incidents (Public read, Staff manage)
CREATE POLICY "incidents_public_read" ON public.incidents FOR SELECT TO public USING (true);
CREATE POLICY "incidents_admin" ON public.incidents FOR ALL TO authenticated USING (public.is_staff());

-- Kill Switches (Public read status, Admin write)
CREATE POLICY "kill_switches_public_read" ON public.platform_kill_switches FOR SELECT TO public USING (true);
CREATE POLICY "kill_switches_admin" ON public.platform_kill_switches FOR ALL TO authenticated USING (public.is_admin());
