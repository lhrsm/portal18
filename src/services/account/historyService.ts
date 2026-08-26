import { createClient } from '@/lib/supabase/client';

export const historyService = {
  /**
   * Fetches user viewing history sorted by last_viewed_at DESC (Section 18).
   */
  async getUserHistory(profileId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profile_view_history')
      .select('advertiser_id, view_count, last_viewed_at, first_viewed_at, advertiser_profiles(id, slug, stage_name, headline, verification_status, profile_status, brazil_cities(name, slug), brazil_states(code, slug), advertiser_media(storage_path, thumbnail_path))')
      .eq('viewer_profile_id', profileId)
      .order('last_viewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching view history:', error);
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
        verification_status: adv.verification_status,
        profile_status: adv.profile_status,
        primary_photo_url: media?.thumbnail_path || media?.storage_path || null,
        last_viewed_at: item.last_viewed_at,
        view_count: item.view_count,
      };
    }).filter(Boolean);
  },

  /**
   * Non-blocking history record upsert via RPC (Section 16, 17, 20).
   */
  async recordProfileView(advertiserId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.rpc as any)('record_profile_history', {
        p_advertiser_id: advertiserId,
      });
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Removes a single profile from history (Section 22).
   */
  async removeHistoryItem(profileId: string, advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profile_view_history')
      .delete()
      .eq('viewer_profile_id', profileId)
      .eq('advertiser_id', advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Clears entire viewing history for current user (Section 21).
   */
  async clearHistory(): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('clear_user_history');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
