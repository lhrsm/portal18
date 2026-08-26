import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type BrazilState = Database['public']['Tables']['brazil_states']['Row'];
export type BrazilCity = Database['public']['Tables']['brazil_cities']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type AdvertiserProfile = Database['public']['Tables']['advertiser_profiles']['Row'];
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
  organic_score: number;
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

export interface DiscoveryFilters {
  query?: string;
  stateCode?: string;
  citySlug?: string;
  originCityId?: string;
  radiusKm?: number;
  categorySlug?: string;
  verifiedOnly?: boolean;
  withVideo?: boolean;
  activityFilter?: string;
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

// View Type
export type PublicAdvertiser = Database['public']['Views']['public_advertiser_profiles']['Row'];

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
  media_limit: number;
  video_limit: number;
  boost_allowance: number;
  analytics_level: 'basic' | 'advanced' | 'premium';
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


