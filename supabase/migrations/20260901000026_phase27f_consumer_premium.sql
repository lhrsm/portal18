-- ============================================================================
-- MIGRATION 00026: Phase 27F — Consumer Premium, Exclusive Media & Reviews
-- ============================================================================

-- 1. Consumer Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.consumer_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Canonical Consumer Plans (Free vs Premium)
INSERT INTO public.consumer_plans (name, slug, description, sort_order, is_active, features)
VALUES
    ('Portal18 Free', 'free', 'Acesso básico com navegação por perfis, fotos públicas e contato direto com anunciantes.', 1, true,
     '["Acesso a perfis e fotos públicas", "Contato direto via canais oficiais", "Favoritos e histórico básico", "Selo de Autenticidade visível"]'::jsonb),
    ('Portal18 Premium', 'premium', 'Experiência exclusiva para membros com vídeos restritos, avaliações completas e alertas.', 2, true,
     '["Acesso a vídeos exclusivos Premium", "Leitura completa de avaliações moderadas", "Alertas inteligentes de novos perfis", "Coleções e favoritos avançados", "Histórico de navegação estendido"]'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    features = EXCLUDED.features;

-- 2. Consumer Plan Pricing Matrix Table (Versioned Pricing per Period in BRL minor units/cents)
CREATE TABLE IF NOT EXISTS public.consumer_plan_pricing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.consumer_plans(id) ON DELETE CASCADE,
    billing_period_id uuid NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
    price_cents integer NOT NULL, -- in integer cents BRL (e.g. 2490 = R$ 24,90)
    currency text NOT NULL DEFAULT 'BRL',
    is_active boolean NOT NULL DEFAULT true,
    policy_version text NOT NULL DEFAULT 'v1',
    effective_from timestamptz NOT NULL DEFAULT now(),
    effective_to timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_consumer_plan_period_policy UNIQUE(plan_id, billing_period_id, policy_version)
);

-- Seed Consumer Plan Pricing (Free is R$0; Premium: 7d = R$9,90, 30d = R$24,90, 90d = R$59,90)
DO $$
DECLARE
    v_c_premium uuid;
    v_b_7 uuid;
    v_b_30 uuid;
    v_b_90 uuid;
BEGIN
    SELECT id INTO v_c_premium FROM public.consumer_plans WHERE slug = 'premium' LIMIT 1;
    SELECT id INTO v_b_7 FROM public.billing_periods WHERE slug = '7_days' LIMIT 1;
    SELECT id INTO v_b_30 FROM public.billing_periods WHERE slug = '30_days' LIMIT 1;
    SELECT id INTO v_b_90 FROM public.billing_periods WHERE slug = '90_days' LIMIT 1;

    IF v_c_premium IS NOT NULL AND v_b_7 IS NOT NULL THEN
        INSERT INTO public.consumer_plan_pricing (plan_id, billing_period_id, price_cents, policy_version)
        VALUES
            (v_c_premium, v_b_7, 990, 'v1'),
            (v_c_premium, v_b_30, 2490, 'v1'),
            (v_c_premium, v_b_90, 5990, 'v1')
        ON CONFLICT (plan_id, billing_period_id, policy_version) DO UPDATE SET
            price_cents = EXCLUDED.price_cents;
    END IF;
END $$;

-- 3. Consumer Subscriptions Table (Independent from Advertiser Subscriptions)
CREATE TABLE IF NOT EXISTS public.consumer_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.consumer_plans(id),
    status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'grace_period', 'cancelled', 'expired', 'suspended')),
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumer_subs_user_status ON public.consumer_subscriptions(user_profile_id, status);

-- 4. Extend Advertiser Media with Audience Level
DO $$ BEGIN
    ALTER TABLE public.advertiser_media
        ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'age_verified'
        CHECK (audience IN ('public', 'age_verified', 'consumer_premium', 'private'));
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_adv_media_audience ON public.advertiser_media(audience);

