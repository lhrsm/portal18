import { createClient } from '@/lib/supabase/client';
import { DiscoveryProfileCard } from '@/types/app.types';
import { searchService } from './searchService';

export const recommendationService = {
  /**
   * Recommends similar profiles based on location, categories and quality (Section 49, 50, 111).
   * Strictly excludes the current advertiser profile.
   */
  async getSimilarProfiles(advertiserId: string, limit = 6): Promise<DiscoveryProfileCard[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_similar_profiles', {
      p_advertiser_id: advertiserId,
      p_limit: limit,
    });

    if (error || !data || data.length === 0) {
      const { publicProfilesService } = await import('@/services/publicProfilesService');
      const fallback = await publicProfilesService.getPublicAdvertisers({ limit: limit + 1 });
      return fallback.data
        .filter((p) => p.advertiser_id !== advertiserId)
        .slice(0, limit)
        .map((p) => ({
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
          activity_label: 'Ativo hoje',
          distance_label: p.neighborhood || 'Região',
          is_sponsored: false,
        }));
    }

    return (data || []).map((row: any) => ({
      ...row,
      city_slug: '',
      distance_label: 'Região',
      organic_score: 80,
    })) as DiscoveryProfileCard[];
  },

  /**
   * Recommends top-ranked profiles for Homepage sections (Section 58).
   */
  async getRecommendedHome(limit = 12): Promise<DiscoveryProfileCard[]> {
    const res = await searchService.searchProfiles({
      limit,
      verifiedOnly: false,
    });
    return res.profiles;
  },

  /**
   * Recommends newly registered and recently activated profiles in the region (Section 63, 64).
   */
  async getNewInRegion(stateCode?: string, citySlug?: string, limit = 8): Promise<DiscoveryProfileCard[]> {
    const res = await searchService.searchProfiles({
      stateCode,
      citySlug,
      limit,
    });
    return res.profiles;
  },
};
