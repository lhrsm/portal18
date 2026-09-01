import { createClient } from '@/lib/supabase/client';
import { RegionalGrowthStats, OpportunitySignal, CityReadinessStatus } from './types';

export const growthIntelligenceService = {
  /**
   * Retrieves regional stats for states and cities.
   */
  async getRegionalStats(filters?: { stateCode?: string; readiness?: string }): Promise<RegionalGrowthStats[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('regional_growth_stats') as any)
        .select('*')
        .order('search_impressions_count', { ascending: false });

      if (filters?.stateCode && filters.stateCode !== 'all') {
        query = query.eq('state_code', filters.stateCode.toUpperCase());
      }
      if (filters?.readiness && filters.readiness !== 'all') {
        query = query.eq('readiness_status', filters.readiness);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as RegionalGrowthStats[];
    } catch {
      return [];
    }
  },

  /**
   * Generates deterministic opportunity signals without opaque AI.
   */
  async getOpportunitySignals(): Promise<Array<{ city: string; state: string; signal: OpportunitySignal; description: string }>> {
    const stats = await this.getRegionalStats();
    const signals: Array<{ city: string; state: string; signal: OpportunitySignal; description: string }> = [];

    for (const s of stats) {
      if (s.search_impressions_count > 1000 && s.active_profiles_count < 5) {
        signals.push({
          city: s.city_name,
          state: s.state_code,
          signal: 'high_search_low_supply',
          description: `Alta demanda de busca (${s.search_impressions_count} impressões) com apenas ${s.active_profiles_count} anunciantes ativos.`,
        });
      } else if (s.contact_clicks_count > 200 && s.active_profiles_count >= 5) {
        signals.push({
          city: s.city_name,
          state: s.state_code,
          signal: 'high_contact_conversion',
          description: `Excelente conversão de contato (${s.contact_clicks_count} cliques de WhatsApp/chat) nos perfis locais.`,
        });
      }
    }

    return signals;
  },

  /**
   * Updates city readiness status.
   */
  async updateCityReadiness(
    stateCode: string,
    citySlug: string,
    status: CityReadinessStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('regional_growth_stats') as any)
        .update({ readiness_status: status, last_calculated_at: new Date().toISOString() })
        .eq('state_code', stateCode.toUpperCase())
        .eq('city_slug', citySlug.toLowerCase());

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao atualizar prontidão regional.' };
    }
  },
};
