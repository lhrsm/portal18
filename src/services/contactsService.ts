import { createClient } from '@/lib/supabase/client';
import { AdvertiserContact } from '@/types/app.types';
import { ContactType } from '@/types/database.types';

export const contactsService = {
  async getContactsByAdvertiser(advertiserId: string): Promise<AdvertiserContact[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_contacts')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching advertiser contacts:', error);
      return [];
    }
    return (data as AdvertiserContact[]) || [];
  },

  async addContact(
    advertiserId: string,
    contactType: ContactType,
    contactValue: string,
    isPrimary: boolean = false,
    isVisible: boolean = true
  ): Promise<{ success: boolean; data?: AdvertiserContact; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_contacts') as any)
      .insert({
        advertiser_id: advertiserId,
        contact_type: contactType,
        contact_value: contactValue,
        is_primary: isPrimary,
        is_visible: isVisible,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserContact };
  },

  async deleteContact(contactId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('advertiser_contacts')
      .delete()
      .eq('id', contactId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
