import { createClient } from '@/lib/supabase/client';
import { AdvertiserFunnelAnalytics, AdminPlatformAnalytics } from '@/types/app.types';

export const advertiserAnalyticsService = {
  /**
   * Fetches aggregated funnel performance analytics for the advertiser profile.
   */
  async getFunnelAnalytics(
    advertiserId: string,
    periodDays: 7 | 30 | 90 = 7
  ): Promise<AdvertiserFunnelAnalytics | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_advertiser_funnel_analytics', {
        p_advertiser_id: advertiserId,
        p_period_days: periodDays,
      });

      if (error || !data) {
        return null;
      }
      return data as AdvertiserFunnelAnalytics;
    } catch {
      return null;
    }
  },

  /**
   * Admin: Fetches platform-wide discovery funnel and traffic distribution analytics.
   */
  async getAdminPlatformAnalytics(
    periodDays: 7 | 30 | 90 = 7
  ): Promise<AdminPlatformAnalytics | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_admin_platform_analytics', {
        p_period_days: periodDays,
      });

      if (error || !data) {
        return null;
      }
      return data as AdminPlatformAnalytics;
    } catch {
      return null;
    }
  },
};
