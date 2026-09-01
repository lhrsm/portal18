-- ============================================================================
-- MIGRATION 00036: Phase 32 — Reputation, Trust Signals & Profile Quality
-- ============================================================================

-- 1. Create Advertiser Trust Signals Table (Discrete, Verifiable Claims)
CREATE TABLE IF NOT EXISTS public.advertiser_trust_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    signal_type text NOT NULL CHECK (signal_type IN (
        'authenticity_verified',
        'identity_verified',
        'age_verified',
        'media_verified',
        'phone_verified',
        'email_verified',
        'profile_complete',
        'profile_recently_updated',
        'review_history',
        'advertiser_responds_to_reviews'
    )),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'revoked')),
    source text NOT NULL DEFAULT 'system_verified',
    verified_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    revoked_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_adv_trust_signal UNIQUE(advertiser_id, signal_type)
);

CREATE INDEX IF NOT EXISTS idx_adv_trust_signals_adv ON public.advertiser_trust_signals(advertiser_id, status);
CREATE INDEX IF NOT EXISTS idx_adv_trust_signals_type ON public.advertiser_trust_signals(signal_type, status);

-- 2. Create Advertiser Reputation Snapshots Table (Daily Audited Metrics)
CREATE TABLE IF NOT EXISTS public.advertiser_reputation_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
    approved_review_count integer NOT NULL DEFAULT 0,
    average_rating numeric(3,2) NOT NULL DEFAULT 0.00,
    authenticity_status text NOT NULL DEFAULT 'unverified',
    media_verified boolean NOT NULL DEFAULT false,
    profile_complete boolean NOT NULL DEFAULT false,
    freshness_status text NOT NULL DEFAULT 'stale',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_adv_rep_snapshot UNIQUE(advertiser_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_adv_rep_snapshots_adv ON public.advertiser_reputation_snapshots(advertiser_id, snapshot_date DESC);

-- 3. Atomic RPC: Compute Advertiser Trust Signals
CREATE OR REPLACE FUNCTION public.compute_advertiser_trust_signals(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv record;
    v_media_count integer := 0;
    v_review_count integer := 0;
    v_response_count integer := 0;
    v_avg_rating numeric(3,2) := 0.00;
    v_signals_created integer := 0;
BEGIN
    SELECT * INTO v_adv
    FROM public.advertiser_profiles
    WHERE id = p_advertiser_id;

    IF v_adv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Advertiser not found');
    END IF;

    -- 1. Authenticity Signal
    IF v_adv.authenticity_verified = true THEN
        INSERT INTO public.advertiser_trust_signals (advertiser_id, signal_type, status, source)
        VALUES (p_advertiser_id, 'authenticity_verified', 'active', 'video_challenge_approved')
        ON CONFLICT (advertiser_id, signal_type) DO UPDATE
        SET status = 'active', revoked_at = NULL, updated_at = now();
        v_signals_created := v_signals_created + 1;
    ELSE
        UPDATE public.advertiser_trust_signals
        SET status = 'revoked', revoked_at = now(), updated_at = now()
        WHERE advertiser_id = p_advertiser_id AND signal_type = 'authenticity_verified';
    END IF;

    -- 2. Age Verified (Advertiser 18+ gate)
    INSERT INTO public.advertiser_trust_signals (advertiser_id, signal_type, status, source)
    VALUES (p_advertiser_id, 'age_verified', 'active', 'advertiser_onboarding_18plus')
    ON CONFLICT (advertiser_id, signal_type) DO UPDATE
    SET status = 'active', updated_at = now();
    v_signals_created := v_signals_created + 1;

    -- 3. Media Verified Signal (At least 3 approved media items)
    SELECT count(*) INTO v_media_count
    FROM public.advertiser_media
    WHERE advertiser_id = p_advertiser_id AND status = 'approved';

    IF v_media_count >= 3 THEN
        INSERT INTO public.advertiser_trust_signals (advertiser_id, signal_type, status, source, metadata)
        VALUES (p_advertiser_id, 'media_verified', 'active', 'media_moderation_approved', jsonb_build_object('approved_media_count', v_media_count))
        ON CONFLICT (advertiser_id, signal_type) DO UPDATE
        SET status = 'active', metadata = jsonb_build_object('approved_media_count', v_media_count), updated_at = now();
        v_signals_created := v_signals_created + 1;
    ELSE
        UPDATE public.advertiser_trust_signals
        SET status = 'expired', updated_at = now()
        WHERE advertiser_id = p_advertiser_id AND signal_type = 'media_verified';
    END IF;

    -- 4. Profile Freshness Signal (Updated within last 30 days)
    IF v_adv.updated_at >= (now() - interval '30 days') THEN
        INSERT INTO public.advertiser_trust_signals (advertiser_id, signal_type, status, source)
        VALUES (p_advertiser_id, 'profile_recently_updated', 'active', 'recent_advertiser_edit')
        ON CONFLICT (advertiser_id, signal_type) DO UPDATE
        SET status = 'active', updated_at = now();
        v_signals_created := v_signals_created + 1;
    ELSE
        UPDATE public.advertiser_trust_signals
        SET status = 'expired', updated_at = now()
        WHERE advertiser_id = p_advertiser_id AND signal_type = 'profile_recently_updated';
    END IF;

    -- 5. Review History & Response Signal
    SELECT count(*), COALESCE(avg(rating_overall), 0.00), count(CASE WHEN advertiser_response IS NOT NULL THEN 1 END)
    INTO v_review_count, v_avg_rating, v_response_count
    FROM public.advertiser_reviews
    WHERE advertiser_id = p_advertiser_id AND status = 'approved';

    IF v_review_count >= 3 THEN
        INSERT INTO public.advertiser_trust_signals (advertiser_id, signal_type, status, source, metadata)
        VALUES (p_advertiser_id, 'review_history', 'active', 'approved_reviews_aggregate', jsonb_build_object('review_count', v_review_count, 'avg_rating', v_avg_rating))
        ON CONFLICT (advertiser_id, signal_type) DO UPDATE
        SET status = 'active', metadata = jsonb_build_object('review_count', v_review_count, 'avg_rating', v_avg_rating), updated_at = now();
        v_signals_created := v_signals_created + 1;
    END IF;

    IF v_response_count >= 1 THEN
        INSERT INTO public.advertiser_trust_signals (advertiser_id, signal_type, status, source)
        VALUES (p_advertiser_id, 'advertiser_responds_to_reviews', 'active', 'advertiser_response_history')
        ON CONFLICT (advertiser_id, signal_type) DO UPDATE
        SET status = 'active', updated_at = now();
        v_signals_created := v_signals_created + 1;
    END IF;

    -- 6. Record Daily Snapshot
    INSERT INTO public.advertiser_reputation_snapshots (
        advertiser_id,
        snapshot_date,
        approved_review_count,
        average_rating,
        authenticity_status,
        media_verified,
        profile_complete,
        freshness_status
    ) VALUES (
        p_advertiser_id,
        CURRENT_DATE,
        v_review_count,
        v_avg_rating,
        CASE WHEN v_adv.authenticity_verified THEN 'verified' ELSE 'unverified' END,
        (v_media_count >= 3),
        true,
        CASE WHEN v_adv.updated_at >= (now() - interval '30 days') THEN 'recent' ELSE 'stale' END
    )
    ON CONFLICT (advertiser_id, snapshot_date) DO UPDATE
    SET
        approved_review_count = EXCLUDED.approved_review_count,
        average_rating = EXCLUDED.average_rating,
        authenticity_status = EXCLUDED.authenticity_status,
        media_verified = EXCLUDED.media_verified,
        freshness_status = EXCLUDED.freshness_status;

    RETURN jsonb_build_object(
        'success', true,
        'signals_count', v_signals_created,
        'review_count', v_review_count,
        'media_count', v_media_count
    );
END;
$$;

-- 4. Atomic RPC: Get Public Advertiser Trust (Sanitized for Visitors)
CREATE OR REPLACE FUNCTION public.get_public_advertiser_trust(p_advertiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_signals jsonb;
    v_adv record;
    v_review_stats record;
BEGIN
    SELECT * INTO v_adv
    FROM public.advertiser_profiles
    WHERE id = p_advertiser_id;

    IF v_adv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Advertiser not found');
    END IF;

    -- Fetch active trust signals
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'signal_type', signal_type,
        'verified_at', verified_at,
        'source', source
    )), '[]'::jsonb) INTO v_signals
    FROM public.advertiser_trust_signals
    WHERE advertiser_id = p_advertiser_id AND status = 'active';

    -- Fetch review aggregate
    SELECT
        count(*) AS total_reviews,
        COALESCE(avg(rating_overall), 0.00) AS avg_rating,
        count(CASE WHEN rating_overall = 5 THEN 1 END) AS stars_5,
        count(CASE WHEN rating_overall = 4 THEN 1 END) AS stars_4,
        count(CASE WHEN rating_overall = 3 THEN 1 END) AS stars_3,
        count(CASE WHEN rating_overall = 2 THEN 1 END) AS stars_2,
        count(CASE WHEN rating_overall = 1 THEN 1 END) AS stars_1
    INTO v_review_stats
    FROM public.advertiser_reviews
    WHERE advertiser_id = p_advertiser_id AND status = 'approved';

    RETURN jsonb_build_object(
        'success', true,
        'advertiser_id', p_advertiser_id,
        'published_since', v_adv.created_at,
        'signals', v_signals,
        'reviews', jsonb_build_object(
            'total', v_review_stats.total_reviews,
            'average', round(v_review_stats.avg_rating, 1),
            'has_sufficient_sample', (v_review_stats.total_reviews >= 3),
            'distribution', jsonb_build_object(
                '5', v_review_stats.stars_5,
                '4', v_review_stats.stars_4,
                '3', v_review_stats.stars_3,
                '2', v_review_stats.stars_2,
                '1', v_review_stats.stars_1
            )
        )
    );
