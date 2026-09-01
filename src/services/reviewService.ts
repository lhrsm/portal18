import { createClient } from '@/lib/supabase/client';
import { ProfileReviewsResponse, ReviewInput } from '@/types/app.types';

export const reviewService = {
  /**
   * Fetches approved reviews and rating summary for a profile, respecting the viewer's consumer entitlements.
   */
  async getProfileReviews(advertiserId: string, viewerId?: string): Promise<ProfileReviewsResponse> {
    const defaultResponse: ProfileReviewsResponse = {
      success: false,
      advertiser_id: advertiserId,
      viewer_can_see_full_text: false,
      summary: {
        total_reviews: 0,
        avg_communication: 0,
        avg_accuracy: 0,
        avg_professionalism: 0,
        avg_overall: 0,
      },
      reviews: [],
    };

    if (!advertiserId) return defaultResponse;

    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_profile_reviews', {
        p_advertiser_id: advertiserId,
        p_viewer_id: viewerId || null,
      });

      if (error || !data) {
        return defaultResponse;
      }
      return data as ProfileReviewsResponse;
    } catch {
      return defaultResponse;
    }
  },

  /**
   * Submits a structured, moderated review for an advertiser profile.
   */
  async submitReview(input: ReviewInput): Promise<{ success: boolean; message?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('submit_advertiser_review', {
        p_advertiser_id: input.advertiser_id,
        p_rating_comm: input.rating_communication,
        p_rating_acc: input.rating_accuracy,
        p_rating_prof: input.rating_professionalism,
        p_comment: input.comment || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: data?.message || 'Avaliação enviada com sucesso para moderação.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro inesperado ao enviar avaliação.' };
    }
  },

  /**
   * Fetches review moderation queue for staff administrators.
   */
  async getAdminReviewQueue(): Promise<any[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_reviews')
      .select('*, advertiser_profiles(id, stage_name, state_slug, city_slug, slug)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin review queue:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Approves, rejects, or removes a review as staff administrator.
   */
  async moderateReview(
    reviewId: string,
    status: 'approved' | 'rejected' | 'removed',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('advertiser_reviews') as any)
      .update({
        status,
        rejection_reason: reason || null,
        moderated_at: new Date().toISOString(),
        moderated_by: user?.id || null,
      })
      .eq('id', reviewId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
