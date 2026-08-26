-- ============================================================================
-- MIGRATION 00006: Phase 3 — Advertiser Panel, Gallery, Submission & Constraints
-- ============================================================================

-- 1. Advertiser Profile History Table
CREATE TABLE IF NOT EXISTS public.advertiser_profile_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    changed_by uuid NOT NULL REFERENCES public.profiles(id),
    change_type text NOT NULL,
    changed_fields jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adv_history_adv_id ON public.advertiser_profile_history(advertiser_id, created_at DESC);

-- 2. Extend Advertiser Profiles with Moderation & Submission Columns
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
    ADD COLUMN IF NOT EXISTS rejection_reason text,
    ADD COLUMN IF NOT EXISTS moderation_notes text;

-- 3. Extend Advertiser Media with Reviewer Columns
ALTER TABLE public.advertiser_media
    ADD COLUMN IF NOT EXISTS moderation_reason text,
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 4. Trigger Function: Protect Advertiser Administrative Fields (Section 69 & 70)
CREATE OR REPLACE FUNCTION public.protect_advertiser_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If actor is admin or moderator, allow updates
    IF public.is_admin() OR public.is_moderator() THEN
        RETURN NEW;
    END IF;

    -- Prevent non-admins from changing verification_status
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        RAISE EXCEPTION 'Anunciantes não podem alterar o status de verificação diretamente.';
    END IF;

    -- Prevent non-admins from changing rejection_reason or moderation_notes
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason OR NEW.moderation_notes IS DISTINCT FROM OLD.moderation_notes THEN
        RAISE EXCEPTION 'Campos de moderação são restritos a administradores.';
    END IF;

    -- Prevent non-admins from activating their own profile directly
    IF NEW.profile_status IN ('active', 'approved') AND OLD.profile_status NOT IN ('active', 'approved') THEN
        RAISE EXCEPTION 'A ativação do perfil requer aprovação da equipe de moderação.';
    END IF;

    -- Material changes during pending_review reset profile to draft (Requirement 47 & 48)
    IF OLD.profile_status = 'pending_review' THEN
        IF (NEW.stage_name IS DISTINCT FROM OLD.stage_name) OR
           (NEW.bio IS DISTINCT FROM OLD.bio) OR
           (NEW.state_id IS DISTINCT FROM OLD.state_id) OR
           (NEW.city_id IS DISTINCT FROM OLD.city_id) OR
           (NEW.birth_date IS DISTINCT FROM OLD.birth_date) THEN
            NEW.profile_status := 'draft';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_advertiser_admin_fields ON public.advertiser_profiles;
CREATE TRIGGER trg_protect_advertiser_admin_fields
    BEFORE UPDATE ON public.advertiser_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_advertiser_admin_fields();

-- 5. Trigger Function: Enforce Single Primary Contact (Section 22 & 88)
CREATE OR REPLACE FUNCTION public.enforce_single_primary_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE public.advertiser_contacts
        SET is_primary = false
        WHERE advertiser_id = NEW.advertiser_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_primary_contact ON public.advertiser_contacts;
CREATE TRIGGER trg_enforce_single_primary_contact
    BEFORE INSERT OR UPDATE ON public.advertiser_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_single_primary_contact();

-- 6. Secure RPC: reorder_advertiser_media (Section 35 & 36)
CREATE OR REPLACE FUNCTION public.reorder_advertiser_media(
    p_advertiser_id uuid,
    p_media_ids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_media_id uuid;
    v_index integer := 0;
    v_profile_id uuid;
BEGIN
    -- Verify ownership
    IF NOT public.owns_advertiser(p_advertiser_id) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Você não possui permissão para reordenar mídias deste anunciante.';
    END IF;

    -- Verify all media belong to advertiser
    IF EXISTS (
        SELECT 1 FROM unnest(p_media_ids) mid
        WHERE NOT EXISTS (
            SELECT 1 FROM public.advertiser_media am
            WHERE am.id = mid AND am.advertiser_id = p_advertiser_id
        )
    ) THEN
        RAISE EXCEPTION 'Tentativa de reordenar mídias pertencentes a outro anunciante.';
    END IF;

    -- Atomically update positions
    FOREACH v_media_id IN ARRAY p_media_ids
    LOOP
        UPDATE public.advertiser_media
        SET position = v_index,
            updated_at = now()
        WHERE id = v_media_id AND advertiser_id = p_advertiser_id;

        v_index := v_index + 1;
    END LOOP;

    -- Insert Audit Log
    v_profile_id := public.current_profile_id();
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'advertiser_media_reordered',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('count', array_length(p_media_ids, 1))
    );

    RETURN true;
