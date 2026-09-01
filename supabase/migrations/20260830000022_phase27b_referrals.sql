-- ============================================================================
-- MIGRATION 00022: Phase 27B — Referral Program, Reward Ledger & Anti-Fraud Engine
-- ============================================================================

-- 1. Extend advertiser_profiles with Canonical Referral Code
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by_code text;

CREATE INDEX IF NOT EXISTS idx_adv_profiles_ref_code ON public.advertiser_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_referred_by ON public.advertiser_profiles(referred_by_code);

-- 2. First-Party Anonymous Referral Attributions Table
CREATE TABLE IF NOT EXISTS public.referral_attributions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code text NOT NULL,
    referrer_advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    visitor_attribution_token text NOT NULL,
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'captured' CHECK (status IN ('captured', 'registered', 'converted', 'expired')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ref_attr_token_code ON public.referral_attributions(visitor_attribution_token, referral_code);
CREATE INDEX IF NOT EXISTS idx_ref_attr_referrer ON public.referral_attributions(referrer_advertiser_id);

-- 3. Canonical Referrals Table (Referral Relationship Lifecycle)
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    referrer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    referred_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_code text NOT NULL,
    status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'pending_qualification', 'qualified', 'rewarded', 'rejected', 'cancelled', 'revoked', 'flagged')),
    risk_status text NOT NULL DEFAULT 'normal' CHECK (risk_status IN ('normal', 'manual_review', 'blocked')),
    risk_reasons text[] DEFAULT ARRAY[]::text[],
    qualification_due_at timestamptz,
    qualified_at timestamptz,
    rewarded_at timestamptz,
    policy_version text NOT NULL DEFAULT 'v1',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    -- Constraints: Strictly forbid self-referral and duplicate bindings per referred account
    CONSTRAINT referrals_no_self_referral CHECK (referrer_profile_id <> referred_profile_id),
    CONSTRAINT referrals_unique_referred_adv UNIQUE (referred_advertiser_id),
    CONSTRAINT referrals_unique_referred_profile UNIQUE (referred_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_adv ON public.referrals(referrer_advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_profile ON public.referrals(referrer_profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_risk ON public.referrals(risk_status);

-- 4. Immutable Referral Rewards Ledger Table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referral_id uuid NOT NULL UNIQUE REFERENCES public.referrals(id) ON DELETE CASCADE,
    reward_type text NOT NULL DEFAULT 'bonus_days' CHECK (reward_type IN ('bonus_days', 'promotion_credit', 'feature_unlock')),
    reward_value integer NOT NULL DEFAULT 7,
    status text NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'consumed', 'revoked', 'expired')),
    policy_version text NOT NULL DEFAULT 'v1',
    granted_at timestamptz NOT NULL DEFAULT now(),
    effective_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revocation_reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ref_rewards_adv ON public.referral_rewards(advertiser_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_ref_rewards_profile ON public.referral_rewards(profile_id);

-- 5. RPC: get_or_create_advertiser_referral_code
CREATE OR REPLACE FUNCTION public.get_or_create_advertiser_referral_code(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_generated_code text;
    v_tries integer := 0;
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
        RAISE EXCEPTION 'Acesso negado: Você não é o proprietário deste anunciante.';
    END IF;

    -- Return existing code if present
    IF v_adv.referral_code IS NOT NULL AND length(v_adv.referral_code) > 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'referral_code', v_adv.referral_code,
            'advertiser_id', v_adv.id
        );
    END IF;

    -- Generate a unique 8-character CSPRNG alphanumeric code
    LOOP
        v_tries := v_tries + 1;
        v_generated_code := upper(encode(gen_random_bytes(4), 'hex')); -- 8 hex chars (e.g. 7A8B9C0D)

        BEGIN
            UPDATE public.advertiser_profiles
            SET referral_code = v_generated_code,
                updated_at = now()
            WHERE id = p_advertiser_id
              AND referral_code IS NULL;

            IF FOUND THEN
                EXIT;
            END IF;
        EXCEPTION
            WHEN unique_violation THEN
                IF v_tries > 10 THEN
                    RAISE EXCEPTION 'Falha ao gerar código único de indicação.';
                END IF;
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'referral_code', v_generated_code,
        'advertiser_id', p_advertiser_id
    );
END;
$$;

-- 6. RPC: track_referral_click (First-Party Attribution, First-Referrer-Wins)
CREATE OR REPLACE FUNCTION public.track_referral_click(
    p_referral_code text,
    p_visitor_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_code text;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_existing_attr public.referral_attributions%ROWTYPE;
BEGIN
    IF p_referral_code IS NULL OR length(trim(p_referral_code)) < 4 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inválido.');
    END IF;

    v_clean_code := upper(trim(p_referral_code));

    -- Look up referrer
    SELECT * INTO v_adv
    FROM public.advertiser_profiles
    WHERE referral_code = v_clean_code
      AND deleted_at IS NULL
      AND profile_status <> 'suspended';

    IF v_adv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Código de indicação não encontrado ou inativo.');
    END IF;

    -- Check if attribution already exists for this visitor token (FIRST REFERRER WINS)
    SELECT * INTO v_existing_attr
    FROM public.referral_attributions
    WHERE visitor_attribution_token = p_visitor_token
      AND status = 'captured'
      AND first_seen_at > (now() - INTERVAL '30 days')
    ORDER BY first_seen_at ASC
    LIMIT 1;

    IF v_existing_attr.id IS NOT NULL THEN
        -- Update last seen timestamp
        UPDATE public.referral_attributions
        SET last_seen_at = now()
        WHERE id = v_existing_attr.id;

        RETURN jsonb_build_object(
            'success', true,
            'attributed', false,
            'message', 'Primeiro referenciador preservado.',
            'referral_code', v_existing_attr.referral_code
        );
    END IF;

    -- Create new attribution record
    INSERT INTO public.referral_attributions (
        referral_code,
        referrer_advertiser_id,
        referrer_profile_id,
        visitor_attribution_token,
        first_seen_at,
        last_seen_at,
        status
    )
    VALUES (
        v_clean_code,
        v_adv.id,
        v_adv.profile_id,
        p_visitor_token,
        now(),
        now(),
        'captured'
    );

    RETURN jsonb_build_object(
        'success', true,
        'attributed', true,
        'referral_code', v_clean_code,
        'referrer_stage_name', v_adv.stage_name
    );
END;
$$;

-- 7. RPC: bind_referral_on_advertiser_creation (Called during onboarding)
CREATE OR REPLACE FUNCTION public.bind_referral_on_advertiser_creation(
    p_referred_advertiser_id uuid,
    p_referral_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_code text;
    v_referred_adv public.advertiser_profiles%ROWTYPE;
    v_referrer_adv public.advertiser_profiles%ROWTYPE;
    v_existing_ref public.referrals%ROWTYPE;
BEGIN
    IF p_referral_code IS NULL OR length(trim(p_referral_code)) < 4 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Código de indicação vazio ou inválido.');
    END IF;

    v_clean_code := upper(trim(p_referral_code));

    SELECT * INTO v_referred_adv FROM public.advertiser_profiles WHERE id = p_referred_advertiser_id;
    IF v_referred_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante indicado não encontrado.';
    END IF;

    SELECT * INTO v_referrer_adv FROM public.advertiser_profiles WHERE referral_code = v_clean_code;
    IF v_referrer_adv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Código de indicação inexistente.');
    END IF;

    -- SELF-REFERRAL SECURITY CHECK (Database enforcement)
    IF v_referrer_adv.profile_id = v_referred_adv.profile_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Autoindicação não permitida.');
    END IF;

    -- Check if this referred account is already bound
    SELECT * INTO v_existing_ref FROM public.referrals WHERE referred_profile_id = v_referred_adv.profile_id;
    IF v_existing_ref.id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Conta já vinculada a uma indicação anterior.');
    END IF;

    -- Create canonical referral record
    INSERT INTO public.referrals (
        referrer_advertiser_id,
        referrer_profile_id,
        referred_advertiser_id,
        referred_profile_id,
        referral_code,
        status,
        risk_status,
        policy_version
    )
    VALUES (
        v_referrer_adv.id,
        v_referrer_adv.profile_id,
        v_referred_adv.id,
        v_referred_adv.profile_id,
        v_clean_code,
        'registered',
        'normal',
        'v1'
    );

    -- Update referred_by_code on profile
    UPDATE public.advertiser_profiles
    SET referred_by_code = v_clean_code,
        updated_at = now()
    WHERE id = p_referred_advertiser_id;

    -- Notify referrer
    INSERT INTO public.notifications (profile_id, type, title, message)
    VALUES (
        v_referrer_adv.profile_id,
        'referral_registered',
        'Nova Indicação Cadastrada',
        'Um novo anunciante iniciou o cadastro através do seu link de indicação. O benefício será concedido após a aprovação e qualificação do perfil.'
    );

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_referred_adv.profile_id,
        'referral_bound',
        'referrals',
        p_referred_advertiser_id,
        jsonb_build_object('referrer_advertiser_id', v_referrer_adv.id, 'referral_code', v_clean_code)
    );

    RETURN jsonb_build_object('success', true, 'status', 'registered');
END;
$$;

-- 8. RPC: evaluate_referral_qualifications (Server-Side Qualification & Reward Granting Engine)
CREATE OR REPLACE FUNCTION public.evaluate_referral_qualifications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r RECORD;
    v_qualified_count integer := 0;
    v_rewarded_count integer := 0;
    v_reward_days integer := 7;
BEGIN
    -- 1. Progress 'registered' referrals to 'pending_qualification' once referred profile is approved & published
    FOR r IN
        SELECT ref.id AS referral_id, ref.referrer_advertiser_id, ref.referrer_profile_id, ref.referred_advertiser_id, adv.published_at
        FROM public.referrals ref
        JOIN public.advertiser_profiles adv ON ref.referred_advertiser_id = adv.id
        WHERE ref.status = 'registered'
          AND adv.profile_status = 'active'
          AND adv.published_at IS NOT NULL
          AND adv.deleted_at IS NULL
    LOOP
        UPDATE public.referrals
        SET status = 'pending_qualification',
            qualification_due_at = r.published_at + INTERVAL '48 hours',
            updated_at = now()
        WHERE id = r.referral_id;
    END LOOP;

    -- 2. Qualify and Reward referrals where qualification delay (48 hours) has matured
    FOR r IN
        SELECT
            ref.id AS referral_id,
            ref.referrer_advertiser_id,
            ref.referrer_profile_id,
            ref.referred_advertiser_id,
            ref.policy_version,
            adv.profile_status AS referred_status,
            adv_ref.profile_status AS referrer_status
        FROM public.referrals ref
        JOIN public.advertiser_profiles adv ON ref.referred_advertiser_id = adv.id
        JOIN public.advertiser_profiles adv_ref ON ref.referrer_advertiser_id = adv_ref.id
        WHERE ref.status = 'pending_qualification'
          AND ref.qualification_due_at <= now()
          AND adv.profile_status = 'active'
          AND adv_ref.profile_status <> 'suspended'
          AND ref.risk_status = 'normal'
    LOOP
        -- Atomically update referral status to qualified
        UPDATE public.referrals
        SET status = 'qualified',
            qualified_at = now(),
            rewarded_at = now(),
            updated_at = now()
        WHERE id = r.referral_id
          AND status = 'pending_qualification';

        IF FOUND THEN
            v_qualified_count := v_qualified_count + 1;

            -- Grant Bonus Days in Immutable Reward Ledger (idempotent via unique constraint on referral_id)
            INSERT INTO public.referral_rewards (
                advertiser_id,
                profile_id,
                referral_id,
                reward_type,
                reward_value,
                status,
                policy_version,
                granted_at,
                effective_at,
                expires_at
            )
            VALUES (
                r.referrer_advertiser_id,
                r.referrer_profile_id,
                r.referral_id,
                'bonus_days',
                v_reward_days,
                'granted',
                COALESCE(r.policy_version, 'v1'),
                now(),
                now(),
                now() + INTERVAL '30 days' -- Reward claim/usage window
            )
            ON CONFLICT (referral_id) DO NOTHING;

            v_rewarded_count := v_rewarded_count + 1;

            -- Update referral status to rewarded
            UPDATE public.referrals SET status = 'rewarded', updated_at = now() WHERE id = r.referral_id;

            -- Notify referrer of granted reward
            INSERT INTO public.notifications (profile_id, type, title, message)
            VALUES (
                r.referrer_profile_id,
                'referral_rewarded',
                'Parabéns! Você Conquistou 7 Dias de Bônus',
                'Uma de suas indicações cumpriu todos os requisitos de qualificação. Seus 7 dias de benefícios comerciais foram creditados em seu painel.'
            );

            -- Audit log
            INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
            VALUES (
                r.referrer_profile_id,
                'referral_reward_granted',
                'referral_rewards',
                r.referral_id,
                jsonb_build_object('reward_days', v_reward_days, 'referral_id', r.referral_id)
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'qualified_count', v_qualified_count,
        'rewarded_count', v_rewarded_count
    );
END;
$$;

-- 9. RPC: revoke_referral_reward (Staff-Only with Mandatory Reason and Audit)
CREATE OR REPLACE FUNCTION public.revoke_referral_reward(
    p_reward_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_staff_id uuid;
    v_reward public.referral_rewards%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de administração.';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'Motivo da revogação é obrigatório (mínimo 5 caracteres).';
    END IF;

    v_staff_id := public.current_profile_id();

    SELECT * INTO v_reward FROM public.referral_rewards WHERE id = p_reward_id;
    IF v_reward.id IS NULL THEN
        RAISE EXCEPTION 'Registro de recompensa não encontrado.';
    END IF;

    -- Update reward record status to revoked
    UPDATE public.referral_rewards
    SET status = 'revoked',
        revoked_at = now(),
        revocation_reason = p_reason
    WHERE id = p_reward_id;

    -- Update associated referral status to revoked
    UPDATE public.referrals
    SET status = 'revoked',
        risk_status = 'blocked',
        risk_reasons = array_append(risk_reasons, 'Reward revoked: ' || p_reason),
        updated_at = now()
    WHERE id = v_reward.referral_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_staff_id,
        'referral_reward_revoked',
        'referral_rewards',
        p_reward_id,
        jsonb_build_object('advertiser_id', v_reward.advertiser_id, 'reason', p_reason)
    );

    -- Notification to advertiser
    INSERT INTO public.notifications (profile_id, type, title, message)
    VALUES (
        v_reward.profile_id,
        'referral_reward_revoked',
        'Recompensa de Indicação Revogada',
        'Uma recompensa de indicação foi cancelada pela equipe de conformidade: ' || p_reason
    );

    RETURN jsonb_build_object('success', true, 'status', 'revoked');
END;
$$;

-- 10. Update get_advertiser_entitlements to Support Referral Bonus Days
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
    v_trial_end_time timestamptz;
    v_trial_days_remaining integer := 0;
    v_lifecycle_state text := 'limited';
    v_active_bonus_days integer := 0;
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
            'authenticity_verified', false,
            'bonus_days_active', 0
        );
    END IF;

    -- 1. Suspended Profile Check
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
            'authenticity_verified', v_adv.authenticity_verified,
            'bonus_days_active', 0
        );
    END IF;

    -- 2. Calculate Active Granted Bonus Days from Referral Rewards Ledger
    SELECT COALESCE(SUM(reward_value), 0) INTO v_active_bonus_days
    FROM public.referral_rewards
    WHERE advertiser_id = p_advertiser_id
      AND status = 'granted'
      AND effective_at <= now()
      AND expires_at > now();

    -- 3. Check for Active Trial Subscription
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
            'authenticity_verified', v_adv.authenticity_verified,
            'bonus_days_active', v_active_bonus_days
        );
    END IF;

    -- 4. Check for Active Paid Subscription
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
            'authenticity_verified', v_adv.authenticity_verified,
            'bonus_days_active', v_active_bonus_days
        );
    END IF;

    -- 5. Check for Grace Period
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
            'authenticity_verified', v_adv.authenticity_verified,
            'bonus_days_active', v_active_bonus_days
        );
    END IF;

    -- 6. Active Referral Bonus Days Entitlement (When in Limited/Free mode with active granted rewards)
    IF v_active_bonus_days > 0 THEN
        RETURN jsonb_build_object(
            'has_active_subscription', true,
            'plan_name', 'Bônus de Indicação (' || v_active_bonus_days || ' Dias)',
            'plan_slug', 'referral_bonus',
            'lifecycle_state', 'active',
            'media_limit', 20,
            'video_limit', 2,
            'boost_allowance', 0,
            'analytics_level', 'basic',
            'audio_allowed', true,
            'commercial_video_allowed', true,
            'contacts_strategy', 'full',
            'is_trial', false,
            'trial_days_remaining', 0,
            'trial_ends_at', NULL,
            'authenticity_verified', v_adv.authenticity_verified,
            'bonus_days_active', v_active_bonus_days
        );
    END IF;

    -- 7. Baseline Limited / Free Mode
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
        'authenticity_verified', v_adv.authenticity_verified,
        'bonus_days_active', 0
    );
END;
$$;

-- 11. Row Level Security (RLS) Policies
ALTER TABLE public.referral_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Referrer can view their own referrals
CREATE POLICY "Referrer can view their referrals"
    ON public.referrals FOR SELECT
    USING (referrer_profile_id = public.current_profile_id() OR public.is_staff());

-- Referrer can view their own reward ledger
CREATE POLICY "Referrer can view their rewards"
    ON public.referral_rewards FOR SELECT
    USING (profile_id = public.current_profile_id() OR public.is_staff());

-- Staff can manage referrals & rewards
CREATE POLICY "Staff can manage referrals"
    ON public.referrals FOR ALL
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

CREATE POLICY "Staff can manage rewards"
    ON public.referral_rewards FOR ALL
    USING (public.is_staff())
    WITH CHECK (public.is_staff());
