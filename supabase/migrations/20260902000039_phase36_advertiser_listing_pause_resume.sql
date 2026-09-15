-- ============================================================================
-- MIGRATION 00039: Phase 36 — Advertiser Listing Pause & Resume
-- Canonical state model, fail-closed discovery gate, atomic RPCs & audit trail
-- ============================================================================

-- 1. Schema Extensions on advertiser_profiles
-- Represents voluntary advertiser pause cleanly without overloading profile_status (moderation lifecycle)
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS paused_at timestamptz DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS pause_reason text DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS paused_by uuid REFERENCES public.profiles(id) DEFAULT NULL;

-- Index for fast lookup of paused profiles and discovery exclusion
CREATE INDEX IF NOT EXISTS idx_adv_profiles_paused
    ON public.advertiser_profiles(paused_at)
    WHERE paused_at IS NOT NULL;

-- 2. Update Secure Public View: public_advertiser_profiles
-- Hard fail-closed defense: filters out deleted, unapproved, non-public, AND paused profiles
CREATE OR REPLACE VIEW public.public_advertiser_profiles AS
SELECT
    ap.id AS advertiser_id,
    ap.profile_id,
    ap.slug,
    ap.stage_name,
    ap.headline,
    ap.bio,
    GREATEST(18, EXTRACT(YEAR FROM age(CURRENT_DATE, ap.birth_date))::integer) AS age,
    ap.gender,
    ap.presentation,
    ap.state_id,
    bs.code AS state_code,
    bs.name AS state_name,
    bs.slug AS state_slug,
    ap.city_id,
    bc.name AS city_name,
    bc.slug AS city_slug,
    ap.neighborhood,
    ap.verification_status,
    ap.profile_status,
    ap.visibility,
    ap.last_active_at,
    ap.created_at,
    ap.updated_at,
    ap.paused_at,
    -- Aggregate approved primary photo
    (
        SELECT am.storage_path
        FROM public.advertiser_media am
        WHERE am.advertiser_id = ap.id
          AND am.moderation_status = 'approved'
          AND am.visibility = 'public'
          AND am.deleted_at IS NULL
        ORDER BY am.position ASC, am.created_at ASC
        LIMIT 1
    ) AS primary_photo_url,
    -- Count of approved media
    (
        SELECT count(*)::integer
        FROM public.advertiser_media am
        WHERE am.advertiser_id = ap.id
          AND am.moderation_status = 'approved'
          AND am.visibility = 'public'
          AND am.deleted_at IS NULL
    ) AS approved_media_count,
    -- Aggregate category IDs
    ARRAY(
        SELECT ac.category_id
        FROM public.advertiser_categories ac
        WHERE ac.advertiser_id = ap.id
    ) AS category_ids
FROM public.advertiser_profiles ap
LEFT JOIN public.brazil_states bs ON bs.id = ap.state_id
LEFT JOIN public.brazil_cities bc ON bc.id = ap.city_id
WHERE ap.profile_status IN ('approved', 'active')
  AND ap.visibility = 'public'
  AND ap.paused_at IS NULL
  AND ap.deleted_at IS NULL;