-- 5. Structured & Moderated Advertiser Reviews Table
CREATE TABLE IF NOT EXISTS public.advertiser_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating_communication integer NOT NULL CHECK (rating_communication BETWEEN 1 AND 5),
    rating_accuracy integer NOT NULL CHECK (rating_accuracy BETWEEN 1 AND 5),
    rating_professionalism integer NOT NULL CHECK (rating_professionalism BETWEEN 1 AND 5),
    rating_overall numeric(3,2) NOT NULL,
    comment text,
    status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'pending_review', 'approved', 'rejected', 'removed', 'appealed')),
    rejection_reason text,
    moderated_at timestamptz,
    moderated_by uuid REFERENCES public.profiles(id),
    advertiser_response text,
    advertiser_response_at timestamptz,
    advertiser_response_status text NOT NULL DEFAULT 'none' CHECK (advertiser_response_status IN ('none', 'submitted', 'approved', 'rejected')),
    appeal_reason text,
    appeal_status text NOT NULL DEFAULT 'none' CHECK (appeal_status IN ('none', 'pending', 'resolved', 'dismissed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adv_reviews_adv_status ON public.advertiser_reviews(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_adv_reviews_user ON public.advertiser_reviews(user_profile_id);

-- Prevent Self-Review Constraint Trigger
CREATE OR REPLACE FUNCTION public.check_self_review_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_adv_owner_id uuid;
BEGIN
    SELECT profile_id INTO v_adv_owner_id
    FROM public.advertiser_profiles
    WHERE id = NEW.advertiser_id;

    IF v_adv_owner_id = NEW.user_profile_id THEN
        RAISE EXCEPTION 'Não é permitido avaliar o próprio perfil de anunciante.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_review ON public.advertiser_reviews;
CREATE TRIGGER trg_prevent_self_review
    BEFORE INSERT OR UPDATE ON public.advertiser_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.check_self_review_guard();

-- 6. RPC: get_consumer_catalog (Public Consumer Plans & Multi-Period Pricing)
CREATE OR REPLACE FUNCTION public.get_consumer_catalog()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plans jsonb;
    v_periods jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'slug', p.slug,
            'description', p.description,
            'sort_order', p.sort_order,
            'features', p.features,
            'pricing', COALESCE((
                SELECT jsonb_object_agg(
                    bp.slug,
                    jsonb_build_object(
                        'period_slug', bp.slug,
                        'duration_days', bp.duration_days,
                        'price_cents', cp.price_cents,
                        'currency', cp.currency
                    )
                )
                FROM public.consumer_plan_pricing cp
                JOIN public.billing_periods bp ON cp.billing_period_id = bp.id
                WHERE cp.plan_id = p.id AND cp.is_active = true
            ), '{}'::jsonb)
        ) ORDER BY p.sort_order ASC
    ) INTO v_plans
    FROM public.consumer_plans p
    WHERE p.is_active = true;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'slug', slug,
            'name', name,
            'duration_days', duration_days,
            'display_order', display_order
        ) ORDER BY display_order ASC
    ) INTO v_periods
    FROM public.billing_periods
    WHERE is_active = true;

    RETURN jsonb_build_object(
        'success', true,
        'plans', COALESCE(v_plans, '[]'::jsonb),
        'periods', COALESCE(v_periods, '[]'::jsonb),
        'policy_version', 'v1'
    );
END;
$$;

