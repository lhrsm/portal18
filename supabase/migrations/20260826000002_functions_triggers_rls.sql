-- ============================================================================
-- MIGRATION 00002: Security Functions, Triggers, and Row Level Security (RLS)
-- ============================================================================

-- 1. Helper Security Functions (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_has_role boolean;
BEGIN
    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id = auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE profile_id = v_profile_id AND role = role_name
    ) INTO v_has_role;

    RETURN v_has_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_is_adm boolean;
BEGIN
    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id = auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE profile_id = v_profile_id AND role IN ('admin', 'super_admin')
    ) INTO v_is_adm;

    RETURN v_is_adm;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_is_mod boolean;
BEGIN
    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id = auth.uid();
    IF v_profile_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE profile_id = v_profile_id AND role IN ('moderator', 'admin', 'super_admin')
    ) INTO v_is_mod;

    RETURN v_is_mod;
END;
$$;

CREATE OR REPLACE FUNCTION public.owns_advertiser(target_advertiser_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.advertiser_profiles
        WHERE id = target_advertiser_id AND profile_id = public.current_profile_id()
    );
$$;

-- 2. Automatic Profile & Role Creation on auth.users Insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_display_name text;
BEGIN
    -- Extract display name if provided, or default from email
    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );

    -- Create profile strictly as basic 'user' account_type (ignoring any untrusted client metadata role)
    INSERT INTO public.profiles (
        auth_user_id,
        account_type,
        display_name,
        username,
        status
    ) VALUES (
        NEW.id,
        'user',
        v_display_name,
        NULL,
        'active'
    ) RETURNING id INTO v_profile_id;

    -- Assign basic 'user' role
    INSERT INTO public.user_roles (
        profile_id,
        role
    ) VALUES (
        v_profile_id,
        'user'
    );

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Privilege Escalation & Field Protection Triggers
CREATE OR REPLACE FUNCTION public.protect_profile_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is NOT admin, prevent modification of account_type, status, or auth_user_id
    IF NOT public.is_admin() THEN
        IF NEW.account_type <> OLD.account_type THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar o account_type do perfil.';
        END IF;
        IF NEW.status <> OLD.status THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar o status de moderação do perfil.';
        END IF;
        IF NEW.auth_user_id <> OLD.auth_user_id THEN
            RAISE EXCEPTION 'O auth_user_id não pode ser alterado.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_profile_modifications
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_modifications();

CREATE OR REPLACE FUNCTION public.protect_media_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is NOT admin or moderator, moderation_status MUST be 'pending' on insert/update
    IF NOT public.is_moderator() THEN
        IF TG_OP = 'INSERT' THEN
            NEW.moderation_status := 'pending';
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.moderation_status <> OLD.moderation_status AND NEW.moderation_status = 'approved' THEN
                RAISE EXCEPTION 'Anunciantes não podem auto-aprovar suas mídias.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_media_moderation
    BEFORE INSERT OR UPDATE ON public.advertiser_media
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_media_moderation();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES — DENY BY DEFAULT
-- ============================================================================

-- Enable RLS on all domain tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brazil_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brazil_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_select_public"
    ON public.profiles FOR SELECT
    TO anon
    USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- USER_ROLES POLICIES (Only Admins can insert/update/delete; Users can view own)
-- ----------------------------------------------------------------------------
CREATE POLICY "user_roles_select_own_or_admin"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "user_roles_admin_all"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- GEOGRAPHY & CATEGORIES POLICIES (Public read, admin write)
-- ----------------------------------------------------------------------------
CREATE POLICY "brazil_states_select_public"
    ON public.brazil_states FOR SELECT
    TO public
    USING (true);

CREATE POLICY "brazil_states_admin_manage"
    ON public.brazil_states FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "brazil_cities_select_public"
    ON public.brazil_cities FOR SELECT
    TO public
    USING (true);

