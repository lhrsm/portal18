-- ============================================================================
-- MIGRATION 00012: Phase 9 — User Account, Following, History, Lists, Notifications & Personalization
-- ============================================================================

-- 1. Extend notifications with Priority & Deduplication Key
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
    ON public.notifications(profile_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL;

-- 2. Profile Follows Table (Section 10 & 11)
CREATE TABLE IF NOT EXISTS public.profile_follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    notifications_enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_profile_follows UNIQUE (follower_profile_id, advertiser_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_follows_follower ON public.profile_follows(follower_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_follows_advertiser ON public.profile_follows(advertiser_id);

-- 3. Profile View History Table (Section 16 & 17)
CREATE TABLE IF NOT EXISTS public.profile_view_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    first_viewed_at timestamptz NOT NULL DEFAULT now(),
    last_viewed_at timestamptz NOT NULL DEFAULT now(),
    view_count integer NOT NULL DEFAULT 1,
    CONSTRAINT uq_profile_view_history UNIQUE (viewer_profile_id, advertiser_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_view_history_viewer ON public.profile_view_history(viewer_profile_id, last_viewed_at DESC);

-- 4. User Lists & Items Tables (Section 27 & 28)
CREATE TABLE IF NOT EXISTS public.user_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_lists_profile ON public.user_lists(profile_id);

CREATE TABLE IF NOT EXISTS public.user_list_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL REFERENCES public.user_lists(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_list_items UNIQUE (list_id, advertiser_id)
);

CREATE INDEX IF NOT EXISTS idx_user_list_items_list ON public.user_list_items(list_id);

-- 5. User Blocks Table (Section 34)
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_blocks UNIQUE (blocker_profile_id, blocked_advertiser_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_profile_id);

-- 6. User Preferences Table (Section 41)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_city_id uuid REFERENCES public.brazil_cities(id) ON DELETE SET NULL,
    age_min integer DEFAULT 18,
    age_max integer DEFAULT 70,
    verified_only boolean NOT NULL DEFAULT false,
    recently_active_only boolean NOT NULL DEFAULT false,
    personalization_enabled boolean NOT NULL DEFAULT true,
    history_enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. User Preferred Categories Table (Section 42)
CREATE TABLE IF NOT EXISTS public.user_preferred_categories (
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, category_id)
);

-- 8. Notification Preferences Table (Section 63)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel text NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
    category text NOT NULL CHECK (category IN ('transactional', 'security', 'profile_updates', 'platform_news', 'marketing')),
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_notif_prefs UNIQUE (profile_id, channel, category)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_profile ON public.notification_preferences(profile_id);

-- 9. User Hidden Recommendations Table (Section 120)
CREATE TABLE IF NOT EXISTS public.user_hidden_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_hidden_recs UNIQUE (profile_id, advertiser_id)
);

CREATE INDEX IF NOT EXISTS idx_user_hidden_recs_profile ON public.user_hidden_recommendations(profile_id);

-- 10. Notification Jobs Table (Section 105)
CREATE TABLE IF NOT EXISTS public.notification_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    entity_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    cursor integer NOT NULL DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_jobs_status ON public.notification_jobs(status, created_at);

-- 11. RPC: toggle_favorite (Section 129)
CREATE OR REPLACE FUNCTION public.toggle_favorite(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_exists boolean;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.favorites
        WHERE user_profile_id = v_profile_id AND advertiser_id = p_advertiser_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.favorites
        WHERE user_profile_id = v_profile_id AND advertiser_id = p_advertiser_id;
        RETURN jsonb_build_object('success', true, 'is_favorite', false);
    ELSE
        INSERT INTO public.favorites (user_profile_id, advertiser_id)
        VALUES (v_profile_id, p_advertiser_id)
        ON CONFLICT (user_profile_id, advertiser_id) DO NOTHING;
        RETURN jsonb_build_object('success', true, 'is_favorite', true);
    END IF;
END;
$$;

-- 12. RPC: toggle_follow (Section 10 & 129)
CREATE OR REPLACE FUNCTION public.toggle_follow(p_advertiser_id uuid, p_notifications_enabled boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_exists boolean;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profile_follows
        WHERE follower_profile_id = v_profile_id AND advertiser_id = p_advertiser_id
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.profile_follows
        WHERE follower_profile_id = v_profile_id AND advertiser_id = p_advertiser_id;
        RETURN jsonb_build_object('success', true, 'is_following', false);
    ELSE
        INSERT INTO public.profile_follows (follower_profile_id, advertiser_id, notifications_enabled)
        VALUES (v_profile_id, p_advertiser_id, p_notifications_enabled)
        ON CONFLICT (follower_profile_id, advertiser_id)
        DO UPDATE SET notifications_enabled = EXCLUDED.notifications_enabled, updated_at = now();
        RETURN jsonb_build_object('success', true, 'is_following', true);
    END IF;
END;
$$;

-- 13. RPC: record_profile_history (Section 16, 17, 20)
CREATE OR REPLACE FUNCTION public.record_profile_history(p_advertiser_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_history_enabled boolean := true;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        -- Anonymous visit: do not record identified history (Section 25)
        RETURN true;
    END IF;

    -- Check if user opted out of history recording (Section 20)
    SELECT history_enabled INTO v_history_enabled
    FROM public.user_preferences
    WHERE profile_id = v_profile_id;

    IF v_history_enabled = false THEN
        RETURN true;
    END IF;

    INSERT INTO public.profile_view_history (viewer_profile_id, advertiser_id, first_viewed_at, last_viewed_at, view_count)
    VALUES (v_profile_id, p_advertiser_id, now(), now(), 1)
    ON CONFLICT (viewer_profile_id, advertiser_id) DO UPDATE SET
        last_viewed_at = now(),
        view_count = public.profile_view_history.view_count + 1;

    RETURN true;
END;
$$;

-- 14. RPC: get_user_relationship_map (Section 95 & 96)
CREATE OR REPLACE FUNCTION public.get_user_relationship_map(p_advertiser_ids uuid[])
RETURNS TABLE (
    advertiser_id uuid,
    is_favorite boolean,
    is_following boolean,
    is_blocked boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        -- Return all false for anonymous users
        RETURN QUERY
        SELECT
            adv_id,
            false AS is_favorite,
            false AS is_following,
            false AS is_blocked
        FROM unnest(p_advertiser_ids) AS adv_id;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        adv_id,
        EXISTS (SELECT 1 FROM public.favorites f WHERE f.user_profile_id = v_profile_id AND f.advertiser_id = adv_id) AS is_favorite,
        EXISTS (SELECT 1 FROM public.profile_follows pf WHERE pf.follower_profile_id = v_profile_id AND pf.advertiser_id = adv_id) AS is_following,
        EXISTS (SELECT 1 FROM public.user_blocks ub WHERE ub.blocker_profile_id = v_profile_id AND ub.blocked_advertiser_id = adv_id) AS is_blocked
    FROM unnest(p_advertiser_ids) AS adv_id;
END;
$$;

-- 15. RPC: toggle_block_advertiser (Section 34 & 35)
CREATE OR REPLACE FUNCTION public.toggle_block_advertiser(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_is_blocked boolean;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_blocks
        WHERE blocker_profile_id = v_profile_id AND blocked_advertiser_id = p_advertiser_id
    ) INTO v_is_blocked;

    IF v_is_blocked THEN
        DELETE FROM public.user_blocks
        WHERE blocker_profile_id = v_profile_id AND blocked_advertiser_id = p_advertiser_id;
        RETURN jsonb_build_object('success', true, 'is_blocked', false);
    ELSE
        -- Remove from favorites and follows if blocked
        DELETE FROM public.favorites WHERE user_profile_id = v_profile_id AND advertiser_id = p_advertiser_id;
        DELETE FROM public.profile_follows WHERE follower_profile_id = v_profile_id AND advertiser_id = p_advertiser_id;

        INSERT INTO public.user_blocks (blocker_profile_id, blocked_advertiser_id)
        VALUES (v_profile_id, p_advertiser_id)
        ON CONFLICT (blocker_profile_id, blocked_advertiser_id) DO NOTHING;
        RETURN jsonb_build_object('success', true, 'is_blocked', true);
    END IF;
END;
$$;

-- 16. RPC: clear_user_history (Section 21)
CREATE OR REPLACE FUNCTION public.clear_user_history()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    DELETE FROM public.profile_view_history
    WHERE viewer_profile_id = v_profile_id;

    RETURN true;
END;
$$;

-- 17. RPC: reset_personalization (Section 45 & 123)
CREATE OR REPLACE FUNCTION public.reset_personalization()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    DELETE FROM public.user_hidden_recommendations WHERE profile_id = v_profile_id;
    DELETE FROM public.user_preferred_categories WHERE profile_id = v_profile_id;

    UPDATE public.user_preferences
    SET preferred_city_id = NULL,
        age_min = 18,
        age_max = 70,
        verified_only = false,
        recently_active_only = false,
        personalization_enabled = true,
        updated_at = now()
    WHERE profile_id = v_profile_id;

    RETURN true;
END;
$$;

-- 18. RLS Policies for Phase 9 User Privacy
ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferred_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hidden_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

-- profile_follows policies
CREATE POLICY "follows_owner_all" ON public.profile_follows
    FOR ALL TO authenticated
    USING (follower_profile_id = public.current_profile_id())
    WITH CHECK (follower_profile_id = public.current_profile_id());

-- profile_view_history policies
CREATE POLICY "history_owner_all" ON public.profile_view_history
    FOR ALL TO authenticated
    USING (viewer_profile_id = public.current_profile_id())
    WITH CHECK (viewer_profile_id = public.current_profile_id());

-- user_lists policies
CREATE POLICY "lists_owner_all" ON public.user_lists
    FOR ALL TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- user_list_items policies
CREATE POLICY "list_items_owner_all" ON public.user_list_items
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_lists ul
        WHERE ul.id = list_id AND ul.profile_id = public.current_profile_id()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_lists ul
        WHERE ul.id = list_id AND ul.profile_id = public.current_profile_id()
    ));

-- user_blocks policies
CREATE POLICY "blocks_owner_all" ON public.user_blocks
    FOR ALL TO authenticated
    USING (blocker_profile_id = public.current_profile_id())
    WITH CHECK (blocker_profile_id = public.current_profile_id());

-- user_preferences policies
CREATE POLICY "prefs_owner_all" ON public.user_preferences
    FOR ALL TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- user_preferred_categories policies
CREATE POLICY "pref_cats_owner_all" ON public.user_preferred_categories
    FOR ALL TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- notification_preferences policies
CREATE POLICY "notif_prefs_owner_all" ON public.notification_preferences
    FOR ALL TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- user_hidden_recommendations policies
CREATE POLICY "hidden_recs_owner_all" ON public.user_hidden_recommendations
    FOR ALL TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- notification_jobs policies (Admin only)
CREATE POLICY "notif_jobs_admin" ON public.notification_jobs
    FOR ALL TO authenticated
    USING (public.is_admin());