-- 7. RPC: get_consumer_entitlements (Authoritative Server Evaluation)
CREATE OR REPLACE FUNCTION public.get_consumer_entitlements(
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_profile public.profiles%ROWTYPE;
    v_sub public.consumer_subscriptions%ROWTYPE;
    v_is_premium boolean := false;
    v_state text := 'free';
    v_plan_name text := 'Portal18 Free';
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authenticated', false,
            'is_premium', false,
            'lifecycle_state', 'anonymous',
            'plan_name', 'Visitante Anônimo',
            'entitlements', jsonb_build_object(
                'can_watch_premium_videos', false,
                'full_review_access', false,
                'advanced_favorites', false,
                'advanced_lists', false,
                'extended_history', false,
                'new_profile_alerts', false
            )
        );
    END IF;

    SELECT * INTO v_user_profile FROM public.profiles WHERE id = p_user_id;
    IF v_user_profile.id IS NULL THEN
        RETURN jsonb_build_object(
            'is_authenticated', false,
            'is_premium', false,
            'lifecycle_state', 'anonymous',
            'plan_name', 'Visitante Anônimo',
            'entitlements', jsonb_build_object(
                'can_watch_premium_videos', false,
                'full_review_access', false,
                'advanced_favorites', false,
                'advanced_lists', false,
                'extended_history', false,
                'new_profile_alerts', false
            )
        );
    END IF;

    -- Check active consumer subscription
    SELECT * INTO v_sub
    FROM public.consumer_subscriptions
    WHERE user_profile_id = p_user_id AND status IN ('active', 'grace_period')
    ORDER BY created_at DESC LIMIT 1;

    IF v_sub.id IS NOT NULL THEN
        v_is_premium := true;
        v_state := v_sub.status;
        v_plan_name := 'Portal18 Premium';
    END IF;

    RETURN jsonb_build_object(
        'is_authenticated', true,
        'is_premium', v_is_premium,
        'lifecycle_state', v_state,
        'plan_name', v_plan_name,
        'current_period_end', v_sub.current_period_end,
        'cancel_at_period_end', COALESCE(v_sub.cancel_at_period_end, false),
        'entitlements', jsonb_build_object(
            'can_watch_premium_videos', v_is_premium,
            'full_review_access', v_is_premium,
            'advanced_favorites', v_is_premium,
            'advanced_lists', v_is_premium,
            'extended_history', v_is_premium,
            'new_profile_alerts', v_is_premium
        )
    );
END;
$$;

-- 8. RPC: get_profile_reviews (Entitlement-Aware Review Display)
CREATE OR REPLACE FUNCTION public.get_profile_reviews(
    p_advertiser_id uuid,
    p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entitlements jsonb;
    v_can_see_full_text boolean := false;
    v_total_count integer := 0;
    v_avg_comm numeric(3,2) := 0;
    v_avg_acc numeric(3,2) := 0;
    v_avg_prof numeric(3,2) := 0;
    v_avg_overall numeric(3,2) := 0;
    v_reviews jsonb;
BEGIN
    -- 1. Determine viewer entitlement
    v_entitlements := public.get_consumer_entitlements(p_viewer_id);
    v_can_see_full_text := COALESCE((v_entitlements->'entitlements'->>'full_review_access')::boolean, false);

    -- 2. Aggregate statistics for approved reviews
    SELECT
        COUNT(*),
        COALESCE(AVG(rating_communication), 0),
        COALESCE(AVG(rating_accuracy), 0),
        COALESCE(AVG(rating_professionalism), 0),
        COALESCE(AVG(rating_overall), 0)
    INTO v_total_count, v_avg_comm, v_avg_acc, v_avg_prof, v_avg_overall
    FROM public.advertiser_reviews
    WHERE advertiser_id = p_advertiser_id AND status = 'approved';

    -- 3. Fetch reviews list with privacy sanitation
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', r.id,
            'rating_communication', r.rating_communication,
            'rating_accuracy', r.rating_accuracy,
            'rating_professionalism', r.rating_professionalism,
            'rating_overall', r.rating_overall,
            -- Truncate comment preview for Free users; Full text for Premium users
            'comment', CASE
                WHEN v_can_see_full_text THEN r.comment
                WHEN r.comment IS NOT NULL AND length(r.comment) > 60 THEN substring(r.comment FROM 1 FOR 60) || '...'
                ELSE r.comment
            END,
            'is_truncated', CASE WHEN NOT v_can_see_full_text AND r.comment IS NOT NULL AND length(r.comment) > 60 THEN true ELSE false END,
            'reviewer_label', 'Usuário Autenticado',
            'advertiser_response', CASE WHEN r.advertiser_response_status = 'approved' THEN r.advertiser_response ELSE NULL END,
            'advertiser_response_at', r.advertiser_response_at,
            'created_at', r.created_at
        ) ORDER BY r.created_at DESC
    ) INTO v_reviews
    FROM public.advertiser_reviews r
    WHERE r.advertiser_id = p_advertiser_id AND r.status = 'approved';

    RETURN jsonb_build_object(
        'success', true,
        'advertiser_id', p_advertiser_id,
        'viewer_can_see_full_text', v_can_see_full_text,
        'summary', jsonb_build_object(
            'total_reviews', v_total_count,
            'avg_communication', round(v_avg_comm, 1),
            'avg_accuracy', round(v_avg_acc, 1),
            'avg_professionalism', round(v_avg_prof, 1),
            'avg_overall', round(v_avg_overall, 1)
        ),
        'reviews', COALESCE(v_reviews, '[]'::jsonb)
    );
