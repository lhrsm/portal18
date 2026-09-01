import { createClient } from '@/lib/supabase/client';
import { SavedSearch, AdvancedSearchFilters } from './types';

export const savedSearchService = {
  /**
   * Retrieves user's saved searches.
   */
  async getSavedSearches(): Promise<SavedSearch[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }
      return data as SavedSearch[];
    } catch {
      return [];
    }
  },

  /**
   * Saves a new search filter configuration.
   */
  async createSavedSearch(
    title: string,
    filters: AdvancedSearchFilters,
    notificationFrequency: 'none' | 'instant' | 'daily' | 'weekly' = 'none'
  ): Promise<{ success: boolean; data?: SavedSearch; error?: string }> {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Usuário não autenticado.' };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('saved_searches') as any)
        .insert({
          user_id: user.id,
          title: title.trim(),
          filters,
          notification_frequency: notificationFrequency,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data as SavedSearch };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao salvar busca.' };
    }
  },

  /**
   * Deletes a saved search.
   */
  async deleteSavedSearch(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('saved_searches').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao remover busca salva.' };
    }
  },
};
