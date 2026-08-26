-- ============================================================================
-- MIGRATION 00001: Initial Schema for National Adult Portal (18+)
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Common Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Profiles Table (Internal identity linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_type text NOT NULL DEFAULT 'user' CHECK (account_type IN ('user', 'advertiser', 'moderator', 'admin', 'super_admin')),
    display_name text,
    username text UNIQUE,
    avatar_path text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated', 'banned')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. User Roles Table (Strict RBAC isolation)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'advertiser', 'moderator', 'admin', 'super_admin')),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_roles_profile_role UNIQUE (profile_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_profile ON public.user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 5. Brazil Geographic Hierarchy (States & Cities)
CREATE TABLE IF NOT EXISTS public.brazil_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(2) UNIQUE NOT NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.brazil_cities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id uuid NOT NULL REFERENCES public.brazil_states(id) ON DELETE CASCADE,
    ibge_code varchar(7) UNIQUE,
    name text NOT NULL,
    slug text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_brazil_cities_state ON public.brazil_cities(state_id);
CREATE INDEX IF NOT EXISTS idx_brazil_cities_slug ON public.brazil_cities(slug);
CREATE INDEX IF NOT EXISTS idx_brazil_cities_state_slug ON public.brazil_cities(state_id, slug);

-- 6. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 7. Advertiser Profiles Table
CREATE TABLE IF NOT EXISTS public.advertiser_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug text UNIQUE NOT NULL,
    stage_name text NOT NULL,
    headline text,
    bio text,
    birth_date date NOT NULL CHECK (birth_date <= (CURRENT_DATE - INTERVAL '18 years')),
    gender text,
    presentation text,
    state_id uuid REFERENCES public.brazil_states(id) ON DELETE SET NULL,
    city_id uuid REFERENCES public.brazil_cities(id) ON DELETE SET NULL,
    neighborhood text,
    verification_status text NOT NULL DEFAULT 'not_started' CHECK (verification_status IN ('not_started', 'pending', 'processing', 'verified', 'rejected', 'requires_review', 'expired')),
    profile_status text NOT NULL DEFAULT 'draft' CHECK (profile_status IN ('draft', 'pending_review', 'approved', 'rejected', 'suspended')),
    visibility text NOT NULL DEFAULT 'hidden' CHECK (visibility IN ('public', 'unlisted', 'hidden')),
    last_active_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TRIGGER trg_advertiser_profiles_updated_at
    BEFORE UPDATE ON public.advertiser_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_adv_profiles_slug ON public.advertiser_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_state_city ON public.advertiser_profiles(state_id, city_id);
CREATE INDEX IF NOT EXISTS idx_adv_profiles_search ON public.advertiser_profiles(profile_status, visibility) WHERE deleted_at IS NULL;

-- 8. Advertiser Categories Join Table
CREATE TABLE IF NOT EXISTS public.advertiser_categories (
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (advertiser_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_adv_cat_category ON public.advertiser_categories(category_id);

-- 9. Advertiser Media Table
CREATE TABLE IF NOT EXISTS public.advertiser_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
    storage_path text NOT NULL,
    thumbnail_path text,
    position integer NOT NULL DEFAULT 0,
    visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'hidden')),
    moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged', 'blocked')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TRIGGER trg_advertiser_media_updated_at
    BEFORE UPDATE ON public.advertiser_media
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_adv_media_adv_id ON public.advertiser_media(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_adv_media_mod_status ON public.advertiser_media(moderation_status);

-- 10. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_favorites_user_adv UNIQUE (user_profile_id, advertiser_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_adv ON public.favorites(advertiser_id);

-- 11. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_type text NOT NULL CHECK (target_type IN ('advertiser', 'media', 'review', 'user')),
    target_id uuid NOT NULL,
    reason text NOT NULL,
    description text,
    severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected', 'escalated')),
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.reports(severity);

-- 12. Verification Requests Table (KYC Foundation)
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    provider text NOT NULL DEFAULT 'manual',
    provider_reference text,
    status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'pending', 'processing', 'verified', 'rejected', 'requires_review', 'expired')),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_verification_requests_updated_at
    BEFORE UPDATE ON public.verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_verification_adv ON public.verification_requests(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.verification_requests(status);

-- 13. Audit Logs Table (Immutable security trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_hash text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
