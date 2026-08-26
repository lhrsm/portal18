-- ============================================================================
-- MIGRATION 00005: Phase 2 — Public Discovery, Secure View, SEO & Analytics
-- ============================================================================

-- 1. Contact Events Analytics Table (Tracks outbound clicks to WhatsApp/Telegram)
CREATE TABLE IF NOT EXISTS public.profile_contact_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    contact_type text NOT NULL CHECK (contact_type IN ('whatsapp', 'telegram', 'phone', 'website')),
    viewer_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_events_adv ON public.profile_contact_events(advertiser_id, created_at);

-- 2. Daily Aggregated Statistics Table (High performance non-blocking analytics)
CREATE TABLE IF NOT EXISTS public.advertiser_daily_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    views integer NOT NULL DEFAULT 0,
    contact_clicks integer NOT NULL DEFAULT 0,
    favorites_added integer NOT NULL DEFAULT 0,
    CONSTRAINT uq_adv_daily_stats UNIQUE (advertiser_id, date)
);

CREATE INDEX IF NOT EXISTS idx_adv_daily_stats_adv_date ON public.advertiser_daily_stats(advertiser_id, date);

-- 3. Trigger Function: Auto Severity for Reports (Enforces 'critical' on 'suspected_minor')
CREATE OR REPLACE FUNCTION public.enforce_report_severity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.reason = 'suspected_minor' THEN
        NEW.severity := 'critical';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_severity_check ON public.reports;
CREATE TRIGGER trg_report_severity_check
    BEFORE INSERT OR UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_report_severity();

-- 4. Non-blocking RPC: increment_profile_view
CREATE OR REPLACE FUNCTION public.increment_profile_view(p_advertiser_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.advertiser_daily_stats (advertiser_id, date, views)
    VALUES (p_advertiser_id, CURRENT_DATE, 1)
    ON CONFLICT (advertiser_id, date)
    DO UPDATE SET views = public.advertiser_daily_stats.views + 1;
END;
$$;

-- 5. Non-blocking RPC: increment_contact_click
CREATE OR REPLACE FUNCTION public.increment_contact_click(
    p_advertiser_id uuid,
    p_contact_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_viewer_profile_id uuid;
BEGIN
    v_viewer_profile_id := public.current_profile_id();

    -- Insert granular event log
    INSERT INTO public.profile_contact_events (
        advertiser_id,
        contact_type,
        viewer_profile_id
    ) VALUES (
        p_advertiser_id,
        p_contact_type,
        v_viewer_profile_id
    );

    -- Update aggregated stats
    INSERT INTO public.advertiser_daily_stats (advertiser_id, date, contact_clicks)
    VALUES (p_advertiser_id, CURRENT_DATE, 1)
    ON CONFLICT (advertiser_id, date)
    DO UPDATE SET contact_clicks = public.advertiser_daily_stats.contact_clicks + 1;
END;
$$;

-- 6. Performance Indexes (Section 67)
CREATE INDEX IF NOT EXISTS idx_adv_profiles_status_vis ON public.advertiser_profiles(profile_status, visibility);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_city_id ON public.advertiser_profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_state_id ON public.advertiser_profiles(state_id);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_last_active ON public.advertiser_profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_adv_cat_cat_adv ON public.advertiser_categories(category_id, advertiser_id);
CREATE INDEX IF NOT EXISTS idx_adv_media_adv_mod_pos ON public.advertiser_media(advertiser_id, moderation_status, position);
CREATE INDEX IF NOT EXISTS idx_fav_user_adv ON public.favorites(user_profile_id, advertiser_id);
CREATE INDEX IF NOT EXISTS idx_brazil_cities_state_name ON public.brazil_cities(state_id, name);

-- 7. Secure Public View: public_advertiser_profiles (Section 4 & 5)
-- NEVER exposes birth_date, e-mail, auth_user_id or private data
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

-- 8. Enable RLS on New Tables
ALTER TABLE public.profile_contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_daily_stats ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for profile_contact_events
CREATE POLICY "profile_contact_events_select"
    ON public.profile_contact_events FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

CREATE POLICY "profile_contact_events_insert"
    ON public.profile_contact_events FOR INSERT
    TO public
    WITH CHECK (true);

-- 10. RLS Policies for advertiser_daily_stats
CREATE POLICY "advertiser_daily_stats_select"
    ON public.advertiser_daily_stats FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

CREATE POLICY "advertiser_daily_stats_modify"
    ON public.advertiser_daily_stats FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
