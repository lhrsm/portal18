import { createClient } from '@/lib/supabase/client';
import { UserList } from '@/types/app.types';

export const userListsService = {
  /**
   * Fetches lists created by the user with item counts.
   */
  async getUserLists(profileId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_lists')
      .select('*, user_list_items(id)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user lists:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
      ...item,
      items_count: (item.user_list_items || []).length,
    }));
  },

  /**
   * Creates a new list (Section 27 & 31: max 20 lists per user).
   */
  async createList(profileId: string, name: string, description?: string): Promise<{ success: boolean; data?: UserList; error?: string }> {
    const supabase = createClient();

    // Check limit
    const { count } = await supabase
      .from('user_lists')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    if ((count || 0) >= 20) {
      return { success: false, error: 'Limite de 20 listas atingido.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('user_lists') as any)
      .insert({
        profile_id: profileId,
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as UserList };
  },

  /**
   * Deletes a list.
   */
  async deleteList(listId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Adds an advertiser profile to a list.
   */
  async addToList(listId: string, advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('user_list_items') as any)
      .insert({
        list_id: listId,
        advertiser_id: advertiserId,
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Removes an advertiser profile from a list.
   */
  async removeFromList(listId: string, advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('advertiser_id', advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Fetches items inside a specific user list.
   */
  async getListItems(listId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_list_items')
      .select('advertiser_id, created_at, advertiser_profiles(id, slug, stage_name, headline, verification_status, profile_status, brazil_cities(name, slug), brazil_states(code, slug), advertiser_media(storage_path, thumbnail_path))')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching list items:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => {
      const adv = item.advertiser_profiles;
      if (!adv) return null;
      const media = (adv.advertiser_media || [])[0];
      return {
        advertiser_id: adv.id,
        slug: adv.slug,
        stage_name: adv.stage_name,
        headline: adv.headline,
        city_name: adv.brazil_cities?.name || 'Brasil',
        city_slug: adv.brazil_cities?.slug || '',
        state_code: adv.brazil_states?.code || '',
        verification_status: adv.verification_status,
        profile_status: adv.profile_status,
        primary_photo_url: media?.thumbnail_path || media?.storage_path || null,
        added_at: item.created_at,
      };
    }).filter(Boolean);
  },
};
