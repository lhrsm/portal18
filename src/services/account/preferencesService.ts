import { createClient } from '@/lib/supabase/client';
import { UserPreferences } from '@/types/app.types';

export const preferencesService = {
  /**
   * Fetches user preferences.
   */
  async getUserPreferences(profileId: string): Promise<UserPreferences | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
    return data as UserPreferences | null;
  },

  /**
   * Updates user preferences.
   */
  async updatePreferences(profileId: string, updates: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('user_preferences') as any)
      .upsert({
        profile_id: profileId,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Fetches preferred categories for user.
   */
  async getPreferredCategories(profileId: string): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_preferred_categories')
      .select('category_id')
      .eq('profile_id', profileId);

    if (error) {
      return [];
    }
    return (data || []).map((row: any) => row.category_id);
  },

  /**
   * Updates preferred categories.
   */
  async setPreferredCategories(profileId: string, categoryIds: string[]): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // Delete existing
    await supabase.from('user_preferred_categories').delete().eq('profile_id', profileId);

    if (categoryIds.length > 0) {
      const rows = categoryIds.map((cid) => ({ profile_id: profileId, category_id: cid }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('user_preferred_categories') as any).insert(rows);
      if (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  },

  /**
   * Resets personalization signals (Section 45 & 123).
   */
  async resetPersonalization(): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('reset_personalization');
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: Boolean(data) };
  },
};
