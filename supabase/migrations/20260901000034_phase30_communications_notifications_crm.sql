-- ============================================================================
-- MIGRATION 00034: Phase 30 — Communications, Notifications & CRM Operations
-- ============================================================================

-- 1. Create Notification Events Table (Canonical Domain Event)
CREATE TABLE IF NOT EXISTS public.notification_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    recipient_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_role text NOT NULL DEFAULT 'user'
        CHECK (recipient_role IN ('user', 'advertiser', 'admin', 'moderator', 'support')),
    subject_type text NOT NULL,
    subject_id text NOT NULL,
    priority text NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    category text NOT NULL
        CHECK (category IN ('security', 'account', 'moderation', 'trust_safety', 'billing', 'subscription', 'referral', 'review', 'support', 'system', 'marketing')),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    dedupe_key text,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'suppressed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notif_events_recipient ON public.notification_events(recipient_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_notif_events_category ON public.notification_events(category, priority);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notif_event_dedupe ON public.notification_events(recipient_profile_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

-- 2. Create Notification Deliveries Table (Multi-Channel Delivery Queue)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.notification_events(id) ON DELETE CASCADE,
    channel text NOT NULL
        CHECK (channel IN ('in_app', 'email', 'push', 'sms', 'whatsapp')),
    provider text NOT NULL DEFAULT 'internal_mock',
    status text NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'sent', 'delivered', 'failed', 'retry_scheduled', 'suppressed', 'expired')),
    attempt_count integer NOT NULL DEFAULT 1,
    provider_reference text,
    failure_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notif_deliveries_event ON public.notification_deliveries(event_id);
CREATE INDEX IF NOT EXISTS idx_notif_deliveries_status ON public.notification_deliveries(status, channel);

-- 3. Create Notification Templates Table (Versioned, Sanitized Templates)
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key text NOT NULL,
    channel text NOT NULL
        CHECK (channel IN ('in_app', 'email', 'push')),
    locale text NOT NULL DEFAULT 'pt-BR',
    subject text NOT NULL,
    body_template text NOT NULL,
    version integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('draft', 'active', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_template_key_channel_ver UNIQUE(template_key, channel, version)
);

CREATE INDEX IF NOT EXISTS idx_notif_templates_lookup ON public.notification_templates(template_key, channel, status);

-- 4. Create Communication Campaigns Table (CRM & Lifecycle Journeys)
CREATE TABLE IF NOT EXISTS public.communication_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    campaign_type text NOT NULL
        CHECK (campaign_type IN ('institutional', 'marketing', 'advertiser_education', 'consumer_discovery')),
    channel text NOT NULL
        CHECK (channel IN ('in_app', 'email', 'push')),
    template_key text NOT NULL,
    audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status ON public.communication_campaigns(status);

-- 5. Seed Core Notification Templates
INSERT INTO public.notification_templates (template_key, channel, locale, subject, body_template, version, status)
VALUES
    ('security_alert', 'in_app', 'pt-BR', 'Alerta de Segurança', 'Detectamos uma nova atividade na sua conta: {{activity_description}}.', 1, 'active'),
    ('security_alert', 'email', 'pt-BR', 'Portal18: Alerta de Segurança na Conta', '<p>Olá <strong>{{display_name}}</strong>,</p><p>Detectamos uma nova atividade de segurança: {{activity_description}}.</p><p>Se não foi você, acerte suas credenciais imediatamente.</p>', 1, 'active'),
    ('security_alert', 'push', 'pt-BR', 'Portal18', 'Alerta de segurança na sua conta.', 1, 'active'),
    ('profile_approved', 'in_app', 'pt-BR', 'Perfil Aprovado!', 'Parabéns! Seu perfil de anunciante foi aprovado pela moderação.', 1, 'active'),
    ('profile_approved', 'push', 'pt-BR', 'Portal18', 'Atualização sobre a publicação do seu anúncio.', 1, 'active'),
    ('billing_failed', 'in_app', 'pt-BR', 'Falha no Pagamento', 'Não conseguimos processar o pagamento da assinatura do plano {{plan_name}}.', 1, 'active'),
    ('billing_failed', 'email', 'pt-BR', 'Portal18: Falha no pagamento da assinatura', '<p>Olá <strong>{{display_name}}</strong>,</p><p>Houve uma falha ao renovar o plano {{plan_name}}. Seu período de tolerância está ativo.</p>', 1, 'active')
