-- ============================================================================
-- MIGRATION 00023: Phase 27C — Discovery Ranking, Sponsored Placement & Commercial Inventory Engine
-- ============================================================================

-- 1. Commercial Inventory Slots Table (Section 20 & 21)
CREATE TABLE IF NOT EXISTS public.commercial_inventory_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    placement text NOT NULL CHECK (placement IN ('homepage_featured', 'city_top', 'category_top', 'search_boost', 'regional_featured')),
    scope_type text NOT NULL CHECK (scope_type IN ('global', 'state', 'city', 'category', 'city_category')),
    scope_id text, -- e.g. city_id or category_slug
    scope_name text, -- e.g. "Salvador - BA"
    max_slots integer NOT NULL DEFAULT 4 CHECK (max_slots >= 1),
    max_sponsored_ratio numeric(3,2) NOT NULL DEFAULT 0.25 CHECK (max_sponsored_ratio > 0 AND max_sponsored_ratio <= 1.0),
    is_active boolean NOT NULL DEFAULT true,
    policy_version text NOT NULL DEFAULT 'v1',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_inventory_placement_scope UNIQUE (placement, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON public.commercial_inventory_slots(placement, scope_type, scope_id, is_active);

-- Seed baseline initial inventory slots
INSERT INTO public.commercial_inventory_slots (placement, scope_type, scope_id, scope_name, max_slots, max_sponsored_ratio)
VALUES 
    ('homepage_featured', 'global', 'global', 'Nacional / Home', 6, 0.25),
    ('city_top', 'city', 'city-salvador', 'Salvador - BA', 4, 0.25),
    ('city_top', 'city', 'city-sao-paulo', 'São Paulo - SP', 6, 0.25),
    ('city_top', 'city', 'city-rio-de-janeiro', 'Rio de Janeiro - RJ', 6, 0.25),
    ('category_top', 'category', 'massagistas', 'Massagistas', 4, 0.25),
    ('search_boost', 'global', 'global', 'Busca Geral', 4, 0.25)
ON CONFLICT DO NOTHING;

-- 2. First-Party Viewable Discovery Events Table (Section 30, 31, 32, 33, 34, 40, 41)
CREATE TABLE IF NOT EXISTS public.discovery_impression_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL CHECK (event_type IN ('organic_impression', 'sponsored_impression', 'organic_click', 'sponsored_click')),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES public.advertiser_campaigns(id) ON DELETE SET NULL,
    placement text NOT NULL DEFAULT 'explore',
    city_slug text,
    category_slug text,
    session_dedupe_key text NOT NULL,
    policy_version text NOT NULL DEFAULT 'v1',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disc_events_adv_type ON public.discovery_impression_events(advertiser_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_disc_events_dedupe ON public.discovery_impression_events(session_dedupe_key);
CREATE INDEX IF NOT EXISTS idx_disc_events_campaign ON public.discovery_impression_events(campaign_id, event_type);

-- 3. Enhance advertiser_ranking_scores with Component Signals (Section 4, 7, 8, 9, 10, 11, 12, 13)
ALTER TABLE public.advertiser_ranking_scores
    ADD COLUMN IF NOT EXISTS location_score numeric(5,2) NOT NULL DEFAULT 50.0,
    ADD COLUMN IF NOT EXISTS bayesian_ctr numeric(6,4) NOT NULL DEFAULT 0.05,
    ADD COLUMN IF NOT EXISTS new_profile_boost numeric(5,2) NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS policy_version text NOT NULL DEFAULT 'v1';

-- 4. RPC: recalculate_organic_ranking_scores (Batch Bayesian Smoothing & Quality Signals)
CREATE OR REPLACE FUNCTION public.recalculate_organic_ranking_scores()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_count integer := 0;
    r RECORD;
    v_prior_impressions numeric := 100.0;
    v_prior_ctr numeric := 0.04; -- 4% baseline prior CTR
    v_raw_impressions numeric;
    v_raw_clicks numeric;
    v_smoothed_ctr numeric;
    v_comp_score numeric;
    v_verif_score numeric;
    v_fresh_score numeric;
    v_quality_score numeric;
    v_new_boost numeric;
    v_final_organic numeric;
BEGIN
    FOR r IN
        SELECT 
            ap.id AS adv_id,
            ap.created_at,
            ap.published_at,
            ap.last_active_at,
            ap.verification_status,
            ap.authenticity_verified,
            ap.completeness_score,
            COALESCE(rs.organic_score, 50.0) AS cur_score
        FROM public.advertiser_profiles ap
        LEFT JOIN public.advertiser_ranking_scores rs ON ap.id = rs.advertiser_id
        WHERE ap.deleted_at IS NULL
          AND ap.profile_status <> 'suspended'
    LOOP
        -- 1. Completeness component (0 to 100)
        v_comp_score := COALESCE(r.completeness_score, 50.0);

        -- 2. Verification component (0 to 100)
        v_verif_score := 30.0;
        IF r.verification_status = 'verified' THEN
            v_verif_score := v_verif_score + 40.0;
        END IF;
        IF r.authenticity_verified = true THEN
            v_verif_score := v_verif_score + 30.0;
        END IF;

        -- 3. Freshness / Activity component (0 to 100 with cooldown normalization)
        IF r.last_active_at > (now() - INTERVAL '24 hours') THEN
            v_fresh_score := 100.0;
        ELSIF r.last_active_at > (now() - INTERVAL '3 days') THEN
            v_fresh_score := 80.0;
        ELSIF r.last_active_at > (now() - INTERVAL '7 days') THEN
            v_fresh_score := 60.0;
        ELSE
            v_fresh_score := 30.0;
        END IF;

        -- 4. Quality component
        v_quality_score := (v_comp_score * 0.5) + (v_verif_score * 0.5);

        -- 5. Fair-start new profile boost window (active for first 7 days post publication)
        IF r.published_at IS NOT NULL AND r.published_at > (now() - INTERVAL '7 days') THEN
            v_new_boost := 20.0;
        ELSE
            v_new_boost := 0.0;
        END IF;

        -- 6. Bayesian Smoothed Engagement / CTR: (clicks + prior_ctr * prior_impr) / (impressions + prior_impr)
        SELECT COALESCE(SUM(impressions), 0), COALESCE(SUM(clicks), 0)
        INTO v_raw_impressions, v_raw_clicks
        FROM public.advertiser_daily_stats
        WHERE advertiser_id = r.adv_id
          AND date >= (CURRENT_DATE - INTERVAL '30 days');

        v_smoothed_ctr := (v_raw_clicks + (v_prior_ctr * v_prior_impressions)) / (v_raw_impressions + v_prior_impressions);

        -- 7. Calculate Final Organic Score: NO SUBSCRIPTION / NO PAYMENT BIAS
        v_final_organic := (
            (v_quality_score * 0.35) +
            (v_fresh_score * 0.25) +
            ((v_smoothed_ctr * 1000.0) * 0.25) +
            (v_new_boost * 0.15)
        );

        -- Clamp score to [1.0, 100.0]
        v_final_organic := LEAST(100.0, GREATEST(1.0, v_final_organic));

        -- Upsert into advertiser_ranking_scores
        INSERT INTO public.advertiser_ranking_scores (
            advertiser_id,
            organic_score,
            completeness_score,
            verification_score,
            freshness_score,
            quality_score,
            bayesian_ctr,
            new_profile_boost,
            policy_version,
            calculated_at
        )
        VALUES (
            r.adv_id,
            v_final_organic,
            v_comp_score,
            v_verif_score,
            v_fresh_score,
            v_quality_score,
            v_smoothed_ctr,
            v_new_boost,
            'v1',
            now()
        )
        ON CONFLICT (advertiser_id) DO UPDATE SET
            organic_score = EXCLUDED.organic_score,
            completeness_score = EXCLUDED.completeness_score,
            verification_score = EXCLUDED.verification_score,
            freshness_score = EXCLUDED.freshness_score,
            quality_score = EXCLUDED.quality_score,
            bayesian_ctr = EXCLUDED.bayesian_ctr,
            new_profile_boost = EXCLUDED.new_profile_boost,
            policy_version = EXCLUDED.policy_version,
            calculated_at = now();

        v_updated_count := v_updated_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'profiles_scored', v_updated_count,
        'policy_version', 'v1'
    );
END;
$$;

-- 5. RPC: record_discovery_event (First-Party Viewability & Click Attribution)
CREATE OR REPLACE FUNCTION public.record_discovery_event(
    p_event_type text,
    p_advertiser_id uuid,
    p_campaign_id uuid DEFAULT NULL,
    p_placement text DEFAULT 'explore',
    p_city_slug text DEFAULT NULL,
    p_category_slug text DEFAULT NULL,
    p_session_dedupe_key text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_viewer_id uuid;
    v_adv_owner_id uuid;
    v_clean_key text;
    v_lower_ua text;
BEGIN
    -- 1. Crawler / Bot Exclusion (Googlebot, Bingbot, OAI, Anthropic, PetalBot, etc.)
    IF p_user_agent IS NOT NULL THEN
        v_lower_ua := lower(p_user_agent);
        IF v_lower_ua LIKE '%bot%' OR v_lower_ua LIKE '%crawl%' OR v_lower_ua LIKE '%spider%' 
           OR v_lower_ua LIKE '%slurp%' OR v_lower_ua LIKE '%mediapartners%' OR v_lower_ua LIKE '%bingpreview%' THEN
            RETURN jsonb_build_object('success', true, 'recorded', false, 'reason', 'bot_excluded');
        END IF;
    END IF;

    -- 2. Self-View & Staff Exclusion
    v_viewer_id := public.current_profile_id();
    IF v_viewer_id IS NOT NULL THEN
        SELECT profile_id INTO v_adv_owner_id FROM public.advertiser_profiles WHERE id = p_advertiser_id;
        IF v_viewer_id = v_adv_owner_id OR public.is_staff() THEN
            RETURN jsonb_build_object('success', true, 'recorded', false, 'reason', 'self_or_staff_view_excluded');
        END IF;
    END IF;

    -- 3. Deduplication Check (Window: 1 hour per session key)
    v_clean_key := COALESCE(p_session_dedupe_key, md5(COALESCE(p_advertiser_id::text, '') || p_event_type || CURRENT_DATE::text));
    IF EXISTS (
        SELECT 1 FROM public.discovery_impression_events
        WHERE session_dedupe_key = v_clean_key
          AND created_at > (now() - INTERVAL '1 hour')
    ) THEN
        RETURN jsonb_build_object('success', true, 'recorded', false, 'reason', 'deduplicated');
    END IF;

    -- 4. Insert Impression Event
    INSERT INTO public.discovery_impression_events (
        event_type,
        advertiser_id,
        campaign_id,
        placement,
        city_slug,
        category_slug,
        session_dedupe_key,
        policy_version
    )
    VALUES (
        p_event_type,
        p_advertiser_id,
        p_campaign_id,
        COALESCE(p_placement, 'explore'),
        p_city_slug,
        p_category_slug,
        v_clean_key,
        'v1'
    );

    -- 5. Synchronize daily stats
    IF p_event_type = 'organic_impression' OR p_event_type = 'sponsored_impression' THEN
        INSERT INTO public.advertiser_daily_stats (advertiser_id, date, impressions)
        VALUES (p_advertiser_id, CURRENT_DATE, 1)
        ON CONFLICT (advertiser_id, date) DO UPDATE SET impressions = advertiser_daily_stats.impressions + 1;

        IF p_campaign_id IS NOT NULL THEN
            INSERT INTO public.campaign_daily_stats (campaign_id, date, impressions)
            VALUES (p_campaign_id, CURRENT_DATE, 1)
            ON CONFLICT (campaign_id, date) DO UPDATE SET impressions = campaign_daily_stats.impressions + 1;
        END IF;
    ELSIF p_event_type = 'organic_click' OR p_event_type = 'sponsored_click' THEN
        INSERT INTO public.advertiser_daily_stats (advertiser_id, date, clicks)
        VALUES (p_advertiser_id, CURRENT_DATE, 1)
        ON CONFLICT (advertiser_id, date) DO UPDATE SET clicks = advertiser_daily_stats.clicks + 1;

        IF p_campaign_id IS NOT NULL THEN
            INSERT INTO public.campaign_daily_stats (campaign_id, date, clicks)
            VALUES (p_campaign_id, CURRENT_DATE, 1)
            ON CONFLICT (campaign_id, date) DO UPDATE SET clicks = campaign_daily_stats.clicks + 1;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'recorded', true);
END;
$$;

-- 6. CANONICAL: search_profiles_discovery_v2 (Eligibility Gate, Organic Ranking, Sponsored Slots, Fairness & Staggered Insertion)
CREATE OR REPLACE FUNCTION public.search_profiles_discovery_v2(
    p_query text DEFAULT NULL,
    p_state_code text DEFAULT NULL,
    p_city_slug text DEFAULT NULL,
    p_origin_city_id uuid DEFAULT NULL,
    p_radius_km integer DEFAULT 50,
    p_category_slug text DEFAULT NULL,
    p_verified_only boolean DEFAULT false,
    p_with_video boolean DEFAULT false,
    p_activity_filter text DEFAULT NULL,
    p_sort_by text DEFAULT 'relevance',
    p_limit integer DEFAULT 24,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    advertiser_id uuid,
    slug text,
    stage_name text,
    age integer,
    city_name text,
    city_slug text,
    state_code varchar(2),
    headline text,
    thumbnail_url text,
    verification_status text,
    authenticity_verified boolean,
    activity_label text,
    distance_label text,
    is_sponsored boolean,
    sponsored_placement_name text,
    organic_score numeric,
    rank_position integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_origin_lat numeric;
    v_origin_lon numeric;
    v_city_id uuid;
    v_max_sponsored_slots integer := 4;
BEGIN
    IF p_origin_city_id IS NOT NULL THEN
        SELECT bc.latitude, bc.longitude INTO v_origin_lat, v_origin_lon
        FROM public.brazil_cities bc
        WHERE bc.id = p_origin_city_id;
    END IF;

    IF p_city_slug IS NOT NULL THEN
        SELECT id INTO v_city_id FROM public.brazil_cities WHERE slug = p_city_slug;
    END IF;

    -- Lookup inventory slot limits for context
    SELECT COALESCE(max_slots, 4) INTO v_max_sponsored_slots
    FROM public.commercial_inventory_slots
    WHERE is_active = true
      AND (
          (scope_type = 'city' AND scope_id = v_city_id::text) OR
          (scope_type = 'global')
      )
    ORDER BY CASE WHEN scope_type = 'city' THEN 1 ELSE 2 END
    LIMIT 1;

    RETURN QUERY
    WITH eligible_profiles AS (
        -- 1. STRICT ELIGIBILITY GATE: Filter ineligible profiles upfront
        SELECT 
            ap.id AS adv_id,
            ap.slug AS adv_slug,
            ap.stage_name AS adv_stage_name,
            extract(year from age(ap.birth_date))::integer AS adv_age,
            c.name AS adv_city_name,
            c.slug AS adv_city_slug,
            s.code AS adv_state_code,
            ap.headline AS adv_headline,
            coalesce(am.thumbnail_path, am.storage_path) AS adv_thumbnail_url,
            ap.verification_status AS adv_verification_status,
            COALESCE(ap.authenticity_verified, false) AS adv_authenticity_verified,
            CASE 
                WHEN ap.last_active_at > (now() - INTERVAL '24 hours') THEN 'Ativo hoje'
                WHEN ap.last_active_at > (now() - INTERVAL '3 days') THEN 'Ativo recentemente'
                ELSE 'Ativo esta semana'
            END AS adv_activity_label,
            CASE 
                WHEN v_origin_lat IS NULL OR c.latitude IS NULL THEN 'Região'
                WHEN ap.city_id = p_origin_city_id THEN 'Na sua cidade'
                WHEN public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= 25 THEN 'Até 25 km'
                WHEN public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= 50 THEN 'Até 50 km'
                ELSE 'Região próxima'
            END AS adv_distance_label,
            -- Active Campaign Check (Must match hard location / category constraints)
            EXISTS (
                SELECT 1 FROM public.advertiser_campaigns ac 
                WHERE ac.advertiser_id = ap.id 
                  AND ac.status = 'active' 
                  AND ac.starts_at <= now() 
                  AND ac.ends_at >= now()
            ) AS has_active_campaign,
            COALESCE(rs.organic_score, 50.0) AS adv_organic_score,
            ap.created_at AS adv_created_at,
            ap.last_active_at AS adv_last_active_at
        FROM public.advertiser_profiles ap
        JOIN public.brazil_cities c ON ap.city_id = c.id
        JOIN public.brazil_states s ON ap.state_id = s.id
        LEFT JOIN public.advertiser_ranking_scores rs ON ap.id = rs.advertiser_id
        LEFT JOIN LATERAL (
            SELECT med.storage_path, med.thumbnail_path 
            FROM public.advertiser_media med
            WHERE med.advertiser_id = ap.id AND med.moderation_status = 'approved' AND med.deleted_at IS NULL 
            ORDER BY med.position ASC, med.created_at ASC LIMIT 1
        ) am ON true
        WHERE ap.profile_status = 'active'
          AND ap.visibility = 'public'
          AND ap.deleted_at IS NULL
          -- 2. HARD USER FILTER CONSTRAINTS
          AND (p_state_code IS NULL OR lower(s.code) = lower(p_state_code))
          AND (p_city_slug IS NULL OR c.slug = p_city_slug)
          AND (p_category_slug IS NULL OR EXISTS (
              SELECT 1 FROM public.advertiser_categories ac_cat
              JOIN public.categories cat ON ac_cat.category_id = cat.id
              WHERE ac_cat.advertiser_id = ap.id AND cat.slug = p_category_slug
          ))
          AND (NOT p_verified_only OR ap.verification_status = 'verified')
          AND (NOT p_with_video OR EXISTS (
              SELECT 1 FROM public.advertiser_media v_med
              WHERE v_med.advertiser_id = ap.id AND v_med.media_type = 'video' AND v_med.moderation_status = 'approved' AND v_med.deleted_at IS NULL
          ))
          AND (v_origin_lat IS NULL OR c.latitude IS NULL OR public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= p_radius_km)
          AND (p_activity_filter IS NULL OR (
              CASE 
                  WHEN p_activity_filter = 'active_now' THEN ap.last_active_at > (now() - INTERVAL '2 hours')
                  WHEN p_activity_filter = 'active_today' THEN ap.last_active_at > (now() - INTERVAL '24 hours')
                  WHEN p_activity_filter = 'active_this_week' THEN ap.last_active_at > (now() - INTERVAL '7 days')
                  ELSE true
              END
          ))
          AND (p_query IS NULL OR (
              ap.stage_name ILIKE ('%' || p_query || '%')
              OR ap.headline ILIKE ('%' || p_query || '%')
              OR ap.bio ILIKE ('%' || p_query || '%')
              OR c.name ILIKE ('%' || p_query || '%')
          ))
    ),
    ranked_organic AS (
        SELECT 
            ep.*,
            ROW_NUMBER() OVER (
                ORDER BY 
                    CASE WHEN p_sort_by = 'recent' THEN ep.adv_created_at END DESC,
                    CASE WHEN p_sort_by = 'active' THEN ep.adv_last_active_at END DESC,
                    ep.adv_organic_score DESC,
                    ep.adv_created_at DESC
            ) AS organic_rank
        FROM eligible_profiles ep
    )
    SELECT 
        ro.adv_id AS advertiser_id,
        ro.adv_slug AS slug,
        ro.adv_stage_name AS stage_name,
        ro.adv_age AS age,
        ro.adv_city_name AS city_name,
        ro.adv_city_slug AS city_slug,
        ro.adv_state_code AS state_code,
        ro.adv_headline AS headline,
        ro.adv_thumbnail_url AS thumbnail_url,
        ro.adv_verification_status AS verification_status,
        ro.adv_authenticity_verified AS authenticity_verified,
        ro.adv_activity_label AS activity_label,
        ro.adv_distance_label AS distance_label,
        (ro.has_active_campaign AND ro.organic_rank <= v_max_sponsored_slots) AS is_sponsored,
        CASE WHEN (ro.has_active_campaign AND ro.organic_rank <= v_max_sponsored_slots) THEN 'Patrocinado' ELSE NULL END AS sponsored_placement_name,
        ro.adv_organic_score AS organic_score,
        ro.organic_rank::integer AS rank_position
    FROM ranked_organic ro
    ORDER BY 
        -- Stagger sponsored entries at top positions while preserving organic relevancy below
        CASE WHEN ro.has_active_campaign AND ro.organic_rank <= v_max_sponsored_slots THEN 0 ELSE 1 END ASC,
        ro.organic_rank ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 7. RPC: diagnose_advertiser_ranking (Staff Diagnostic Tool, Section 44 & 51)
CREATE OR REPLACE FUNCTION public.diagnose_advertiser_ranking(
    p_advertiser_id uuid,
    p_city_slug text DEFAULT NULL,
    p_category_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv public.advertiser_profiles%ROWTYPE;
    v_scores public.advertiser_ranking_scores%ROWTYPE;
    v_is_eligible boolean := true;
    v_eligibility_reasons text[] := ARRAY[]::text[];
    v_has_active_campaign boolean := false;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso restrito ao staff de operações.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RETURN jsonb_build_object('found', false, 'error', 'Anunciante não encontrado.');
    END IF;

    -- Check Eligibility Rules
    IF v_adv.profile_status <> 'active' THEN
        v_is_eligible := false;
        v_eligibility_reasons := array_append(v_eligibility_reasons, 'Status do perfil não está ativo (' || v_adv.profile_status || ')');
    END IF;

    IF v_adv.visibility <> 'public' THEN
        v_is_eligible := false;
        v_eligibility_reasons := array_append(v_eligibility_reasons, 'Visibilidade do perfil não é pública');
    END IF;

    IF v_adv.deleted_at IS NOT NULL THEN
        v_is_eligible := false;
        v_eligibility_reasons := array_append(v_eligibility_reasons, 'Perfil arquivado/removido');
    END IF;

    -- Check Active Campaigns
    SELECT EXISTS (
        SELECT 1 FROM public.advertiser_campaigns
        WHERE advertiser_id = p_advertiser_id
          AND status = 'active'
          AND starts_at <= now()
          AND ends_at >= now()
    ) INTO v_has_active_campaign;

    -- Retrieve Component Scores
    SELECT * INTO v_scores FROM public.advertiser_ranking_scores WHERE advertiser_id = p_advertiser_id;

    RETURN jsonb_build_object(
        'found', true,
        'advertiser_id', p_advertiser_id,
        'stage_name', v_adv.stage_name,
        'is_eligible', v_is_eligible,
        'ineligibility_reasons', v_eligibility_reasons,
        'has_active_campaign', v_has_active_campaign,
        'scores', jsonb_build_object(
            'organic_score', COALESCE(v_scores.organic_score, 50.0),
            'completeness_score', COALESCE(v_scores.completeness_score, v_adv.completeness_score, 50.0),
            'verification_score', COALESCE(v_scores.verification_score, 30.0),
            'freshness_score', COALESCE(v_scores.freshness_score, 50.0),
            'quality_score', COALESCE(v_scores.quality_score, 50.0),
            'bayesian_ctr', COALESCE(v_scores.bayesian_ctr, 0.04),
            'new_profile_boost', COALESCE(v_scores.new_profile_boost, 0.0)
        ),
        'policy_version', COALESCE(v_scores.policy_version, 'v1')
    );
END;
$$;

-- 8. Row Level Security Policies
ALTER TABLE public.commercial_inventory_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_impression_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view inventory slots"
    ON public.commercial_inventory_slots FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage inventory slots"
    ON public.commercial_inventory_slots FOR ALL
    USING (public.is_staff())
    WITH CHECK (public.is_staff());

CREATE POLICY "Public can insert discovery impression events"
    ON public.discovery_impression_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Advertisers can view their own discovery events"
    ON public.discovery_impression_events FOR SELECT
    USING (advertiser_id = public.current_profile_id() OR public.is_staff());
