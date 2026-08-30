-- ============================================================================
-- MIGRATION 00025: Phase 27E — Plan Catalog, Billing Periods & Boost Marketplace
-- ============================================================================

-- 1. Billing Periods Table (7, 30, 90 days)
CREATE TABLE IF NOT EXISTS public.billing_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    duration_days integer NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Canonical Billing Periods
INSERT INTO public.billing_periods (slug, name, duration_days, display_order, is_active)
VALUES
    ('7_days', '7 Dias (Semanal)', 7, 1, true),
    ('30_days', '30 Dias (Mensal)', 30, 2, true),
    ('90_days', '90 Dias (Trimestral)', 90, 3, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    duration_days = EXCLUDED.duration_days,
    display_order = EXCLUDED.display_order;

-- 2. Plan Pricing Matrix Table (Versioned pricing per period in BRL cents)
CREATE TABLE IF NOT EXISTS public.plan_pricing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    billing_period_id uuid NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
    price_cents integer NOT NULL, -- Integer minor units BRL (e.g. 4990 = R$ 49,90)
    currency text NOT NULL DEFAULT 'BRL',
    is_active boolean NOT NULL DEFAULT true,
    policy_version text NOT NULL DEFAULT 'v1',
    effective_from timestamptz NOT NULL DEFAULT now(),
    effective_to timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_plan_period_policy UNIQUE(plan_id, billing_period_id, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_plan_pricing_lookup ON public.plan_pricing(plan_id, billing_period_id, is_active);

-- Seed Plan Pricing Matrix for Essencial, Destaque, Premium, VIP
DO $$
DECLARE
    v_p_essencial uuid;
    v_p_destaque uuid;
    v_p_premium uuid;
    v_p_vip uuid;
    v_b_7 uuid;
    v_b_30 uuid;
    v_b_90 uuid;
BEGIN
    SELECT id INTO v_p_essencial FROM public.subscription_plans WHERE slug = 'essencial' LIMIT 1;
    SELECT id INTO v_p_destaque FROM public.subscription_plans WHERE slug = 'destaque' LIMIT 1;
    SELECT id INTO v_p_premium FROM public.subscription_plans WHERE slug = 'premium' LIMIT 1;
    SELECT id INTO v_p_vip FROM public.subscription_plans WHERE slug = 'vip' LIMIT 1;

    SELECT id INTO v_b_7 FROM public.billing_periods WHERE slug = '7_days' LIMIT 1;
    SELECT id INTO v_b_30 FROM public.billing_periods WHERE slug = '30_days' LIMIT 1;
    SELECT id INTO v_b_90 FROM public.billing_periods WHERE slug = '90_days' LIMIT 1;

    IF v_p_essencial IS NOT NULL AND v_b_7 IS NOT NULL THEN
        INSERT INTO public.plan_pricing (plan_id, billing_period_id, price_cents, policy_version)
        VALUES
            -- Essencial (7d: R$19,90 | 30d: R$49,90 | 90d: R$119,90)
            (v_p_essencial, v_b_7, 1990, 'v1'),
            (v_p_essencial, v_b_30, 4990, 'v1'),
            (v_p_essencial, v_b_90, 11990, 'v1'),
            -- Destaque (7d: R$34,90 | 30d: R$89,90 | 90d: R$219,90)
            (v_p_destaque, v_b_7, 3490, 'v1'),
            (v_p_destaque, v_b_30, 8990, 'v1'),
            (v_p_destaque, v_b_90, 21990, 'v1'),
            -- Premium (7d: R$59,90 | 30d: R$149,90 | 90d: R$359,90)
            (v_p_premium, v_b_7, 5990, 'v1'),
            (v_p_premium, v_b_30, 14990, 'v1'),
            (v_p_premium, v_b_90, 35990, 'v1'),
            -- VIP (7d: R$99,90 | 30d: R$249,90 | 90d: R$599,90)
            (v_p_vip, v_b_7, 9990, 'v1'),
            (v_p_vip, v_b_30, 24990, 'v1'),
            (v_p_vip, v_b_90, 59990, 'v1')
        ON CONFLICT (plan_id, billing_period_id, policy_version) DO UPDATE SET
            price_cents = EXCLUDED.price_cents;
    END IF;
END $$;

-- 3. RPC: get_commercial_catalog (Public Catalog & Pricing Matrix)
CREATE OR REPLACE FUNCTION public.get_commercial_catalog()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plans jsonb;
    v_periods jsonb;
    v_boosts jsonb;
BEGIN
    -- 1. Fetch Plans with Price Matrix
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'slug', p.slug,
            'description', p.description,
            'sort_order', p.sort_order,
            'media_limit', p.media_limit,
            'video_limit', p.video_limit,
            'boost_allowance', p.boost_allowance,
            'analytics_level', p.analytics_level,
            'features', p.features,
            'pricing', COALESCE((
                SELECT jsonb_object_agg(
                    bp.slug,
                    jsonb_build_object(
                        'period_slug', bp.slug,
                        'duration_days', bp.duration_days,
                        'price_cents', pp.price_cents,
                        'currency', pp.currency
                    )
                )
                FROM public.plan_pricing pp
                JOIN public.billing_periods bp ON pp.billing_period_id = bp.id
                WHERE pp.plan_id = p.id AND pp.is_active = true
            ), '{}'::jsonb)
        ) ORDER BY p.sort_order ASC
    ) INTO v_plans
    FROM public.subscription_plans p
    WHERE p.status = 'active';

    -- 2. Fetch Active Billing Periods
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

    -- 3. Fetch Active Boost Products
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'name', name,
            'slug', slug,
            'description', description,
            'placement', placement,
            'duration_hours', duration_hours,
            'price_amount', price_amount,
            'currency', currency
        ) ORDER BY price_amount ASC
    ) INTO v_boosts
    FROM public.promotion_products
    WHERE status = 'active';

    RETURN jsonb_build_object(
        'success', true,
        'plans', COALESCE(v_plans, '[]'::jsonb),
        'periods', COALESCE(v_periods, '[]'::jsonb),
        'boost_products', COALESCE(v_boosts, '[]'::jsonb),
        'policy_version', 'v1'
    );