CREATE POLICY "brazil_cities_admin_manage"
    ON public.brazil_cities FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "categories_select_public"
    ON public.categories FOR SELECT
    TO public
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "categories_admin_manage"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- ADVERTISER PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "advertiser_profiles_select_public"
    ON public.advertiser_profiles FOR SELECT
    TO public
    USING (
        (profile_status = 'approved' AND visibility = 'public' AND deleted_at IS NULL)
        OR profile_id = public.current_profile_id()
        OR public.is_moderator()
    );

CREATE POLICY "advertiser_profiles_insert_own"
    ON public.advertiser_profiles FOR INSERT
    TO authenticated
    WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "advertiser_profiles_update_own"
    ON public.advertiser_profiles FOR UPDATE
    TO authenticated
    USING (profile_id = public.current_profile_id() OR public.is_admin())
    WITH CHECK (profile_id = public.current_profile_id() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- ADVERTISER CATEGORIES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "advertiser_categories_select_public"
    ON public.advertiser_categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "advertiser_categories_manage_own"
    ON public.advertiser_categories FOR ALL
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin())
    WITH CHECK (public.owns_advertiser(advertiser_id) OR public.is_admin());

-- ----------------------------------------------------------------------------
-- ADVERTISER MEDIA POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "advertiser_media_select"
    ON public.advertiser_media FOR SELECT
    TO public
    USING (
        (
            moderation_status = 'approved'
            AND visibility = 'public'
            AND deleted_at IS NULL
            AND EXISTS (
                SELECT 1 FROM public.advertiser_profiles ap
                WHERE ap.id = advertiser_media.advertiser_id
                AND ap.profile_status = 'approved'
                AND ap.visibility = 'public'
                AND ap.deleted_at IS NULL
            )
        )
        OR public.owns_advertiser(advertiser_id)
        OR public.is_moderator()
    );

CREATE POLICY "advertiser_media_insert_own"
    ON public.advertiser_media FOR INSERT
    TO authenticated
    WITH CHECK (public.owns_advertiser(advertiser_id));

CREATE POLICY "advertiser_media_update_own"
    ON public.advertiser_media FOR UPDATE
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_moderator())
    WITH CHECK (public.owns_advertiser(advertiser_id) OR public.is_moderator());

CREATE POLICY "advertiser_media_delete_own"
    ON public.advertiser_media FOR DELETE
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

-- ----------------------------------------------------------------------------
-- FAVORITES POLICIES (Cross-user isolated)
-- ----------------------------------------------------------------------------
CREATE POLICY "favorites_select_own"
    ON public.favorites FOR SELECT
    TO authenticated
    USING (user_profile_id = public.current_profile_id());

CREATE POLICY "favorites_insert_own"
    ON public.favorites FOR INSERT
    TO authenticated
    WITH CHECK (user_profile_id = public.current_profile_id());

CREATE POLICY "favorites_delete_own"
    ON public.favorites FOR DELETE
    TO authenticated
    USING (user_profile_id = public.current_profile_id());

-- ----------------------------------------------------------------------------
-- REPORTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "reports_insert_authenticated"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (reporter_profile_id = public.current_profile_id());

CREATE POLICY "reports_select_own_or_moderator"
    ON public.reports FOR SELECT
    TO authenticated
    USING (reporter_profile_id = public.current_profile_id() OR public.is_moderator());

CREATE POLICY "reports_update_moderator"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

-- ----------------------------------------------------------------------------
-- VERIFICATION REQUESTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "verification_requests_select"
    ON public.verification_requests FOR SELECT
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_moderator());

CREATE POLICY "verification_requests_insert_own"
    ON public.verification_requests FOR INSERT
    TO authenticated
    WITH CHECK (public.owns_advertiser(advertiser_id));

CREATE POLICY "verification_requests_update_moderator"
    ON public.verification_requests FOR UPDATE
    TO authenticated
    USING (public.is_moderator())
    WITH CHECK (public.is_moderator());

-- ----------------------------------------------------------------------------
-- AUDIT LOGS POLICIES (Immutable: insert allowed, select admin-only, NO update/delete)
-- ----------------------------------------------------------------------------
CREATE POLICY "audit_logs_select_admin"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "audit_logs_insert_system"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
