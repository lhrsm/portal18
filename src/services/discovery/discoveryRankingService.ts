import { createClient } from '@/lib/supabase/client';
import {
  CommercialInventorySlot,
  DiscoveryEventType,
  RankingDiagnostics
} from '@/types/app.types';

export const discoveryRankingService = {
  /**
   * Recalculates all organic ranking scores batch with Bayesian smoothed engagement and quality signals.
   */
  async recalculateRankingScores(): Promise<{ success: boolean; profiles_scored?: number; policy_version?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('recalculate_organic_ranking_scores');
      if (error) return { success: false, error: error.message };
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao recalcular scores de ranking.' };
    }
  },

  /**
   * Records a viewable impression or card click with crawler filtering and session deduplication.
   */
  async recordDiscoveryEvent(event: {
    eventType: DiscoveryEventType;
    advertiserId: string;
    campaignId?: string | null;
    placement?: string;
    citySlug?: string | null;
    categorySlug?: string | null;
  }): Promise<{ success: boolean; recorded?: boolean; reason?: string }> {
    const supabase = createClient();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Server';
    const dateStr = new Date().toISOString().slice(0, 10);
    const sessionDedupeKey = `dedupe_${event.advertiserId}_${event.eventType}_${dateStr}`;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('record_discovery_event', {
        p_event_type: event.eventType,
        p_advertiser_id: event.advertiserId,
        p_campaign_id: event.campaignId || null,
        p_placement: event.placement || 'explore',
        p_city_slug: event.citySlug || null,
        p_category_slug: event.categorySlug || null,
        p_session_dedupe_key: sessionDedupeKey,
        p_user_agent: userAgent,
      });

      if (error) return { success: false, reason: error.message };
      return data || { success: true, recorded: true };
    } catch {
      return { success: false, reason: 'network_error' };
    }
  },

  /**
   * Retrieves all commercial inventory slots and capacity configs.
   */
  async getInventorySlots(): Promise<CommercialInventorySlot[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('commercial_inventory_slots')
        .select('*')
        .order('placement', { ascending: true });

      if (error || !data) return [];
      return data as any[];
    } catch {
      return [];
    }
  },

  /**
   * Updates commercial inventory slot parameters (Admin-only).
   */
  async updateInventorySlot(
    slotId: string,
    updates: Partial<CommercialInventorySlot>
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('commercial_inventory_slots') as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao atualizar inventário.' };
    }
  },

  /**
   * Staff ranking diagnostics for a given advertiser profile in search context.
   */
  async diagnoseAdvertiser(
    advertiserId: string,
    citySlug?: string,
    categorySlug?: string
  ): Promise<RankingDiagnostics> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('diagnose_advertiser_ranking', {
        p_advertiser_id: advertiserId,
        p_city_slug: citySlug || null,
        p_category_slug: categorySlug || null,
      });

      if (error || !data) {
        return { found: false, error: error?.message || 'Erro ao diagnosticar anunciante.' };
      }
      return data as RankingDiagnostics;
    } catch (err: any) {
      return { found: false, error: err?.message || 'Erro na comunicação.' };
    }
  },
};
