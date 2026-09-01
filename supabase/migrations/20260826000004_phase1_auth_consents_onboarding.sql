-- ============================================================================
-- MIGRATION 00004: Phase 1 — Consents, Legal Documents, Contacts & Onboarding
-- ============================================================================

-- 1. Legal Documents Table (Versioned platform terms and policies)
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type text NOT NULL CHECK (document_type IN ('terms', 'privacy', 'cookies', 'community_guidelines', 'advertiser_terms')),
    version text NOT NULL,
    title text NOT NULL,
    content_url text,
    active boolean NOT NULL DEFAULT true,
    published_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_legal_documents_type_version UNIQUE (document_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_docs_type_active ON public.legal_documents(document_type, active);

-- 2. Consent Records Table (Formal user consent audit trail)
CREATE TABLE IF NOT EXISTS public.consent_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type text NOT NULL CHECK (consent_type IN ('age_declaration', 'terms', 'privacy', 'marketing_email', 'analytics', 'advertiser_terms')),
    document_id uuid REFERENCES public.legal_documents(id) ON DELETE SET NULL,
    granted boolean NOT NULL DEFAULT true,
    source text NOT NULL DEFAULT 'web',
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_consent_records_profile ON public.consent_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON public.consent_records(consent_type);

-- 3. Advertiser Contacts Table (Public & Private contact channels)
CREATE TABLE IF NOT EXISTS public.advertiser_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    contact_type text NOT NULL CHECK (contact_type IN ('whatsapp', 'telegram', 'phone', 'website')),
    contact_value text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    is_visible boolean NOT NULL DEFAULT true,
    verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_advertiser_contacts_updated_at
    BEFORE UPDATE ON public.advertiser_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_adv_contacts_adv_id ON public.advertiser_contacts(advertiser_id);

-- 4. Extend Advertiser Profiles with Onboarding Tracking
ALTER TABLE public.advertiser_profiles
    ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 5. Helper Function: Available Slug Generator
CREATE OR REPLACE FUNCTION public.generate_available_advertiser_slug(p_base_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_slug text;
    v_candidate text;
    v_counter integer := 1;
    v_exists boolean;
BEGIN
    -- Lowercase and remove accents / invalid chars
    v_clean_slug := lower(regexp_replace(p_base_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_clean_slug := trim(both '-' from v_clean_slug);

    IF v_clean_slug IS NULL OR length(v_clean_slug) < 2 THEN
        v_clean_slug := 'anunciante-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;

    v_candidate := v_clean_slug;

    LOOP
        SELECT EXISTS (
            SELECT 1 FROM public.advertiser_profiles WHERE slug = v_candidate
        ) INTO v_exists;

        IF NOT v_exists THEN
            RETURN v_candidate;
        END IF;

        v_counter := v_counter + 1;
        v_candidate := v_clean_slug || '-' || v_counter;
    END LOOP;
END;
$$;

-- 6. Secure & Idempotent RPC: become_advertiser
CREATE OR REPLACE FUNCTION public.become_advertiser(
    p_terms_accepted boolean,
    p_is_adult boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_auth_uid uuid;
    v_adv_id uuid;
    v_temp_slug text;
    v_doc_id uuid;
    v_already_advertiser boolean := false;
BEGIN
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF NOT p_terms_accepted THEN
        RAISE EXCEPTION 'Você deve aceitar os Termos para Anunciantes.';
    END IF;

    IF NOT p_is_adult THEN
        RAISE EXCEPTION 'Você deve confirmar que tem 18 anos ou mais.';
    END IF;

    -- Retrieve caller's profile
    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id = v_auth_uid;
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de usuário não encontrado.';
    END IF;

    -- Check if advertiser profile already exists (idempotency check)
    SELECT id INTO v_adv_id FROM public.advertiser_profiles WHERE profile_id = v_profile_id;

    IF v_adv_id IS NULL THEN
        -- Generate temporary unique slug
        v_temp_slug := 'anunciante-' || substr(v_profile_id::text, 1, 8);

        -- Insert advertiser profile
        INSERT INTO public.advertiser_profiles (
            profile_id,
            slug,
            stage_name,
            birth_date,
            profile_status,
            verification_status,
            visibility,
            onboarding_step,
            onboarding_completed
        ) VALUES (
            v_profile_id,
            v_temp_slug,
            'Novo Anunciante',
            (CURRENT_DATE - INTERVAL '18 years')::date,
            'draft',
            'not_started',
            'hidden',
            1,
            false
        ) RETURNING id INTO v_adv_id;
    ELSE
        v_already_advertiser := true;
    END IF;

    -- Ensure 'advertiser' role exists in user_roles (idempotent)
    INSERT INTO public.user_roles (profile_id, role)
    VALUES (v_profile_id, 'advertiser')
    ON CONFLICT (profile_id, role) DO NOTHING;

    -- Update account_type to 'advertiser' only if currently 'user'
    UPDATE public.profiles
    SET account_type = 'advertiser'
    WHERE id = v_profile_id AND account_type = 'user';

    -- Retrieve current advertiser_terms document ID if exists
    SELECT id INTO v_doc_id FROM public.legal_documents
    WHERE document_type = 'advertiser_terms' AND active = true
    ORDER BY published_at DESC LIMIT 1;

    -- Record consents
    INSERT INTO public.consent_records (profile_id, consent_type, document_id, granted, source)
    VALUES
        (v_profile_id, 'advertiser_terms', v_doc_id, true, 'become_advertiser_flow'),
        (v_profile_id, 'age_declaration', NULL, true, 'become_advertiser_flow');

    -- Insert Audit Log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        CASE WHEN v_already_advertiser THEN 'advertiser_reconfirmed' ELSE 'advertiser_created' END,
        'advertiser_profiles',
        v_adv_id,
        jsonb_build_object('terms_accepted', true, 'is_adult', true)
    );

    RETURN jsonb_build_object(
        'success', true,
        'advertiser_id', v_adv_id,
        'already_existed', v_already_advertiser
    );
END;
$$;

-- 7. Enable RLS on New Tables
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_contacts ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for legal_documents
CREATE POLICY "legal_documents_select_public"
    ON public.legal_documents FOR SELECT
    TO public
    USING (active = true OR public.is_admin());

CREATE POLICY "legal_documents_admin_manage"
    ON public.legal_documents FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. RLS Policies for consent_records (Strict isolation: own records only)
CREATE POLICY "consent_records_select_own"
    ON public.consent_records FOR SELECT
    TO authenticated
    USING (profile_id = public.current_profile_id() OR public.is_admin());

CREATE POLICY "consent_records_insert_own"
    ON public.consent_records FOR INSERT
    TO authenticated
    WITH CHECK (profile_id = public.current_profile_id());

CREATE POLICY "consent_records_update_own"
    ON public.consent_records FOR UPDATE
    TO authenticated
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- 10. RLS Policies for advertiser_contacts
CREATE POLICY "advertiser_contacts_select"
    ON public.advertiser_contacts FOR SELECT
    TO public
    USING (
        (
            is_visible = true
            AND EXISTS (
                SELECT 1 FROM public.advertiser_profiles ap
                WHERE ap.id = advertiser_contacts.advertiser_id
                AND ap.profile_status = 'approved'
                AND ap.visibility = 'public'
                AND ap.deleted_at IS NULL
            )
        )
        OR public.owns_advertiser(advertiser_id)
        OR public.is_moderator()
    );

CREATE POLICY "advertiser_contacts_insert_own"
    ON public.advertiser_contacts FOR INSERT
    TO authenticated
    WITH CHECK (public.owns_advertiser(advertiser_id));

CREATE POLICY "advertiser_contacts_update_own"
    ON public.advertiser_contacts FOR UPDATE
    TO authenticated
    USING (public.owns_advertiser(advertiser_id))
    WITH CHECK (public.owns_advertiser(advertiser_id));

CREATE POLICY "advertiser_contacts_delete_own"
    ON public.advertiser_contacts FOR DELETE
    TO authenticated
    USING (public.owns_advertiser(advertiser_id) OR public.is_admin());

-- 11. Initial Legal Documents Seed
INSERT INTO public.legal_documents (document_type, version, title, active) VALUES
    ('terms', '1.0', 'Termos de Uso do Portal Nacional 18+', true),
    ('privacy', '1.0', 'Política de Privacidade e Proteção de Dados', true),
    ('advertiser_terms', '1.0', 'Termos de Adesão e Responsabilidade do Anunciante', true),
    ('cookies', '1.0', 'Política de Cookies e Armazenamento Local', true),
    ('community_guidelines', '1.0', 'Diretrizes da Comunidade e Moderação 18+', true)
ON CONFLICT (document_type, version) DO NOTHING;
