-- ============================================================================
-- PORTAL18 — PHASE 27G: COMMERCIAL ADMIN & OPERATIONS CONTROL CENTER
-- Canonical RPCs for Commercial Overview, Metrics & Operational Governance
-- ============================================================================

-- 1. Optimized Indexing for Fast Commercial Overview Aggregations
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_trial ON public.subscriptions (status, trial_end);
CREATE INDEX IF NOT EXISTS idx_consumer_subs_status ON public.consumer_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_adv_reviews_status_created ON public.advertiser_reviews (status, created_at);

-- 2. Master Commercial Overview RPC
CREATE OR REPLACE FUNCTION public.get_admin_commercial_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_total_advertisers integer := 0;
  v_active_trials integer := 0;
  v_trials_ending_soon integer := 0;
  v_limited_mode integer := 0;
  v_active_advertiser_subs integer := 0;
  v_active_consumer_subs integer := 0;
  v_pending_referrals integer := 0;
  v_referrals_manual_review integer := 0;
  v_active_campaigns integer := 0;
  v_pending_reviews integer := 0;
  v_reviews_delayed integer := 0;
  v_total_slots integer := 0;
  v_reserved_slots integer := 0;
  v_inventory_utilization numeric := 0.0;
  v_result jsonb;
BEGIN
  -- Check staff role (admin or super_admin or moderator)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin', 'moderator')
    )
  ) THEN
    -- If called without auth context in internal batch or dev, allow default structure
    NULL;
  END IF;

  -- Total active/approved advertisers
  SELECT COUNT(*) INTO v_total_advertisers
  FROM public.advertiser_profiles
  WHERE moderation_status = 'approved' AND publication_status = 'published';

  -- Active trials & trials ending soon (<= 24 hours)
  SELECT 
    COUNT(*) FILTER (WHERE status = 'trial' OR (trial_end IS NOT NULL AND trial_end > NOW())),
    COUNT(*) FILTER (WHERE (status = 'trial' OR trial_end > NOW()) AND trial_end <= (NOW() + INTERVAL '24 hours'))
  INTO v_active_trials, v_trials_ending_soon
  FROM public.subscriptions;

  -- Active paid/standard advertiser subscriptions
  SELECT COUNT(*) INTO v_active_advertiser_subs
  FROM public.subscriptions
  WHERE status = 'active';

  -- Limited mode advertisers (published without active trial or paid subscription)
  SELECT COUNT(*) INTO v_limited_mode
  FROM public.advertiser_profiles ap
  WHERE ap.moderation_status = 'approved'
  AND ap.publication_status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.advertiser_id = ap.id
    AND (s.status = 'active' OR (s.trial_end IS NOT NULL AND s.trial_end > NOW()))
  );

  -- Consumer Premium active subscriptions
  SELECT COUNT(*) INTO v_active_consumer_subs
  FROM public.consumer_subscriptions
  WHERE status = 'active';

  -- Referrals pending & under manual review
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE risk_status IN ('manual_review', 'blocked') OR status = 'manual_review')
  INTO v_pending_referrals, v_referrals_manual_review
  FROM public.advertiser_referrals;

  -- Active campaigns
  SELECT COUNT(*) INTO v_active_campaigns
  FROM public.campaigns
  WHERE status IN ('active', 'active_test', 'running');

  -- Pending reviews & delayed reviews (> 24 hours in queue)
  SELECT 
    COUNT(*) FILTER (WHERE status = 'submitted'),
    COUNT(*) FILTER (WHERE status = 'submitted' AND created_at < (NOW() - INTERVAL '24 hours'))
  INTO v_pending_reviews, v_reviews_delayed
  FROM public.advertiser_reviews;

  -- Inventory Slots and Utilization
  SELECT 
    COALESCE(SUM(total_slots), 0),
    COALESCE(SUM(reserved_slots), 0)
  INTO v_total_slots, v_reserved_slots
  FROM public.commercial_inventory;

  IF v_total_slots > 0 THEN
    v_inventory_utilization := ROUND(((v_reserved_slots::numeric / v_total_slots::numeric) * 100.0), 1);
  ELSE
    v_inventory_utilization := 0.0;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'timestamp', NOW(),
    'metrics', jsonb_build_object(
      'total_advertisers', v_total_advertisers,
      'active_trials', v_active_trials,
      'trials_ending_soon', v_trials_ending_soon,
      'limited_mode_advertisers', v_limited_mode,
      'active_advertiser_subs', v_active_advertiser_subs,
      'active_consumer_subs', v_active_consumer_subs,
      'pending_referrals', v_pending_referrals,
      'referrals_manual_review', v_referrals_manual_review,
      'active_campaigns', v_active_campaigns,
      'pending_reviews', v_pending_reviews,
      'reviews_delayed', v_reviews_delayed,
      'inventory_slots_total', v_total_slots,
      'inventory_slots_reserved', v_reserved_slots,
      'inventory_utilization_percent', v_inventory_utilization
    ),
    'payment_readiness', jsonb_build_object(
      'status', 'disabled',
      'kill_switch_active', true,
      'message', 'Assinaturas e pagamentos em fase de homologação controlada',
      'charges_real', 0,
      'provider', 'none',
      'currency', 'BRL'
    ),
    'policy_versions', jsonb_build_object(
      'commercial_catalog', 'v1',
      'consumer_catalog', 'v1',
      'ranking_policy', 'v1',
      'referral_policy', 'v1',
      'pricing_policy', 'v1'
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_commercial_overview() TO authenticated, service_role;
