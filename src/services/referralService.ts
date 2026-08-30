import { createClient } from '@/lib/supabase/client';
import { Referral, ReferralReward, ReferralStats } from '@/types/app.types';

export const referralService = {
  /**
   * Retrieves or initializes the advertiser's canonical referral program data and live stats.
   */
  async getAdvertiserReferralStats(advertiserId: string): Promise<ReferralStats> {
    const supabase = createClient();
    const defaultStats: ReferralStats = {
      referral_code: '',
      referral_url: '',
      total_referrals: 0,
      pending_count: 0,
      qualified_count: 0,
      rewarded_count: 0,
      total_bonus_days_earned: 0,
      active_bonus_days: 0,
    };

    try {
      // 1. Get or generate canonical referral code
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: codeData, error: codeError } = await (supabase.rpc as any)(
        'get_or_create_advertiser_referral_code',
        { p_advertiser_id: advertiserId }
      );

      if (codeError || !codeData?.referral_code) {
        return defaultStats;
      }

      const code = codeData.referral_code;
      const host = typeof window !== 'undefined' ? window.location.origin : 'https://portal18.com.br';
      const referralUrl = `${host}/anunciar?ref=${code}`;

      // 2. Fetch referrals counts
      const { data: referrals } = await supabase
        .from('referrals')
        .select('status')
        .eq('referrer_advertiser_id', advertiserId);

      const allRefs: any[] = (referrals as any[]) || [];
      const total = allRefs.length;
      const pending = allRefs.filter((r) => r.status === 'registered' || r.status === 'pending_qualification').length;
      const qualified = allRefs.filter((r) => r.status === 'qualified' || r.status === 'rewarded').length;
      const rewarded = allRefs.filter((r) => r.status === 'rewarded').length;

      // 3. Fetch rewards ledger totals
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('reward_value, status, expires_at')
        .eq('advertiser_id', advertiserId);

      const allRewards: any[] = (rewards as any[]) || [];
      const totalDaysEarned = allRewards
        .filter((r) => r.status === 'granted' || r.status === 'consumed')
        .reduce((sum, r) => sum + (r.reward_value || 0), 0);

      const activeDays = allRewards
        .filter((r) => r.status === 'granted' && new Date(r.expires_at).getTime() > Date.now())
        .reduce((sum, r) => sum + (r.reward_value || 0), 0);

      return {
        referral_code: code,
        referral_url: referralUrl,
        total_referrals: total,
        pending_count: pending,
        qualified_count: qualified,
        rewarded_count: rewarded,
        total_bonus_days_earned: totalDaysEarned,
        active_bonus_days: activeDays,
      };
    } catch {
      return defaultStats;
    }
  },

  /**
   * Retrieves sanitized referral history for an advertiser (zero PII exposure).
   */
  async getReferralHistory(advertiserId: string): Promise<Referral[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, referral_code, status, risk_status, qualification_due_at, qualified_at, rewarded_at, policy_version, created_at, updated_at, referred_advertiser:advertiser_profiles!referrals_referred_advertiser_id_fkey(stage_name, city_id, state_id, profile_status)')
        .eq('referrer_advertiser_id', advertiserId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as any[];
    } catch {
      return [];
    }
  },

  /**
   * Tracks a visitor referral click (First-party attribution, First-Referrer-Wins).
   */
  async trackReferralVisit(
    referralCode: string,
    visitorToken: string
  ): Promise<{ success: boolean; attributed?: boolean; referral_code?: string; referrer_stage_name?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('track_referral_click', {
        p_referral_code: referralCode,
        p_visitor_token: visitorToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atribuir indicação.' };
    }
  },

  /**
   * Binds a referral to an advertiser profile during creation/onboarding.
   */
  async bindReferral(
    referredAdvertiserId: string,
    referralCode: string
  ): Promise<{ success: boolean; status?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('bind_referral_on_advertiser_creation', {
        p_referred_advertiser_id: referredAdvertiserId,
        p_referral_code: referralCode,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao vincular indicação.' };
    }
  },

  /**
   * Admin: Evaluates maturation delay and automatically qualifies mature referrals.
   */
  async evaluateQualifications(): Promise<{ success: boolean; qualified_count?: number; rewarded_count?: number; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('evaluate_referral_qualifications');
      if (error) return { success: false, error: error.message };
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  /**
   * Admin: Fetches referrals for the administration queue with optional status & risk filtering.
   */
  async getAdminReferrals(filters?: { status?: string; risk_status?: string }): Promise<any[]> {
    const supabase = createClient();
    try {
      let query = supabase
        .from('referrals')
        .select('*, referrer:advertiser_profiles!referrals_referrer_advertiser_id_fkey(stage_name, slug), referred:advertiser_profiles!referrals_referred_advertiser_id_fkey(stage_name, slug, profile_status, published_at), rewards:referral_rewards(*)')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.risk_status && filters.risk_status !== 'all') {
        query = query.eq('risk_status', filters.risk_status);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  /**
   * Admin: Revokes an active referral reward with mandatory reason and audit log.
   */
  async revokeReward(
    rewardId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('revoke_referral_reward', {
        p_reward_id: rewardId,
        p_reason: reason,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao revogar recompensa.' };
    }
  },
};