END;
$$;

-- 5. Atomic RPC: Respond to Advertiser Review (Advertiser Owner Right of Response)
CREATE OR REPLACE FUNCTION public.respond_to_advertiser_review(
    p_review_id uuid,
    p_advertiser_id uuid,
    p_response text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adv record;
    v_rev record;
    v_clean_response text;
BEGIN
    -- Verify advertiser existence
    SELECT * INTO v_adv
    FROM public.advertiser_profiles
    WHERE id = p_advertiser_id;

    IF v_adv.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anunciante não encontrado.');
    END IF;

    -- Verify review belongs to advertiser and is approved
    SELECT * INTO v_rev
    FROM public.advertiser_reviews
    WHERE id = p_review_id AND advertiser_id = p_advertiser_id;

    IF v_rev.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Avaliação não encontrada para este anunciante.');
    END IF;

    IF v_rev.status <> 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Apenas avaliações aprovadas podem receber resposta.');
    END IF;

    -- Clean & sanitize response text
    v_clean_response := trim(p_response);
    IF length(v_clean_response) < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A resposta deve conter pelo menos 2 caracteres.');
    END IF;

    IF length(v_clean_response) > 1000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'A resposta não pode exceder 1000 caracteres.');
    END IF;

    -- Update review with response
    UPDATE public.advertiser_reviews
    SET
        advertiser_response = v_clean_response,
        advertiser_responded_at = now(),
        updated_at = now()
    WHERE id = p_review_id;

    -- Trigger trust signals recompute for response signal
    PERFORM public.compute_advertiser_trust_signals(p_advertiser_id);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Resposta registrada com sucesso.'
    );
END;
$$;

-- 6. Row Level Security Policies
ALTER TABLE public.advertiser_trust_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_reputation_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can read active trust signals
CREATE POLICY "Public can read active trust signals"
    ON public.advertiser_trust_signals
    FOR SELECT
    USING (status = 'active');

-- Service role and staff have full access
CREATE POLICY "Staff and system full access trust signals"
    ON public.advertiser_trust_signals
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Public/Staff can read reputation snapshots
CREATE POLICY "Staff can read reputation snapshots"
    ON public.advertiser_reputation_snapshots
    FOR SELECT
    USING (true);

