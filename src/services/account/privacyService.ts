import { createClient } from '@/lib/supabase/client';

export const privacyService = {
  /**
   * Fetches list of advertisers blocked by the user (Section 37).
   */
  async getUserBlocks(profileId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_advertiser_id, created_at, advertiser_profiles(id, slug, stage_name, headline, verification_status, profile_status, brazil_cities(name, slug), brazil_states(code, slug))')
      .eq('blocker_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked profiles:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => {
      const adv = item.advertiser_profiles;
      if (!adv) return null;
      return {
        advertiser_id: adv.id,
        slug: adv.slug,
        stage_name: adv.stage_name,
        headline: adv.headline,
        city_name: adv.brazil_cities?.name || 'Brasil',
        state_code: adv.brazil_states?.code || '',
        verification_status: adv.verification_status,
        blocked_at: item.created_at,
      };
    }).filter(Boolean);
  },

  /**
   * Atomic block toggle via RPC (Section 34 & 35).
   */
  async toggleBlock(advertiserId: string): Promise<{ success: boolean; is_blocked?: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('toggle_block_advertiser', {
      p_advertiser_id: advertiserId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Records user feedback "Not interested" to reduce future recommendations (Section 119 & 120).
   */
  async hideRecommendation(profileId: string, advertiserId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('user_hidden_recommendations') as any)
      .insert({
        profile_id: profileId,
        advertiser_id: advertiserId,
        reason: reason || null,
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Fetches user consent audit trail (Section 71).
   */
  async getUserConsents(profileId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user consents:', error);
      return [];
    }
    return data || [];
  },
};
