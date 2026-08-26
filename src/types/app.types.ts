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
