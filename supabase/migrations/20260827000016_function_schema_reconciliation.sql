-- ============================================================================
-- MIGRATION 00016: Phase 13C — Function Overload & Real Schema Reconciliation
-- ============================================================================

-- 1. DROP OBSOLETE OVERLOADS
DROP FUNCTION IF EXISTS public.process_payment_webhook(text, text, text, text, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.process_payment_webhook(text, text, text, text, integer, text, jsonb);
DROP FUNCTION IF EXISTS public.process_verification_webhook(text, text, text, text, text, boolean, boolean, text, text, jsonb);

-- 2. CANONICAL: process_payment_webhook
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_provider_reference text,
    p_status text,
    p_amount integer,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_new_payment_status public.payment_status;
    v_item RECORD;
    v_hours integer;
BEGIN
    -- 1. Replay attack protection
    IF EXISTS (
        SELECT 1 FROM public.webhook_events
        WHERE provider = p_provider AND event_id = p_event_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Webhook duplicado já processado.');
    END IF;

    -- 2. Find payment by provider reference
    SELECT * INTO v_payment
    FROM public.payments
    WHERE provider_payment_reference = p_provider_reference
    FOR UPDATE;

    IF v_payment.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pagamento não encontrado.');
    END IF;

    -- Map incoming provider status
    IF p_status IN ('paid', 'approved', 'succeeded', 'COMPLETED') THEN
        v_new_payment_status := 'paid'::public.payment_status;
    ELSIF p_status IN ('failed', 'declined', 'canceled', 'EXPIRED') THEN
        v_new_payment_status := 'failed'::public.payment_status;
    ELSIF p_status IN ('refunded', 'REFUNDED') THEN
        v_new_payment_status := 'refunded'::public.payment_status;
    ELSIF p_status IN ('chargeback', 'disputed') THEN
        v_new_payment_status := 'chargeback'::public.payment_status;
    ELSE
        v_new_payment_status := 'pending'::public.payment_status;
    END IF;

    -- Update Payment Record using existing valid columns
    UPDATE public.payments
    SET status = v_new_payment_status,
        paid_at = CASE WHEN v_new_payment_status = 'paid' THEN now() ELSE paid_at END,
        failed_at = CASE WHEN v_new_payment_status = 'failed' THEN now() ELSE failed_at END,
        refunded_at = CASE WHEN v_new_payment_status = 'refunded' THEN now() ELSE refunded_at END,
        metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
        updated_at = now()
    WHERE id = v_payment.id;

    -- Provision Entitlements upon successful payment
    IF v_new_payment_status = 'paid' THEN
        UPDATE public.orders SET status = 'completed', updated_at = now() WHERE id = v_payment.order_id;

        FOR v_item IN SELECT * FROM public.order_items WHERE order_id = v_payment.order_id LOOP
            IF v_item.product_type = 'subscription' THEN
                UPDATE public.subscriptions
                SET status = 'active',
                    current_period_start = now(),
                    current_period_end = now() + INTERVAL '30 days',
                    updated_at = now()
                WHERE advertiser_id = v_payment.advertiser_id AND plan_id = v_item.product_id;

                INSERT INTO public.notifications (profile_id, type, title, message)
                SELECT ap.profile_id, 'subscription_activated', 'Assinatura Ativada! 🎉', 'Seu plano de anunciante está ativo.'
                FROM public.advertiser_profiles ap WHERE ap.id = v_payment.advertiser_id;

            ELSIF v_item.product_type IN ('boost', 'featured_placement', 'campaign') THEN
                SELECT duration_hours INTO v_hours FROM public.promotion_products WHERE id = v_item.product_id;
                v_hours := COALESCE(v_hours, 168);

                INSERT INTO public.advertiser_campaigns (
                    advertiser_id,
                    product_id,
                    order_id,
                    placement,
                    status,
                    starts_at,
                    ends_at
                )
                SELECT
                    v_payment.advertiser_id,
                    v_item.product_id,
                    v_payment.order_id,
                    pp.placement,
                    'active',
                    now(),
                    now() + (v_hours || ' hours')::interval
                FROM public.promotion_products pp
                WHERE pp.id = v_item.product_id;

                INSERT INTO public.notifications (profile_id, type, title, message)
                SELECT ap.profile_id, 'promotion_activated', 'Destaque Ativado! 🚀', 'Sua campanha promocional está ativa e gerando mais visibilidade.'
                FROM public.advertiser_profiles ap WHERE ap.id = v_payment.advertiser_id;
            END IF;
        END LOOP;
    ELSIF v_new_payment_status = 'failed' THEN
        UPDATE public.orders SET status = 'failed', updated_at = now() WHERE id = v_payment.order_id;
    END IF;

    -- Record webhook event with deterministic SHA-256
    INSERT INTO public.webhook_events (
        provider,
        event_id,
        event_type,
        payload_hash,
        status
    )
    VALUES (
        p_provider,
        p_event_id,
        p_event_type,
        encode(
            extensions.digest(
                convert_to(
                    p_provider
                    || ':' ||
                    p_event_id
                    || ':' ||
                    p_event_type
                    || ':' ||
                    COALESCE(p_metadata, '{}'::jsonb)::text,
                    'UTF8'
                ),
                'sha256'
            ),
            'hex'
        ),
        'processed'
    );

    -- Audit Log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        NULL,
        'payment_' || v_new_payment_status::text,
        'payments',
        v_payment.id,
        jsonb_build_object('amount', p_amount, 'provider', p_provider, 'order_id', v_payment.order_id)
    );

    RETURN jsonb_build_object('success', true, 'status', v_new_payment_status::text);
END;
$$;

-- 3. CANONICAL: process_verification_webhook
CREATE OR REPLACE FUNCTION public.process_verification_webhook(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_provider_reference text,
    p_status text,
    p_age_verified boolean,
    p_identity_verified boolean,
    p_result_code text,
    p_payload_hash text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_verif public.verification_requests%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_new_status text;
    v_expires_at timestamptz;
BEGIN
    -- 1. Replay Attack & Duplicate Protection
    IF EXISTS (
        SELECT 1 FROM public.webhook_events
        WHERE provider = p_provider AND event_id = p_event_id
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Webhook duplicado já processado.');
    END IF;

    -- 2. Find associated verification request
    SELECT * INTO v_verif
    FROM public.verification_requests
    WHERE provider_reference = p_provider_reference
    FOR UPDATE;

    IF v_verif.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referência de provedor não encontrada.');
    END IF;

    -- Validate State Machine Transition
    v_new_status := p_status;
    IF v_verif.status = 'verified' AND p_status IN ('pending', 'processing') THEN
        v_new_status := 'verified';
    END IF;

    IF v_new_status NOT IN ('not_started', 'pending', 'processing', 'verified', 'rejected', 'requires_review', 'expired') THEN
        v_new_status := 'requires_review';
    END IF;

    -- Expiration calculation: 1 year validity for approved KYC
    IF v_new_status = 'verified' THEN
        v_expires_at := now() + INTERVAL '365 days';
    END IF;

    -- Update verification record using text status, reviewed_at and metadata
    UPDATE public.verification_requests
    SET status = v_new_status,
        age_verified = p_age_verified,
        identity_verified = p_identity_verified,
        result_code = p_result_code,
        reviewed_at = CASE WHEN v_new_status IN ('verified', 'rejected') THEN now() ELSE reviewed_at END,
        expires_at = COALESCE(v_expires_at, expires_at),
        metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
        updated_at = now()
    WHERE id = v_verif.id;

    -- Sync advertiser profile status
    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_verif.advertiser_id;

    -- Underage Protection
    IF p_age_verified = false OR (v_new_status = 'rejected' AND p_result_code = 'underage_detected') THEN
        UPDATE public.advertiser_profiles
        SET verification_status = 'rejected',
            profile_status = 'suspended',
            visibility = 'hidden',
            rejection_reason = 'Suspensão preventiva: falha na comprovação de maioridade 18+ pelo provedor de identidade.',
            updated_at = now()
        WHERE id = v_verif.advertiser_id;

        INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
        VALUES (
            NULL,
            'verification_critical_age_failure',
            'advertiser_profiles',
            v_verif.advertiser_id,
            jsonb_build_object('reason', 'underage_detected', 'provider', p_provider)
        );
    ELSE
        UPDATE public.advertiser_profiles
        SET verification_status = v_new_status,
            updated_at = now()
        WHERE id = v_verif.advertiser_id;
    END IF;

    -- Insert Notification to Advertiser
    IF v_new_status = 'verified' THEN
        INSERT INTO public.notifications (profile_id, type, title, message)
        VALUES (
            v_adv.profile_id,
            'verification_verified',
            'Identidade Verificada com Sucesso! 🛡️',
            'Seu perfil recebeu o selo de Identidade Verificada 18+.'
        );
    ELSIF v_new_status = 'rejected' THEN
        INSERT INTO public.notifications (profile_id, type, title, message)
        VALUES (
            v_adv.profile_id,
            'verification_rejected',
            'Verificação Não Concluída',
            'Não foi possível concluir a verificação. Consulte seu painel para tentar novamente.'
        );
    END IF;

    -- Record webhook event for replay protection
    INSERT INTO public.webhook_events (provider, event_id, event_type, payload_hash, status)
    VALUES (p_provider, p_event_id, p_event_type, p_payload_hash, 'processed');

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        NULL,
        'verification_' || v_new_status,
        'verification_requests',
        v_verif.id,
        jsonb_build_object('provider', p_provider, 'age_verified', p_age_verified, 'result_code', p_result_code, 'metadata', p_metadata)
    );

    RETURN jsonb_build_object('success', true, 'status', v_new_status);
END;
$$;

-- 4. CANONICAL: create_identity_verification_session
CREATE OR REPLACE FUNCTION public.create_identity_verification_session(
    p_verification_type text DEFAULT 'identity_and_age'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv_id uuid;
    v_current_status text;
    v_req_id uuid;
    v_idempotency_key text;
    v_retry_count integer := 0;
    v_retry_available_at timestamptz;
    v_session_token text;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    -- Identify advertiser profile owned by user
    SELECT id, verification_status INTO v_adv_id, v_current_status
    FROM public.advertiser_profiles
    WHERE profile_id = v_profile_id AND deleted_at IS NULL;

    IF v_adv_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado para este usuário.';
    END IF;

    -- If already verified and valid, return current verified status
    IF v_current_status = 'verified' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'verified',
            'message', 'Sua identidade já se encontra verificada e ativa.'
        );
    END IF;

    -- Check rate limiting & cooldown
    SELECT id, retry_count, retry_available_at
    INTO v_req_id, v_retry_count, v_retry_available_at
    FROM public.verification_requests
    WHERE advertiser_id = v_adv_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_retry_available_at IS NOT NULL AND v_retry_available_at > now() THEN
        RAISE EXCEPTION 'Limite de tentativas atingido. Nova tentativa disponível em %', v_retry_available_at;
    END IF;

    IF v_retry_count IS NOT NULL AND v_retry_count >= 5 THEN
        RAISE EXCEPTION 'Limite máximo de tentativas atingido. Entre em contato com o suporte.';
    END IF;

    v_idempotency_key := 'verif_' || v_adv_id || '_' || to_char(now(), 'YYYYMMDDHH24MISS');
    v_session_token := 'sess_' || gen_random_uuid()::text;

    -- Create or update verification record using existing timestamp columns
    INSERT INTO public.verification_requests (
        advertiser_id,
        provider,
        provider_reference,
        status,
        verification_type,
        idempotency_key,
        retry_count,
        submitted_at,
        metadata
    )
    VALUES (
        v_adv_id,
        'unconfigured',
        v_session_token,
        'pending',
        p_verification_type,
        v_idempotency_key,
        COALESCE(v_retry_count, 0) + 1,
        now(),
        jsonb_build_object(
            'created_by', v_profile_id,
            'client_ip', 'masked',
            'session_type', p_verification_type
        )
    )
    RETURNING id INTO v_req_id;

    -- Update advertiser status to pending
    UPDATE public.advertiser_profiles
    SET verification_status = 'pending', updated_at = now()
    WHERE id = v_adv_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'verification_session_created',
        'verification_requests',
        v_req_id,
        jsonb_build_object('type', p_verification_type, 'idempotency_key', v_idempotency_key)
    );

    RETURN jsonb_build_object(
        'success', true,
        'verification_id', v_req_id,
        'session_token', v_session_token,
        'status', 'pending',
        'provider', 'unconfigured'
    );
END;
$$;

-- 5. CANONICAL: submit_advertiser_profile
CREATE OR REPLACE FUNCTION public.submit_advertiser_profile(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_cat_count integer;
    v_contact_count integer;
    v_media_count integer;
    v_missing text[] := ARRAY[]::text[];
BEGIN
    -- Verify caller identity and ownership
    IF NOT public.owns_advertiser(p_advertiser_id) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: você não é o proprietário deste anúncio.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- If already pending review, return idempotent success
    IF v_adv.profile_status = 'pending_review' THEN
        RETURN jsonb_build_object(
            'success', true,
            'status', 'pending_review',
            'message', 'O perfil já está em processo de análise.'
        );
    END IF;

    -- Validate Prerequisites
    IF v_adv.stage_name IS NULL OR length(trim(v_adv.stage_name)) < 2 OR v_adv.stage_name = 'Novo Anunciante' THEN
        v_missing := array_append(v_missing, 'Nome artístico válido');
    END IF;

    IF v_adv.bio IS NULL OR length(trim(v_adv.bio)) < 20 THEN
        v_missing := array_append(v_missing, 'Descrição/Biografia com no mínimo 20 caracteres');
    END IF;

    IF v_adv.state_id IS NULL OR v_adv.city_id IS NULL THEN
        v_missing := array_append(v_missing, 'Localização de atendimento (Estado e Cidade)');
    END IF;

    IF v_adv.birth_date > (CURRENT_DATE - INTERVAL '18 years') THEN
        v_missing := array_append(v_missing, 'Comprovação de maioridade 18+');
    END IF;

    -- Check at least 1 category
    SELECT count(*) INTO v_cat_count FROM public.advertiser_categories WHERE advertiser_id = p_advertiser_id;
    IF v_cat_count = 0 THEN
        v_missing := array_append(v_missing, 'Ao menos uma categoria de anúncio');
    END IF;

    -- Check at least 1 visible contact
    SELECT count(*) INTO v_contact_count FROM public.advertiser_contacts WHERE advertiser_id = p_advertiser_id AND is_visible = true;
    IF v_contact_count = 0 THEN
        v_missing := array_append(v_missing, 'Ao menos um contato visível');
    END IF;

    -- Check at least 1 photo in catalog
    SELECT count(*) INTO v_media_count FROM public.advertiser_media WHERE advertiser_id = p_advertiser_id AND deleted_at IS NULL;
    IF v_media_count = 0 THEN
        v_missing := array_append(v_missing, 'Ao menos uma foto no catálogo');
    END IF;

    IF array_length(v_missing, 1) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'incomplete',
            'missing_requirements', v_missing,
            'message', 'Complete todos os requisitos obrigatórios antes de enviar para revisão.'
        );
    END IF;

    v_profile_id := public.current_profile_id();

    -- Transition Profile Status and set submitted_at
    UPDATE public.advertiser_profiles
    SET profile_status = 'pending_review',
        submitted_at = now(),
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Record profile history in advertiser_profile_history
    INSERT INTO public.advertiser_profile_history (
        advertiser_id,
        changed_by,
        change_type,
        changed_fields
    )
    VALUES (
        p_advertiser_id,
        v_profile_id,
        'submitted_for_review',
        jsonb_build_object('profile_status', 'pending_review', 'submitted_at', now())
    );

    -- Audit Log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_profile_id, 'profile_submitted_for_review', 'advertiser_profiles', p_advertiser_id, '{}'::jsonb);

    -- Notification to advertiser
    INSERT INTO public.notifications (profile_id, type, title, message)
    VALUES (
        v_adv.profile_id,
        'profile_submitted',
        'Perfil Enviado para Análise',
        'Seu perfil foi recebido pela equipe de moderação e será avaliado em breve.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', 'pending_review',
        'message', 'Perfil enviado com sucesso para a moderação.'
    );
