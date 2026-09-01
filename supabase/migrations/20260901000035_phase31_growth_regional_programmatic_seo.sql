-- ============================================================================
-- MIGRATION 00035: Phase 31 — Growth, Regional Expansion & Programmatic SEO
-- ============================================================================

-- 1. Create Regional Growth Stats Table (Audited Inventory & Demand)
CREATE TABLE IF NOT EXISTS public.regional_growth_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code text NOT NULL,
    city_slug text NOT NULL,
    city_name text NOT NULL,
    readiness_status text NOT NULL DEFAULT 'emerging'
        CHECK (readiness_status IN ('inactive', 'emerging', 'ready', 'active', 'high_activity')),
    active_profiles_count integer NOT NULL DEFAULT 0,
    verified_profiles_count integer NOT NULL DEFAULT 0,
    search_impressions_count integer NOT NULL DEFAULT 0,
    contact_clicks_count integer NOT NULL DEFAULT 0,
    advertiser_signups_count integer NOT NULL DEFAULT 0,
    last_calculated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_regional_growth_city UNIQUE(state_code, city_slug)
);

CREATE INDEX IF NOT EXISTS idx_reg_growth_state_city ON public.regional_growth_stats(state_code, city_slug);
CREATE INDEX IF NOT EXISTS idx_reg_growth_readiness ON public.regional_growth_stats(readiness_status);

-- 2. Create Growth Page Policies Table (Indexability Engine & Thin Content Governance)
CREATE TABLE IF NOT EXISTS public.growth_page_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path text NOT NULL UNIQUE,
    page_type text NOT NULL
        CHECK (page_type IN ('state', 'city', 'category', 'landing', 'filter_combination')),
    is_indexable boolean NOT NULL DEFAULT true,
    min_profile_threshold integer NOT NULL DEFAULT 1,
    custom_h1 text,
    custom_intro text,
    quality_score integer NOT NULL DEFAULT 100,
    editorial_status text NOT NULL DEFAULT 'published'
        CHECK (editorial_status IN ('draft', 'review', 'published', 'archived')),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_page_policies_path ON public.growth_page_policies(page_path);

-- 3. Create Growth Experiments Table (Privacy-Safe A/B Testing)
CREATE TABLE IF NOT EXISTS public.growth_experiments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_key text NOT NULL UNIQUE,
    name text NOT NULL,
    hypothesis text NOT NULL,
    variants jsonb NOT NULL DEFAULT '["control", "variant_a"]'::jsonb,
    target_page text NOT NULL,
    primary_metric text NOT NULL,
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    traffic_allocation integer NOT NULL DEFAULT 100,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_experiments_key ON public.growth_experiments(experiment_key);

-- 4. Create Acquisition Attribution Logs Table (First-Party Privacy-Safe Funnels)
CREATE TABLE IF NOT EXISTS public.acquisition_attribution_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    event_name text NOT NULL,
    landing_page text NOT NULL,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    referrer_host text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acq_attrib_session ON public.acquisition_attribution_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_acq_attrib_event ON public.acquisition_attribution_logs(event_name);

-- 5. Seed Core Regional Stats
INSERT INTO public.regional_growth_stats (state_code, city_slug, city_name, readiness_status, active_profiles_count, verified_profiles_count, search_impressions_count, contact_clicks_count, advertiser_signups_count)
VALUES
    ('BA', 'salvador', 'Salvador', 'active', 12, 10, 3420, 854, 4),
    ('BA', 'feira-de-santana', 'Feira de Santana', 'emerging', 2, 2, 410, 62, 1),
    ('SP', 'sao-paulo', 'São Paulo', 'ready', 8, 7, 5120, 1200, 3),
    ('RJ', 'rio-de-janeiro', 'Rio de Janeiro', 'ready', 6, 5, 4200, 980, 2)
ON CONFLICT (state_code, city_slug) DO UPDATE
SET
    active_profiles_count = EXCLUDED.active_profiles_count,
    last_calculated_at = now();

-- 6. Atomic RPC: Check Page Indexability
CREATE OR REPLACE FUNCTION public.check_page_indexability(
    p_page_path text,
    p_profile_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_policy record;
    v_is_indexable boolean := true;
    v_reason text := 'inventory_eligible';
BEGIN
    -- Look for explicit policy override
    SELECT * INTO v_policy
    FROM public.growth_page_policies
    WHERE page_path = p_page_path
    LIMIT 1;

    IF v_policy.id IS NOT NULL THEN
        IF NOT v_policy.is_indexable THEN
            RETURN jsonb_build_object(
                'is_indexable', false,
                'reason', 'manual_policy_override',
                'quality_score', v_policy.quality_score
            );
        END IF;

        IF p_profile_count < v_policy.min_profile_threshold THEN
            RETURN jsonb_build_object(
                'is_indexable', false,
                'reason', 'thin_content_insufficient_profiles',
                'min_threshold', v_policy.min_profile_threshold,
                'current_count', p_profile_count
            );
        END IF;
    ELSE
        -- Default rule: 0 profiles = noindex to prevent doorway thin pages
        IF p_profile_count < 1 THEN
            RETURN jsonb_build_object(
                'is_indexable', false,
                'reason', 'default_thin_content_zero_profiles',
                'current_count', 0
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'is_indexable', true,
        'reason', v_reason,
        'current_count', p_profile_count
    );
END;
$$;
