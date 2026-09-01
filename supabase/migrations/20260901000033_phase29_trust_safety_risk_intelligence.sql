-- ============================================================================
-- MIGRATION 00033: Phase 29 — Trust & Safety, Anti-Fraud & Risk Intelligence
-- ============================================================================

-- 1. Create Risk Signals Table
CREATE TABLE IF NOT EXISTS public.risk_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type text NOT NULL
        CHECK (subject_type IN ('user', 'advertiser', 'profile', 'referral', 'review', 'report', 'payment', 'session', 'device')),
    subject_id text NOT NULL,
    signal_type text NOT NULL,
    severity text NOT NULL
        CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    confidence text NOT NULL
        CHECK (confidence IN ('low', 'medium', 'high')),
    source text NOT NULL
        CHECK (source IN ('system_rule', 'moderation', 'user_report', 'support', 'auth', 'referral', 'review', 'payment', 'provider', 'staff', 'automated_detection')),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive', 'expired', 'archived')),
    policy_version text NOT NULL DEFAULT '1.0',
    first_seen_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_signals_subject ON public.risk_signals(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_risk_signals_severity ON public.risk_signals(severity, status);

-- 2. Create Trust & Safety Cases Table
CREATE TABLE IF NOT EXISTS public.trust_safety_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number text UNIQUE NOT NULL,
    subject_type text NOT NULL,
    subject_id text NOT NULL,
    title text NOT NULL,
    description text,
    priority text NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    status text NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'triage', 'investigating', 'waiting_user', 'waiting_external', 'action_required', 'resolved', 'closed', 'appealed', 'reopened')),
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    sla_due_at timestamptz,
    resolution text,
    resolved_at timestamptz,
    resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ts_cases_status_prio ON public.trust_safety_cases(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ts_cases_assigned ON public.trust_safety_cases(assigned_to);

-- 3. Case Signal Links (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.case_signal_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.trust_safety_cases(id) ON DELETE CASCADE,
    signal_id uuid NOT NULL REFERENCES public.risk_signals(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_case_signal UNIQUE(case_id, signal_id)
);

-- 4. Case Internal Notes (Staff-only, private)
CREATE TABLE IF NOT EXISTS public.case_internal_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.trust_safety_cases(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_notes_parent ON public.case_internal_notes(case_id);

-- 5. Sanctions Table (Tiered, Proportional)
CREATE TABLE IF NOT EXISTS public.sanctions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type text NOT NULL,
    subject_id text NOT NULL,
    case_id uuid REFERENCES public.trust_safety_cases(id) ON DELETE SET NULL,
    sanction_type text NOT NULL
        CHECK (sanction_type IN ('warning', 'feature_restriction', 'upload_restriction', 'review_restriction', 'referral_restriction', 'contact_change_hold', 'temporary_account_hold', 'profile_unpublished', 'account_suspended', 'account_terminated')),
    scope text NOT NULL DEFAULT 'account'
        CHECK (scope IN ('account', 'advertiser_profile', 'reviews', 'referrals', 'uploads')),
    duration text NOT NULL DEFAULT 'temporary'
        CHECK (duration IN ('temporary', 'indefinite', 'permanent')),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'lifted', 'expired', 'overturned_on_appeal')),
    reason_internal text NOT NULL,
    reason_public text NOT NULL,
    starts_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz,
    applied_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    lifted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    lifted_reason text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_subject ON public.sanctions(subject_type, subject_id, status);

-- 6. Appeals Table (Independent Four-Eyes Review)
CREATE TABLE IF NOT EXISTS public.appeals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sanction_id uuid REFERENCES public.sanctions(id) ON DELETE SET NULL,
    case_id uuid REFERENCES public.trust_safety_cases(id) ON DELETE SET NULL,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_type text NOT NULL,
    subject_id text NOT NULL,
    reason text NOT NULL,
    evidence_urls text[] NOT NULL DEFAULT '{}',
    status text NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'under_review', 'additional_information_requested', 'upheld', 'modified', 'overturned', 'closed')),
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    decision_notes text,
    decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    decided_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_profile ON public.appeals(profile_id);

