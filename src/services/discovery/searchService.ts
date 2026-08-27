import { createClient } from '@/lib/supabase/client';
import { DiscoveryFilters, DiscoveryProfileCard, NearbyCity, RankingWeights } from '@/types/app.types';
import { SearchResult } from './types';

export const searchService = {
  /**
   * Main Discovery search RPC call supporting text FTS (unaccent), state/city, proximity radius, categories, and verified filters.
   */
  async searchProfiles(filters: DiscoveryFilters): Promise<SearchResult> {
    const supabase = createClient();
    const limit = filters.limit || 24;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('search_profiles_discovery', {
      p_query: filters.query || null,
      p_state_code: filters.stateCode || null,
      p_city_slug: filters.citySlug || null,
      p_origin_city_id: filters.originCityId || null,
      p_radius_km: filters.radiusKm || 50,
      p_category_slug: filters.categorySlug || null,
      p_verified_only: Boolean(filters.verifiedOnly),
      p_with_video: Boolean(filters.withVideo),
      p_activity_filter: filters.activityFilter || null,
      p_limit: limit + 1, // Fetch +1 to check for hasMore without full count query
      p_offset: offset,
    });

    if (error || !data || data.length === 0) {
      // Seamless fallback to public profiles
      const { publicProfilesService } = await import('@/services/publicProfilesService');
      const fallback = await publicProfilesService.getPublicAdvertisers({
        state: filters.stateCode,
        city: filters.citySlug,
        category: filters.categorySlug,
        verified: filters.verifiedOnly,
        page,
        limit,
      });

      const fallbackCards: DiscoveryProfileCard[] = fallback.data.map((p) => ({
        advertiser_id: p.advertiser_id,
        stage_name: p.stage_name,
        slug: p.slug,
        age: p.age,
        city_name: p.city_name,
        city_slug: p.city_slug,
        state_code: p.state_code,
        state_slug: p.state_slug,
        headline: p.headline,
        thumbnail_url: p.primary_photo_url,
        verification_status: p.verification_status,
        activity_label: 'Ativo recentemente',
        distance_label: p.neighborhood ? p.neighborhood : undefined,
        is_sponsored: false,
      }));

      return {
        profiles: fallbackCards,
        total: fallback.totalCount,
        hasMore: fallback.hasMore,
        page,
      };
    }

    const rows = (data || []) as DiscoveryProfileCard[];
    const hasMore = rows.length > limit;
    const profiles = hasMore ? rows.slice(0, limit) : rows;

    return {
      profiles,
      total: profiles.length,
      hasMore,
      page,
    };
  },

  /**
   * Retrieves neighboring cities with active advertiser profile counts within a specified radius.
   */
  async getNearbyCities(cityId: string, radiusKm = 50): Promise<NearbyCity[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_nearby_cities', {
      p_city_id: cityId,
      p_radius_km: radiusKm,
    });

    if (error) {
      console.error('Error fetching nearby cities:', error);
      return [];
    }

    return (data || []) as NearbyCity[];
  },

  /**
   * Retrieves current algorithmic ranking weights configured by Super Admin.
   */
  async getRankingWeights(): Promise<RankingWeights | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ranking_weights')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching ranking weights:', error);
      return null;
    }
    return data as RankingWeights | null;
  },

  /**
   * Updates ranking weights (Restricted to Super Admin with RLS).
   */
  async updateRankingWeights(weights: Partial<RankingWeights>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { data: current } = await (supabase.from('ranking_weights').select('id').limit(1).maybeSingle() as any);

    if (!current) {
      return { success: false, error: 'Configuração de pesos não encontrada.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('ranking_weights') as any)
      .update({
        ...weights,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (current as any).id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Recalculates organic ranking scores for an individual advertiser or all profiles.
   */
  async recalculateRankings(advertiserId?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('recalculate_advertiser_rankings', {
      p_advertiser_id: advertiserId || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: Boolean(data) };
  },
};