END;
$$;

-- 4. RPC: get_advertiser_commercial_summary (Consolidated Advertiser Status)
CREATE OR REPLACE FUNCTION public.get_advertiser_commercial_summary(
    p_advertiser_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_entitlements jsonb;
    v_photo_count integer := 0;
    v_video_count integer := 0;
    v_category_count integer := 0;
    v_sub public.subscriptions%ROWTYPE;
    v_plan public.subscription_plans%ROWTYPE;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    IF v_adv.profile_id <> v_profile_id AND NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Você não possui permissão para visualizar estes dados comerciais.';
    END IF;

    -- 1. Get Canonical Entitlements
    v_entitlements := public.get_advertiser_entitlements(p_advertiser_id);

    -- 2. Count Usage Assets
    SELECT 
        COUNT(*) FILTER (WHERE media_type <> 'video'),
        COUNT(*) FILTER (WHERE media_type = 'video')
    INTO v_photo_count, v_video_count
    FROM public.advertiser_media
    WHERE advertiser_id = p_advertiser_id AND deleted_at IS NULL;

    SELECT COUNT(*) INTO v_category_count
    FROM public.advertiser_categories
    WHERE advertiser_id = p_advertiser_id;

    -- 3. Get Active Subscription if any
    SELECT * INTO v_sub
    FROM public.subscriptions
    WHERE advertiser_id = p_advertiser_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1;

    IF v_sub.id IS NOT NULL THEN
        SELECT * INTO v_plan FROM public.subscription_plans WHERE id = v_sub.plan_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'advertiser_id', p_advertiser_id,
        'entitlements', v_entitlements,
        'usage', jsonb_build_object(
            'photos', jsonb_build_object(
                'current', v_photo_count,
                'limit', (v_entitlements->>'media_limit')::integer,
                'can_add_more', v_photo_count < (v_entitlements->>'media_limit')::integer
            ),
            'videos', jsonb_build_object(
                'current', v_video_count,
                'limit', (v_entitlements->>'video_limit')::integer,
                'can_add_more', v_video_count < (v_entitlements->>'video_limit')::integer
            ),
            'categories', jsonb_build_object(
                'current', v_category_count,
                'limit', 3,
                'can_add_more', v_category_count < 3
            )
        ),
        'subscription', CASE WHEN v_sub.id IS NOT NULL THEN jsonb_build_object(
            'id', v_sub.id,
            'plan_name', v_plan.name,
            'plan_slug', v_plan.slug,
            'status', v_sub.status,
            'current_period_end', v_sub.current_period_end,
            'cancel_at_period_end', v_sub.cancel_at_period_end
        ) ELSE NULL END
    );
END;
$$;