-- 7. Blocked Media Fingerprints (Perceptual and Cryptographic Catalogue)
CREATE TABLE IF NOT EXISTS public.blocked_media_fingerprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_hash text UNIQUE NOT NULL,
    hash_type text NOT NULL DEFAULT 'sha256'
        CHECK (hash_type IN ('sha256', 'phash', 'md5')),
    block_reason text NOT NULL,
    severity text NOT NULL DEFAULT 'high'
        CHECK (severity IN ('critical', 'high', 'medium')),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_hashes ON public.blocked_media_fingerprints(media_hash);

-- 8. Atomic RPC: Record Risk Signal with Deduplication
CREATE OR REPLACE FUNCTION public.record_risk_signal(
    p_subject_type text,
    p_subject_id text,
    p_signal_type text,
    p_severity text,
    p_confidence text,
    p_source text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_signal_id uuid;
BEGIN
    -- Check if active identical signal was recently recorded in the last 24h
    SELECT id INTO v_signal_id
    FROM public.risk_signals
    WHERE subject_type = p_subject_type
      AND subject_id = p_subject_id
      AND signal_type = p_signal_type
      AND status = 'active'
      AND created_at > now() - interval '24 hours'
    LIMIT 1;

    IF v_signal_id IS NOT NULL THEN
        UPDATE public.risk_signals
        SET last_seen_at = now(),
            metadata = metadata || p_metadata
        WHERE id = v_signal_id;
        RETURN v_signal_id;
    END IF;

    INSERT INTO public.risk_signals (
        subject_type,
        subject_id,
        signal_type,
        severity,
        confidence,
        source,
        status,
        metadata
    ) VALUES (
        p_subject_type,
        p_subject_id,
        p_signal_type,
        p_severity,
        p_confidence,
        p_source,
        'active',
        p_metadata
    )
    RETURNING id INTO v_signal_id;

    RETURN v_signal_id;
END;
$$;

-- 9. Atomic RPC: Create or Escalate T&S Case
CREATE OR REPLACE FUNCTION public.create_or_escalate_ts_case(
    p_subject_type text,
    p_subject_id text,
    p_title text,
    p_priority text,
    p_description text,
    p_signal_ids uuid[] DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_case_id uuid;
    v_case_number text;
    v_sig_id uuid;
    v_sla_hours integer := 24;
BEGIN
    IF p_priority = 'critical' THEN
        v_sla_hours := 4;
    ELSIF p_priority = 'high' THEN
        v_sla_hours := 12;
    END IF;

    -- Check if open case exists for this subject
    SELECT id, case_number INTO v_case_id, v_case_number
    FROM public.trust_safety_cases
    WHERE subject_type = p_subject_type
      AND subject_id = p_subject_id
      AND status IN ('open', 'triage', 'investigating', 'action_required')
    LIMIT 1;

    IF v_case_id IS NULL THEN
        v_case_number := 'TSC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

        INSERT INTO public.trust_safety_cases (
            case_number,
            subject_type,
            subject_id,
            title,
            description,
            priority,
            status,
            sla_due_at
        ) VALUES (
            v_case_number,
            p_subject_type,
            p_subject_id,
            p_title,
            p_description,
            p_priority,
            'open',
            now() + (v_sla_hours || ' hours')::interval
        )
        RETURNING id INTO v_case_id;
    ELSE
        -- Escalate priority if higher
        IF p_priority = 'critical' THEN
            UPDATE public.trust_safety_cases
            SET priority = 'critical',
                sla_due_at = LEAST(sla_due_at, now() + interval '4 hours'),
                updated_at = now()
            WHERE id = v_case_id;
        END IF;
    END IF;

    -- Link signals
    FOREACH v_sig_id IN ARRAY p_signal_ids LOOP
        INSERT INTO public.case_signal_links (case_id, signal_id)
        VALUES (v_case_id, v_sig_id)
        ON CONFLICT (case_id, signal_id) DO NOTHING;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'case_id', v_case_id,
        'case_number', v_case_number
    );
END;
$$;

-- 10. Atomic RPC: Apply Sanction with Idempotency
CREATE OR REPLACE FUNCTION public.apply_sanction(
    p_subject_type text,
    p_subject_id text,
    p_case_id uuid,
    p_sanction_type text,
    p_scope text,
    p_duration text,
    p_duration_days integer,
    p_reason_internal text,
    p_reason_public text,
    p_applied_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sanction_id uuid;
    v_ends_at timestamptz := NULL;
BEGIN
    IF p_duration = 'temporary' AND p_duration_days IS NOT NULL AND p_duration_days > 0 THEN
        v_ends_at := now() + (p_duration_days || ' days')::interval;
    END IF;

    INSERT INTO public.sanctions (
        subject_type,
        subject_id,
        case_id,
        sanction_type,
        scope,
        duration,
        status,
        reason_internal,
        reason_public,
        starts_at,
        ends_at,
        applied_by
    ) VALUES (
        p_subject_type,
        p_subject_id,
        p_case_id,
        p_sanction_type,
        p_scope,
        p_duration,
        'active',
        p_reason_internal,
        p_reason_public,
        now(),
        v_ends_at,
        p_applied_by
    )
    RETURNING id INTO v_sanction_id;

    -- Log audit
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        new_data
    ) VALUES (
        p_applied_by,
        'sanction_applied',
        'sanctions',
        v_sanction_id,
        jsonb_build_object(
            'sanction_type', p_sanction_type,
            'subject_type', p_subject_type,
            'subject_id', p_subject_id,
            'duration', p_duration,
            'ends_at', v_ends_at
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'sanction_id', v_sanction_id
    );
END;
$$;

-- 11. Atomic RPC: Resolve Appeal with Independent Review Enforcement
CREATE OR REPLACE FUNCTION public.resolve_appeal(
    p_appeal_id uuid,
    p_decision text, -- 'upheld', 'modified', 'overturned'
    p_decision_notes text,
    p_decided_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appeal public.appeals%ROWTYPE;
    v_sanction public.sanctions%ROWTYPE;
BEGIN
    SELECT * INTO v_appeal
    FROM public.appeals
    WHERE id = p_appeal_id
    FOR UPDATE;

    IF v_appeal.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Recurso não encontrado.');
    END IF;

    IF v_appeal.status IN ('upheld', 'overturned', 'closed') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Recurso já foi deliberado anteriormente.');
    END IF;

    IF v_appeal.sanction_id IS NOT NULL THEN
        SELECT * INTO v_sanction
        FROM public.sanctions
        WHERE id = v_appeal.sanction_id;

        -- Four-Eyes Review Guard: decided_by cannot be applied_by
        IF v_sanction.applied_by IS NOT NULL AND v_sanction.applied_by = p_decided_by THEN
            RETURN jsonb_build_object('success', false, 'error', 'Princípio de Revisão Independente: o recurso não pode ser julgado pelo mesmo moderador que aplicou a sanção.');
        END IF;
    END IF;

    -- Update appeal
    UPDATE public.appeals
    SET
        status = p_decision,
        decision_notes = p_decision_notes,
        decided_by = p_decided_by,
        decided_at = now()
    WHERE id = p_appeal_id;

    -- If overturned, lift active sanction
    IF p_decision = 'overturned' AND v_appeal.sanction_id IS NOT NULL THEN
        UPDATE public.sanctions
        SET
            status = 'overturned_on_appeal',
            lifted_by = p_decided_by,
            lifted_reason = 'Recurso provido: ' || p_decision_notes
        WHERE id = v_appeal.sanction_id;
    END IF;

    -- Log audit
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity,
        entity_id,
        new_data
    ) VALUES (
        p_decided_by,
        'appeal_resolved',
        'appeals',
        p_appeal_id,
        jsonb_build_object(
            'decision', p_decision,
            'notes', p_decision_notes,
            'sanction_id', v_appeal.sanction_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'appeal_id', p_appeal_id,
        'status', p_decision
    );
END;
$$;
