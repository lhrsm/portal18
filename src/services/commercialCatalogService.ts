import { createClient } from '@/lib/supabase/client';
import { CommercialCatalog, AdvertiserCommercialSummary } from '@/types/app.types';

export const commercialCatalogService = {
  /**
   * Fetches full public commercial catalog (plans, multi-period pricing matrix, and boost products).
   */
  async getCatalog(): Promise<CommercialCatalog | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_commercial_catalog');
      if (error || !data) {
        return null;
      }
      return data as CommercialCatalog;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves consolidated commercial summary, usage meters, and entitlements for an advertiser.
   */
  async getAdvertiserCommercialSummary(advertiserId: string): Promise<AdvertiserCommercialSummary | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_advertiser_commercial_summary', {
        p_advertiser_id: advertiserId,
      });

      if (error || !data) {
        return null;
      }
      return data as AdvertiserCommercialSummary;
    } catch {
      return null;
    }
  },
};
