-- ============================================================================
-- MIGRATION 00007: Phase 4 — Super Admin, Moderation, Reports & Audit
-- ============================================================================

-- 1. Helper Security Functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.has_role('super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT public.has_role('moderator') OR public.has_role('admin') OR public.has_role('super_admin');
$$;

-- 2. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_profile_read ON public.notifications(profile_id, read_at, created_at DESC);

-- 3. Moderation Internal Notes Table (Staff Only)
CREATE TABLE IF NOT EXISTS public.moderation_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL, -- 'advertiser', 'media', 'report', 'user'
    entity_id uuid NOT NULL,
    author_profile_id uuid NOT NULL REFERENCES public.profiles(id),
    note text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mod_notes_entity ON public.moderation_notes(entity_type, entity_id, created_at DESC);

-- 4. Moderation Feedback Table (Public to Advertiser)
CREATE TABLE IF NOT EXISTS public.moderation_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    entity_type text NOT NULL, -- 'profile', 'media'
    entity_id uuid NOT NULL,
    message text NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id),
    resolved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mod_feedback_adv ON public.moderation_feedback(advertiser_id, created_at DESC);

-- 5. Extend Reports & Advertiser Profiles Columns
ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS resolution_notes text;

ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
    ADD COLUMN IF NOT EXISTS published_at timestamptz,
    ADD COLUMN IF NOT EXISTS review_feedback text;

