import { createClient } from '@/lib/supabase/client';
import { DiscoveryProfileCard } from '@/types/app.types';
import { searchService } from './searchService';

export const recommendationService = {
  /**
   * Recommends similar profiles based on location, categories and quality (Section 49, 50, 111).
   * Strictly excludes the current advertiser profile.
   */
  async getSimilarProfiles(advertiserId: string, limit = 6, citySlug?: string, stateSlug?: string): Promise<DiscoveryProfileCard[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_similar_profiles', {
        p_advertiser_id: advertiserId,
        p_limit: limit + 4,
      });

      if (!error && data && data.length > 0) {
        const validProfiles = data
          .filter((row: any) => row.advertiser_id !== advertiserId && Boolean(row.thumbnail_url))
          .slice(0, limit)
          .map((row: any) => ({
            ...row,
            age: row.age || 18,
            city_slug: row.city_slug || citySlug || '',
            state_code: row.state_code || 'BA',
            distance_label: row.distance_label || 'Região',
            organic_score: 80,
          })) as DiscoveryProfileCard[];

        if (validProfiles.length >= Math.min(limit, 3)) {
          return validProfiles;
        }
      }
    } catch {
      // Fallback
    }

    const { publicProfilesService } = await import('@/services/publicProfilesService');
    const fallback = await publicProfilesService.getPublicAdvertisers({
      city: citySlug,
      state: stateSlug,
      limit: limit + 4
    });

    let validFallback = fallback.data.filter((p) => p.advertiser_id !== advertiserId && Boolean(p.primary_photo_url));

    // If not enough in the same city, get from general pool
    if (validFallback.length < limit) {
      const generalFallback = await publicProfilesService.getPublicAdvertisers({ limit: limit + 4 });
      const generalValid = generalFallback.data.filter((p) => p.advertiser_id !== advertiserId && Boolean(p.primary_photo_url));
      validFallback = [...validFallback, ...generalValid.filter((gp) => !validFallback.some((vf) => vf.advertiser_id === gp.advertiser_id))];
    }

    return validFallback
      .slice(0, limit)
      .map((p) => ({
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
        activity_label: 'Ativo hoje',
        distance_label: p.neighborhood || 'Região',
        organic_score: 80,
        is_sponsored: false,
      }));
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
