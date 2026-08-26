import { createClient } from '@/lib/supabase/client';

export const followingService = {
  /**
   * Fetches profiles followed by the user.
   */
  async getFollowedProfiles(profileId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profile_follows')
      .select('advertiser_id, notifications_enabled, created_at, advertiser_profiles(id, slug, stage_name, headline, verification_status, profile_status, brazil_cities(name, slug), brazil_states(code, slug), advertiser_media(storage_path, thumbnail_path))')
      .eq('follower_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching followed profiles:', error);
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
        notifications_enabled: item.notifications_enabled,
        followed_at: item.created_at,
      };
    }).filter(Boolean);
  },

  /**
   * Atomic toggle of follow relationship (Section 10 & 13).
   */
  async toggleFollow(advertiserId: string, notificationsEnabled = true): Promise<{ success: boolean; is_following?: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('toggle_follow', {
      p_advertiser_id: advertiserId,
      p_notifications_enabled: notificationsEnabled,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Updates notification preference for a specific followed profile (Section 15).
   */
  async updateFollowNotification(followerProfileId: string, advertiserId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profile_follows') as any)
      .update({
        notifications_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('follower_profile_id', followerProfileId)
      .eq('advertiser_id', advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
