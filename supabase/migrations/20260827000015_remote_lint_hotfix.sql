-- ============================================================================
-- MIGRATION 00015: Phase 13B — Remote DB Lint Hotfix & PL/pgSQL Hardening
-- ============================================================================

-- 1. Reports: assign_report (Remove invalid cast ::public.report_status)
CREATE OR REPLACE FUNCTION public.assign_report(p_report_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    UPDATE public.reports
    SET assigned_to = v_actor_id,
        status = CASE WHEN status = 'open' THEN 'under_review' ELSE status END
    WHERE id = p_report_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'report_assigned', 'reports', p_report_id, '{}'::jsonb);

    RETURN jsonb_build_object('success', true, 'assigned_to', v_actor_id);
END;
$$;

-- 2. Reports: update_report_status (Validate text status and remove invalid cast)
CREATE OR REPLACE FUNCTION public.update_report_status(
    p_report_id uuid,
    p_status text,
    p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    IF p_status NOT IN ('open', 'under_review', 'resolved', 'rejected', 'escalated') THEN
        RAISE EXCEPTION 'Status de denúncia inválido: %', p_status;
    END IF;

    v_actor_id := public.current_profile_id();

    UPDATE public.reports
    SET status = p_status,
        resolution_notes = COALESCE(p_notes, resolution_notes),
        reviewed_by = v_actor_id,
        reviewed_at = now()
    WHERE id = p_report_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'report_status_changed', 'reports', p_report_id, jsonb_build_object('new_status', p_status, 'notes', p_notes));

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;

-- 3. RBAC: grant_role (Remove invalid cast ::public.account_type)
CREATE OR REPLACE FUNCTION public.grant_role(
    p_target_profile_id uuid,
    p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente Super Administradores podem conceder cargos.';
    END IF;

    IF p_role NOT IN ('user', 'advertiser', 'moderator', 'admin', 'super_admin') THEN
        RAISE EXCEPTION 'Cargo inválido: %', p_role;
    END IF;

    v_actor_id := public.current_profile_id();

    -- Check if already has role
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE profile_id = p_target_profile_id AND role = p_role
    ) THEN
        RETURN jsonb_build_object('success', true, 'message', 'O usuário já possui este cargo.');
    END IF;

    INSERT INTO public.user_roles (profile_id, role, created_by)
    VALUES (p_target_profile_id, p_role, v_actor_id);

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'role_granted', 'user_roles', p_target_profile_id, jsonb_build_object('granted_role', p_role));

    RETURN jsonb_build_object('success', true, 'granted_role', p_role);
END;
$$;

-- 4. RBAC: revoke_role (Remove invalid cast ::public.account_type)
CREATE OR REPLACE FUNCTION public.revoke_role(
    p_target_profile_id uuid,
    p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_super_admin_count integer;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Somente Super Administradores podem revogar cargos.';
    END IF;

    IF p_role NOT IN ('user', 'advertiser', 'moderator', 'admin', 'super_admin') THEN
        RAISE EXCEPTION 'Cargo inválido: %', p_role;
    END IF;

    v_actor_id := public.current_profile_id();

    -- Protect Last Active Super Admin
    IF p_role = 'super_admin' THEN
        SELECT count(*) INTO v_super_admin_count FROM public.user_roles WHERE role = 'super_admin';
        IF v_super_admin_count <= 1 THEN
            RAISE EXCEPTION 'Operação negada: Não é permitido remover o último Super Administrador ativo da plataforma.';
        END IF;
    END IF;

    DELETE FROM public.user_roles
    WHERE profile_id = p_target_profile_id AND role = p_role;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'role_revoked', 'user_roles', p_target_profile_id, jsonb_build_object('revoked_role', p_role));

    RETURN jsonb_build_object('success', true, 'revoked_role', p_role);
END;
$$;

-- 5. KYC: create_identity_verification_session (Use submitted_at instead of non-existent started_at)
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
    v_retry_count integer;
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