END;
$$;

-- 9. RPC: submit_advertiser_review (Structured Review Submission)
CREATE OR REPLACE FUNCTION public.submit_advertiser_review(
    p_advertiser_id uuid,
    p_rating_comm integer,
    p_rating_acc integer,
    p_rating_prof integer,
    p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_profile_id uuid;
    v_user public.profiles%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_overall numeric(3,2);
    v_clean_comment text;
    v_review_id uuid;
BEGIN
    v_user_profile_id := public.current_profile_id();
    IF v_user_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Você precisa estar autenticado para enviar uma avaliação.';
    END IF;

    SELECT * INTO v_user FROM public.profiles WHERE id = v_user_profile_id;
    IF v_user.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de usuário não encontrado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL OR v_adv.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    IF v_adv.profile_id = v_user_profile_id THEN
        RAISE EXCEPTION 'Não é permitido avaliar o seu próprio anúncio.';
    END IF;

    IF p_rating_comm NOT BETWEEN 1 AND 5 OR p_rating_acc NOT BETWEEN 1 AND 5 OR p_rating_prof NOT BETWEEN 1 AND 5 THEN
        RAISE EXCEPTION 'As notas de avaliação devem estar entre 1 e 5.';
    END IF;

    -- Calculate overall arithmetic mean
    v_overall := round(((p_rating_comm + p_rating_acc + p_rating_prof)::numeric / 3.0), 2);

    -- Sanitize comment (strip HTML tags, trim, max 1000 chars)
    IF p_comment IS NOT NULL THEN
        v_clean_comment := regexp_replace(p_comment, '<[^>]*>', '', 'g');
        v_clean_comment := trim(v_clean_comment);
        IF length(v_clean_comment) > 1000 THEN
            v_clean_comment := substring(v_clean_comment FROM 1 FOR 1000);
        END IF;
    END IF;

    -- Insert in 'submitted' status for administrative moderation
    INSERT INTO public.advertiser_reviews (
        advertiser_id,
        user_profile_id,
        rating_communication,
        rating_accuracy,
        rating_professionalism,
        rating_overall,
        comment,
        status
    )
    VALUES (
        p_advertiser_id,
        v_user_profile_id,
        p_rating_comm,
        p_rating_acc,
        p_rating_prof,
        v_overall,
        v_clean_comment,
        'submitted'
    )
    RETURNING id INTO v_review_id;

    RETURN jsonb_build_object(
        'success', true,
        'review_id', v_review_id,
        'status', 'submitted',
        'message', 'Sua avaliação foi enviada e será publicada após moderação da equipe.'
    );
END;
$$;
