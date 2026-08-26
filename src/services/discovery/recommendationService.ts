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

    if (error) {
      console.error('Error in get_similar_profiles RPC:', error);
      return [];
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
