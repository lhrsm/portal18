export type TrustSignalType =
  | 'authenticity_verified'
  | 'identity_verified'
  | 'age_verified'
  | 'media_verified'
  | 'phone_verified'
  | 'email_verified'
  | 'profile_complete'
  | 'profile_recently_updated'
  | 'review_history'
  | 'advertiser_responds_to_reviews';

export interface AdvertiserTrustSignal {
  id: string;
  advertiser_id: string;
  signal_type: TrustSignalType;
  status: 'active' | 'expired' | 'revoked';
  source: string;
  verified_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReviewAggregate {
  total: number;
  average: number;
  has_sufficient_sample: boolean;
  distribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
}

export interface PublicAdvertiserTrust {
  advertiser_id: string;
  published_since: string;
  signals: Array<{
    signal_type: TrustSignalType;
    verified_at: string;
    source: string;
  }>;
  reviews: ReviewAggregate;
}

export interface ProfileHealthDimension {
  key: string;
  label: string;
  status: 'good' | 'attention' | 'action_required';
  status_label: string;
  guidance: string;
}

export interface AdvertiserProfileHealth {
  advertiser_id: string;
  overall_status: 'healthy' | 'attention_needed';
  dimensions: ProfileHealthDimension[];
  last_evaluated_at: string;
}

export interface AdvertiserReputationSnapshot {
  id: string;
  advertiser_id: string;
  snapshot_date: string;
  approved_review_count: number;
  average_rating: number;
  authenticity_status: string;
  media_verified: boolean;
  profile_complete: boolean;
  freshness_status: string;
  created_at: string;
}

export interface AdminReputationOverview {
  totalProfiles: number;
  authenticProfiles: number;
  mediaVerifiedProfiles: number;
  totalReviews: number;
  avgPlatformRating: number;
  outliersCount: number;
  unansweredReviewsCount: number;
}

export type ReviewFilterType = 'recent' | 'highest_rating' | 'lowest_rating' | 'with_response';

