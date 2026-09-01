-- ============================================================================
-- MIGRATION 00020: Phase 27A — Commercial Lifecycle, Trial, Entitlements & Media Authenticity Foundation
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Extend advertiser_profiles with Commercial Trial & Authenticity Flags
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
    ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS authenticity_verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS audio_presentation_url text;

CREATE INDEX IF NOT EXISTS idx_adv_profiles_trial ON public.advertiser_profiles(trial_used, trial_started_at);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_auth_ver ON public.advertiser_profiles(authenticity_verified);

-- 2. Extend subscriptions with Grace Period End
ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS grace_period_end timestamptz;

-- 3. Extend advertiser_media check constraint for media_type (Image, Video, Audio, Authenticity Video)
DO $$
BEGIN
    ALTER TABLE public.advertiser_media DROP CONSTRAINT IF EXISTS advertiser_media_media_type_check;
    ALTER TABLE public.advertiser_media ADD CONSTRAINT advertiser_media_media_type_check
        CHECK (media_type IN ('image', 'photo', 'video', 'commercial_video', 'audio', 'profile_audio', 'authenticity_video'));
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- 4. Authenticity Challenges Table (Section 15, 16, 17, 18)
CREATE TABLE IF NOT EXISTS public.authenticity_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    challenge_code text NOT NULL,
    status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'submitted', 'expired', 'verified', 'rejected')),
    issued_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
    used_at timestamptz,
    video_storage_path text,
    moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_adv ON public.authenticity_challenges(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_code ON public.authenticity_challenges(challenge_code);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_mod ON public.authenticity_challenges(moderation_status);

-- 5. RPC: generate_authenticity_challenge
CREATE OR REPLACE FUNCTION public.generate_authenticity_challenge(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_random_code text;
    v_challenge public.authenticity_challenges%ROWTYPE;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    IF v_adv.profile_id <> v_profile_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Você não pode solicitar challenge para este anunciante.';
    END IF;

    -- Invalidate older unused challenges
    UPDATE public.authenticity_challenges
    SET status = 'expired', updated_at = now()
    WHERE advertiser_id = p_advertiser_id
      AND status = 'issued'
      AND expires_at <= now();

    -- Generate a cryptographically strong 6-character uppercase alphanumeric code
    v_random_code := 'P18-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4));

    INSERT INTO public.authenticity_challenges (
        advertiser_id,
        challenge_code,
        status,
        issued_at,
        expires_at
    )
    VALUES (
        p_advertiser_id,
        v_random_code,
        'issued',
        now(),
        now() + INTERVAL '15 minutes'
    )
    RETURNING * INTO v_challenge;

    RETURN jsonb_build_object(
        'success', true,
        'challenge_id', v_challenge.id,
        'challenge_code', v_challenge.challenge_code,
        'expires_at', v_challenge.expires_at,
        'duration_seconds', 900
    );
END;
$$;

-- 6. RPC: submit_authenticity_video
CREATE OR REPLACE FUNCTION public.submit_authenticity_video(
    p_challenge_id uuid,
    p_storage_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_challenge public.authenticity_challenges%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_challenge FROM public.authenticity_challenges WHERE id = p_challenge_id;
    IF v_challenge.id IS NULL THEN
        RAISE EXCEPTION 'Challenge de autenticidade não encontrado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_challenge.advertiser_id;
    IF v_adv.profile_id <> v_profile_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Não autorizado a enviar para este challenge.';
    END IF;

    IF v_challenge.status <> 'issued' OR v_challenge.expires_at < now() THEN
        RAISE EXCEPTION 'Este challenge de autenticidade expirou ou já foi utilizado. Solicite um novo código.';
    END IF;

    UPDATE public.authenticity_challenges
    SET status = 'submitted',
        used_at = now(),
        video_storage_path = p_storage_path,
        moderation_status = 'pending',
        updated_at = now()
    WHERE id = p_challenge_id;

    -- Create audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'authenticity_video_submitted',
        'authenticity_challenges',
        p_challenge_id,
        jsonb_build_object('advertiser_id', v_challenge.advertiser_id, 'storage_path', p_storage_path)
    );

    RETURN jsonb_build_object('success', true, 'status', 'submitted');
END;
$$;

-- 7. RPC: review_authenticity_video
CREATE OR REPLACE FUNCTION public.review_authenticity_video(
    p_challenge_id uuid,
    p_action text, -- 'approve' or 'reject'
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_staff_id uuid;
    v_challenge public.authenticity_challenges%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação ou administração.';
    END IF;

    v_staff_id := public.current_profile_id();

    SELECT * INTO v_challenge FROM public.authenticity_challenges WHERE id = p_challenge_id;
    IF v_challenge.id IS NULL THEN
        RAISE EXCEPTION 'Challenge de autenticidade não encontrado.';
    END IF;

    IF p_action = 'approve' THEN
        UPDATE public.authenticity_challenges
        SET moderation_status = 'approved',
            status = 'verified',
            reviewed_by = v_staff_id,
            reviewed_at = now(),
            rejection_reason = NULL,
            updated_at = now()
        WHERE id = p_challenge_id;

        -- Set authenticity_verified = true on advertiser profile
        UPDATE public.advertiser_profiles
        SET authenticity_verified = true,
            updated_at = now()
        WHERE id = v_challenge.advertiser_id;

        -- Notify advertiser
        INSERT INTO public.notifications (profile_id, type, title, message)
        SELECT profile_id, 'authenticity_approved', 'Selo de Autenticidade Aprovado! ✨', 'Seu vídeo de autenticidade foi validado pela equipe e seu selo oficial já está ativo em seu perfil.'
        FROM public.advertiser_profiles WHERE id = v_challenge.advertiser_id;

    ELSIF p_action = 'reject' THEN
        UPDATE public.authenticity_challenges
        SET moderation_status = 'rejected',
            status = 'rejected',
            reviewed_by = v_staff_id,
            reviewed_at = now(),
            rejection_reason = COALESCE(p_reason, 'Vídeo não atende aos requisitos de clareza ou código exibido incorreto.'),
            updated_at = now()
        WHERE id = p_challenge_id;

        UPDATE public.advertiser_profiles
        SET authenticity_verified = false,
            updated_at = now()
        WHERE id = v_challenge.advertiser_id;

        -- Notify advertiser
        INSERT INTO public.notifications (profile_id, type, title, message)
        SELECT profile_id, 'authenticity_rejected', 'Vídeo de Autenticidade Não Aprovado', COALESCE(p_reason, 'O vídeo enviado não pôde ser validado. Por favor, grave um novo vídeo exibindo o código com nitidez.')
        FROM public.advertiser_profiles WHERE id = v_challenge.advertiser_id;
    ELSE
        RAISE EXCEPTION 'Ação inválida. Use "approve" ou "reject".';
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_staff_id,
        'authenticity_video_' || p_action,
        'authenticity_challenges',
        p_challenge_id,
        jsonb_build_object('advertiser_id', v_challenge.advertiser_id, 'action', p_action, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

-- 8. Enhanced RPC: get_advertiser_entitlements (Section 2, 3, 4, 5, 6)
CREATE OR REPLACE FUNCTION public.get_advertiser_entitlements(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv public.advertiser_profiles%ROWTYPE;
    v_sub public.subscriptions%ROWTYPE;
    v_plan public.subscription_plans%ROWTYPE;
    v_is_trial boolean := false;
    v_trial_days_remaining integer := 0;
    v_trial_end_time timestamptz := NULL;
    v_lifecycle_state text := 'limited';
BEGIN
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RETURN jsonb_build_object(
            'has_active_subscription', false,
            'plan_name', 'Gratuito / Básico',
            'plan_slug', 'free',
            'lifecycle_state', 'limited',
            'media_limit', 10,
            'video_limit', 0,
            'boost_allowance', 0,
            'analytics_level', 'basic',
            'audio_allowed', false,
            'commercial_video_allowed', false,
            'contacts_strategy', 'limited',
            'is_trial', false,
            'trial_days_remaining', 0,
            'trial_ends_at', NULL,
            'authenticity_verified', false
        );
    END IF;

    -- 1. Check if profile is suspended
    IF v_adv.profile_status = 'suspended' THEN
        RETURN jsonb_build_object(
            'has_active_subscription', false,
            'plan_name', 'Perfil Suspenso',
            'plan_slug', 'suspended',
            'lifecycle_state', 'suspended',
            'media_limit', 0,
            'video_limit', 0,
            'boost_allowance', 0,
            'analytics_level', 'none',
            'audio_allowed', false,
            'commercial_video_allowed', false,
            'contacts_strategy', 'hidden',
            'is_trial', false,
            'trial_days_remaining', 0,
            'trial_ends_at', NULL,
            'authenticity_verified', v_adv.authenticity_verified
        );
    END IF;

    -- 2. Check for active trial subscription
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE advertiser_id = p_advertiser_id
      AND status IN ('active', 'pending')
      AND trial_end IS NOT NULL
      AND trial_end > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_sub.id IS NOT NULL THEN
        v_is_trial := true;
        v_lifecycle_state := 'trial';
        v_trial_end_time := v_sub.trial_end;
        v_trial_days_remaining := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_sub.trial_end - now())) / 86400.0)::integer);

        RETURN jsonb_build_object(
            'has_active_subscription', true,
            'plan_name', 'Premium Trial (7 Dias)',
            'plan_slug', 'premium_trial',
            'lifecycle_state', 'trial',
            'media_limit', 25,
            'video_limit', 3,
            'boost_allowance', 1,
            'analytics_level', 'premium',
            'audio_allowed', true,
            'commercial_video_allowed', true,
            'contacts_strategy', 'full',
            'is_trial', true,
            'trial_days_remaining', v_trial_days_remaining,
            'trial_ends_at', v_trial_end_time,
            'authenticity_verified', v_adv.authenticity_verified
        );
    END IF;

    -- 3. Check for active paid subscription
    SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.media_limit, p.video_limit, p.boost_allowance, p.analytics_level
    INTO v_sub
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.advertiser_id = p_advertiser_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
    ORDER BY p.price_amount DESC
    LIMIT 1;

    IF v_sub.id IS NOT NULL THEN
        SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
        RETURN jsonb_build_object(
            'has_active_subscription', true,
            'plan_name', v_plan.name,
            'plan_slug', v_plan.slug,
            'lifecycle_state', 'active',
            'media_limit', v_plan.media_limit,
            'video_limit', v_plan.video_limit,
            'boost_allowance', v_plan.boost_allowance,
            'analytics_level', v_plan.analytics_level,
            'audio_allowed', (v_plan.slug IN ('destaque', 'premium', 'vip')),
            'commercial_video_allowed', (v_plan.video_limit > 0),
            'contacts_strategy', 'full',
            'is_trial', false,
            'trial_days_remaining', 0,
            'trial_ends_at', NULL,
            'current_period_end', v_sub.current_period_end,
            'authenticity_verified', v_adv.authenticity_verified
        );
    END IF;

    -- 4. Check for Grace Period
    SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.media_limit, p.video_limit, p.boost_allowance, p.analytics_level
    INTO v_sub
    FROM public.subscriptions s
    JOIN public.subscription_plans p ON s.plan_id = p.id
    WHERE s.advertiser_id = p_advertiser_id
      AND s.grace_period_end IS NOT NULL
      AND s.grace_period_end > now()
    ORDER BY s.updated_at DESC
    LIMIT 1;

    IF v_sub.id IS NOT NULL THEN
        SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
        RETURN jsonb_build_object(
            'has_active_subscription', true,
            'plan_name', v_plan.name || ' (Grace Period)',
            'plan_slug', v_plan.slug,
            'lifecycle_state', 'grace_period',
            'media_limit', v_plan.media_limit,
            'video_limit', v_plan.video_limit,
            'boost_allowance', 0,
            'analytics_level', 'basic',
            'audio_allowed', true,
            'commercial_video_allowed', true,
            'contacts_strategy', 'full',
            'is_trial', false,
            'trial_days_remaining', 0,
            'trial_ends_at', NULL,
            'grace_period_end', v_sub.grace_period_end,
            'authenticity_verified', v_adv.authenticity_verified
        );
    END IF;

    -- 5. Baseline Limited / Free Mode (Post-Trial or Unsubscribed)
    RETURN jsonb_build_object(
        'has_active_subscription', false,
        'plan_name', 'Gratuito / Básico',
        'plan_slug', 'free',
        'lifecycle_state', 'limited',
        'media_limit', 10,
        'video_limit', 0,
        'boost_allowance', 0,
        'analytics_level', 'basic',
        'audio_allowed', false,
        'commercial_video_allowed', false,
        'contacts_strategy', 'limited',
        'is_trial', false,
        'trial_days_remaining', 0,
        'trial_ends_at', NULL,
        'authenticity_verified', v_adv.authenticity_verified
    );
END;
$$;

-- 9. Server-Side Contact Resolver RPC: get_public_advertiser_contacts (Section 7 & 8)
CREATE OR REPLACE FUNCTION public.get_public_advertiser_contacts(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv public.advertiser_profiles%ROWTYPE;
    v_entitlements jsonb;
    v_strategy text;
    v_contacts jsonb := '[]'::jsonb;
BEGIN
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL OR v_adv.deleted_at IS NOT NULL OR v_adv.profile_status = 'suspended' THEN
        RETURN '[]'::jsonb;
    END IF;

    v_entitlements := public.get_advertiser_entitlements(p_advertiser_id);
    v_strategy := COALESCE(v_entitlements->>'contacts_strategy', 'limited');

    IF v_strategy = 'hidden' THEN
        RETURN '[]'::jsonb;
    END IF;

    IF v_strategy = 'full' THEN
        -- Return all active visible contacts
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', id,
                'advertiser_id', advertiser_id,
                'contact_type', contact_type,
                'contact_value', contact_value,
                'is_primary', is_primary,
                'is_visible', is_visible
            )
            ORDER BY is_primary DESC, created_at ASC
        ) INTO v_contacts
        FROM public.advertiser_contacts
        WHERE advertiser_id = p_advertiser_id
          AND is_visible = true;

        RETURN COALESCE(v_contacts, '[]'::jsonb);
    END IF;

    -- 'limited' strategy: Expose primary WhatsApp/Phone and Telegram
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'advertiser_id', advertiser_id,
            'contact_type', contact_type,
            'contact_value', contact_value,
            'is_primary', is_primary,
            'is_visible', is_visible
        )
        ORDER BY is_primary DESC, created_at ASC
    ) INTO v_contacts
    FROM public.advertiser_contacts
    WHERE advertiser_id = p_advertiser_id
      AND is_visible = true
      AND (is_primary = true OR contact_type IN ('whatsapp', 'telegram'))
    LIMIT 2;

    RETURN COALESCE(v_contacts, '[]'::jsonb);
