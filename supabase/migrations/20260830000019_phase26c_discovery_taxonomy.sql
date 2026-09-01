-- ============================================================================
-- MIGRATION 00019: Phase 26C — Discovery Taxonomy, Inclusive Profile Model & National Navigation
-- ============================================================================

-- 1. Extend Advertiser Profiles with Independent Target Audience & Service Modalities
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS target_audience text[] NOT NULL DEFAULT '{todos}'::text[],
    ADD COLUMN IF NOT EXISTS service_modalities text[] NOT NULL DEFAULT '{local_proprio,hotel_motel}'::text[];

-- 2. Backfill & Normalize Gender/Identity to Canonical Values
UPDATE public.advertiser_profiles
SET gender = 'mulheres'
WHERE gender = 'feminino' OR gender = 'female' OR gender IS NULL;

UPDATE public.advertiser_profiles
SET gender = 'homens'
WHERE gender = 'masculino' OR gender = 'male';

UPDATE public.advertiser_profiles
SET gender = 'travestis_trans'
WHERE gender = 'trans_travesti' OR gender = 'travesti' OR gender = 'trans';

UPDATE public.advertiser_profiles
SET gender = 'nao_binario_outros'
WHERE gender = 'casal_dupla' OR gender = 'non_binary' OR gender = 'outros';

-- 3. Add Performance Indexes for Taxonomy Filters
CREATE INDEX IF NOT EXISTS idx_adv_profiles_gender ON public.advertiser_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_target_aud ON public.advertiser_profiles USING gin (target_audience);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_serv_mod ON public.advertiser_profiles USING gin (service_modalities);

-- 4. Recreate View: public_advertiser_profiles (Adding Taxonomy Dimensions)
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

-- 5. RPC: get_discovery_identity_counts (Returns real aggregation respecting Publication Gate)
CREATE OR REPLACE FUNCTION public.get_discovery_identity_counts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'mulheres', COUNT(*) FILTER (WHERE gender = 'mulheres'),
        'homens', COUNT(*) FILTER (WHERE gender = 'homens'),
        'travestis_trans', COUNT(*) FILTER (WHERE gender = 'travestis_trans'),
        'nao_binario_outros', COUNT(*) FILTER (WHERE gender = 'nao_binario_outros')
    )
    INTO v_result
    FROM public.advertiser_profiles
    WHERE profile_status IN ('approved', 'active')
      AND visibility = 'public'
      AND deleted_at IS NULL;

    RETURN v_result;
END;
$$;

-- 6. RPC: get_regional_discovery_stats (Returns real profile counts per state/region)
CREATE OR REPLACE FUNCTION public.get_regional_discovery_stats()
RETURNS TABLE (
    state_code varchar(2),
    state_name text,
    state_slug text,
    active_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        bs.code AS state_code,
        bs.name AS state_name,
        bs.slug AS state_slug,
        COUNT(ap.id) AS active_count
    FROM public.brazil_states bs
    LEFT JOIN public.advertiser_profiles ap ON ap.state_id = bs.id
        AND ap.profile_status IN ('approved', 'active')
        AND ap.visibility = 'public'
        AND ap.deleted_at IS NULL
    GROUP BY bs.id, bs.code, bs.name, bs.slug
    ORDER BY active_count DESC, bs.name ASC;
END;
$$;
