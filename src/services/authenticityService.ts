import { createClient } from '@/lib/supabase/client';
import { AuthenticityChallenge } from '@/types/app.types';

export interface ChallengeResponse {
  success: boolean;
  challenge_id?: string;
  challenge_code?: string;
  expires_at?: string;
  duration_seconds?: number;
  error?: string;
}

export const authenticityService = {
  /**
   * Generates a new single-use, high-entropy challenge code (15-min TTL).
   */
  async generateChallenge(advertiserId: string): Promise<ChallengeResponse> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('generate_authenticity_challenge', {
        p_advertiser_id: advertiserId,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return data as ChallengeResponse;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao gerar código de autenticidade.' };
    }
  },

  /**
   * Submits a recorded authenticity video for review.
   */
  async submitVideo(challengeId: string, storagePath: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('submit_authenticity_video', {
        p_challenge_id: challengeId,
        p_storage_path: storagePath,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao enviar vídeo de autenticidade.' };
    }
  },

  /**
   * Retrieves the latest authenticity challenge record for an advertiser.
   */
  async getLatestChallenge(advertiserId: string): Promise<AuthenticityChallenge | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('authenticity_challenges')
        .select('*')
        .eq('advertiser_id', advertiserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return data as AuthenticityChallenge;
    } catch {
      return null;
    }
  },

  /**
   * Admin: Reviews an authenticity challenge (approves or rejects).
   */
  async reviewChallenge(
    challengeId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('review_authenticity_video', {
        p_challenge_id: challengeId,
        p_action: action,
        p_reason: reason || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao avaliar vídeo de autenticidade.' };
    }
  },

  /**
   * Admin: Fetches pending authenticity review items.
   */
  async getPendingAuthenticityReviews(): Promise<(AuthenticityChallenge & { advertiser_profiles?: any })[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('authenticity_challenges')
        .select('*, advertiser_profiles(id, stage_name, slug, verification_status)')
        .eq('moderation_status', 'pending')
        .eq('status', 'submitted')
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data as any[];
    } catch {
      return [];
    }
  },
};
