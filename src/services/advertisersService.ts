import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { AdvertiserProfile, AdvertiserProfileHistory, Visibility, ReactivationEligibilityResult } from '@/types/app.types';

type AdvertiserInsert = Database['public']['Tables']['advertiser_profiles']['Insert'];
type AdvertiserUpdate = Database['public']['Tables']['advertiser_profiles']['Update'];

export const advertisersService = {
  async getPublicAdvertisers(limit = 20): Promise<AdvertiserProfile[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_profiles')
      .select('*')
      .eq('profile_status', 'approved')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching public advertisers:', error);
      return [];
    }
    return (data as AdvertiserProfile[]) || [];
  },

  async getOwnAdvertiserProfile(profileId: string): Promise<AdvertiserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      console.error('Error fetching own advertiser profile:', error);
      return null;
    }
    return data as AdvertiserProfile | null;
  },

  async becomeAdvertiser(
    termsAccepted: boolean,
    isAdult: boolean
  ): Promise<{ success: boolean; advertiser_id?: string; already_existed?: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('become_advertiser', {
      p_terms_accepted: termsAccepted,
      p_is_adult: isAdult,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data as { success: boolean; advertiser_id: string; already_existed: boolean };
  },

  async generateAvailableSlug(baseName: string): Promise<string> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('generate_available_advertiser_slug', {
      p_base_name: baseName,
    });

    if (error || !data) {
      return baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'anunciante';
    }
    return data as string;
  },

  async saveOnboardingProgress(
    advertiserId: string,
    step: number,
    partialData: Partial<AdvertiserProfile>
  ): Promise<{ success: boolean; data?: AdvertiserProfile; error?: string }> {
    const supabase = createClient();
    // Strip restricted admin columns
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { profile_status, verification_status, profile_id, ...safeUpdates } = partialData;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_profiles') as any)
      .update({
        ...safeUpdates,
        onboarding_step: step,
      } as AdvertiserUpdate)
      .eq('id', advertiserId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserProfile };
  },

  async completeOnboarding(
    advertiserId: string
  ): Promise<{ success: boolean; data?: AdvertiserProfile; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_profiles') as any)
      .update({
        onboarding_completed: true,
      } as AdvertiserUpdate)
      .eq('id', advertiserId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserProfile };
  },

  async submitProfileForReview(
    advertiserId: string
  ): Promise<{ success: boolean; status?: string; message?: string; missing_requirements?: string[]; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('submit_advertiser_profile', {
      p_advertiser_id: advertiserId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data as { success: boolean; status: string; message: string; missing_requirements?: string[]; error?: string };
  },

  async getAdvertiserCategoryIds(advertiserId: string): Promise<string[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('advertiser_categories')
      .select('category_id')
      .eq('advertiser_id', advertiserId) as any);

    if (error || !data) return [];
    return data.map((c: any) => c.category_id);
  },

  async updateAdvertiserCategories(advertiserId: string, categoryIds: string[]): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // Limit to max 5 categories (Requirement 16)
    const limitedIds = categoryIds.slice(0, 5);

    // Delete existing categories
    const { error: deleteError } = await supabase
      .from('advertiser_categories')
      .delete()
      .eq('advertiser_id', advertiserId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    if (limitedIds.length === 0) {
      return { success: true };
    }

    const payload = limitedIds.map((cid) => ({
      advertiser_id: advertiserId,
      category_id: cid,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('advertiser_categories') as any)
      .insert(payload);

    if (insertError) {
      return { success: false, error: insertError.message };
    }
    return { success: true };
  },

  async updateVisibility(
    advertiserId: string,
    visibility: Visibility
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('advertiser_profiles') as any)
      .update({ visibility } as AdvertiserUpdate)
      .eq('id', advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async getAdvertiserHistory(advertiserId: string): Promise<AdvertiserProfileHistory[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_profile_history')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching advertiser history:', error);
      return [];
    }
    return (data as AdvertiserProfileHistory[]) || [];
  },

  async updateAdvertiserProfile(id: string, updates: Partial<AdvertiserProfile>): Promise<{ success: boolean; data?: AdvertiserProfile; error?: string }> {
    const supabase = createClient();
    // Strip restricted admin columns
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { profile_status, verification_status, profile_id, ...safeUpdates } = updates;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_profiles') as any)
      .update(safeUpdates as AdvertiserUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserProfile };
  },

  /**
   * Canonically pauses an advertiser listing.
   * Atomically switches visibility to 'hidden', registers paused_at and paused_by,
   * while completely preserving previous approved moderation status and subscription integrity.
   */
  async pauseListing(
    advertiserId: string,
    reason: string = 'voluntary_pause'
  ): Promise<{ success: boolean; status?: string; paused_at?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('pause_advertiser_listing', {
        p_advertiser_id: advertiserId,
        p_reason: reason,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: data?.success ?? true,
        status: data?.status,
        paused_at: data?.paused_at,
        error: data?.error,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao pausar anúncio.' };
    }
  },

  /**
   * Pre-flight check: evaluates real canonical publication eligibility without mutating state.
   */
  async checkReactivationEligibility(
    advertiserId: string
  ): Promise<ReactivationEligibilityResult> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('check_listing_reactivation_eligibility', {
        p_advertiser_id: advertiserId,
      });

      if (error || !data) {
        return {
          eligible: false,
          blockers: ['check_failed'],
        };
      }

      return {
        eligible: Boolean(data.eligible),
        blockers: Array.isArray(data.blockers) ? data.blockers : [],
        is_paused: Boolean(data.is_paused),
        profile_status: data.profile_status,
        verification_status: data.verification_status,
        approved_media_count: data.approved_media_count,
      };
    } catch {
      return {
        eligible: false,
        blockers: ['network_error'],
      };
    }
  },

  /**
   * Canonically resumes a paused advertiser listing.
   * Runs CAN_PUBLISH_NOW fail-closed validation on KYC, moderation, sanctions, and media
   * before restoring public visibility.
   */
  async resumeListing(
    advertiserId: string
  ): Promise<{ success: boolean; status?: string; blockers?: string[]; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('resume_advertiser_listing', {
        p_advertiser_id: advertiserId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return {
          success: false,
          status: 'blocked',
          blockers: Array.isArray(data?.blockers) ? data.blockers : [],
          error: data?.error || 'Reativação bloqueada por critérios de elegibilidade.',
        };
      }

      return {
        success: true,
        status: data?.status || 'active',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao reativar anúncio.' };
    }
  },
};
