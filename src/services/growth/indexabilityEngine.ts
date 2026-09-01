import { createClient } from '@/lib/supabase/client';
import { GrowthPagePolicy } from './types';

export const indexabilityEngine = {
  /**
   * Centralized server/edge evaluator for programmatic SEO indexability.
   * Prevents thin content and empty doorway pages.
   */
  async shouldIndexPage(params: {
    path: string;
    profileCount: number;
    pageType?: 'state' | 'city' | 'category' | 'landing' | 'filter_combination';
  }): Promise<{ isIndexable: boolean; reason: string; qualityScore?: number }> {
    // 1. Basic Thin Content rule: Empty pages are strictly noindex
    if (params.profileCount <= 0) {
      return {
        isIndexable: false,
        reason: 'thin_content_zero_profiles',
      };
    }

    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('check_page_indexability', {
        p_page_path: params.path,
        p_profile_count: params.profileCount,
      });

      if (!error && data) {
        return {
          isIndexable: Boolean(data.is_indexable),
          reason: data.reason || 'evaluated',
          qualityScore: data.quality_score,
        };
      }
    } catch {
      // Fallback
    }

    return {
      isIndexable: params.profileCount > 0,
      reason: params.profileCount > 0 ? 'inventory_eligible' : 'thin_content',
    };
  },

  /**
   * Retrieves all registered growth page policies.
   */
  async getPagePolicies(): Promise<GrowthPagePolicy[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('growth_page_policies') as any)
        .select('*')
        .order('updated_at', { ascending: false });

      if (error || !data) return [];
      return data as GrowthPagePolicy[];
    } catch {
      return [];
    }
  },

  /**
   * Creates or updates a growth page policy.
   */
  async savePagePolicy(policy: {
    pagePath: string;
    pageType: 'state' | 'city' | 'category' | 'landing' | 'filter_combination';
    isIndexable: boolean;
    minProfileThreshold: number;
    customH1?: string;
    customIntro?: string;
    qualityScore?: number;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('growth_page_policies') as any).upsert(
        {
          page_path: policy.pagePath,
          page_type: policy.pageType,
          is_indexable: policy.isIndexable,
          min_profile_threshold: policy.minProfileThreshold,
          custom_h1: policy.customH1 || null,
          custom_intro: policy.customIntro || null,
          quality_score: policy.qualityScore || 100,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'page_path' }
      );

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao salvar política de indexabilidade.' };
    }
  },
};
