import { createClient } from '@/lib/supabase/client';
import { SearchSynonym } from './types';
import { searchQueryNormalizer } from './searchQueryNormalizer';

export const synonymService = {
  /**
   * Retrieves all synonyms for admin management.
   */
  async getSynonyms(): Promise<SearchSynonym[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('search_synonyms')
        .select('*')
        .order('term', { ascending: true });

      if (error || !data) {
        // Fallback to baseline dictionary
        return Object.entries(searchQueryNormalizer.baselineSynonyms).map(([term, syns], idx) => ({
          id: `syn-${idx}`,
          term,
          synonyms: syns,
          locale: 'pt-BR',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      }

      return data as SearchSynonym[];
    } catch {
      return [];
    }
  },

  /**
   * Adds or updates a synonym dictionary entry.
   */
  async upsertSynonym(synonym: Partial<SearchSynonym>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const cleanTerm = searchQueryNormalizer.normalize(synonym.term || '');
      const cleanSynonyms = (synonym.synonyms || []).map((s) => searchQueryNormalizer.normalize(s)).filter(Boolean);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('search_synonyms') as any).upsert({
        id: synonym.id,
        term: cleanTerm,
        synonyms: cleanSynonyms,
        locale: synonym.locale || 'pt-BR',
        status: synonym.status || 'active',
        updated_at: new Date().toISOString(),
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao salvar sinônimo.' };
    }
  },

  /**
   * Deletes a synonym dictionary entry.
   */
  async deleteSynonym(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('search_synonyms').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao remover sinônimo.' };
    }
  },
};
