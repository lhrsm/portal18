import { createClient } from '@/lib/supabase/client';
import { GrowthExperiment } from './types';

export const experimentationEngine = {
  /**
   * Retrieves active or draft A/B experiments.
   */
  async getExperiments(): Promise<GrowthExperiment[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('growth_experiments') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as GrowthExperiment[];
    } catch {
      return [];
    }
  },

  /**
   * Deterministically assigns a variant to a user/session without cookie tracking.
   */
  assignVariant(experimentKey: string, identifier: string, variants: string[] = ['control', 'variant_a']): string {
    if (!variants || variants.length === 0) return 'control';

    let hash = 0;
    const combined = `${experimentKey}:${identifier}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }

    const index = Math.abs(hash) % variants.length;
    return variants[index];
  },

  /**
   * Creates a new growth A/B experiment.
   */
  async createExperiment(params: {
    experimentKey: string;
    name: string;
    hypothesis: string;
    variants: string[];
    targetPage: string;
    primaryMetric: string;
  }): Promise<{ success: boolean; experimentId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('growth_experiments') as any)
        .insert({
          experiment_key: params.experimentKey,
          name: params.name,
          hypothesis: params.hypothesis,
          variants: params.variants,
          target_page: params.targetPage,
          primary_metric: params.primaryMetric,
          status: 'draft',
        })
        .select('id')
        .single();

      if (error || !data) return { success: false, error: error?.message };
      return { success: true, experimentId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao registrar experimento.' };
    }
  },
};