-- 6. KYC: process_verification_webhook (Remove invalid cast ::public.verification_status & fix reviewed_at)
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

    -- Update verification record using text status and reviewed_at
    UPDATE public.verification_requests
    SET status = v_new_status,
        age_verified = p_age_verified,
        identity_verified = p_identity_verified,
        result_code = p_result_code,
        reviewed_at = CASE WHEN v_new_status IN ('verified', 'rejected') THEN now() ELSE reviewed_at END,
        expires_at = COALESCE(v_expires_at, expires_at),
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
        INSERT INTO public.notifications (profile_id, type, title, message, metadata)
        VALUES (
            v_adv.profile_id,
            'verification_verified',
            'Identidade Verificada com Sucesso! 🛡️',
            'Seu perfil recebeu o selo de Identidade Verificada 18+.',
            jsonb_build_object('verification_id', v_verif.id)
        );
    ELSIF v_new_status = 'rejected' THEN
        INSERT INTO public.notifications (profile_id, type, title, message, metadata)
        VALUES (
            v_adv.profile_id,
            'verification_rejected',
            'Verificação Não Concluída',
            'Não foi possível concluir a verificação. Consulte seu painel para tentar novamente.',
            jsonb_build_object('verification_id', v_verif.id, 'result_code', p_result_code)
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
        jsonb_build_object('provider', p_provider, 'age_verified', p_age_verified, 'result_code', p_result_code)
    );

    RETURN jsonb_build_object('success', true, 'status', v_new_status);
END;
$$;