ON CONFLICT DO NOTHING;

-- 6. Atomic RPC: Dispatch Canonical Notification
CREATE OR REPLACE FUNCTION public.dispatch_canonical_notification(
    p_event_type text,
    p_recipient_profile_id uuid,
    p_recipient_role text,
    p_subject_type text,
    p_subject_id text,
    p_priority text,
    p_category text,
    p_payload jsonb DEFAULT '{}'::jsonb,
    p_dedupe_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id uuid;
    v_pref_in_app boolean := true;
    v_pref_email boolean := true;
    v_pref_push boolean := true;
BEGIN
    -- 1. Deduplication check
    IF p_dedupe_key IS NOT NULL THEN
        SELECT id INTO v_event_id
        FROM public.notification_events
        WHERE recipient_profile_id = p_recipient_profile_id
          AND dedupe_key = p_dedupe_key
        LIMIT 1;

        IF v_event_id IS NOT NULL THEN
            RETURN jsonb_build_object('success', true, 'event_id', v_event_id, 'already_dispatched', true);
        END IF;
    END IF;

    -- 2. Insert Canonical Event
    INSERT INTO public.notification_events (
        event_type,
        recipient_profile_id,
        recipient_role,
        subject_type,
        subject_id,
        priority,
        category,
        payload,
        dedupe_key,
        status
    ) VALUES (
        p_event_type,
        p_recipient_profile_id,
        p_recipient_role,
        p_subject_type,
        p_subject_id,
        p_priority,
        p_category,
        p_payload,
        p_dedupe_key,
        'processing'
    )
    RETURNING id INTO v_event_id;

    -- 3. Check Channel Preferences (Security & Critical transactions are mandatory for in_app)
    IF p_category = 'security' OR p_priority = 'critical' THEN
        v_pref_in_app := true;
    ELSE
        -- Query user preferences if existing
        SELECT COALESCE((
            SELECT enabled FROM public.notification_preferences
            WHERE profile_id = p_recipient_profile_id AND channel = 'in_app' AND category = p_category
        ), true) INTO v_pref_in_app;
    END IF;

    -- 4. Queue Deliveries
    -- IN-APP Delivery
    IF v_pref_in_app THEN
        INSERT INTO public.notification_deliveries (event_id, channel, provider, status)
        VALUES (v_event_id, 'in_app', 'internal', 'delivered');

        -- Insert legacy notification for backward compatibility with in-app notification center
        INSERT INTO public.notifications (
            profile_id,
            type,
            title,
            message,
            priority,
            dedupe_key,
            metadata
        ) VALUES (
            p_recipient_profile_id,
            p_event_type,
            COALESCE(p_payload->>'title', 'Notificação do Portal18'),
            COALESCE(p_payload->>'message', 'Você tem uma nova atualização.'),
            p_priority,
            p_dedupe_key,
            p_payload
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- EMAIL Delivery (Queued for internal mock / transactional engine)
    INSERT INTO public.notification_deliveries (event_id, channel, provider, status)
    VALUES (v_event_id, 'email', 'internal_mock', 'queued');

    -- PUSH Delivery (Queued for VAPID service worker)
    INSERT INTO public.notification_deliveries (event_id, channel, provider, status)
    VALUES (v_event_id, 'push', 'vapid_mock', 'queued');

    -- Update Event status to completed
    UPDATE public.notification_events
    SET status = 'completed'
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'status', 'completed'
    );
END;
$$;
