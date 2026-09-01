-- ============================================================================
-- MIGRATION 00011: Phase 8 — Geolocation, Ranking, Recommendations & Discovery
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- 2. Enums
DO $$ BEGIN
    CREATE TYPE public.location_precision AS ENUM ('city', 'district', 'approximate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.activity_bucket AS ENUM ('active_now', 'recently_active', 'active_today', 'active_this_week', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Extend brazil_cities with Centroid Coordinates & Metadata (Section 6)
ALTER TABLE public.brazil_cities
    ADD COLUMN IF NOT EXISTS latitude numeric(10,6),
    ADD COLUMN IF NOT EXISTS longitude numeric(10,6),
    ADD COLUMN IF NOT EXISTS population integer,
    ADD COLUMN IF NOT EXISTS capital boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS region text;

CREATE INDEX IF NOT EXISTS idx_brazil_cities_coords ON public.brazil_cities(latitude, longitude);

-- Update sample capital coordinates
UPDATE public.brazil_cities SET latitude = -23.550520, longitude = -46.633308, capital = true, region = 'Sudeste' WHERE slug = 'sao-paulo';
UPDATE public.brazil_cities SET latitude = -22.906847, longitude = -43.172896, capital = true, region = 'Sudeste' WHERE slug = 'rio-de-janeiro';
UPDATE public.brazil_cities SET latitude = -19.916681, longitude = -43.934493, capital = true, region = 'Sudeste' WHERE slug = 'belo-horizonte';
UPDATE public.brazil_cities SET latitude = -12.977749, longitude = -38.501630, capital = true, region = 'Nordeste' WHERE slug = 'salvador';
UPDATE public.brazil_cities SET latitude = -15.797515, longitude = -47.891887, capital = true, region = 'Centro-Oeste' WHERE slug = 'brasilia';
UPDATE public.brazil_cities SET latitude = -25.428954, longitude = -49.267137, capital = true, region = 'Sul' WHERE slug = 'curitiba';
UPDATE public.brazil_cities SET latitude = -30.034647, longitude = -51.217659, capital = true, region = 'Sul' WHERE slug = 'porto-alegre';

-- 4. Extend advertiser_profiles with Approximate Geolocation (Section 3 & 4)
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS location_precision public.location_precision NOT NULL DEFAULT 'city',
    ADD COLUMN IF NOT EXISTS approx_latitude numeric(10,6),
    ADD COLUMN IF NOT EXISTS approx_longitude numeric(10,6),
    ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- 5. Advertiser Ranking Scores Table (Section 43 & 44)
CREATE TABLE IF NOT EXISTS public.advertiser_ranking_scores (
    advertiser_id uuid PRIMARY KEY REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    organic_score numeric(5,2) NOT NULL DEFAULT 50.0,
    completeness_score numeric(5,2) NOT NULL DEFAULT 0.0,
    verification_score numeric(5,2) NOT NULL DEFAULT 0.0,
    activity_score numeric(5,2) NOT NULL DEFAULT 0.0,
    freshness_score numeric(5,2) NOT NULL DEFAULT 0.0,
    quality_score numeric(5,2) NOT NULL DEFAULT 0.0,
    engagement_score numeric(5,2) NOT NULL DEFAULT 0.0,
    trust_score numeric(5,2) NOT NULL DEFAULT 0.0,
    calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adv_ranking_score ON public.advertiser_ranking_scores(organic_score DESC);

-- 6. Ranking Weights Table (Section 34 & 98)
CREATE TABLE IF NOT EXISTS public.ranking_weights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    completeness_weight numeric(3,2) NOT NULL DEFAULT 0.20,
    verification_weight numeric(3,2) NOT NULL DEFAULT 0.20,
    activity_weight numeric(3,2) NOT NULL DEFAULT 0.15,
    freshness_weight numeric(3,2) NOT NULL DEFAULT 0.10,
    quality_weight numeric(3,2) NOT NULL DEFAULT 0.15,
    engagement_weight numeric(3,2) NOT NULL DEFAULT 0.10,
    trust_weight numeric(3,2) NOT NULL DEFAULT 0.10,
    exploration_factor numeric(3,2) NOT NULL DEFAULT 0.15,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id)
);