-- 6. Indexes for Performance (Section 69)
CREATE INDEX IF NOT EXISTS idx_adv_profiles_status_sub ON public.advertiser_profiles(profile_status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_adv_media_mod_created ON public.advertiser_media(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_sev ON public.reports(status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 7. Secure Admin RPC: approve_advertiser_profile (Section 14, 15, 16)
CREATE OR REPLACE FUNCTION public.approve_advertiser_profile(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_approved_media_count integer;
BEGIN
    -- Verify staff permissions
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação ou administração.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Concurrency check (optimistic lock)
    IF v_adv.profile_status = 'active' THEN
        RETURN jsonb_build_object('success', true, 'status', 'active', 'message', 'O perfil já se encontra aprovado e ativo.');
    END IF;

    -- Verify at least 1 approved media (Requirement 16)
    SELECT count(*) INTO v_approved_media_count
    FROM public.advertiser_media
    WHERE advertiser_id = p_advertiser_id
      AND moderation_status = 'approved'
      AND deleted_at IS NULL;

    IF v_approved_media_count = 0 THEN
        RAISE EXCEPTION 'O perfil precisa de pelo menos uma mídia aprovada antes da publicação.';
    END IF;

    -- Update profile status to active
    UPDATE public.advertiser_profiles
    SET profile_status = 'active',
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        published_at = COALESCE(published_at, now()),
        rejection_reason = NULL,
        review_feedback = NULL,
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Insert Notification to Advertiser (Requirement 86)
    INSERT INTO public.notifications (profile_id, type, title, message, metadata)
    VALUES (
        v_adv.profile_id,
        'profile_approved',
        'Perfil Aprovado com Sucesso! 🎉',
        'Seu perfil foi aprovado pela moderação e já está publicado nas buscas de sua cidade e estado.',
        jsonb_build_object('advertiser_id', p_advertiser_id)
    );

    -- Insert History & Audit Log
    INSERT INTO public.advertiser_profile_history (advertiser_id, changed_by, change_type, changed_fields)
    VALUES (
        p_advertiser_id,
        v_actor_id,
        'profile_approved',
        jsonb_build_object('status', 'active', 'approved_at', now())
    );

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'admin_profile_approved',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('profile_id', v_adv.profile_id, 'approved_media_count', v_approved_media_count)
    );

    RETURN jsonb_build_object('success', true, 'status', 'active', 'message', 'Perfil aprovado e publicado com sucesso.');
END;
$$;

-- 8. Secure Admin RPC: request_changes_advertiser_profile (Section 17 & 18)
CREATE OR REPLACE FUNCTION public.request_changes_advertiser_profile(
    p_advertiser_id uuid,
    p_feedback text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil não encontrado.';
    END IF;

    UPDATE public.advertiser_profiles
    SET profile_status = 'rejected',
        review_feedback = p_feedback,
        rejection_reason = p_feedback,
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Feedback entry
    INSERT INTO public.moderation_feedback (advertiser_id, entity_type, entity_id, message, created_by)
    VALUES (p_advertiser_id, 'profile', p_advertiser_id, p_feedback, v_actor_id);

    -- Notification (Requirement 87)
    INSERT INTO public.notifications (profile_id, type, title, message, metadata)
    VALUES (
        v_adv.profile_id,
        'profile_changes_requested',
        'Ajustes Solicitados no Perfil',
        'Seu perfil precisa de alguns ajustes antes da publicação. Consulte as pendências no seu painel.',
        jsonb_build_object('feedback', p_feedback)
    );

    -- Audit
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'admin_profile_changes_requested',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('feedback', p_feedback)
    );

    RETURN jsonb_build_object('success', true, 'status', 'rejected', 'message', 'Solicitação de ajustes enviada.');
END;
$$;

-- 9. Secure Admin RPC: reject_advertiser_profile (Section 19)
CREATE OR REPLACE FUNCTION public.reject_advertiser_profile(
    p_advertiser_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil não encontrado.';
    END IF;

    UPDATE public.advertiser_profiles
    SET profile_status = 'rejected',
        rejection_reason = p_reason,
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_advertiser_id;

    INSERT INTO public.notifications (profile_id, type, title, message, metadata)
    VALUES (
        v_adv.profile_id,
        'profile_rejected',
        'Perfil Recusado pela Moderação',
        'Seu perfil foi recusado. Motivo: ' || p_reason,
        jsonb_build_object('reason', p_reason)
    );

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'admin_profile_rejected',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;

-- 10. Secure Admin RPC: suspend_advertiser_profile (Section 20)
CREATE OR REPLACE FUNCTION public.suspend_advertiser_profile(
    p_advertiser_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil não encontrado.';
    END IF;

    UPDATE public.advertiser_profiles
    SET profile_status = 'suspended',
        rejection_reason = p_reason,
        updated_at = now()
    WHERE id = p_advertiser_id;

    INSERT INTO public.notifications (profile_id, type, title, message, metadata)
    VALUES (
        v_adv.profile_id,
        'profile_suspended',
        'Perfil Suspenso',
        'Seu anúncio foi temporariamente suspenso pela administração. Motivo: ' || p_reason,
        jsonb_build_object('reason', p_reason)
    );

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'admin_profile_suspended',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'status', 'suspended');
END;
$$;

-- 11. Secure Admin RPC: reactivate_advertiser_profile (Section 21)
CREATE OR REPLACE FUNCTION public.reactivate_advertiser_profile(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil não encontrado.';
    END IF;

    UPDATE public.advertiser_profiles
    SET profile_status = 'active',
        rejection_reason = NULL,
        updated_at = now()
    WHERE id = p_advertiser_id;

    INSERT INTO public.notifications (profile_id, type, title, message, metadata)
    VALUES (
        v_adv.profile_id,
        'profile_reactivated',
        'Perfil Reativado',
        'Seu perfil foi reativado e voltou a ser exibido publicamente.',
        jsonb_build_object('advertiser_id', p_advertiser_id)
    );

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'admin_profile_reactivated',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('status', 'active')
    );

    RETURN jsonb_build_object('success', true, 'status', 'active');
END;
$$;

-- 12. Media Moderation RPCs (Section 24, 25, 26, 28)
CREATE OR REPLACE FUNCTION public.approve_advertiser_media(p_media_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    UPDATE public.advertiser_media
    SET moderation_status = 'approved',
        moderation_reason = NULL,
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_media_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'admin_media_approved', 'advertiser_media', p_media_id, '{}'::jsonb);

    RETURN jsonb_build_object('success', true, 'status', 'approved');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_advertiser_media(
    p_media_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_media public.advertiser_media%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_media FROM public.advertiser_media WHERE id = p_media_id;
    IF v_media.id IS NULL THEN
        RAISE EXCEPTION 'Mídia não encontrada.';
    END IF;

    UPDATE public.advertiser_media
    SET moderation_status = 'rejected',
        moderation_reason = p_reason,
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_media_id;

    -- Notify advertiser
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_media.advertiser_id;
    IF v_adv.id IS NOT NULL THEN
        INSERT INTO public.notifications (profile_id, type, title, message, metadata)
        VALUES (
            v_adv.profile_id,
            'media_rejected',
            'Foto Rejeitada na Moderação',
            'Uma das suas imagens precisa ser substituída. Motivo: ' || p_reason,
            jsonb_build_object('media_id', p_media_id, 'reason', p_reason)
        );
    END IF;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'admin_media_rejected', 'advertiser_media', p_media_id, jsonb_build_object('reason', p_reason));

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
END;
$$;

CREATE OR REPLACE FUNCTION public.block_advertiser_media(
    p_media_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_media public.advertiser_media%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_media FROM public.advertiser_media WHERE id = p_media_id;
    IF v_media.id IS NULL THEN
        RAISE EXCEPTION 'Mídia não encontrada.';
    END IF;

    UPDATE public.advertiser_media
    SET moderation_status = 'blocked',
        moderation_reason = p_reason,
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_media_id;

    -- If critical violation (suspected_minor / non_consensual), suspend profile immediately (Section 28)
    IF p_reason IN ('suspected_minor', 'non_consensual_content') THEN
        UPDATE public.advertiser_profiles
        SET profile_status = 'suspended',
            rejection_reason = 'Suspensão preventiva por violação crítica em mídia (' || p_reason || ')',
            updated_at = now()
        WHERE id = v_media.advertiser_id;
    END IF;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'admin_media_blocked', 'advertiser_media', p_media_id, jsonb_build_object('reason', p_reason));

    RETURN jsonb_build_object('success', true, 'status', 'blocked');
END;
$$;

-- 13. Reports Assignment & Status Transition RPCs (Section 32, 33)
CREATE OR REPLACE FUNCTION public.assign_report(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    UPDATE public.reports
    SET assigned_to = v_actor_id,
        status = CASE WHEN status = 'open' THEN 'under_review'::public.report_status ELSE status END
    WHERE id = p_report_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'report_assigned', 'reports', p_report_id, '{}'::jsonb);

    RETURN jsonb_build_object('success', true, 'assigned_to', v_actor_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_report_status(
    p_report_id uuid,
    p_status text,
    p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    UPDATE public.reports
    SET status = p_status::public.report_status,
        resolution_notes = COALESCE(p_notes, resolution_notes),
        reviewed_by = v_actor_id,
        reviewed_at = now()
    WHERE id = p_report_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'report_status_changed', 'reports', p_report_id, jsonb_build_object('new_status', p_status, 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

-- 14. Super Admin Roles RPCs (Section 50, 51, 52)
CREATE OR REPLACE FUNCTION public.grant_role(
    p_target_profile_id uuid,
    p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente Super Administradores podem conceder cargos.';
    END IF;

    v_actor_id := public.current_profile_id();

    -- Check if already has role
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE profile_id = p_target_profile_id AND role = p_role::public.account_type
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'O usuário já possui este cargo.');
    END IF;

    INSERT INTO public.user_roles (profile_id, role, created_by)
    VALUES (p_target_profile_id, p_role::public.account_type, v_actor_id);

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'role_granted', 'user_roles', p_target_profile_id, jsonb_build_object('granted_role', p_role));

    RETURN jsonb_build_object('success', true, 'granted_role', p_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_role(
    p_target_profile_id uuid,
    p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_super_admin_count integer;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente Super Administradores podem revogar cargos.';
    END IF;

    v_actor_id := public.current_profile_id();

    -- Protect Last Active Super Admin (Requirement 52)
    IF p_role = 'super_admin' THEN
        SELECT count(*) INTO v_super_admin_count FROM public.user_roles WHERE role = 'super_admin';
        IF v_super_admin_count <= 1 THEN
            RAISE EXCEPTION 'Operação negada: Não é permitido remover o último Super Administrador ativo da plataforma.';
        END IF;
    END IF;

    DELETE FROM public.user_roles
    WHERE profile_id = p_target_profile_id AND role = p_role::public.account_type;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'role_revoked', 'user_roles', p_target_profile_id, jsonb_build_object('revoked_role', p_role));

    RETURN jsonb_build_object('success', true, 'revoked_role', p_role);
END;
$$;

-- 15. RLS Policies Configuration
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_feedback ENABLE ROW LEVEL SECURITY;

-- Notifications Policies (Requirement 62)
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (profile_id = public.current_profile_id() OR public.is_staff());

CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- Moderation Notes Policies (Staff only, never exposed to advertisers)
CREATE POLICY "mod_notes_staff_select"
    ON public.moderation_notes FOR SELECT
    TO authenticated
    USING (public.is_staff());

CREATE POLICY "mod_notes_staff_insert"
    ON public.moderation_notes FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

-- Moderation Feedback Policies (Advertiser can see own, staff can manage)
CREATE POLICY "mod_feedback_adv_select"
    ON public.moderation_feedback FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_staff());

CREATE POLICY "mod_feedback_staff_insert"
    ON public.moderation_feedback FOR INSERT
    TO authenticated
    WITH CHECK (public.is_staff());

-- Audit Logs Policies: Strict Immutability (Requirement 41 & Section 74)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_staff_select" ON public.audit_logs;
CREATE POLICY "audit_logs_staff_select"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_staff());

-- No UPDATE or DELETE policy exists on audit_logs => Immutable by design!
