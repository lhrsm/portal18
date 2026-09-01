export type CityReadinessStatus =
  | 'inactive'
  | 'emerging'
  | 'ready'
  | 'active'
  | 'high_activity';

export interface RegionalGrowthStats {
  id: string;
  state_code: string;
  city_slug: string;
  city_name: string;
  readiness_status: CityReadinessStatus;
  active_profiles_count: number;
  verified_profiles_count: number;
  search_impressions_count: number;
  contact_clicks_count: number;
  advertiser_signups_count: number;
  last_calculated_at: string;
}

export interface GrowthPagePolicy {
  id: string;
  page_path: string;
  page_type: 'state' | 'city' | 'category' | 'landing' | 'filter_combination';
  is_indexable: boolean;
  min_profile_threshold: number;
  custom_h1?: string | null;
  custom_intro?: string | null;
  quality_score: number;
  editorial_status: 'draft' | 'review' | 'published' | 'archived';
  updated_at: string;
}

export interface GrowthExperiment {
  id: string;
  experiment_key: string;
  name: string;
  hypothesis: string;
  variants: string[];
  target_page: string;
  primary_metric: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  traffic_allocation: number;
  created_at: string;
}

export interface AcquisitionAttributionLog {
  id: string;
  session_id: string;
  event_name: string;
  landing_page: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_host?: string | null;
  created_at: string;
}

export type OpportunitySignal =
  | 'high_search_low_supply'
  | 'growing_views'
  | 'high_contact_conversion'
  | 'advertiser_gap'
  | 'new_city_activation';
