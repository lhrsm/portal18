import { DiscoveryFilters, DiscoveryProfileCard, NearbyCity } from '@/types/app.types';

export interface SearchResult {
  profiles: DiscoveryProfileCard[];
  total: number;
  hasMore: boolean;
  page: number;
}

export interface NearbySearchParams {
  originCityId: string;
  radiusKm?: number;
  categorySlug?: string;
  limit?: number;
}

export interface SimilarProfilesParams {
  advertiserId: string;
  limit?: number;
}
