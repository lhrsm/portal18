import { createClient } from '@/lib/supabase/client';
import { VerificationRequest, VerificationSessionResponse } from '@/types/app.types';

export const verificationService = {
  /**
   * Initiates a secure identity verification session for the authenticated advertiser.
   */
  async startVerificationSession(verificationType = 'identity_and_age'): Promise<VerificationSessionResponse> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('create_identity_verification_session', {
      p_verification_type: verificationType,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: data?.success ?? true,
      verificationId: data?.verification_id,
      status: data?.status,
      sessionToken: data?.session_token,
      redirectUrl: data?.redirect_url,
      message: data?.message,
    };
  },

  /**
   * Retrieves the current advertiser's verification record and details.
   */
  async getOwnVerificationDetails(): Promise<{
    verificationStatus: string;
    request: VerificationRequest | null;
    expiresAt?: string | null;
    completedAt?: string | null;
  }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { verificationStatus: 'not_started', request: null };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle() as any);

    if (!profile) return { verificationStatus: 'not_started', request: null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adv } = await (supabase
      .from('advertiser_profiles')
      .select('id, verification_status')
      .eq('profile_id', profile.id)
      .maybeSingle() as any);

    if (!adv) return { verificationStatus: 'not_started', request: null };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: latestReq } = await (supabase
      .from('verification_requests')
      .select('*')
      .eq('advertiser_id', adv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any);

    return {
      verificationStatus: adv.verification_status || 'not_started',
      request: latestReq || null,
      expiresAt: latestReq?.expires_at,
      completedAt: latestReq?.completed_at,
    };
  },

  /**
   * Admin / Staff queue of verification requests (Section 45).
   */
  async getVerificationsQueue(filters: { status?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('verification_requests')
      .select('*, advertiser_profiles(stage_name, slug, profile_status)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching verifications queue:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  /**
   * Super Admin Manual KYC Override (Section 48, 49, 86).
   */
  async overrideVerificationStatus(
    verificationId: string,
    newStatus: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('override_verification_status', {
      p_verification_id: verificationId,
      p_new_status: newStatus,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: data?.success ?? true };
  },

  /**
   * Expiration processor.
   */
  async expireStaleVerifications(): Promise<number> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('expire_stale_verifications');
    if (error) {
      console.error('Error expiring verifications:', error);
      return 0;
    }
    return data || 0;
  },
};