-- 3. Atomic RPC: pause_advertiser_listing
-- Transitions visibility to 'hidden', registers paused_at and paused_by, preserving moderation state
CREATE OR REPLACE FUNCTION public.pause_advertiser_listing(
    p_advertiser_id uuid,
    p_reason text DEFAULT 'voluntary_pause'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_profile record;
    v_prev_vis text;
BEGIN
    v_actor_id := public.current_profile_id();

    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: sessão não autenticada.';
    END IF;

    -- Verify ownership or admin privileges
    IF NOT public.owns_advertiser(p_advertiser_id) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: você não possui permissão para pausar este anúncio.';
    END IF;

    -- Concurrency protection: lock profile row for update
    SELECT * INTO v_profile
    FROM public.advertiser_profiles
    WHERE id = p_advertiser_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    IF v_profile.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Operação inválida: perfil excluído.';
    END IF;

    -- State Precedence Check: Administrative and disciplinary states override voluntary actions
    IF v_profile.profile_status = 'suspended' THEN
        RAISE EXCEPTION 'Operação inválida: perfil suspenso por ação administrativa.';
    END IF;

    IF v_profile.profile_status = 'rejected' THEN
        RAISE EXCEPTION 'Operação inválida: perfil rejeitado pela moderação.';
    END IF;

    -- Idempotency Check: if already paused, return success without mutating
    IF v_profile.paused_at IS NOT NULL AND v_profile.visibility = 'hidden' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'already_paused',
            'paused_at', v_profile.paused_at,
            'message', 'O anúncio já se encontra pausado.'
        );
    END IF;

    v_prev_vis := v_profile.visibility;

    -- Atomic State Transition: Voluntary Pause
    -- profile_status remains intact ('active' or 'approved') to prevent loss of moderation state
    UPDATE public.advertiser_profiles
    SET visibility = 'hidden',
        paused_at = now(),
        pause_reason = COALESCE(p_reason, 'voluntary_pause'),
        paused_by = v_actor_id,
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Record Audit Trail
    INSERT INTO public.audit_logs (
        actor_profile_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_actor_id,
        'listing_paused',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object(
            'actor_type', CASE WHEN public.is_admin() THEN 'admin' ELSE 'advertiser_self_service' END,
            'previous_visibility', v_prev_vis,
            'new_visibility', 'hidden',
            'pause_reason', p_reason,
            'profile_status_preserved', v_profile.profile_status,
            'paused_at', now()
        )
    );

    -- Record in Advertiser Profile History
    INSERT INTO public.advertiser_profile_history (
        advertiser_id,
        changed_by,
        change_type,
        changed_fields
    ) VALUES (
        p_advertiser_id,
        v_actor_id,
        'listing_paused',
        jsonb_build_object(
            'visibility', 'hidden',
            'paused_at', now(),
            'pause_reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'paused',
        'paused_at', now(),
        'message', 'Anúncio pausado com sucesso. Seu perfil está temporariamente oculto para visitantes.'
    );
END;
$$;

-- 4. Eligibility Check Helper RPC: check_listing_reactivation_eligibility
-- Evaluates real canonical publication requirements without mutating state
CREATE OR REPLACE FUNCTION public.check_listing_reactivation_eligibility(
    p_advertiser_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile record;
    v_blockers text[] := ARRAY[]::text[];
    v_active_sanction_count integer := 0;
    v_approved_media_count integer := 0;
BEGIN
    SELECT * INTO v_profile
    FROM public.advertiser_profiles
    WHERE id = p_advertiser_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('eligible', false, 'blockers', ARRAY['profile_not_found']);
    END IF;

    -- 1. Account Deletion
    IF v_profile.deleted_at IS NOT NULL THEN
        v_blockers := array_append(v_blockers, 'account_deleted');
    END IF;

    -- 2. State Precedence: Administrative Suspension
    IF v_profile.profile_status = 'suspended' THEN
        v_blockers := array_append(v_blockers, 'admin_suspended');
    END IF;

    -- 3. Moderation State: Advertiser cannot self-approve; must already be approved/active
    IF v_profile.profile_status NOT IN ('active', 'approved') THEN
        v_blockers := array_append(v_blockers, 'moderation_not_approved');
    END IF;

    -- 4. Trust & Safety: Active disciplinary sanctions on account or profile
    SELECT count(*)::integer INTO v_active_sanction_count
    FROM public.sanctions
    WHERE status = 'active'
      AND (
          (subject_type = 'advertiser_profile' AND subject_id = p_advertiser_id::text) OR
          (subject_type = 'account' AND subject_id = v_profile.profile_id::text)
      )
      AND sanction_type IN (
          'temporary_account_hold',
          'profile_unpublished',
          'account_suspended',
          'account_terminated'
      );

    IF v_active_sanction_count > 0 THEN
        v_blockers := array_append(v_blockers, 'trust_safety_sanction_active');
    END IF;

    -- 5. Advertiser Identity / KYC Verification
    IF v_profile.verification_status != 'verified' THEN
        v_blockers := array_append(v_blockers, 'kyc_verification_required');
    END IF;

    -- 6. Media Authenticity / Minimum Approved Media
    SELECT count(*)::integer INTO v_approved_media_count
    FROM public.advertiser_media
    WHERE advertiser_id = p_advertiser_id
      AND moderation_status = 'approved'
      AND deleted_at IS NULL;

    IF v_approved_media_count < 1 THEN
        v_blockers := array_append(v_blockers, 'minimum_approved_media_required');
    END IF;

    RETURN jsonb_build_object(
        'eligible', (array_length(v_blockers, 1) IS NULL),
        'blockers', to_jsonb(v_blockers),
        'is_paused', (v_profile.paused_at IS NOT NULL),
        'profile_status', v_profile.profile_status,
        'verification_status', v_profile.verification_status,
        'approved_media_count', v_approved_media_count
    );
END;
$$;

-- 5. Atomic RPC: resume_advertiser_listing
-- Fail-closed publication eligibility evaluation before restoring public visibility
CREATE OR REPLACE FUNCTION public.resume_advertiser_listing(
    p_advertiser_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_profile record;
    v_eligibility jsonb;
    v_is_eligible boolean;
    v_blockers jsonb;
    v_prev_paused_at timestamptz;
BEGIN
    v_actor_id := public.current_profile_id();

    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: sessão não autenticada.';
    END IF;

    -- Verify ownership or admin privileges
    IF NOT public.owns_advertiser(p_advertiser_id) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: você não possui permissão para reativar este anúncio.';
    END IF;

    -- Concurrency protection: lock row for atomic evaluation & mutation
    SELECT * INTO v_profile
    FROM public.advertiser_profiles
    WHERE id = p_advertiser_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Idempotency Check: if already active and not paused
    IF v_profile.paused_at IS NULL AND v_profile.visibility = 'public' AND v_profile.profile_status = 'active' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'already_active',
            'message', 'O anúncio já se encontra ativo e público.'
        );
    END IF;

    -- Log Resume Request
    INSERT INTO public.audit_logs (
        actor_profile_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_actor_id,
        'listing_resume_requested',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('actor_id', v_actor_id, 'profile_status', v_profile.profile_status)
    );

    -- CAN_PUBLISH_NOW Gate: Check canonical publication eligibility
    v_eligibility := public.check_listing_reactivation_eligibility(p_advertiser_id);
    v_is_eligible := (v_eligibility->>'eligible')::boolean;
    v_blockers := v_eligibility->'blockers';

    -- Fail-closed: If ANY requirement fails, rollback / reject publication
    IF NOT v_is_eligible THEN
        INSERT INTO public.audit_logs (
            actor_profile_id,
            action,
            entity_type,
            entity_id,
            metadata
        ) VALUES (
            v_actor_id,
            'listing_resume_blocked',
            'advertiser_profiles',
            p_advertiser_id,
            jsonb_build_object(
                'blockers', v_blockers,
                'profile_status', v_profile.profile_status,
                'verification_status', v_profile.verification_status
            )
        );

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Reativação bloqueada: o perfil não atende a todos os requisitos de elegibilidade de publicação.',
            'blockers', v_blockers
        );
    END IF;

    v_prev_paused_at := v_profile.paused_at;

    -- Atomic State Transition: Resume Public Listing
    UPDATE public.advertiser_profiles
    SET visibility = 'public',
        profile_status = 'active',
        paused_at = NULL,
        pause_reason = NULL,
        paused_by = NULL,
        last_active_at = now(),
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Record Audit Trail
    INSERT INTO public.audit_logs (
        actor_profile_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_actor_id,
        'listing_resumed',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object(
            'actor_type', CASE WHEN public.is_admin() THEN 'admin' ELSE 'advertiser_self_service' END,
            'previous_paused_at', v_prev_paused_at,
            'resumed_at', now(),
            'visibility', 'public',
            'profile_status', 'active'
        )
    );

    -- Record in Advertiser Profile History
    INSERT INTO public.advertiser_profile_history (
        advertiser_id,
        changed_by,
        change_type,
        changed_fields
    ) VALUES (
        p_advertiser_id,
        v_actor_id,
        'listing_resumed',
        jsonb_build_object(
            'visibility', 'public',
            'paused_at', NULL,
            'resumed_at', now()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'active',
        'message', 'Anúncio reativado com sucesso! Seu perfil já está visível nas buscas e superfícies públicas.'
    );
END;
$$;

-- Grant execution permissions on RPCs
GRANT EXECUTE ON FUNCTION public.pause_advertiser_listing(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_advertiser_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_listing_reactivation_eligibility(uuid) TO authenticated;
