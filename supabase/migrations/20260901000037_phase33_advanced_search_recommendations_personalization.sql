-- ==============================================================================
-- PORTAL18 — PHASE 33 MIGRATION
-- Advanced Search, Recommendations & Privacy-First Personalization
-- ==============================================================================

-- 1. SEARCH SYNONYMS TABLE
CREATE TABLE IF NOT EXISTS public.search_synonyms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    term text NOT NULL,
    synonyms text[] NOT NULL DEFAULT '{}',
    locale varchar(10) NOT NULL DEFAULT 'pt-BR',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_synonyms_term ON public.search_synonyms(lower(term));
CREATE INDEX IF NOT EXISTS idx_search_synonyms_status ON public.search_synonyms(status);
CREATE INDEX IF NOT EXISTS idx_search_synonyms_gin ON public.search_synonyms USING gin(synonyms);

-- Initial seed of baseline search synonyms
INSERT INTO public.search_synonyms (term, synonyms, status)
VALUES
    ('massagem', ARRAY['massagista', 'massagens', 'massoterapia', 'terapia corporal'], 'active'),
    ('acompanhante', ARRAY['acompanhantes', 'atendimento', 'presencial'], 'active'),
    ('privê', ARRAY['prive', 'local proprio', 'apartamento'], 'active'),
    ('trans', ARRAY['travesti', 'transgenero', 'mulher trans'], 'active')
ON CONFLICT DO NOTHING;

-- 2. SAVED SEARCHES TABLE
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    filters jsonb NOT NULL DEFAULT '{}'::jsonb,
    notification_frequency text NOT NULL DEFAULT 'none' CHECK (notification_frequency IN ('none', 'instant', 'daily', 'weekly')),
    last_notified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches(user_id);

-- 3. USER DISCOVERY PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_discovery_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    personalization_enabled boolean NOT NULL DEFAULT true,
    favorite_cities jsonb NOT NULL DEFAULT '[]'::jsonb,
    preferred_categories text[] NOT NULL DEFAULT '{}',
    target_audiences text[] NOT NULL DEFAULT '{}',
    service_modalities text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RECOMMENDATION FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.recommendation_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    feedback_type text NOT NULL CHECK (feedback_type IN ('hide', 'not_interested')),
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, advertiser_id, feedback_type)
);

CREATE INDEX IF NOT EXISTS idx_rec_feedback_user_adv ON public.recommendation_feedback(user_id, advertiser_id);