INSERT INTO public.ranking_weights (id, completeness_weight, verification_weight, activity_weight, freshness_weight, quality_weight, engagement_weight, trust_weight, exploration_factor)
VALUES (gen_random_uuid(), 0.20, 0.20, 0.15, 0.10, 0.15, 0.10, 0.10, 0.15)
ON CONFLICT DO NOTHING;

-- 7. Haversine Distance Calculation Function (Section 8)
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
    p_lat1 numeric,
    p_lon1 numeric,
    p_lat2 numeric,
    p_lon2 numeric
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_r numeric := 6371; -- Earth radius in KM
    v_dlat numeric;
    v_dlon numeric;
    v_a numeric;
    v_c numeric;
BEGIN
    IF p_lat1 IS NULL OR p_lon1 IS NULL OR p_lat2 IS NULL OR p_lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    v_dlat := radians(p_lat2 - p_lat1);
    v_dlon := radians(p_lon2 - p_lon1);

    v_a := sin(v_dlat / 2)^2 + cos(radians(p_lat1)) * cos(radians(p_lat2)) * sin(v_dlon / 2)^2;
    v_c := 2 * atan2(sqrt(v_a), sqrt(1 - v_a));

    RETURN round(v_r * v_c, 1);
END;
$$;

-- 8. RPC: recalculate_advertiser_rankings (Section 45 & 46)
CREATE OR REPLACE FUNCTION public.recalculate_advertiser_rankings(p_advertiser_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv record;
    v_weights public.ranking_weights%ROWTYPE;
    v_completeness numeric;
    v_verification numeric;
    v_activity numeric;
    v_freshness numeric;
    v_quality numeric;
    v_trust numeric;
    v_final_organic numeric;
    v_media_count integer;
    v_report_count integer;
    v_days_active integer;
BEGIN
    SELECT * INTO v_weights FROM public.ranking_weights LIMIT 1;
    IF v_weights.id IS NULL THEN
        v_weights.completeness_weight := 0.20;
        v_weights.verification_weight := 0.20;
        v_weights.activity_weight := 0.15;
        v_weights.freshness_weight := 0.10;
        v_weights.quality_weight := 0.15;
        v_weights.engagement_weight := 0.10;
        v_weights.trust_weight := 0.10;
    END IF;

    FOR v_adv IN
        SELECT ap.id, ap.profile_status, ap.visibility, ap.verification_status, ap.last_active_at, ap.created_at, ap.headline, ap.bio
        FROM public.advertiser_profiles ap
        WHERE (p_advertiser_id IS NULL OR ap.id = p_advertiser_id)
          AND ap.deleted_at IS NULL
    LOOP
        -- Exclude suspended / inactive profiles from high ranking (Section 38)
        IF v_adv.profile_status <> 'active' OR v_adv.visibility <> 'public' THEN
            INSERT INTO public.advertiser_ranking_scores (advertiser_id, organic_score, calculated_at)
            VALUES (v_adv.id, 0.0, now())
            ON CONFLICT (advertiser_id) DO UPDATE SET organic_score = 0.0, calculated_at = now();
            CONTINUE;
        END IF;

        -- 1. Completeness Score (0 - 100)
        v_completeness := 50.0;
        IF length(coalesce(v_adv.headline, '')) > 10 THEN v_completeness := v_completeness + 25.0; END IF;
        IF length(coalesce(v_adv.bio, '')) > 30 THEN v_completeness := v_completeness + 25.0; END IF;

        -- 2. Verification Score (0 - 100)
        v_verification := CASE WHEN v_adv.verification_status = 'verified' THEN 100.0 ELSE 20.0 END;

        -- 3. Activity Score (0 - 100) (Section 23 & 28)
        IF v_adv.last_active_at IS NOT NULL AND v_adv.last_active_at > (now() - INTERVAL '24 hours') THEN
            v_activity := 100.0;
        ELSIF v_adv.last_active_at IS NOT NULL AND v_adv.last_active_at > (now() - INTERVAL '3 days') THEN
            v_activity := 75.0;
        ELSIF v_adv.last_active_at IS NOT NULL AND v_adv.last_active_at > (now() - INTERVAL '7 days') THEN
            v_activity := 50.0;
        ELSE
            v_activity := 20.0;
        END IF;

        -- 4. Freshness / Cold-start Boost (0 - 100) (Section 64 & 65)
        v_days_active := extract(day from (now() - v_adv.created_at));
        IF v_days_active <= 7 THEN
            v_freshness := 100.0;
        ELSIF v_days_active <= 30 THEN
            v_freshness := 70.0;
        ELSE
            v_freshness := 40.0;
        END IF;

        -- 5. Quality Score (Approved Media Count) (0 - 100)
        SELECT count(*) INTO v_media_count
        FROM public.advertiser_media
        WHERE advertiser_id = v_adv.id AND moderation_status = 'approved' AND deleted_at IS NULL;
        v_quality := LEAST(100.0, v_media_count * 15.0);

        -- 6. Trust Score (Penalized by confirmed reports) (Section 36 & 37)
        SELECT count(*) INTO v_report_count
        FROM public.reports
        WHERE target_advertiser_id = v_adv.id AND status = 'resolved';
        v_trust := GREATEST(0.0, 100.0 - (v_report_count * 30.0));

        -- Weighted Sum Calculation
        v_final_organic := (v_completeness * v_weights.completeness_weight)
                         + (v_verification * v_weights.verification_weight)
                         + (v_activity * v_weights.activity_weight)
                         + (v_freshness * v_weights.freshness_weight)
                         + (v_quality * v_weights.quality_weight)
                         + (v_trust * v_weights.trust_weight);

        INSERT INTO public.advertiser_ranking_scores (
            advertiser_id,
            organic_score,
            completeness_score,
            verification_score,
            activity_score,
            freshness_score,
            quality_score,
            engagement_score,
            trust_score,
            calculated_at
        )
        VALUES (
            v_adv.id,
            round(v_final_organic, 2),
            round(v_completeness, 2),
            round(v_verification, 2),
            round(v_activity, 2),
            round(v_freshness, 2),
            round(v_quality, 2),
            50.0,
            round(v_trust, 2),
            now()
        )
        ON CONFLICT (advertiser_id) DO UPDATE SET
            organic_score = EXCLUDED.organic_score,
            completeness_score = EXCLUDED.completeness_score,
            verification_score = EXCLUDED.verification_score,
            activity_score = EXCLUDED.activity_score,
            freshness_score = EXCLUDED.freshness_score,
            quality_score = EXCLUDED.quality_score,
            trust_score = EXCLUDED.trust_score,
            calculated_at = now();
    END LOOP;

    RETURN jsonb_build_object('success', true, 'recalculated_at', now());
END;
$$;

-- 9. RPC: get_nearby_cities (Section 20)
CREATE OR REPLACE FUNCTION public.get_nearby_cities(
    p_city_id uuid,
    p_radius_km integer DEFAULT 50
)
RETURNS TABLE (
    city_id uuid,
    city_name text,
    city_slug text,
    state_code varchar(2),
    distance_km numeric,
    distance_label text,
    active_advertisers_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_origin_lat numeric;
    v_origin_lon numeric;
BEGIN
    SELECT latitude, longitude INTO v_origin_lat, v_origin_lon
    FROM public.brazil_cities
    WHERE id = p_city_id;

    IF v_origin_lat IS NULL OR v_origin_lon IS NULL THEN
        -- Return empty if city has no coordinates
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        c.id AS city_id,
        c.name AS city_name,
        c.slug AS city_slug,
        s.code AS state_code,
        public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) AS distance_km,
        CASE
            WHEN c.id = p_city_id THEN 'Na sua cidade'
            WHEN public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= 25 THEN 'Até 25 km'
            ELSE 'Região próxima'
        END AS distance_label,
        count(ap.id) AS active_advertisers_count
    FROM public.brazil_cities c
    JOIN public.brazil_states s ON c.state_id = s.id
    LEFT JOIN public.advertiser_profiles ap ON ap.city_id = c.id AND ap.profile_status = 'active' AND ap.visibility = 'public' AND ap.deleted_at IS NULL
    WHERE c.latitude IS NOT NULL
      AND c.longitude IS NOT NULL
      AND public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= p_radius_km
    GROUP BY c.id, c.name, c.slug, s.code, c.latitude, c.longitude
    ORDER BY distance_km ASC;
END;
$$;

-- 10. RPC: get_similar_profiles (Section 49, 50, 111)
CREATE OR REPLACE FUNCTION public.get_similar_profiles(
    p_advertiser_id uuid,
    p_limit integer DEFAULT 6
)
RETURNS TABLE (
    advertiser_id uuid,
    slug text,
    stage_name text,
    age integer,
    city_name text,
    state_code varchar(2),
    headline text,
    thumbnail_url text,
    verification_status text,
    activity_label text,
    is_sponsored boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_city_id uuid;
BEGIN
    SELECT city_id INTO v_city_id FROM public.advertiser_profiles WHERE id = p_advertiser_id;

    RETURN QUERY
    SELECT
        ap.id AS advertiser_id,
        ap.slug,
        ap.stage_name,
        extract(year from age(ap.birth_date))::integer AS age,
        c.name AS city_name,
        s.code AS state_code,
        ap.headline,
        coalesce(am.thumbnail_path, am.storage_path) AS thumbnail_url,
        ap.verification_status::text,
        CASE
            WHEN ap.last_active_at > (now() - INTERVAL '24 hours') THEN 'Ativo hoje'
            WHEN ap.last_active_at > (now() - INTERVAL '3 days') THEN 'Ativo recentemente'
            ELSE 'Ativo esta semana'
        END AS activity_label,
        EXISTS (
            SELECT 1 FROM public.advertiser_campaigns ac
            WHERE ac.advertiser_id = ap.id AND ac.status = 'active' AND ac.starts_at <= now() AND ac.ends_at >= now()
        ) AS is_sponsored
    FROM public.advertiser_profiles ap
    JOIN public.brazil_cities c ON ap.city_id = c.id
    JOIN public.brazil_states s ON ap.state_id = s.id
    LEFT JOIN public.advertiser_ranking_scores rs ON ap.id = rs.advertiser_id
    LEFT JOIN LATERAL (
        SELECT storage_path, thumbnail_path
        FROM public.advertiser_media
        WHERE advertiser_id = ap.id AND moderation_status = 'approved' AND deleted_at IS NULL
        ORDER BY is_primary DESC, position ASC LIMIT 1
    ) am ON true
    WHERE ap.id <> p_advertiser_id -- Requirement 50: strictly exclude own profile
      AND ap.profile_status = 'active'
      AND ap.visibility = 'public'
      AND ap.deleted_at IS NULL
      AND (v_city_id IS NULL OR ap.city_id = v_city_id)
    ORDER BY rs.organic_score DESC NULLS LAST, ap.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 11. RPC: search_profiles_discovery (Section 9, 11, 12, 71, 77)
CREATE OR REPLACE FUNCTION public.search_profiles_discovery(
    p_query text DEFAULT NULL,
    p_state_code text DEFAULT NULL,
    p_city_slug text DEFAULT NULL,
    p_origin_city_id uuid DEFAULT NULL,
    p_radius_km integer DEFAULT 50,
    p_category_slug text DEFAULT NULL,
    p_verified_only boolean DEFAULT false,
    p_with_video boolean DEFAULT false,
    p_activity_filter text DEFAULT NULL,
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
    activity_label text,
    distance_label text,
    is_sponsored boolean,
    organic_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_origin_lat numeric;
    v_origin_lon numeric;
BEGIN
    IF p_origin_city_id IS NOT NULL THEN
        SELECT latitude, longitude INTO v_origin_lat, v_origin_lon
        FROM public.brazil_cities
        WHERE id = p_origin_city_id;
    END IF;

    RETURN QUERY
    SELECT
        ap.id AS advertiser_id,
        ap.slug,
        ap.stage_name,
        extract(year from age(ap.birth_date))::integer AS age,
        c.name AS city_name,
        c.slug AS city_slug,
        s.code AS state_code,
        ap.headline,
        coalesce(am.thumbnail_path, am.storage_path) AS thumbnail_url,
        ap.verification_status::text,
        CASE
            WHEN ap.last_active_at > (now() - INTERVAL '24 hours') THEN 'Ativo hoje'
            WHEN ap.last_active_at > (now() - INTERVAL '3 days') THEN 'Ativo recentemente'
            ELSE 'Ativo esta semana'
        END AS activity_label,
        CASE
            WHEN v_origin_lat IS NULL OR c.latitude IS NULL THEN 'Região'
            WHEN ap.city_id = p_origin_city_id THEN 'Na sua cidade'
            WHEN public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= 25 THEN 'Até 25 km'
            WHEN public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= 50 THEN 'Até 50 km'
            ELSE 'Região próxima'
        END AS distance_label,
        EXISTS (
            SELECT 1 FROM public.advertiser_campaigns ac
            WHERE ac.advertiser_id = ap.id AND ac.status = 'active' AND ac.starts_at <= now() AND ac.ends_at >= now()
        ) AS is_sponsored,
        coalesce(rs.organic_score, 50.0) AS organic_score
    FROM public.advertiser_profiles ap
    JOIN public.brazil_cities c ON ap.city_id = c.id
    JOIN public.brazil_states s ON ap.state_id = s.id
    LEFT JOIN public.advertiser_ranking_scores rs ON ap.id = rs.advertiser_id
    LEFT JOIN LATERAL (
        SELECT storage_path, thumbnail_path
        FROM public.advertiser_media
        WHERE advertiser_id = ap.id AND moderation_status = 'approved' AND deleted_at IS NULL
        ORDER BY is_primary DESC, position ASC LIMIT 1
    ) am ON true
    WHERE ap.profile_status = 'active'
      AND ap.visibility = 'public'
      AND ap.deleted_at IS NULL
      -- State filter
      AND (p_state_code IS NULL OR lower(s.code) = lower(p_state_code))
      -- City filter
      AND (p_city_slug IS NULL OR c.slug = p_city_slug)
      -- Category filter
      AND (p_category_slug IS NULL OR EXISTS (
          SELECT 1 FROM public.advertiser_categories ac_cat
          JOIN public.categories cat ON ac_cat.category_id = cat.id
          WHERE ac_cat.advertiser_id = ap.id AND cat.slug = p_category_slug
      ))
      -- Verified filter
      AND (NOT p_verified_only OR ap.verification_status = 'verified')
      -- Video filter
      AND (NOT p_with_video OR EXISTS (
          SELECT 1 FROM public.advertiser_media v_med
          WHERE v_med.advertiser_id = ap.id AND v_med.media_type = 'video' AND v_med.moderation_status = 'approved' AND v_med.deleted_at IS NULL
      ))
      -- Distance filter when origin specified
      AND (v_origin_lat IS NULL OR c.latitude IS NULL OR public.calculate_distance_km(v_origin_lat, v_origin_lon, c.latitude, c.longitude) <= p_radius_km)
      -- Text FTS unaccent filter (Section 71 & 73)
      AND (p_query IS NULL OR length(trim(p_query)) = 0 OR (
          unaccent(ap.stage_name) ILIKE '%' || unaccent(trim(p_query)) || '%'
          OR unaccent(coalesce(ap.headline, '')) ILIKE '%' || unaccent(trim(p_query)) || '%'
          OR unaccent(c.name) ILIKE '%' || unaccent(trim(p_query)) || '%'
      ))
    ORDER BY
        is_sponsored DESC,
        organic_score DESC,
        ap.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 12. RLS on new tables
ALTER TABLE public.advertiser_ranking_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranking_scores_public_select"
    ON public.advertiser_ranking_scores FOR SELECT
    TO public
    USING (true);

CREATE POLICY "ranking_weights_admin_manage"
    ON public.ranking_weights FOR ALL
    TO authenticated
    USING (public.is_admin());