END;
$$;

-- 6. CANONICAL: get_similar_profiles
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
    SELECT ap_own.city_id INTO v_city_id FROM public.advertiser_profiles ap_own WHERE ap_own.id = p_advertiser_id;

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
        ap.verification_status,
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
        SELECT med.storage_path, med.thumbnail_path 
        FROM public.advertiser_media med
        WHERE med.advertiser_id = ap.id AND med.moderation_status = 'approved' AND med.deleted_at IS NULL 
        ORDER BY med.position ASC, med.created_at ASC LIMIT 1
    ) am ON true
    WHERE ap.id <> p_advertiser_id
      AND ap.profile_status = 'active'
      AND ap.visibility = 'public'
      AND ap.deleted_at IS NULL
      AND (v_city_id IS NULL OR ap.city_id = v_city_id)
    ORDER BY rs.organic_score DESC NULLS LAST, ap.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 7. CANONICAL: search_profiles_discovery
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
        SELECT bc.latitude, bc.longitude INTO v_origin_lat, v_origin_lon
        FROM public.brazil_cities bc
        WHERE bc.id = p_origin_city_id;
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
        ap.verification_status,
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
        SELECT med.storage_path, med.thumbnail_path 
        FROM public.advertiser_media med
        WHERE med.advertiser_id = ap.id AND med.moderation_status = 'approved' AND med.deleted_at IS NULL 
        ORDER BY med.position ASC, med.created_at ASC LIMIT 1
    ) am ON true
    WHERE ap.profile_status = 'active'
      AND ap.visibility = 'public'
      AND ap.deleted_at IS NULL
      AND (p_state_code IS NULL OR lower(s.code) = lower(p_state_code))
      AND (p_city_slug IS NULL OR c.slug = p_city_slug)
      AND (p_category_slug IS NULL OR EXISTS (
          SELECT 1 FROM public.advertiser_categories ac_cat
          JOIN public.categories cat ON ac_cat.category_id = cat.id
          WHERE ac_cat.advertiser_id = ap.id AND cat.slug = p_category_slug
      ))
      AND (NOT p_verified_only OR ap.verification_status = 'verified')
      AND (NOT p_with_video OR EXISTS (
          SELECT 1 FROM public.advertiser_media v_med
          WHERE v_med.advertiser_id = ap.id AND v_med.media_type = 'video' AND v_med.moderation_status = 'approved' AND v_med.deleted_at IS NULL
      ))
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
    ORDER BY 
        is_sponsored DESC,
        coalesce(rs.organic_score, 50.0) DESC,
        ap.last_active_at DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