-- 5. SEARCH QUERY AGGREGATES TABLE (Aggregated Analytics - Zero User PII)
CREATE TABLE IF NOT EXISTS public.search_query_aggregates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized_query text NOT NULL UNIQUE,
    total_searches integer NOT NULL DEFAULT 1,
    zero_results_count integer NOT NULL DEFAULT 0,
    last_searched_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_query_agg_query ON public.search_query_aggregates(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_query_agg_zero ON public.search_query_aggregates(zero_results_count DESC);

-- Enable RLS
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_discovery_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_query_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Synonyms: Public read active, Staff manage all
CREATE POLICY "Public read active synonyms" ON public.search_synonyms
    FOR SELECT USING (status = 'active');

CREATE POLICY "Staff manage synonyms" ON public.search_synonyms
    FOR ALL USING (public.is_staff());

-- Saved Searches: User owns their saved searches
CREATE POLICY "Users manage own saved searches" ON public.saved_searches
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Discovery Preferences: User owns their discovery preferences
CREATE POLICY "Users manage own discovery preferences" ON public.user_discovery_preferences
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Recommendation Feedback: User owns their feedback
CREATE POLICY "Users manage own recommendation feedback" ON public.recommendation_feedback
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Search Query Aggregates: Staff read and system upsert
CREATE POLICY "Staff read search aggregates" ON public.search_query_aggregates
    FOR SELECT USING (public.is_staff());

-- 6. RPC: record_search_query_event (Atomic Aggregated Analytics)
CREATE OR REPLACE FUNCTION public.record_search_query_event(
    p_normalized_query text,
    p_is_zero_result boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_normalized_query IS NULL OR length(trim(p_normalized_query)) < 2 THEN
        RETURN;
    END IF;

    INSERT INTO public.search_query_aggregates (
        normalized_query,
        total_searches,
        zero_results_count,
        last_searched_at
    )
    VALUES (
        trim(lower(p_normalized_query)),
        1,
        CASE WHEN p_is_zero_result THEN 1 ELSE 0 END,
        now()
    )
    ON CONFLICT (normalized_query) DO UPDATE SET
        total_searches = public.search_query_aggregates.total_searches + 1,
        zero_results_count = public.search_query_aggregates.zero_results_count + (CASE WHEN p_is_zero_result THEN 1 ELSE 0 END),
        last_searched_at = now();
END;
$$;

-- 7. RPC: reset_user_personalization
CREATE OR REPLACE FUNCTION public.reset_user_personalization()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    DELETE FROM public.recommendation_feedback WHERE user_id = v_user_id;

    UPDATE public.user_discovery_preferences
    SET favorite_cities = '[]'::jsonb,
        preferred_categories = '{}',
        target_audiences = '{}',
        service_modalities = '{}',
        updated_at = now()
    WHERE user_id = v_user_id;

    RETURN true;
END;
$$;

-- 8. RPC: autocomplete_search_v1 (Multi-Entity Autocomplete)
CREATE OR REPLACE FUNCTION public.autocomplete_search_v1(
    p_query text,
    p_limit integer DEFAULT 8
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_query text := lower(trim(COALESCE(p_query, '')));
    v_cities jsonb := '[]'::jsonb;
    v_categories jsonb := '[]'::jsonb;
    v_advertisers jsonb := '[]'::jsonb;
BEGIN
    IF length(v_clean_query) < 2 THEN
        RETURN jsonb_build_object(
            'cities', '[]'::jsonb,
            'categories', '[]'::jsonb,
            'advertisers', '[]'::jsonb
        );
    END IF;

    -- Match Cities
    SELECT COALESCE(jsonb_agg(c_row), '[]'::jsonb) INTO v_cities
    FROM (
        SELECT
            bc.id,
            bc.name,
            bc.slug,
            bs.code AS state_code,
            bs.slug AS state_slug,
            'city' AS type
        FROM public.brazil_cities bc
        JOIN public.brazil_states bs ON bc.state_id = bs.id
        WHERE lower(bc.name) LIKE (v_clean_query || '%')
           OR lower(bc.name) LIKE ('%' || v_clean_query || '%')
        ORDER BY
            CASE WHEN lower(bc.name) LIKE (v_clean_query || '%') THEN 1 ELSE 2 END,
            bc.population DESC NULLS LAST
        LIMIT p_limit
    ) c_row;

    -- Match Active Categories
    SELECT COALESCE(jsonb_agg(cat_row), '[]'::jsonb) INTO v_categories
    FROM (
        SELECT
            cat.id,
            cat.name,
            cat.slug,
            'category' AS type
        FROM public.categories cat
        WHERE cat.is_active = true
          AND (lower(cat.name) LIKE (v_clean_query || '%') OR lower(cat.name) LIKE ('%' || v_clean_query || '%'))
        ORDER BY cat.display_order ASC
        LIMIT p_limit
    ) cat_row;

    -- Match Stage Names (Only active public profiles)
    SELECT COALESCE(jsonb_agg(adv_row), '[]'::jsonb) INTO v_advertisers
    FROM (
        SELECT
            ap.id,
            ap.stage_name,
            ap.slug,
            bc.name AS city_name,
            bs.code AS state_code,
            'advertiser' AS type
        FROM public.advertiser_profiles ap
        JOIN public.brazil_cities bc ON ap.city_id = bc.id
        JOIN public.brazil_states bs ON ap.state_id = bs.id
        WHERE ap.profile_status = 'active'
          AND ap.visibility = 'public'
          AND ap.deleted_at IS NULL
          AND lower(ap.stage_name) LIKE ('%' || v_clean_query || '%')
        ORDER BY ap.created_at DESC
        LIMIT p_limit
    ) adv_row;

    RETURN jsonb_build_object(
        'cities', v_cities,
        'categories', v_categories,
        'advertisers', v_advertisers
    );
END;
$$;

-- 9. RPC: get_similar_profiles_v2 (Objective Taxonomy & Proximity Similarity)
CREATE OR REPLACE FUNCTION public.get_similar_profiles_v2(
    p_advertiser_id uuid,
    p_viewer_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 6
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
    similarity_reason text,
    organic_score numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_source_city_id uuid;
    v_source_state_id uuid;
    v_source_categories uuid[];
BEGIN
    -- Get source advertiser context
    SELECT ap.city_id, ap.state_id INTO v_source_city_id, v_source_state_id
    FROM public.advertiser_profiles ap
    WHERE ap.id = p_advertiser_id;

    SELECT array_agg(category_id) INTO v_source_categories
    FROM public.advertiser_categories
    WHERE advertiser_id = p_advertiser_id;

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
        ap.verification_status,
        COALESCE(ap.authenticity_verified, false) AS authenticity_verified,
        CASE
            WHEN ap.last_active_at > (now() - INTERVAL '24 hours') THEN 'Ativo hoje'
            WHEN ap.last_active_at > (now() - INTERVAL '3 days') THEN 'Ativo recentemente'
            ELSE 'Ativo esta semana'
        END AS activity_label,
        CASE
            WHEN ap.city_id = v_source_city_id THEN 'Mesma cidade'
            WHEN ap.state_id = v_source_state_id THEN 'Mesmo estado'
            ELSE 'Região próxima'
        END AS distance_label,
        CASE
            WHEN ap.city_id = v_source_city_id THEN 'Na mesma cidade'
            WHEN EXISTS (
                SELECT 1 FROM public.advertiser_categories ac
                WHERE ac.advertiser_id = ap.id AND ac.category_id = ANY(v_source_categories)
            ) THEN 'Categoria semelhante'
            ELSE 'Perfil em destaque'
        END AS similarity_reason,
        COALESCE(rs.organic_score, 75.0) AS organic_score
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
    WHERE ap.id != p_advertiser_id
      AND ap.profile_status = 'active'
      AND ap.visibility = 'public'
      AND ap.deleted_at IS NULL
      -- Exclude blocked or hidden profiles if viewer is provided
      AND (p_viewer_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM public.recommendation_feedback rf
          WHERE rf.user_id = p_viewer_id AND rf.advertiser_id = ap.id
      ))
      AND (p_viewer_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM public.user_blocked_profiles ubp
          WHERE ubp.user_id = p_viewer_id AND ubp.advertiser_id = ap.id
      ))
    ORDER BY
        -- Prioritize same city, then shared category, then organic quality
        CASE WHEN ap.city_id = v_source_city_id THEN 100 ELSE 0 END +
        CASE WHEN EXISTS (
            SELECT 1 FROM public.advertiser_categories ac
            WHERE ac.advertiser_id = ap.id AND ac.category_id = ANY(v_source_categories)
        ) THEN 50 ELSE 0 END +
        COALESCE(rs.organic_score, 75.0) DESC
    LIMIT p_limit;
END;
$$;

-- 10. RPC: search_profiles_discovery_v3 (Enhanced Search & Recommendations with Full Filter Matrix)
CREATE OR REPLACE FUNCTION public.search_profiles_discovery_v3(
    p_query text DEFAULT NULL,
    p_state_code text DEFAULT NULL,
    p_city_slug text DEFAULT NULL,
    p_origin_city_id uuid DEFAULT NULL,
    p_radius_km integer DEFAULT 50,
    p_category_slug text DEFAULT NULL,
    p_gender text DEFAULT NULL,
    p_target_audience text DEFAULT NULL,
    p_service_modality text DEFAULT NULL,
    p_verified_only boolean DEFAULT false,
    p_media_verified boolean DEFAULT false,
    p_with_video boolean DEFAULT false,
    p_with_audio boolean DEFAULT false,
    p_with_reviews boolean DEFAULT false,
    p_recently_updated boolean DEFAULT false,
    p_activity_filter text DEFAULT NULL,
    p_sort_by text DEFAULT 'relevance',
    p_viewer_id uuid DEFAULT NULL,
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
    media_verified boolean,
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
        -- 1. STRICT ELIGIBILITY GATE
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
            EXISTS (
                SELECT 1 FROM public.advertiser_trust_signals ts
                WHERE ts.advertiser_id = ap.id AND ts.signal_type = 'media_verified' AND ts.status = 'active'
            ) AS adv_media_verified,
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
            EXISTS (
                SELECT 1 FROM public.advertiser_campaigns ac
                WHERE ac.advertiser_id = ap.id
                  AND ac.status = 'active'
                  AND ac.starts_at <= now()
                  AND ac.ends_at >= now()
            ) AS has_active_campaign,
            COALESCE(rs.organic_score, 50.0) AS adv_organic_score,
            ap.created_at AS adv_created_at,
            ap.last_active_at AS adv_last_active_at,
            ap.updated_at AS adv_updated_at
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
          -- User Feedback / Block Filter
          AND (p_viewer_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM public.recommendation_feedback rf
              WHERE rf.user_id = p_viewer_id AND rf.advertiser_id = ap.id
          ))
          AND (p_viewer_id IS NULL OR NOT EXISTS (
              SELECT 1 FROM public.user_blocked_profiles ubp
              WHERE ubp.user_id = p_viewer_id AND ubp.advertiser_id = ap.id
          ))
          -- 2. HARD USER FILTER CONSTRAINTS
          AND (p_state_code IS NULL OR lower(s.code) = lower(p_state_code))
          AND (p_city_slug IS NULL OR c.slug = p_city_slug)
          AND (p_category_slug IS NULL OR EXISTS (
              SELECT 1 FROM public.advertiser_categories ac_cat
              JOIN public.categories cat ON ac_cat.category_id = cat.id
              WHERE ac_cat.advertiser_id = ap.id AND cat.slug = p_category_slug
          ))
          AND (p_gender IS NULL OR p_gender = 'todos' OR ap.gender = p_gender)
          AND (p_target_audience IS NULL OR p_target_audience = 'todos' OR EXISTS (
              SELECT 1 FROM public.advertiser_target_audiences ata
              WHERE ata.advertiser_id = ap.id AND ata.target_audience = p_target_audience
          ))
          AND (p_service_modality IS NULL OR EXISTS (
              SELECT 1 FROM public.advertiser_modalities amod
              WHERE amod.advertiser_id = ap.id AND amod.modality = p_service_modality
          ))
          AND (NOT p_verified_only OR ap.verification_status = 'verified')
          AND (NOT p_media_verified OR EXISTS (
              SELECT 1 FROM public.advertiser_trust_signals ts
              WHERE ts.advertiser_id = ap.id AND ts.signal_type = 'media_verified' AND ts.status = 'active'
          ))
          AND (NOT p_with_video OR EXISTS (
              SELECT 1 FROM public.advertiser_media v_med
              WHERE v_med.advertiser_id = ap.id AND v_med.media_type = 'video' AND v_med.moderation_status = 'approved' AND v_med.deleted_at IS NULL
          ))
          AND (NOT p_with_audio OR EXISTS (
              SELECT 1 FROM public.advertiser_media a_med
              WHERE a_med.advertiser_id = ap.id AND a_med.media_type = 'audio' AND a_med.moderation_status = 'approved' AND a_med.deleted_at IS NULL
          ))
          AND (NOT p_with_reviews OR EXISTS (
              SELECT 1 FROM public.advertiser_reviews rev
              WHERE rev.advertiser_id = ap.id AND rev.status = 'approved'
          ))
          AND (NOT p_recently_updated OR ap.updated_at >= (now() - INTERVAL '30 days'))
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
    ),
    ranked_sponsored AS (
        SELECT
            ep.*,
            ROW_NUMBER() OVER (
                ORDER BY ep.adv_organic_score DESC, ep.adv_created_at DESC
            ) AS sponsored_rank
        FROM eligible_profiles ep
        WHERE ep.has_active_campaign = true
    ),
    mixed_results AS (
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
            ro.adv_media_verified AS media_verified,
            ro.adv_activity_label AS activity_label,
            ro.adv_distance_label AS distance_label,
            false AS is_sponsored,
            NULL::text AS sponsored_placement_name,
            ro.adv_organic_score AS organic_score,
            (ro.organic_rank + COALESCE((
                SELECT count(*)::integer FROM ranked_sponsored rs2
                WHERE rs2.sponsored_rank <= v_max_sponsored_slots
                  AND (rs2.sponsored_rank * 3) <= ro.organic_rank
            ), 0))::integer AS final_pos
        FROM ranked_organic ro

        UNION ALL

        SELECT
            rs.adv_id AS advertiser_id,
            rs.adv_slug AS slug,
            rs.adv_stage_name AS stage_name,
            rs.adv_age AS age,
            rs.adv_city_name AS city_name,
            rs.adv_city_slug AS city_slug,
            rs.adv_state_code AS state_code,
            rs.adv_headline AS headline,
            rs.adv_thumbnail_url AS thumbnail_url,
            rs.adv_verification_status AS verification_status,
            rs.adv_authenticity_verified AS authenticity_verified,
            rs.adv_media_verified AS media_verified,
            rs.adv_activity_label AS activity_label,
            rs.adv_distance_label AS distance_label,
            true AS is_sponsored,
            'Destaque Patrocinado'::text AS sponsored_placement_name,
            rs.adv_organic_score AS organic_score,
            ((rs.sponsored_rank - 1) * 3 + 1)::integer AS final_pos
        FROM ranked_sponsored rs
        WHERE rs.sponsored_rank <= v_max_sponsored_slots
    )
    SELECT DISTINCT ON (mr.advertiser_id)
        mr.advertiser_id,
        mr.slug,
        mr.stage_name,
        mr.age,
        mr.city_name,
        mr.city_slug,
        mr.state_code,
        mr.headline,
        mr.thumbnail_url,
        mr.verification_status,
        mr.authenticity_verified,
        mr.media_verified,
        mr.activity_label,
        mr.distance_label,
        mr.is_sponsored,
        mr.sponsored_placement_name,
        mr.organic_score,
        mr.final_pos AS rank_position
    FROM mixed_results mr
    ORDER BY mr.advertiser_id, mr.is_sponsored DESC, mr.final_pos ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