END;
$$;

-- 7. Secure RPC: submit_advertiser_profile (Section 42, 43, 44, 45, 46)
CREATE OR REPLACE FUNCTION public.submit_advertiser_profile(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_cat_count integer;
    v_contact_count integer;
    v_media_count integer;
    v_terms_accepted boolean;
    v_missing text[] := ARRAY[]::text[];
BEGIN
    -- Verify caller identity and ownership
    IF NOT public.owns_advertiser(p_advertiser_id) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: você não é o proprietário deste anúncio.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- If already pending review, return idempotent success
    IF v_adv.profile_status = 'pending_review' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'pending_review',
            'message', 'O perfil já está em processo de análise.'
        );
    END IF;

    -- Validate Prerequisites
    IF v_adv.stage_name IS NULL OR length(trim(v_adv.stage_name)) < 2 OR v_adv.stage_name = 'Novo Anunciante' THEN
        v_missing := array_append(v_missing, 'Nome artístico válido');
    END IF;

    IF v_adv.bio IS NULL OR length(trim(v_adv.bio)) < 20 THEN
        v_missing := array_append(v_missing, 'Descrição/Biografia com no mínimo 20 caracteres');
    END IF;

    IF v_adv.state_id IS NULL OR v_adv.city_id IS NULL THEN
        v_missing := array_append(v_missing, 'Localização de atendimento (Estado e Cidade)');
    END IF;

    IF v_adv.birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
        v_missing := array_append(v_missing, 'Comprovação de maioridade 18+');
    END IF;

    -- Check at least 1 category
    SELECT count(*) INTO v_cat_count FROM public.advertiser_categories WHERE advertiser_id = p_advertiser_id;
    IF v_cat_count = 0 THEN
        v_missing := array_append(v_missing, 'Ao menos uma categoria de anúncio');
    END IF;

    -- Check at least 1 visible contact
    SELECT count(*) INTO v_contact_count FROM public.advertiser_contacts WHERE advertiser_id = p_advertiser_id AND is_visible = true;
    IF v_contact_count = 0 THEN
        v_missing := array_append(v_missing, 'Ao menos um canal de contato público visível');
    END IF;

    -- Check at least 1 media uploaded
    SELECT count(*) INTO v_media_count FROM public.advertiser_media WHERE advertiser_id = p_advertiser_id AND deleted_at IS NULL;
    IF v_media_count = 0 THEN
        v_missing := array_append(v_missing, 'Ao menos uma foto na galeria do perfil');
    END IF;

    -- If missing requirements, reject submission with details
    IF array_length(v_missing, 1) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', v_adv.profile_status,
            'missing_requirements', v_missing,
            'error', 'Requisitos pendentes para envio à moderação.'
        );
    END IF;

    -- Transition status to pending_review
    UPDATE public.advertiser_profiles
    SET profile_status = 'pending_review',
        submitted_at = now(),
        onboarding_completed = true,
        rejection_reason = NULL,
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Log history and audit
    v_profile_id := public.current_profile_id();
    INSERT INTO public.advertiser_profile_history (advertiser_id, changed_by, change_type, changed_fields)
    VALUES (
        p_advertiser_id,
        v_profile_id,
        'profile_submitted',
        jsonb_build_object('submitted_at', now(), 'new_status', 'pending_review')
    );

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'advertiser_profile_submitted',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('submitted_at', now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'pending_review',
        'message', 'Perfil enviado para análise da moderação com sucesso.'
    );
END;
$$;

-- 8. Enable RLS on History Table
ALTER TABLE public.advertiser_profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adv_history_select_own"
    ON public.advertiser_profile_history FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

CREATE POLICY "adv_history_admin_all"
    ON public.advertiser_profile_history FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