-- 7. KYC: override_verification_status (Remove invalid cast ::public.verification_status)
CREATE OR REPLACE FUNCTION public.override_verification_status(
    p_verification_id uuid,
    p_new_status text,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_verif public.verification_requests%ROWTYPE;
BEGIN
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas Super Administradores podem realizar override manual de verificação.';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'Justificativa administrativa obrigatória para override de KYC.';
    END IF;

    IF p_new_status NOT IN ('not_started', 'pending', 'processing', 'verified', 'rejected', 'requires_review', 'expired') THEN
        RAISE EXCEPTION 'Status de verificação inválido: %', p_new_status;
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_verif FROM public.verification_requests WHERE id = p_verification_id;
    IF v_verif.id IS NULL THEN
        RAISE EXCEPTION 'Registro de verificação não encontrado.';
    END IF;

    UPDATE public.verification_requests
    SET status = p_new_status,
        age_verified = CASE WHEN p_new_status = 'verified' THEN true ELSE age_verified END,
        identity_verified = CASE WHEN p_new_status = 'verified' THEN true ELSE identity_verified END,
        reviewed_at = now(),
        expires_at = CASE WHEN p_new_status = 'verified' THEN now() + INTERVAL '365 days' ELSE expires_at END,
        metadata = metadata || jsonb_build_object('manual_override', true, 'override_by', v_actor_id, 'reason', p_reason),
        updated_at = now()
    WHERE id = p_verification_id;

    UPDATE public.advertiser_profiles
    SET verification_status = p_new_status,
        updated_at = now()
    WHERE id = v_verif.advertiser_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'verification_manual_override',
        'verification_requests',
        p_verification_id,
        jsonb_build_object('new_status', p_new_status, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;

-- 8. Payments: process_payment_webhook (Qualified extensions.digest with convert_to UTF8)
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_provider_payment_ref text,
    p_amount integer,
    p_status text,
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
    v_sub_id uuid;
    v_days integer;
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
    WHERE provider_payment_reference = p_provider_payment_ref
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

    -- Update Payment Record
    UPDATE public.payments
    SET status = v_new_payment_status,
        provider_transaction_id = p_event_id,
        paid_at = CASE WHEN v_new_payment_status = 'paid' THEN now() ELSE paid_at END,
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
                SELECT duration_days INTO v_days FROM public.promotion_products WHERE id = v_item.product_id;
                v_days := COALESCE(v_days, 7);

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
                    now() + (v_days || ' days')::interval
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

-- 9. Discovery & Ranking: recalculate_advertiser_rankings (Correct polymorphic reports target columns)
CREATE OR REPLACE FUNCTION public.recalculate_advertiser_rankings(p_advertiser_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv record;
    v_weights public.ranking_weights%ROWTYPE;
    v_completeness numeric;
    v_verification numeric;
    v_activity numeric;
    v_freshness numeric;
    v_quality numeric;
    v_trust numeric;
    v_final_organic numeric;
    v_media_count integer;
    v_report_count integer;
    v_days_active integer;
BEGIN
    SELECT * INTO v_weights FROM public.ranking_weights LIMIT 1;
    IF v_weights.id IS NULL THEN
        v_weights.completeness_weight := 0.20;
        v_weights.verification_weight := 0.20;
        v_weights.activity_weight := 0.15;
        v_weights.freshness_weight := 0.10;
        v_weights.quality_weight := 0.15;
        v_weights.engagement_weight := 0.10;
        v_weights.trust_weight := 0.10;
    END IF;

    FOR v_adv IN
        SELECT ap.id, ap.profile_status, ap.visibility, ap.verification_status, ap.last_active_at, ap.created_at, ap.headline, ap.bio
        FROM public.advertiser_profiles ap
        WHERE (p_advertiser_id IS NULL OR ap.id = p_advertiser_id)
          AND ap.deleted_at IS NULL
    LOOP
        -- Exclude suspended / inactive profiles from high ranking
        IF v_adv.profile_status <> 'active' OR v_adv.visibility <> 'public' THEN
            INSERT INTO public.advertiser_ranking_scores (advertiser_id, organic_score, calculated_at)
            VALUES (v_adv.id, 0.0, now())
            ON CONFLICT (advertiser_id) DO UPDATE SET organic_score = 0.0, calculated_at = now();
            CONTINUE;
        END IF;

        -- 1. Completeness Score (0 - 100)
        v_completeness := 50.0;
        IF length(coalesce(v_adv.headline, '')) > 10 THEN v_completeness := v_completeness + 25.0; END IF;
        IF length(coalesce(v_adv.bio, '')) > 30 THEN v_completeness := v_completeness + 25.0; END IF;

        -- 2. Verification Score (0 - 100)
        v_verification := CASE WHEN v_adv.verification_status = 'verified' THEN 100.0 ELSE 20.0 END;

        -- 3. Activity Score (0 - 100)
        IF v_adv.last_active_at IS NOT NULL AND v_adv.last_active_at > (now() - INTERVAL '24 hours') THEN
            v_activity := 100.0;
        ELSIF v_adv.last_active_at IS NOT NULL AND v_adv.last_active_at > (now() - INTERVAL '3 days') THEN
            v_activity := 75.0;
        ELSIF v_adv.last_active_at IS NOT NULL AND v_adv.last_active_at > (now() - INTERVAL '7 days') THEN
            v_activity := 50.0;
        ELSE
            v_activity := 20.0;
        END IF;

        -- 4. Freshness / Cold-start Boost (0 - 100)
        v_days_active := extract(day from (now() - v_adv.created_at));
        IF v_days_active <= 7 THEN
            v_freshness := 100.0;
        ELSIF v_days_active <= 30 THEN
            v_freshness := 70.0;
        ELSE
            v_freshness := 40.0;
        END IF;

        -- 5. Quality Score (Approved Media Count) (0 - 100)
        SELECT count(*) INTO v_media_count
        FROM public.advertiser_media
        WHERE advertiser_id = v_adv.id AND moderation_status = 'approved' AND deleted_at IS NULL;
        v_quality := LEAST(100.0, v_media_count * 15.0);

        -- 6. Trust Score (Penalized by confirmed reports using target_type and target_id)
        SELECT count(*) INTO v_report_count
        FROM public.reports
        WHERE target_type = 'advertiser' AND target_id = v_adv.id AND status = 'resolved';
        v_trust := GREATEST(0.0, 100.0 - (v_report_count * 30.0));

        -- Weighted Sum Calculation
        v_final_organic := (v_completeness * v_weights.completeness_weight)
                         + (v_verification * v_weights.verification_weight)
                         + (v_activity * v_weights.activity_weight)
                         + (v_freshness * v_weights.freshness_weight)
                         + (v_quality * v_weights.quality_weight)
                         + (v_trust * v_weights.trust_weight);

        INSERT INTO public.advertiser_ranking_scores (
            advertiser_id,
            organic_score,
            completeness_score,
            verification_score,
            activity_score,
            freshness_score,
            quality_score,
            engagement_score,
            trust_score,
            calculated_at
        )
        VALUES (
            v_adv.id,
            round(v_final_organic, 2),
            round(v_completeness, 2),
            round(v_verification, 2),
            round(v_activity, 2),
            round(v_freshness, 2),
            round(v_quality, 2),
            50.0,
            round(v_trust, 2),
            now()
        )
        ON CONFLICT (advertiser_id) DO UPDATE SET
            organic_score = EXCLUDED.organic_score,
            completeness_score = EXCLUDED.completeness_score,
            verification_score = EXCLUDED.verification_score,
            activity_score = EXCLUDED.activity_score,
            freshness_score = EXCLUDED.freshness_score,
            quality_score = EXCLUDED.quality_score,
            trust_score = EXCLUDED.trust_score,
            calculated_at = now();
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Rankings recalculados com sucesso.');
END;
$$;

-- 10. Discovery: get_similar_profiles (Qualify columns in lateral join to eliminate ambiguity)
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
        ORDER BY med.is_primary DESC, med.position ASC LIMIT 1
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

-- 11. Discovery: search_profiles_discovery (Fully qualify all internal references to eliminate ambiguity)
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
        ORDER BY med.is_primary DESC, med.position ASC LIMIT 1
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

-- 12. Media: finalize_media_upload (Explicit cast for processing_status enum)
CREATE OR REPLACE FUNCTION public.finalize_media_upload(
    p_reservation_id uuid,
    p_storage_path text,
    p_mime_type text,
    p_file_size bigint,
    p_content_hash text,
    p_width integer DEFAULT NULL,
    p_height integer DEFAULT NULL,
    p_duration integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_res public.media_upload_reservations%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_media_id uuid;
    v_is_blocked boolean := false;
    v_block_reason text;
    v_mod_status text := 'pending';
    v_proc_status public.processing_status := 'queued'::public.processing_status;
    v_job_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_res FROM public.media_upload_reservations WHERE id = p_reservation_id FOR UPDATE;
    IF v_res.id IS NULL OR v_res.status <> 'active' OR v_res.expires_at <= now() THEN
        RAISE EXCEPTION 'Reserva de upload inválida ou expirada.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_res.advertiser_id;
    IF v_adv.profile_id <> v_profile_id THEN
        RAISE EXCEPTION 'Acesso negado: Reserva pertence a outro usuário.';
    END IF;

    -- Strict MIME and Extension Validation
    IF p_mime_type IN ('image/svg+xml', 'text/html', 'application/javascript', 'application/x-msdownload', 'application/zip') THEN
        RAISE EXCEPTION 'Tipo de arquivo proibido por motivos de segurança.';
    END IF;

    IF v_res.media_type = 'image' AND p_mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif') THEN
        RAISE EXCEPTION 'Formato de imagem não suportado. Utilize JPEG, PNG, WebP ou AVIF.';
    END IF;

    IF v_res.media_type = 'video' AND p_mime_type NOT IN ('video/mp4', 'video/webm', 'video/quicktime') THEN
        RAISE EXCEPTION 'Formato de vídeo não suportado. Utilize MP4, WebM ou QuickTime.';
    END IF;

    -- Blocked Hash Matching
    SELECT reason INTO v_block_reason
    FROM public.blocked_media_hashes
    WHERE hash_value = p_content_hash;

    IF v_block_reason IS NOT NULL THEN
        v_is_blocked := true;
        v_mod_status := 'blocked';
        v_proc_status := 'processed'::public.processing_status;
    END IF;

    -- Create Advertiser Media Record
    INSERT INTO public.advertiser_media (
        advertiser_id,
        media_type,
        storage_path,
        storage_path_original,
        thumbnail_path,
        mime_type,
        file_size,
        content_hash,
        width,
        height,
        duration_seconds,
        processing_status,
        moderation_status,
        visibility
    )
    VALUES (
        v_res.advertiser_id,
        v_res.media_type,
        p_storage_path,
        p_storage_path,
        p_storage_path,
        p_mime_type,
        p_file_size,
        p_content_hash,
        p_width,
        p_height,
        p_duration,
        v_proc_status,
        v_mod_status,
        'public'
    )
    RETURNING id INTO v_media_id;

    -- Mark reservation consumed
    UPDATE public.media_upload_reservations
    SET status = 'consumed'
    WHERE id = p_reservation_id;

    -- Enqueue Media Processing Job if not blocked
    IF NOT v_is_blocked THEN
        INSERT INTO public.media_processing_jobs (
            media_id,
            job_type,
            status
        )
        VALUES (
            v_media_id,
            CASE WHEN v_res.media_type = 'image' THEN 'image_variants' ELSE 'video_transcode' END,
            'queued'
        )
        RETURNING id INTO v_job_id;
    ELSE
        INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
        VALUES (
            v_profile_id,
            'media_hash_matched_blocked',
            'advertiser_media',
            v_media_id,
            jsonb_build_object('hash', p_content_hash, 'reason', v_block_reason)
        );
    END IF;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'media_uploaded',
        'advertiser_media',
        v_media_id,
        jsonb_build_object('mime_type', p_mime_type, 'size', p_file_size, 'hash', p_content_hash)
    );

    RETURN jsonb_build_object(
        'success', true,
        'media_id', v_media_id,
        'processing_status', v_proc_status::text,
        'moderation_status', v_mod_status,
        'is_blocked', v_is_blocked,
        'job_id', v_job_id
    );
END;
$$;

-- 13. Slug: generate_available_advertiser_slug (Set VOLATILE & safe return paths)
CREATE OR REPLACE FUNCTION public.generate_available_advertiser_slug(p_base_name text)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_slug text;
    v_candidate text;
    v_counter integer := 1;
    v_exists boolean;
BEGIN
    -- Lowercase and sanitize
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
        IF v_counter > 1000 THEN
            RETURN v_clean_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
        END IF;

        v_candidate := v_clean_slug || '-' || v_counter;
    END LOOP;

    RETURN v_candidate;
END;
$$;

-- 14. Profiles: submit_advertiser_profile (Remove unused variable v_terms_accepted)
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

    -- Check at least 1 approved or pending media item
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

    -- Transition Profile Status
    UPDATE public.advertiser_profiles
    SET profile_status = 'pending_review',
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Create Moderation Action Item
    INSERT INTO public.moderation_actions (
        target_type,
        target_id,
        action,
        reason,
        moderator_profile_id
    )
    VALUES (
        'advertiser',
        p_advertiser_id,
        'submitted_for_review',
        'Perfil submetido para moderação pelo anunciante.',
        NULL
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

-- 15. Moderation: block_advertiser_media (Remove unused variable v_adv)
CREATE OR REPLACE FUNCTION public.block_advertiser_media(
    p_media_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_media public.advertiser_media%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_media FROM public.advertiser_media WHERE id = p_media_id;
    IF v_media.id IS NULL THEN
        RAISE EXCEPTION 'Mídia não encontrada.';
    END IF;

    UPDATE public.advertiser_media
    SET moderation_status = 'blocked',
        moderation_reason = p_reason,
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_media_id;

    -- If critical violation (suspected_minor / non_consensual), suspend profile immediately
    IF p_reason IN ('suspected_minor', 'non_consensual_content') THEN
        UPDATE public.advertiser_profiles
        SET profile_status = 'suspended',
            rejection_reason = 'Suspensão preventiva por violação crítica em mídia (' || p_reason || ')',
            updated_at = now()
        WHERE id = v_media.advertiser_id;
    END IF;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (v_actor_id, 'admin_media_blocked', 'advertiser_media', p_media_id, jsonb_build_object('reason', p_reason));

    RETURN jsonb_build_object('success', true, 'status', 'blocked');
END;
$$;

-- 16. Payments: create_advertiser_checkout (Active eligibility validation & payment_id return)
CREATE OR REPLACE FUNCTION public.create_advertiser_checkout(
    p_product_type text,
    p_product_id uuid,
    p_coupon_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv_id uuid;
    v_adv_status text;
    v_subtotal integer;
    v_discount integer := 0;
    v_total integer;
    v_product_name text;
    v_coupon public.coupons%ROWTYPE;
    v_order_id uuid;
    v_order_num text;
    v_idempotency_key text;
    v_session_token text;
    v_payment_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    -- Resolve advertiser profile owned by user
    SELECT id, profile_status INTO v_adv_id, v_adv_status
    FROM public.advertiser_profiles
    WHERE profile_id = v_profile_id AND deleted_at IS NULL;

    IF v_adv_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    IF v_adv_status = 'suspended' THEN
        RAISE EXCEPTION 'Perfil suspenso não pode realizar operações de checkout.';
    END IF;

    -- Fetch trusted server price
    IF p_product_type = 'subscription' THEN
        SELECT price_amount, name INTO v_subtotal, v_product_name
        FROM public.subscription_plans
        WHERE id = p_product_id AND status = 'active';
    ELSE
        SELECT price_amount, name INTO v_subtotal, v_product_name
        FROM public.promotion_products
        WHERE id = p_product_id AND status = 'active';
    END IF;

    IF v_subtotal IS NULL THEN
        RAISE EXCEPTION 'Produto não encontrado ou indisponível.';
    END IF;

    -- Validate coupon atomically if provided
    IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
        SELECT * INTO v_coupon
        FROM public.coupons
        WHERE code = upper(trim(p_coupon_code))
          AND status = 'active'
          AND (starts_at IS NULL OR starts_at <= now())
          AND (expires_at IS NULL OR expires_at >= now())
          AND (usage_limit IS NULL OR usage_count < usage_limit)
        FOR UPDATE;

        IF v_coupon.id IS NOT NULL THEN
            IF v_coupon.discount_type = 'percentage' THEN
                v_discount := (v_subtotal * v_coupon.discount_value) / 100;
            ELSE
                v_discount := LEAST(v_subtotal, v_coupon.discount_value);
            END IF;
        END IF;
    END IF;

    v_total := GREATEST(0, v_subtotal - v_discount);
    v_order_num := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 8));
    v_idempotency_key := 'chk_' || v_adv_id || '_' || p_product_id || '_' || to_char(now(), 'YYYYMMDDHH24MISS');
    v_session_token := 'sess_pay_' || gen_random_uuid()::text;

    -- Insert Order
    INSERT INTO public.orders (
        advertiser_id,
        order_number,
        status,
        subtotal,
        discount_amount,
        total_amount,
        currency,
        coupon_id,
        idempotency_key,
        metadata
    )
    VALUES (
        v_adv_id,
        v_order_num,
        'pending',
        v_subtotal,
        v_discount,
        v_total,
        'BRL',
        v_coupon.id,
        v_idempotency_key,
        jsonb_build_object('product_name', v_product_name, 'product_type', p_product_type)
    )
    RETURNING id INTO v_order_id;

    -- Insert Order Item
    INSERT INTO public.order_items (
        order_id,
        product_type,
        product_id,
        description_snapshot,
        quantity,
        unit_amount,
        total_amount
    )
    VALUES (
        v_order_id,
        p_product_type::public.payment_type,
        p_product_id,
        v_product_name,
        1,
        v_subtotal,
        v_total
    );

    -- Increment Coupon Usage if applied
    IF v_coupon.id IS NOT NULL THEN
        UPDATE public.coupons
        SET usage_count = usage_count + 1, updated_at = now()
        WHERE id = v_coupon.id;

        INSERT INTO public.coupon_redemptions (coupon_id, advertiser_id, order_id, discount_amount)
        VALUES (v_coupon.id, v_adv_id, v_order_id, v_discount);
    END IF;

    -- Insert Pending Payment Record
    INSERT INTO public.payments (
        advertiser_id,
        order_id,
        provider,
        provider_payment_reference,
        payment_type,
        amount,
        currency,
        status
    )
    VALUES (
        v_adv_id,
        v_order_id,
        'unconfigured',
        v_session_token,
        p_product_type::public.payment_type,
        v_total,
        'BRL',
        'pending'
    )
    RETURNING id INTO v_payment_id;

    -- If subscription, create or update pending subscription
    IF p_product_type = 'subscription' THEN
        INSERT INTO public.subscriptions (
            advertiser_id,
            plan_id,
            provider,
            provider_subscription_reference,
            status,
            billing_interval
        )
        VALUES (
            v_adv_id,
            p_product_id,
            'unconfigured',
            v_session_token,
            'pending',
            'monthly'
        );
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'checkout_created',
        'orders',
        v_order_id,
        jsonb_build_object('order_number', v_order_num, 'total', v_total, 'payment_id', v_payment_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_num,
        'payment_id', v_payment_id,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'total', v_total,
        'session_token', v_session_token,
        'provider', 'unconfigured'
    );
END;
$$;
