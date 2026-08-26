import { createClient } from '@/lib/supabase/client';
import { AdvertiserProfile } from '@/types/app.types';

export const favoritesService = {
  async getUserFavorites(profileId: string): Promise<AdvertiserProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('favorites')
      .select('advertiser_id, advertiser_profiles(*)')
      .eq('user_profile_id', profileId);

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => item.advertiser_profiles).filter(Boolean) as AdvertiserProfile[];
  },

  async addFavorite(profileId: string, advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('favorites') as any)
      .insert({
        user_profile_id: profileId,
        advertiser_id: advertiserId,
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
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
};
