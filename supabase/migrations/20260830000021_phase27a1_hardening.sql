-- ============================================================================
-- MIGRATION 00021: Phase 27A.1 — Commercial Lifecycle Hardening & Authenticity Security
-- ============================================================================

-- 1. Extend authenticity_challenges status check constraint to include 'superseded' and 'revoked'
DO $$
BEGIN
    ALTER TABLE public.authenticity_challenges DROP CONSTRAINT IF EXISTS authenticity_challenges_status_check;
    ALTER TABLE public.authenticity_challenges ADD CONSTRAINT authenticity_challenges_status_check
        CHECK (status IN ('issued', 'submitted', 'expired', 'verified', 'rejected', 'superseded', 'revoked'));
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- 2. Hardened RPC: generate_authenticity_challenge (6-char CSPRNG display code, 15-min TTL)
CREATE OR REPLACE FUNCTION public.generate_authenticity_challenge(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_random_hex text;
    v_display_code text;
    v_challenge public.authenticity_challenges%ROWTYPE;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL OR v_adv.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado ou inativo.';
    END IF;

    IF v_adv.profile_id <> v_profile_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Você não pode solicitar challenge para este anunciante.';
    END IF;

    -- Expire any previous unsubmitted challenges
    UPDATE public.authenticity_challenges
    SET status = 'expired', updated_at = now()
    WHERE advertiser_id = p_advertiser_id
      AND status = 'issued'
      AND expires_at <= now();

    -- Generate a 6-character uppercase alphanumeric high-entropy display code using CSPRNG bytes
    v_random_hex := upper(encode(gen_random_bytes(3), 'hex'));
    v_display_code := 'P18-' || v_random_hex;

    INSERT INTO public.authenticity_challenges (
        advertiser_id,
        challenge_code,
        status,
        issued_at,
        expires_at
    )
    VALUES (
        p_advertiser_id,
        v_display_code,
        'issued',
        now(),
        now() + INTERVAL '15 minutes'
    )
    RETURNING * INTO v_challenge;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'challenge_created',
        'authenticity_challenges',
        v_challenge.id,
        jsonb_build_object('advertiser_id', p_advertiser_id, 'expires_at', v_challenge.expires_at)
    );

    RETURN jsonb_build_object(
        'success', true,
        'challenge_id', v_challenge.id,
        'challenge_code', v_challenge.challenge_code,
        'expires_at', v_challenge.expires_at,
        'duration_seconds', 900
    );
END;
$$;

-- 3. Hardened RPC: submit_authenticity_video (Atomic single-use update with strict checks)
CREATE OR REPLACE FUNCTION public.submit_authenticity_video(
    p_challenge_id uuid,
    p_storage_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_challenge public.authenticity_challenges%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_updated_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_challenge FROM public.authenticity_challenges WHERE id = p_challenge_id;
    IF v_challenge.id IS NULL THEN
        RAISE EXCEPTION 'Challenge de autenticidade não encontrado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_challenge.advertiser_id;
    IF v_adv.profile_id <> v_profile_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Não autorizado a enviar para este challenge.';
    END IF;

    -- Atomic single-use update with server clock verification
    UPDATE public.authenticity_challenges
    SET status = 'submitted',
        used_at = now(),
        video_storage_path = p_storage_path,
        moderation_status = 'pending',
        updated_at = now()
    WHERE id = p_challenge_id
      AND advertiser_id = v_adv.id
      AND status = 'issued'
      AND expires_at > now()
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RAISE EXCEPTION 'Este challenge de autenticidade expirou, já foi utilizado ou é inválido. Solicite um novo código.';
    END IF;

    -- Create audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'evidence_uploaded',
        'authenticity_challenges',
        p_challenge_id,
        jsonb_build_object('advertiser_id', v_challenge.advertiser_id, 'storage_path', p_storage_path)
    );

    RETURN jsonb_build_object('success', true, 'status', 'submitted');
END;
$$;

