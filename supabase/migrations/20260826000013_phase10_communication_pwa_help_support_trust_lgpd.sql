-- ============================================================================
-- MIGRATION 00013: Phase 10 — Communication Architecture, Emails, Push, PWA, Help Center, Support, Trust Center & LGPD Data Lifecycle
-- ============================================================================

-- 1. Communication Jobs Table (Section 6 & 7)
CREATE TABLE IF NOT EXISTS public.communication_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel text NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
    category text NOT NULL CHECK (category IN ('security', 'transactional', 'account', 'verification', 'billing', 'profile', 'moderation', 'platform', 'marketing')),
    template_code text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'dead_letter')),
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    scheduled_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    failed_at timestamptz,
    error_message text,
    dedupe_key text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_jobs_status_scheduled ON public.communication_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_comm_jobs_profile ON public.communication_jobs(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_jobs_dedupe ON public.communication_jobs(dedupe_key) WHERE dedupe_key IS NOT NULL;

-- 2. Communication Templates Table (Section 17)
CREATE TABLE IF NOT EXISTS public.communication_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL,
    channel text NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
    locale text NOT NULL DEFAULT 'pt-BR',
    subject text NOT NULL,
    content_html text NOT NULL,
    content_text text NOT NULL,
    version integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_comm_templates UNIQUE (code, channel, locale, version)
);

CREATE INDEX IF NOT EXISTS idx_comm_templates_lookup ON public.communication_templates(code, channel, locale, status);

-- 3. Communication Delivery Events Table (Section 23)
CREATE TABLE IF NOT EXISTS public.communication_delivery_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES public.communication_jobs(id) ON DELETE CASCADE,
    provider text NOT NULL,
    provider_reference text,
    event_type text NOT NULL CHECK (event_type IN ('delivered', 'bounced', 'complained', 'deferred', 'opened', 'clicked')),
    occurred_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_delivery_events_job ON public.communication_delivery_events(job_id);

-- 4. Push Subscriptions Table (Section 30)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent_hash text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    CONSTRAINT uq_push_subscriptions_endpoint UNIQUE (profile_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_profile ON public.push_subscriptions(profile_id);

-- 5. Help Center Categories & Articles (Section 44)
CREATE TABLE IF NOT EXISTS public.help_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    icon text,
    sort_order integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_categories_slug ON public.help_categories(slug);

CREATE TABLE IF NOT EXISTS public.help_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
    title text NOT NULL,
    slug text UNIQUE NOT NULL,
    summary text,
    content text NOT NULL,
    status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    sort_order integer NOT NULL DEFAULT 0,
    helpful_count integer NOT NULL DEFAULT 0,
    unhelpful_count integer NOT NULL DEFAULT 0,
    published_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON public.help_articles(category_id, status);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON public.help_articles(slug);

-- 6. Support Tickets & Ticket Messages (Section 52 & 56)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category text NOT NULL CHECK (category IN ('account', 'security', 'verification', 'profile', 'media', 'billing', 'technical', 'privacy', 'report', 'other')),
    subject text NOT NULL,
    description text NOT NULL,
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_profile ON public.support_tickets(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_admin ON public.support_tickets(status, priority, created_at DESC);

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_type text NOT NULL CHECK (author_type IN ('user', 'staff', 'system')),
    message text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_ticket_messages(ticket_id, created_at ASC);

-- 7. Data Export Requests Table (Section 80)
CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'ready', 'failed', 'expired')),
    requested_at timestamptz NOT NULL DEFAULT now(),
    processing_started_at timestamptz,
    completed_at timestamptz,
    expires_at timestamptz,
    storage_path text,
    file_size_bytes bigint,
    download_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_export_profile ON public.data_export_requests(profile_id, status);

-- 8. Account Deletion Requests Table (Section 94)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'cancelled', 'processing', 'completed', 'failed', 'blocked')),
    requested_at timestamptz NOT NULL DEFAULT now(),
    scheduled_for timestamptz NOT NULL,
    cancelled_at timestamptz,
    executed_at timestamptz,
    reason_optional text,
    blocked_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_deletion_profile ON public.account_deletion_requests(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_scheduled ON public.account_deletion_requests(status, scheduled_for);

-- 9. Legal Holds Table (Section 121)
CREATE TABLE IF NOT EXISTS public.legal_holds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL CHECK (entity_type IN ('profile', 'advertiser', 'payment', 'media', 'ticket')),
    entity_id uuid NOT NULL,
    reason text NOT NULL,
    created_by uuid NOT NULL REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    released_at timestamptz,
    released_by uuid REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_legal_holds_entity ON public.legal_holds(entity_type, entity_id);

-- 10. Data Retention Policies Table (Section 118 & 119)
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key text UNIQUE NOT NULL,
    retention_days integer NOT NULL,
    description text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default retention policies
INSERT INTO public.data_retention_policies (policy_key, retention_days, description)
VALUES 
    ('profile_history_days', 180, 'Histórico de visualização privada de perfis'),
    ('notification_days', 180, 'Histórico de notificações lidas do usuário'),
    ('deleted_media_grace_days', 30, 'Retenção temporária de mídias excluídas'),
    ('data_export_days', 7, 'Validade de link e pacote de exportação LGPD'),
    ('audit_days', 1825, 'Guarda de registros e logs legais (5 anos)'),
    ('support_ticket_days', 730, 'Guarda de tickets e atendimentos concluídos (2 anos)')
ON CONFLICT (policy_key) DO NOTHING;

-- 11. RPC: request_data_export (Section 79 & 89)
CREATE OR REPLACE FUNCTION public.request_data_export()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_existing_id uuid;
    v_new_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    -- Check if active export already exists (rate limit: 1 active export)
    SELECT id INTO v_existing_id
    FROM public.data_export_requests
    WHERE profile_id = v_profile_id 
      AND status IN ('requested', 'processing', 'ready')
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'export_id', v_existing_id, 'status', 'existing');
    END IF;

    INSERT INTO public.data_export_requests (profile_id, status, requested_at, expires_at)
    VALUES (v_profile_id, 'requested', now(), now() + interval '7 days')
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'export_id', v_new_id, 'status', 'requested');
END;
$$;

