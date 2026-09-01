import { DiscoveryProfileCard } from '@/types/app.types';

export interface AdvancedSearchFilters {
  query?: string;
  stateCode?: string;
  citySlug?: string;
  originCityId?: string;
  radiusKm?: number;
  categorySlug?: string;
  gender?: string;
  targetAudience?: string;
  serviceModality?: string;
  verifiedOnly?: boolean;
  mediaVerified?: boolean;
  withVideo?: boolean;
  withAudio?: boolean;
  withReviews?: boolean;
  recentlyUpdated?: boolean;
  activityFilter?: 'active_now' | 'active_today' | 'active_this_week';
  sortBy?: 'relevance' | 'recent' | 'active' | 'reviews';
  viewerId?: string;
  personalize?: boolean;
  page?: number;
  limit?: number;
}

export interface AutocompleteSuggestion {
  id: string;
  name?: string;
  stage_name?: string;
  slug: string;
  state_code?: string;
  state_slug?: string;
  city_name?: string;
  type: 'city' | 'category' | 'advertiser';
}

export interface AutocompleteResult {
  cities: AutocompleteSuggestion[];
  categories: AutocompleteSuggestion[];
  advertisers: AutocompleteSuggestion[];
}

export interface SearchSynonym {
  id: string;
  term: string;
  synonyms: string[];
  locale: string;
  status: 'draft' | 'active' | 'archived';
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  title: string;
  filters: AdvancedSearchFilters;
  notification_frequency: 'none' | 'instant' | 'daily' | 'weekly';
  last_notified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserDiscoveryPreferences {
  user_id: string;
  personalization_enabled: boolean;
  favorite_cities: { id: string; name: string; slug: string; state_code: string }[];
  preferred_categories: string[];
  target_audiences: string[];
  service_modalities: string[];
  created_at: string;
  updated_at: string;
}

export interface RecommendationSection {
  title: string;
  description: string;
  tag?: string;
  profiles: DiscoveryProfileCard[];
}

export interface SearchAnalyticsAggregate {
  normalized_query: string;
  total_searches: number;
  zero_results_count: number;
  last_searched_at: string;
}

export interface SearchDiagnosticsResult {
  normalized_query: string;
  expanded_synonyms: string[];
  matched_intent?: {
    city?: string;
    state?: string;
    category?: string;
    identity?: string;
  };
  total_results: number;
  top_score: number;
}