END;
$$;

-- 10. Update approve_advertiser_profile to start 7-day trial idempotently (Section 3)
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
    v_premium_plan_id uuid;
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

    -- Verify at least 1 approved media
    SELECT count(*) INTO v_approved_media_count
    FROM public.advertiser_media
    WHERE advertiser_id = p_advertiser_id
      AND moderation_status = 'approved'
      AND deleted_at IS NULL;

    IF v_approved_media_count = 0 THEN
        RAISE EXCEPTION 'O perfil precisa de pelo menos uma mídia aprovada antes da publicação.';
    END IF;

    -- Update profile status to active & record published timestamp
    UPDATE public.advertiser_profiles
    SET profile_status = 'active',
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        published_at = COALESCE(published_at, now()),
        rejection_reason = NULL,
        review_feedback = NULL,
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- IDEMPOTENT 7-DAY TRIAL INITIALIZATION: Start only upon FIRST approval/publication
    IF NOT v_adv.trial_used THEN
        -- Find Premium plan id
        SELECT id INTO v_premium_plan_id FROM public.subscription_plans WHERE slug = 'premium' LIMIT 1;
        IF v_premium_plan_id IS NULL THEN
            SELECT id INTO v_premium_plan_id FROM public.subscription_plans ORDER BY price_amount DESC LIMIT 1;
        END IF;

        -- Create or update trial subscription
        IF v_premium_plan_id IS NOT NULL THEN
            INSERT INTO public.subscriptions (
                advertiser_id,
                plan_id,
                provider,
                status,
                trial_start,
                trial_end,
                current_period_start,
                current_period_end
            )
            VALUES (
                p_advertiser_id,
                v_premium_plan_id,
                'portal18_trial',
                'active',
                now(),
                now() + INTERVAL '7 days',
                now(),
                now() + INTERVAL '7 days'
            );
        END IF;

        -- Mark trial as used on advertiser profile
        UPDATE public.advertiser_profiles
        SET trial_used = true,
            trial_started_at = now(),
            updated_at = now()
        WHERE id = p_advertiser_id;

        -- Notification with trial start announcement
        INSERT INTO public.notifications (profile_id, type, title, message)
        VALUES (
            v_adv.profile_id,
            'trial_started',
            'Seu Período Premium de 7 Dias Começou! 🚀',
            'Parabéns! Seu anúncio foi aprovado e você ganhou 7 dias completos de todos os recursos Premium gratuitamente.'
        );
    END IF;

    -- Insert Standard Profile Approved Notification
    INSERT INTO public.notifications (profile_id, type, title, message)
    VALUES (
        v_adv.profile_id,
        'profile_approved',
        'Perfil Aprovado com Sucesso! 🎉',
        'Seu anúncio está publicado e disponível para busca e recomendações nacionais no Portal18.'
    );

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'approve_advertiser_profile',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('published_at', now(), 'trial_started', NOT v_adv.trial_used)
    );

    RETURN jsonb_build_object('success', true, 'status', 'active');
END;
$$;

-- 11. Recreate Public View: public_advertiser_profiles (With authenticity & audio fields)
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
    ap.target_audience,
    ap.service_modalities,
    ap.presentation,
    ap.authenticity_verified,
    ap.audio_presentation_url,
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
  AND ap.deleted_at IS NULL;

-- 12. RLS on Authenticity Challenges
ALTER TABLE public.authenticity_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_challenges_own_select"
    ON public.authenticity_challenges FOR SELECT
    TO authenticated
    USING (
        advertiser_id IN (
            SELECT id FROM public.advertiser_profiles WHERE profile_id = public.current_profile_id()
        )
        OR public.is_staff()
    );

CREATE POLICY "auth_challenges_staff_all"
    ON public.authenticity_challenges FOR ALL
    TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());
