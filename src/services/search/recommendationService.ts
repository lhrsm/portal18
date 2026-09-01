import { createClient } from '@/lib/supabase/client';
import { DiscoveryProfileCard } from '@/types/app.types';
import { RecommendationSection, UserDiscoveryPreferences } from './types';
import { advancedSearchService } from './advancedSearchService';

export const recommendationService = {
  /**
   * Retrieves similar profiles based on objective taxonomy & location similarity.
   */
  async getSimilarProfiles(advertiserId: string, limit = 6, viewerId?: string): Promise<DiscoveryProfileCard[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_similar_profiles_v2', {
        p_advertiser_id: advertiserId,
        p_viewer_id: viewerId || null,
        p_limit: limit,
      });

      if (!error && data && data.length > 0) {
        return (data as any[]).map((row) => ({
          advertiser_id: row.advertiser_id,
          stage_name: row.stage_name,
          slug: row.slug,
          age: row.age || 18,
          city_name: row.city_name,
          city_slug: row.city_slug,
          state_code: row.state_code,
          headline: row.headline,
          thumbnail_url: row.thumbnail_url,
          verification_status: row.verification_status,
          authenticity_verified: row.authenticity_verified,
          activity_label: row.activity_label,
          distance_label: row.distance_label,
          organic_score: row.organic_score,
          is_sponsored: false,
          similarity_reason: row.similarity_reason,
        })) as DiscoveryProfileCard[];
      }
    } catch {
      // Fallback
    }

    // Fallback using general search
    const fallbackRes = await advancedSearchService.search({ limit: limit + 2, viewerId });
    return fallbackRes.profiles
      .filter((p) => p.advertiser_id !== advertiserId)
      .slice(0, limit);
  },

  /**
   * Generates explainable recommendation sections for home & explore.
   */
  async getPersonalizedFeed(
    viewerId?: string,
    userPreferences?: UserDiscoveryPreferences | null
  ): Promise<RecommendationSection[]> {
    const sections: RecommendationSection[] = [];

    // 1. "Perto de Você" / Regional Discovery
    const regionalRes = await advancedSearchService.search({
      limit: 8,
      viewerId,
      sortBy: 'relevance',
    });

    if (regionalRes.profiles.length > 0) {
      sections.push({
        title: 'Perto de Você',
        description: 'Anúncios em destaque e ativos recentemente na sua região',
        tag: 'Regional',
        profiles: regionalRes.profiles.slice(0, 8),
      });
    }

    // 2. "Atualizados Recentemente" / Freshness Discovery
    const freshRes = await advancedSearchService.search({
      recentlyUpdated: true,
      limit: 8,
      viewerId,
      sortBy: 'recent',
    });

    if (freshRes.profiles.length > 0) {
      sections.push({
        title: 'Atualizados Recentemente',
        description: 'Perfis que revisaram informações e fotos nos últimos dias',
        tag: 'Novidades',
        profiles: freshRes.profiles.slice(0, 8),
      });
    }

    // 3. "Perfis com Mídias Verificadas & Vídeo" / Trust Highlights
    const verifiedRes = await advancedSearchService.search({
      verifiedOnly: true,
      withVideo: true,
      limit: 8,
      viewerId,
    });

    if (verifiedRes.profiles.length > 0) {
      sections.push({
        title: 'Perfis com Vídeo e Mídias Verificadas',
        description: 'Anúncios com autenticidade comprovada e mídias aprovadas pela moderação',
        tag: 'Autenticidade',
        profiles: verifiedRes.profiles.slice(0, 8),
      });
    }

    return sections;
  },

  /**
   * Records user feedback (hide or not_interested) on an advertiser.
   */
  async recordFeedback(
    advertiserId: string,
    feedbackType: 'hide' | 'not_interested',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('recommendation_feedback') as any).upsert({
        user_id: user.id,
        advertiser_id: advertiserId,
        feedback_type: feedbackType,
        reason: reason || null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao registrar preferência.' };
    }
  },
};
