import { Database } from './database.types';

// ============================================================================
// Database Generated Enums (Derived directly from PostgreSQL Enums)
// ============================================================================
export type ActivityBucket = Database['public']['Enums']['activity_bucket'];
export type BillingInterval = Database['public']['Enums']['billing_interval'];
export type CampaignStatus = Database['public']['Enums']['campaign_status'];
export type DiscountType = Database['public']['Enums']['discount_type'];
export type LocationPrecision = Database['public']['Enums']['location_precision'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type PaymentType = Database['public']['Enums']['payment_type'];
export type ProcessingStatus = Database['public']['Enums']['processing_status'];
export type PromotionPlacement = Database['public']['Enums']['promotion_placement'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

// ============================================================================
// Text + CHECK Domain Types (Mapped to PostgreSQL Constraints)
// ============================================================================
export type AccountType = 'user' | 'advertiser' | 'moderator' | 'admin' | 'super_admin';
export type ProfileStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'rejected';
export type Visibility = 'public' | 'private' | 'hidden';
export type VerificationStatus = 'not_started' | 'pending' | 'processing' | 'verified' | 'rejected' | 'requires_review' | 'expired';
export type ContactType = 'whatsapp' | 'telegram' | 'phone' | 'website' | 'email' | 'instagram' | 'twitter' | 'onlyfans' | 'privacy';
export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'age_18_verification' | 'commercial_terms' | 'marketing_cookies' | 'analytics_tracking';
export type MediaType = 'image' | 'photo' | 'video' | 'commercial_video' | 'audio' | 'profile_audio' | 'authenticity_video';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'blocked';
export type ModerationRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type ModerationCategory = 'nudity' | 'suggestive' | 'violence' | 'hate_speech' | 'minor' | 'spam' | 'other';
export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LegalDocumentType = 'terms_of_service' | 'privacy_policy' | 'advertiser_rules' | 'compliance_guide' | 'dmca_policy';

// Phase 27A Commercial Lifecycle & Authenticity Types
export type CommercialLifecycleState = 'trial' | 'active' | 'grace_period' | 'limited' | 'expired' | 'cancelled' | 'suspended';

export interface AuthenticityChallenge {
  id: string;
  advertiser_id: string;
  challenge_code: string;
  status: 'issued' | 'submitted' | 'expired' | 'verified' | 'rejected';
  issued_at: string;
  expires_at: string;
  used_at?: string | null;
  video_storage_path?: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustBadges {
  age_verified: boolean;
  identity_verified: boolean;
  authenticity_verified: boolean;
  phone_verified: boolean;
  media_verified: boolean;
}

// ============================================================================
// Database Table Row Types
// ============================================================================
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type BrazilState = Database['public']['Tables']['brazil_states']['Row'];
export type BrazilCity = Database['public']['Tables']['brazil_cities']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type AdvertiserProfile = Database['public']['Tables']['advertiser_profiles']['Row'] & {
  authenticity_verified?: boolean;
  audio_presentation_url?: string | null;
  trial_used?: boolean;
  trial_started_at?: string | null;
};
export type AdvertiserMedia = Database['public']['Tables']['advertiser_media']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
export type VerificationRequest = Database['public']['Tables']['verification_requests']['Row'];
export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type LegalDocument = Database['public']['Tables']['legal_documents']['Row'];
export type ConsentRecord = Database['public']['Tables']['consent_records']['Row'];
export type AdvertiserContact = Database['public']['Tables']['advertiser_contacts']['Row'];
export type ProfileContactEvent = Database['public']['Tables']['profile_contact_events']['Row'];
export type AdvertiserDailyStats = Database['public']['Tables']['advertiser_daily_stats']['Row'];
export type AdvertiserProfileHistory = Database['public']['Tables']['advertiser_profile_history']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type ModerationNote = Database['public']['Tables']['moderation_notes']['Row'];
export type ModerationFeedback = Database['public']['Tables']['moderation_feedback']['Row'];

// Phase 6 Commercial Types
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type PromotionProduct = Database['public']['Tables']['promotion_products']['Row'];
export type AdvertiserCampaign = Database['public']['Tables']['advertiser_campaigns']['Row'];
export type CampaignDailyStat = Database['public']['Tables']['campaign_daily_stats']['Row'];
export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type CouponRedemption = Database['public']['Tables']['coupon_redemptions']['Row'];

// Phase 7 Media & Processing Types
export type MediaProcessingJob = Database['public']['Tables']['media_processing_jobs']['Row'];
export type BlockedMediaHash = Database['public']['Tables']['blocked_media_hashes']['Row'];
export type AutomatedModerationResult = Database['public']['Tables']['automated_moderation_results']['Row'];
export type MediaUploadReservation = Database['public']['Tables']['media_upload_reservations']['Row'];

// Phase 8 Ranking & Discovery Types
export type AdvertiserRankingScore = Database['public']['Tables']['advertiser_ranking_scores']['Row'];
export type RankingWeights = Database['public']['Tables']['ranking_weights']['Row'];

// Phase 9 Account, Social & Personalization Types
export type ProfileFollow = Database['public']['Tables']['profile_follows']['Row'];
export type ProfileViewHistory = Database['public']['Tables']['profile_view_history']['Row'];
export type UserList = Database['public']['Tables']['user_lists']['Row'];
export type UserListItem = Database['public']['Tables']['user_list_items']['Row'];
export type UserBlock = Database['public']['Tables']['user_blocks']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferredCategory = Database['public']['Tables']['user_preferred_categories']['Row'];
export type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row'];
export type UserHiddenRecommendation = Database['public']['Tables']['user_hidden_recommendations']['Row'];

export interface UserRelationship {
  advertiser_id: string;
  is_favorite: boolean;
  is_following: boolean;
  is_blocked: boolean;
}

export interface DiscoveryProfileCard {
  advertiser_id: string;
  slug: string;
  stage_name: string;
  age: number;
  city_name: string;
  city_slug: string;
  state_code: string;
  headline: string | null;
  thumbnail_url: string | null;
  verification_status: string;
  activity_label: string;
  distance_label: string;
  is_sponsored: boolean;
  sponsored_placement_name?: string | null;
  organic_score: number;
  rank_position?: number;
  authenticity_verified?: boolean;
}

export interface NearbyCity {
  city_id: string;
  city_name: string;
  city_slug: string;
  state_code: string;
  distance_km: number;
  distance_label: string;
  active_advertisers_count: number;
}

export type DiscoveryIdentity = 'todos' | 'mulheres' | 'homens' | 'travestis_trans' | 'nao_binario_outros';
export type TargetAudienceOption = 'todos' | 'homens' | 'mulheres' | 'casais' | 'lgbtqia';
export type ServiceModalityOption = 'local_proprio' | 'hotel_motel' | 'domicilio' | 'viagem';

export interface DiscoveryFilters {
  query?: string;
  stateCode?: string;
  citySlug?: string;
  originCityId?: string;
  radiusKm?: number;
  categorySlug?: string;
  identity?: string;
  gender?: string;
  targetAudience?: string;
  serviceModality?: string;
  verifiedOnly?: boolean;
  withVideo?: boolean;
  activityFilter?: string;
  sortBy?: 'relevance' | 'recent' | 'active' | 'distance' | string;
  page?: number;
  limit?: number;
}

export interface MediaVariants {
  thumbnailUrl: string;
  cardUrl: string;
  profileUrl: string;
  fullUrl: string;
}

export interface MediaQuota {
  currentImages: number;
  maxImages: number;
  currentVideos: number;
  maxVideos: number;
  canUploadVideo: boolean;
}

// Raw View Row Type from Supabase
export type PublicAdvertiserRow = Database['public']['Views']['public_advertiser_profiles']['Row'];

// Validated Domain Public Advertiser Model
export type PublicAdvertiser = PublicAdvertiserRow & {
  advertiser_id: string;
  stage_name: string;
  slug: string;
  gender?: string | null;
  target_audience?: string[] | null;
  service_modalities?: string[] | null;
  authenticity_verified?: boolean | null;
  audio_presentation_url?: string | null;
  is_sponsored?: boolean;
  sponsored_placement_name?: string | null;
};

// Runtime type guard for domain invariants
export function isValidPublicAdvertiser(value: unknown): value is PublicAdvertiser {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.advertiser_id === 'string' &&
    p.advertiser_id.length > 0 &&
    typeof p.stage_name === 'string' &&
    p.stage_name.length > 0 &&
    typeof p.slug === 'string' &&
    p.slug.length > 0
  );
}

export interface UserSession {
  id: string;
  email: string;
  profile: Profile | null;
  roles: string[];
  isAdvertiser: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  isStaff: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExploreFilters {
  state?: string;
  city?: string;
  category?: string;
  gender?: string;
  identity?: string;
  targetAudience?: string;
  serviceModality?: string;
  ageRange?: string; // '18-24', '25-34', '35-44', '45+'
  verified?: boolean;
  withPhoto?: boolean;
  sort?: 'recommended' | 'recent' | 'active';
  page?: number;
  limit?: number;
}

export interface CompletenessItem {
  key: string;
  label: string;
  points: number;
  completed: boolean;
  actionUrl: string;
}

export interface CompletenessResult {
  score: number;
  isReadyForSubmission: boolean;
  items: CompletenessItem[];
  missingSuggestions: string[];
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalAdvertisers: number;
  activeProfiles: number;
  pendingProfiles: number;
  pendingMedia: number;
  openReports: number;
  criticalReports: number;
  pendingVerifications: number;
  suspendedProfiles: number;
  // Billing Metrics
  totalRevenueCents?: number;
  activeSubscriptions?: number;
  mrrCents?: number;
  totalPayments?: number;
  totalRefunds?: number;
}

export type VerificationType = 'identity_and_age' | 'age_only' | 'identity_only';

export interface VerificationSessionResponse {
  success: boolean;
  verificationId?: string;
  status?: string;
  sessionToken?: string;
  redirectUrl?: string;
  message?: string;
  error?: string;
}

export interface AdvertiserEntitlements {
  has_active_subscription: boolean;
  plan_name: string;
  plan_slug: string;
  lifecycle_state?: CommercialLifecycleState;
  media_limit: number;
  video_limit: number;
  boost_allowance: number;
  analytics_level: 'basic' | 'advanced' | 'premium' | 'none';
  audio_allowed?: boolean;
  commercial_video_allowed?: boolean;
  contacts_strategy?: 'full' | 'limited' | 'hidden';
  is_trial?: boolean;
  trial_days_remaining?: number;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  grace_period_end?: string | null;
  authenticity_verified?: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  subtotal?: number;
  discount?: number;
  totalAmount?: number;
  sessionToken?: string;
  redirectUrl?: string;
  error?: string;
}

// ============================================================================
// Phase 10 Models — Communication, Push, Help, Support, Trust, LGPD & Retention
// ============================================================================

export type CommunicationChannel = 'in_app' | 'email' | 'push';
export type CommunicationCategory = 
  | 'security' 
  | 'transactional' 
  | 'account' 
  | 'verification' 
  | 'billing' 
  | 'profile' 
  | 'moderation' 
  | 'platform' 
  | 'marketing';

export type CommunicationJobStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'dead_letter';
export type CommunicationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface CommunicationJob {
  id: string;
  profile_id: string | null;
  channel: CommunicationChannel;
  category: CommunicationCategory;
  template_code: string;
  payload: Record<string, any>;
  status: CommunicationJobStatus;
  priority: CommunicationPriority;
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
  dedupe_key?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: string;
  code: string;
  channel: CommunicationChannel;
  locale: string;
  subject: string;
  content_html: string;
  content_text: string;
  version: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent_hash?: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string;
  revoked_at?: string | null;
}

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  article_count?: number;
}

export interface HelpArticle {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  status: 'published' | 'draft' | 'archived';
  sort_order: number;
  helpful_count: number;
  unhelpful_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
}

export type SupportCategory = 
  | 'account' 
  | 'security' 
  | 'verification' 
  | 'profile' 
  | 'media' 
  | 'billing' 
  | 'technical' 
  | 'privacy' 
  | 'report' 
  | 'other';

export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  profile_id: string;
  category: SupportCategory;
  subject: string;
  description: string;
  priority: CommunicationPriority;
  status: SupportTicketStatus;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  author_profile_id: string;
  author_type: 'user' | 'staff' | 'system';
  message: string;
  attachments: { name: string; url: string; size: number; mime: string }[];
  created_at: string;
}

export type DataExportStatus = 'requested' | 'processing' | 'ready' | 'failed' | 'expired';

export interface DataExportRequest {
  id: string;
  profile_id: string;
  status: DataExportStatus;
  requested_at: string;
  processing_started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  storage_path?: string | null;
  file_size_bytes?: number | null;
  download_count: number;
  created_at: string;
  download_url?: string | null;
}

export type AccountDeletionStatus = 'requested' | 'scheduled' | 'cancelled' | 'processing' | 'completed' | 'failed' | 'blocked';

export interface AccountDeletionRequest {
  id: string;
  profile_id: string;
  status: AccountDeletionStatus;
  requested_at: string;
  scheduled_for: string;
  cancelled_at?: string | null;
  executed_at?: string | null;
  reason_optional?: string | null;
  blocked_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalHold {
  id: string;
  entity_type: 'profile' | 'advertiser' | 'payment' | 'media' | 'ticket';
  entity_id: string;
  reason: string;
  created_by: string;
  created_at: string;
  released_at?: string | null;
  released_by?: string | null;
}

export interface DataRetentionPolicy {
  id: string;
  policy_key: string;
  retention_days: number;
  description: string;
  updated_at: string;
}

// ============================================================================
// Phase 11 Models — Advanced Security, MFA, Sessions, Risk Engine & Incidents
// ============================================================================

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'password_reset_requested'
  | 'password_changed'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'mfa_failed'
  | 'new_device'
  | 'session_revoked'
  | 'suspicious_login'
  | 'rate_limit_triggered'
  | 'credential_stuffing_suspected'
  | 'account_takeover_suspected'
  | 'privilege_escalation_attempt'
  | 'cross_user_access_attempt'
  | 'webhook_signature_failure'
  | 'storage_violation';

export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type RiskType = 
  | 'account_abuse'
  | 'fake_profile'
  | 'impersonation'
  | 'media_abuse'
  | 'payment_abuse'
  | 'report_abuse'
  | 'promotion_abuse'
  | 'login_abuse'
  | 'spam'
  | 'automation_abuse'
  | 'identity_risk';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskAction = 'log' | 'notify' | 'challenge' | 'rate_limit' | 'manual_review' | 'temporary_block' | 'suspend';

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentSeverity = 'minor' | 'major' | 'critical';

export interface UserSessionRecord {
  id: string;
  profile_id: string;
  session_reference_hash: string;
  device_id: string;
  user_agent_summary: string;
  ip_hash: string;
  country?: string | null;
  region?: string | null;
  created_at: string;
  last_seen_at: string;
  revoked_at?: string | null;
  is_current?: boolean;
}

export interface TrustedDevice {
  id: string;
  profile_id: string;
  device_token_hash: string;
  device_name: string;
  first_seen_at: string;
  last_seen_at: string;
  trusted_at: string;
  revoked_at?: string | null;
}

export interface SecurityEvent {
  id: string;
  profile_id: string | null;
  event_type: SecurityEventType | string;
  severity: SecuritySeverity;
  risk_score: number;
  ip_hash: string;
  device_id?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  resolved_at?: string | null;
}

export interface RiskEvent {
  id: string;
  profile_id: string | null;
  advertiser_id?: string | null;
  risk_type: RiskType | string;
  severity: SecuritySeverity;
  score_delta: number;
  source: string;
  status: 'open' | 'resolved' | 'false_positive' | 'confirmed';
  metadata: Record<string, any>;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface AccountRiskScore {
  profile_id: string;
  score: number;
  risk_level: RiskLevel;
  last_calculated_at: string;
}

export interface RiskRule {
  id: string;
  code: string;
  event_type: string;
  score_delta: number;
  threshold: number;
  action: RiskAction;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  started_at: string;
  resolved_at?: string | null;
  public_message: string;
  internal_summary: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformKillSwitch {
  id: string;
  switch_key: string;
  enabled: boolean;
  reason?: string | null;
  updated_by?: string | null;
  updated_at: string;
}

// ============================================================================
// Phase 27B Models — Referral Program, Reward Ledger & Anti-Fraud Engine
// ============================================================================

export type ReferralState =
  | 'registered'
  | 'pending_qualification'
  | 'qualified'
  | 'rewarded'
  | 'rejected'
  | 'cancelled'
  | 'revoked'
  | 'flagged';

export type ReferralRiskStatus = 'normal' | 'manual_review' | 'blocked';
export type ReferralRewardType = 'bonus_days' | 'promotion_credit' | 'feature_unlock';
export type ReferralRewardStatus = 'granted' | 'consumed' | 'revoked' | 'expired';

export interface Referral {
  id: string;
  referrer_advertiser_id: string;
  referrer_profile_id: string;
  referred_advertiser_id: string;
  referred_profile_id: string;
  referral_code: string;
  status: ReferralState;
  risk_status: ReferralRiskStatus;
  risk_reasons?: string[] | null;
  qualification_due_at?: string | null;
  qualified_at?: string | null;
  rewarded_at?: string | null;
  policy_version: string;
  created_at: string;
  updated_at: string;
  referred_advertiser?: {
    stage_name?: string;
    city_name?: string;
    state_code?: string;
    profile_status?: string;
  };
}

export interface ReferralReward {
  id: string;
  advertiser_id: string;
  profile_id: string;
  referral_id: string;
  reward_type: ReferralRewardType;
  reward_value: number;
  status: ReferralRewardStatus;
  policy_version: string;
  granted_at: string;
  effective_at: string;
  expires_at: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  created_at: string;
}

export interface ReferralStats {
  referral_code: string;
  referral_url: string;
  total_referrals: number;
  pending_count: number;
  qualified_count: number;
  rewarded_count: number;
  total_bonus_days_earned: number;
  active_bonus_days: number;
}

// ============================================================================
// Phase 27C Models — Discovery Ranking, Sponsored Placement & Inventory Engine
// ============================================================================

export type InventoryPlacement =
  | 'homepage_featured'
  | 'city_top'
  | 'category_top'
  | 'search_boost'
  | 'regional_featured';

export type InventoryScopeType = 'global' | 'state' | 'city' | 'category' | 'city_category';

export interface CommercialInventorySlot {
  id: string;
  placement: InventoryPlacement;
  scope_type: InventoryScopeType;
  scope_id?: string | null;
  scope_name?: string | null;
  max_slots: number;
  max_sponsored_ratio: number;
  is_active: boolean;
  policy_version: string;
  created_at: string;
  updated_at: string;
}

export type DiscoveryEventType =
  | 'organic_impression'
  | 'sponsored_impression'
  | 'organic_click'
  | 'sponsored_click';

export interface DiscoveryImpressionEvent {
  id: string;
  event_type: DiscoveryEventType;
  advertiser_id: string;
  campaign_id?: string | null;
  placement: string;
  city_slug?: string | null;
  category_slug?: string | null;
  session_dedupe_key: string;
  policy_version: string;
  created_at: string;
}

export interface RankingDiagnostics {
  found: boolean;
  advertiser_id?: string;
  stage_name?: string;
  is_eligible?: boolean;
  ineligibility_reasons?: string[];
  has_active_campaign?: boolean;
  scores?: {
    organic_score: number;
    completeness_score: number;
    verification_score: number;
    freshness_score: number;
    quality_score: number;
    bayesian_ctr: number;
    new_profile_boost: number;
  };
  policy_version?: string;
  error?: string;
}

// ============================================================================
// Phase 27D Models — Advertiser Analytics, Funnel Intelligence & Performance
// ============================================================================

export interface FunnelTotals {
  impressions: number;
  profile_views: number;
  contact_clicks: number;
  profile_open_rate: number;
  contact_conversion_rate: number;
  overall_contact_rate: number;
}

export interface FunnelTrends {
  impressions_trend_percent: number;
  views_trend_percent: number;
  contacts_trend_percent: number;
}

export interface FunnelSourceMetric {
  impressions: number;
  views: number;
  contacts: number;
}

export interface FunnelSourceBreakdown {
  organic: FunnelSourceMetric;
  sponsored: FunnelSourceMetric;
  direct: FunnelSourceMetric;
}

export interface FunnelContactChannels {
  whatsapp: number;
  telegram: number;
  phone: number;
  website: number;
}

export interface FunnelTimeSeriesPoint {
  date: string;
  impressions: number;
  profile_views: number;
  contact_clicks: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'positive' | 'neutral' | 'warning' | 'info';
  title: string;
  description: string;
}

export interface ProfileQualityStatus {
  completeness_score: number;
  has_verified_badge: boolean;
  has_authenticity_badge: boolean;
  has_audio_presentation: boolean;
  has_headline: boolean;
  has_bio: boolean;
}

export interface AdvertiserFunnelAnalytics {
  success: boolean;
  period_days: number;
  advertiser_id: string;
  funnel: FunnelTotals;
  trends: FunnelTrends;
  sources: FunnelSourceBreakdown;
  channels: FunnelContactChannels;
  time_series: FunnelTimeSeriesPoint[];
  insights: PerformanceInsight[];
  quality: ProfileQualityStatus;
  error?: string;
}

export interface AdminPlatformAnalytics {
  success: boolean;
  period_days: number;
  funnel: {
    impressions: number;
    profile_views: number;
    contact_clicks: number;
    profile_open_rate: number;
    contact_conversion_rate: number;
  };
  distribution: {
    organic_impressions: number;
    sponsored_impressions: number;
    sponsored_share_percent: number;
  };
  operations: {
    active_advertisers: number;
    active_campaigns: number;
  };
  error?: string;
}

// ============================================================================
// Phase 27E Models — Plan Catalog, Billing Periods & Boost Marketplace
// ============================================================================

export interface BillingPeriod {
  id: string;
  slug: '7_days' | '30_days' | '90_days' | string;
  name: string;
  duration_days: number;
  display_order: number;
}

export interface PlanPeriodPricing {
  period_slug: string;
  duration_days: number;
  price_cents: number;
  currency: string;
}

export interface CatalogPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  media_limit: number;
  video_limit: number;
  boost_allowance: number;
  analytics_level: string;
  features: string[];
  pricing: Record<string, PlanPeriodPricing>;
}

export interface CommercialCatalog {
  success: boolean;
  plans: CatalogPlan[];
  periods: BillingPeriod[];
  boost_products: PromotionProduct[];
  policy_version: string;
}

export interface AdvertiserCommercialSummary {
  success: boolean;
  advertiser_id: string;
  entitlements: AdvertiserEntitlements;
  usage: {
    photos: { current: number; limit: number; can_add_more: boolean };
    videos: { current: number; limit: number; can_add_more: boolean };
    categories: { current: number; limit: number; can_add_more: boolean };
  };
  subscription: {
    id: string;
    plan_name: string;
    plan_slug: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  error?: string;
}