-- 4. Hardened RPC: review_authenticity_video (Handles superseding previous verified records)
CREATE OR REPLACE FUNCTION public.review_authenticity_video(
    p_challenge_id uuid,
    p_action text, -- 'approve' or 'reject'
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_staff_id uuid;
    v_challenge public.authenticity_challenges%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação ou administração.';
    END IF;

    v_staff_id := public.current_profile_id();

    SELECT * INTO v_challenge FROM public.authenticity_challenges WHERE id = p_challenge_id;
    IF v_challenge.id IS NULL THEN
        RAISE EXCEPTION 'Challenge de autenticidade não encontrado.';
    END IF;

    IF p_action = 'approve' THEN
        -- Supersede any previously verified challenge for this advertiser
        UPDATE public.authenticity_challenges
        SET status = 'superseded', updated_at = now()
        WHERE advertiser_id = v_challenge.advertiser_id
          AND id <> p_challenge_id
          AND status = 'verified';

        -- Mark current challenge as verified
        UPDATE public.authenticity_challenges
        SET moderation_status = 'approved',
            status = 'verified',
            reviewed_by = v_staff_id,
            reviewed_at = now(),
            rejection_reason = NULL,
            updated_at = now()
        WHERE id = p_challenge_id;

        -- Set authenticity_verified = true on advertiser profile
        UPDATE public.advertiser_profiles
        SET authenticity_verified = true,
            updated_at = now()
        WHERE id = v_challenge.advertiser_id;

        -- Notify advertiser (No emojis)
        INSERT INTO public.notifications (profile_id, type, title, message)
        SELECT profile_id, 'authenticity_approved', 'Selo de Autenticidade Aprovado', 'Seu vídeo de autenticidade foi validado pela equipe e seu selo oficial já está ativo em seu perfil.'
        FROM public.advertiser_profiles WHERE id = v_challenge.advertiser_id;

    ELSIF p_action = 'reject' THEN
        UPDATE public.authenticity_challenges
        SET moderation_status = 'rejected',
            status = 'rejected',
            reviewed_by = v_staff_id,
            reviewed_at = now(),
            rejection_reason = COALESCE(p_reason, 'Vídeo não atende aos requisitos de clareza ou código exibido incorreto.'),
            updated_at = now()
        WHERE id = p_challenge_id;

        UPDATE public.advertiser_profiles
        SET authenticity_verified = false,
            updated_at = now()
        WHERE id = v_challenge.advertiser_id;

        -- Notify advertiser (No emojis)
        INSERT INTO public.notifications (profile_id, type, title, message)
        SELECT profile_id, 'authenticity_rejected', 'Vídeo de Autenticidade Não Aprovado', COALESCE(p_reason, 'O vídeo enviado não pôde ser validado. Por favor, grave um novo vídeo exibindo o código com nitidez.')
        FROM public.advertiser_profiles WHERE id = v_challenge.advertiser_id;
    ELSE
        RAISE EXCEPTION 'Ação inválida. Use "approve" ou "reject".';
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_staff_id,
        'authenticity_' || p_action || 'd',
        'authenticity_challenges',
        p_challenge_id,
        jsonb_build_object('advertiser_id', v_challenge.advertiser_id, 'action', p_action, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'action', p_action);
END;
$$;

-- 5. New RPC: revoke_authenticity (Allows authorized staff to immediately revoke trust badge)
CREATE OR REPLACE FUNCTION public.revoke_authenticity(
    p_advertiser_id uuid,
    p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_staff_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação ou administração.';
    END IF;

    IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
        RAISE EXCEPTION 'Motivo da revogação é obrigatório (mínimo 5 caracteres).';
    END IF;

    v_staff_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Revoke all verified challenges for this advertiser
    UPDATE public.authenticity_challenges
    SET status = 'revoked',
        rejection_reason = p_reason,
        reviewed_by = v_staff_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE advertiser_id = p_advertiser_id
      AND status = 'verified';

    -- Remove verified flag immediately
    UPDATE public.advertiser_profiles
    SET authenticity_verified = false,
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_staff_id,
        'authenticity_revoked',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('reason', p_reason)
    );

    -- Notification to advertiser
    INSERT INTO public.notifications (profile_id, type, title, message)
    VALUES (
        v_adv.profile_id,
        'authenticity_revoked',
        'Selo de Autenticidade Revogado',
        'O selo de autenticidade do seu perfil foi revogado: ' || p_reason
    );

    RETURN jsonb_build_object('success', true, 'status', 'revoked');
END;
$$;

-- 6. Hardened approve_advertiser_profile (Canonical Account Trial Replay Protection)
CREATE OR REPLACE FUNCTION public.approve_advertiser_profile(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_approved_media_count integer;
    v_premium_plan_id uuid;
    v_already_used_trial boolean := false;
BEGIN
    -- Verify staff permissions
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de moderação ou administração.';
    END IF;

    v_actor_id := public.current_profile_id();

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Concurrency check (optimistic lock)
    IF v_adv.profile_status = 'active' THEN
        RETURN jsonb_build_object('success', true, 'status', 'active', 'message', 'O perfil já se encontra aprovado e ativo.');
    END IF;

    -- Verify at least 1 approved media
    SELECT count(*) INTO v_approved_media_count
    FROM public.advertiser_media
    WHERE advertiser_id = p_advertiser_id
      AND moderation_status = 'approved'
      AND deleted_at IS NULL;

    IF v_approved_media_count = 0 THEN
        RAISE EXCEPTION 'O perfil precisa de pelo menos uma mídia aprovada antes da publicação.';
    END IF;

    -- Update profile status to active & record published timestamp
    UPDATE public.advertiser_profiles
    SET profile_status = 'active',
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        published_at = COALESCE(published_at, now()),
        rejection_reason = NULL,
        review_feedback = NULL,
        updated_at = now()
    WHERE id = p_advertiser_id;

    -- CANONICAL TRIAL REPLAY CHECK: Check across all advertiser profiles and subscription records for this user profile_id
    SELECT (
        v_adv.trial_used OR EXISTS (
            SELECT 1 FROM public.advertiser_profiles WHERE profile_id = v_adv.profile_id AND trial_used = true
        ) OR EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.advertiser_profiles ap ON s.advertiser_id = ap.id
            WHERE ap.profile_id = v_adv.profile_id AND s.provider = 'portal18_trial'
        )
    ) INTO v_already_used_trial;

    IF NOT v_already_used_trial THEN
        -- Find Premium plan id
        SELECT id INTO v_premium_plan_id FROM public.subscription_plans WHERE slug = 'premium' LIMIT 1;
        IF v_premium_plan_id IS NULL THEN
            SELECT id INTO v_premium_plan_id FROM public.subscription_plans ORDER BY price_amount DESC LIMIT 1;
        END IF;

        IF v_premium_plan_id IS NOT NULL THEN
            INSERT INTO public.subscriptions (
                advertiser_id,
                plan_id,
                provider,
                status,
                trial_start,
                trial_end,
                current_period_start,
                current_period_end
            )
            VALUES (
                p_advertiser_id,
                v_premium_plan_id,
                'portal18_trial',
                'active',
                now(),
                now() + INTERVAL '7 days',
                now(),
                now() + INTERVAL '7 days'
            );
        END IF;

        -- Mark trial as used on all advertiser profiles belonging to this canonical account
        UPDATE public.advertiser_profiles
        SET trial_used = true,
            trial_started_at = COALESCE(trial_started_at, now()),
            updated_at = now()
        WHERE profile_id = v_adv.profile_id;

        -- Notification with trial start announcement (No emojis)
        INSERT INTO public.notifications (profile_id, type, title, message)
        VALUES (
            v_adv.profile_id,
            'trial_started',
            'Seu Período Premium de 7 Dias Começou',
            'Seu anúncio foi aprovado e você recebeu 7 dias de recursos Premium para experimentar a plataforma.'
        );
    END IF;

    -- Insert Standard Profile Approved Notification (No emojis)
    INSERT INTO public.notifications (profile_id, type, title, message)
    VALUES (
        v_adv.profile_id,
        'profile_approved',
        'Perfil Aprovado com Sucesso',
        'Seu anúncio está publicado e disponível para busca e recomendações nacionais no Portal18.'
    );

    -- Audit log
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'approve_advertiser_profile',
        'advertiser_profiles',
        p_advertiser_id,
        jsonb_build_object('published_at', now(), 'trial_started', NOT v_already_used_trial)
    );

    RETURN jsonb_build_object('success', true, 'status', 'active');
END;
$$;