-- 12. RPC: request_account_deletion (Section 92 & 96)
CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_existing_id uuid;
    v_new_id uuid;
    v_has_hold boolean;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    -- Check if entity has legal hold
    SELECT EXISTS (
        SELECT 1 FROM public.legal_holds 
        WHERE (entity_type = 'profile' AND entity_id = v_profile_id)
           OR (entity_type = 'advertiser' AND entity_id IN (SELECT id FROM public.advertiser_profiles WHERE profile_id = v_profile_id))
    ) INTO v_has_hold;

    IF v_has_hold THEN
        RETURN jsonb_build_object('success', false, 'status', 'blocked', 'error', 'A exclusão da conta está temporariamente retida por obrigação legal/regulatória.');
    END IF;

    -- Check existing active request
    SELECT id INTO v_existing_id
    FROM public.account_deletion_requests
    WHERE profile_id = v_profile_id AND status IN ('requested', 'scheduled');

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'deletion_id', v_existing_id, 'status', 'scheduled');
    END IF;

    INSERT INTO public.account_deletion_requests (profile_id, status, requested_at, scheduled_for, reason_optional)
    VALUES (v_profile_id, 'scheduled', now(), now() + interval '7 days', p_reason)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'deletion_id', v_new_id, 'status', 'scheduled', 'scheduled_for', now() + interval '7 days');
END;
$$;

-- 13. RPC: cancel_account_deletion (Section 97)
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS jsonb
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

    UPDATE public.account_deletion_requests
    SET status = 'cancelled', cancelled_at = now(), updated_at = now()
    WHERE profile_id = v_profile_id AND status IN ('requested', 'scheduled');

    RETURN jsonb_build_object('success', true, 'message', 'Solicitação de exclusão cancelada com sucesso.');
END;
$$;

-- 14. RLS Policies
ALTER TABLE public.communication_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- communication_jobs (Admin only for queue management)
CREATE POLICY "comm_jobs_admin" ON public.communication_jobs FOR ALL TO authenticated USING (public.is_admin());

-- communication_templates (Public read active, Admin write)
CREATE POLICY "comm_templates_select" ON public.communication_templates FOR SELECT TO public USING (status = 'active' OR public.is_admin());
CREATE POLICY "comm_templates_admin" ON public.communication_templates FOR ALL TO authenticated USING (public.is_admin());

-- push_subscriptions (Owner full access)
CREATE POLICY "push_owner_all" ON public.push_subscriptions FOR ALL TO authenticated 
    USING (profile_id = public.current_profile_id())
    WITH CHECK (profile_id = public.current_profile_id());

-- help_categories & articles (Public read published)
CREATE POLICY "help_cats_read" ON public.help_categories FOR SELECT TO public USING (status = 'active' OR public.is_admin());
CREATE POLICY "help_cats_admin" ON public.help_categories FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "help_arts_read" ON public.help_articles FOR SELECT TO public USING (status = 'published' OR public.is_admin());
CREATE POLICY "help_arts_admin" ON public.help_articles FOR ALL TO authenticated USING (public.is_admin());

-- support_tickets & messages (Owner read/insert, Staff manage)
CREATE POLICY "tickets_owner_select" ON public.support_tickets FOR SELECT TO authenticated USING (profile_id = public.current_profile_id() OR public.is_staff());
CREATE POLICY "tickets_owner_insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "tickets_staff_all" ON public.support_tickets FOR ALL TO authenticated USING (public.is_staff());

CREATE POLICY "messages_ticket_select" ON public.support_ticket_messages FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND (st.profile_id = public.current_profile_id() OR public.is_staff())));
CREATE POLICY "messages_ticket_insert" ON public.support_ticket_messages FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND (st.profile_id = public.current_profile_id() OR public.is_staff())));

-- data_export_requests (Owner read/insert)
CREATE POLICY "data_export_owner_select" ON public.data_export_requests FOR SELECT TO authenticated USING (profile_id = public.current_profile_id());
CREATE POLICY "data_export_owner_insert" ON public.data_export_requests FOR INSERT TO authenticated WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "data_export_admin" ON public.data_export_requests FOR ALL TO authenticated USING (public.is_admin());

-- account_deletion_requests (Owner read/insert)
CREATE POLICY "account_del_owner_select" ON public.account_deletion_requests FOR SELECT TO authenticated USING (profile_id = public.current_profile_id());
CREATE POLICY "account_del_owner_insert" ON public.account_deletion_requests FOR INSERT TO authenticated WITH CHECK (profile_id = public.current_profile_id());
CREATE POLICY "account_del_admin" ON public.account_deletion_requests FOR ALL TO authenticated USING (public.is_admin());

-- legal_holds & retention policies (Admin only)
CREATE POLICY "legal_holds_admin" ON public.legal_holds FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "retention_admin" ON public.data_retention_policies FOR ALL TO authenticated USING (public.is_admin());
