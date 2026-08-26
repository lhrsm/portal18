import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { AdvertiserProfile } from '@/types/app.types';

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
    // Strip restricted columns
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
        profile_status: 'pending_review',
      } as AdvertiserUpdate)
      .eq('id', advertiserId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserProfile };
  },

  async createAdvertiserProfile(profileData: {
    profile_id: string;
    stage_name: string;
    slug: string;
    headline?: string;
    bio?: string;
    birth_date: string;
    gender?: string;
    presentation?: string;
    state_id?: string;
    city_id?: string;
    neighborhood?: string;
  }): Promise<{ success: boolean; data?: AdvertiserProfile; error?: string }> {
    const supabase = createClient();
    const insertPayload: AdvertiserInsert = {
      profile_id: profileData.profile_id,
      stage_name: profileData.stage_name,
      slug: profileData.slug,
      headline: profileData.headline || null,
      bio: profileData.bio || null,
      birth_date: profileData.birth_date,
      gender: profileData.gender || null,
      presentation: profileData.presentation || null,
      state_id: profileData.state_id || null,
      city_id: profileData.city_id || null,
      neighborhood: profileData.neighborhood || null,
      profile_status: 'draft',
      verification_status: 'not_started',
      visibility: 'hidden',
      onboarding_step: 1,
      onboarding_completed: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_profiles') as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserProfile };
  },

  async updateAdvertiserProfile(id: string, updates: Partial<AdvertiserProfile>): Promise<{ success: boolean; data?: AdvertiserProfile; error?: string }> {
    const supabase = createClient();
    // Strip non-editable status columns
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
};
