import { createClient } from '@/lib/supabase/client';
import { DiscoveryProfileCard } from '@/types/app.types';
import { AdvancedSearchFilters, AutocompleteResult } from './types';
import { searchQueryNormalizer } from './searchQueryNormalizer';

export interface SearchExecutionResult {
  profiles: DiscoveryProfileCard[];
  total: number;
  hasMore: boolean;
  page: number;
  normalizedQuery: string;
}

export const advancedSearchService = {
  /**
   * Executes Advanced Discovery Search with full filter matrix and deduplication.
   */
  async search(filters: AdvancedSearchFilters): Promise<SearchExecutionResult> {
    const supabase = createClient();
    const limit = filters.limit || 24;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const normalizedQuery = searchQueryNormalizer.normalize(filters.query || '');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('search_profiles_discovery_v3', {
        p_query: normalizedQuery || null,
        p_state_code: filters.stateCode || null,
        p_city_slug: filters.citySlug || null,
        p_origin_city_id: filters.originCityId || null,
        p_radius_km: filters.radiusKm || 50,
        p_category_slug: filters.categorySlug || null,
        p_gender: filters.gender || null,
        p_target_audience: filters.targetAudience || null,
        p_service_modality: filters.serviceModality || null,
        p_verified_only: Boolean(filters.verifiedOnly),
        p_media_verified: Boolean(filters.mediaVerified),
        p_with_video: Boolean(filters.withVideo),
        p_with_audio: Boolean(filters.withAudio),
        p_with_reviews: Boolean(filters.withReviews),
        p_recently_updated: Boolean(filters.recentlyUpdated),
        p_activity_filter: filters.activityFilter || null,
        p_sort_by: filters.sortBy || 'relevance',
        p_viewer_id: filters.viewerId || null,
        p_limit: limit + 1,
        p_offset: offset,
      });

      if (!error && data && data.length > 0) {
        const rows = data as DiscoveryProfileCard[];
        const hasMore = rows.length > limit;
        const profiles = hasMore ? rows.slice(0, limit) : rows;

        // Record aggregated query event asynchronously
        if (normalizedQuery) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.rpc as any)('record_search_query_event', {
            p_normalized_query: normalizedQuery,
            p_is_zero_result: false,
          }).catch(() => {});
        }

        return {
          profiles,
          total: profiles.length,
          hasMore,
          page,
          normalizedQuery,
        };
      }
    } catch {
      // Fallback
    }

    // Fallback to public profiles service
    const { publicProfilesService } = await import('@/services/publicProfilesService');
    const fallback = await publicProfilesService.getPublicAdvertisers({
      state: filters.stateCode,
      city: filters.citySlug,
      category: filters.categorySlug,
      gender: filters.gender,
      targetAudience: filters.targetAudience,
      serviceModality: filters.serviceModality,
      verified: filters.verifiedOnly,
      page,
      limit,
    });

    const fallbackCards: DiscoveryProfileCard[] = fallback.data.map((p) => ({
      advertiser_id: p.advertiser_id,
      stage_name: p.stage_name,
      slug: p.slug,
      age: p.age || 18,
      city_name: p.city_name || '',
      city_slug: p.city_slug || '',
      state_code: p.state_code || '',
      headline: p.headline,
      thumbnail_url: p.primary_photo_url,
      verification_status: p.verification_status || 'verified',
      activity_label: 'Ativo recentemente',
      distance_label: p.neighborhood || 'Região',
      organic_score: 85,
      is_sponsored: false,
    }));

    if (normalizedQuery && fallbackCards.length === 0) {
      // Record zero-result event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.rpc as any)('record_search_query_event', {
        p_normalized_query: normalizedQuery,
        p_is_zero_result: true,
      }).catch(() => {});
    }

    return {
      profiles: fallbackCards,
      total: fallback.totalCount,
      hasMore: fallback.hasMore,
      page,
      normalizedQuery,
    };
  },

  /**
   * Multi-entity autocomplete for cities, categories, and stage names.
   */
  async autocomplete(query: string, limit = 8): Promise<AutocompleteResult> {
    const cleanQuery = searchQueryNormalizer.normalize(query);
    if (!cleanQuery || cleanQuery.length < 2) {
      return { cities: [], categories: [], advertisers: [] };
    }

    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('autocomplete_search_v1', {
        p_query: cleanQuery,
        p_limit: limit,
      });

      if (!error && data) {
        return data as AutocompleteResult;
      }
    } catch {
      // Fallback to empty
    }

    return { cities: [], categories: [], advertisers: [] };
  },
};
