import { createClient } from '@/lib/supabase/client';

export const favoritesService = {
  /**
   * Fetches user favorites with profile card details.
   */
  async getUserFavorites(profileId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('favorites')
      .select('advertiser_id, created_at, advertiser_profiles(id, slug, stage_name, headline, birth_date, city_id, state_id, profile_status, verification_status, brazil_cities(name, slug), brazil_states(code, name, slug), advertiser_media(storage_path, thumbnail_path))')
      .eq('user_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => {
      const adv = item.advertiser_profiles;
      if (!adv) return null;
      const media = (adv.advertiser_media || [])[0];
      return {
        advertiser_id: adv.id,
        slug: adv.slug,
        stage_name: adv.stage_name,
        headline: adv.headline,
        city_name: adv.brazil_cities?.name || 'Brasil',
        city_slug: adv.brazil_cities?.slug || '',
        state_code: adv.brazil_states?.code || '',
        state_slug: adv.brazil_states?.slug || '',
        verification_status: adv.verification_status,
        profile_status: adv.profile_status,
        primary_photo_url: media?.thumbnail_path || media?.storage_path || null,
        favorited_at: item.created_at,
      };
    }).filter(Boolean);
  },

  /**
   * Atomic toggle of favorite status using RPC.
   */
  async toggleFavorite(advertiserId: string): Promise<{ success: boolean; is_favorite?: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('toggle_favorite', {
      p_advertiser_id: advertiserId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  async addFavorite(profileId: string, advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.toggleFavorite(advertiserId);
    return { success: res.success, error: res.error };
  },

  async removeFavorite(profileId: string, advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_profile_id', profileId)
      .eq('advertiser_id', advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Removes multiple favorites in bulk (Section 7).
   */
  async removeFavoritesBulk(profileId: string, advertiserIds: string[]): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_profile_id', profileId)
      .in('advertiser_id', advertiserIds);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
