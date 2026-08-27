import { createClient } from '@/lib/supabase/client';
import { AdvertiserContact, ContactType } from '@/types/app.types';

export const contactsService = {
  async getContactsByAdvertiser(advertiserId: string): Promise<AdvertiserContact[]> {
    if (advertiserId.startsWith('demo-')) {
      return [
        {
          id: `demo-contact-${advertiserId}-1`,
          advertiser_id: advertiserId,
          contact_type: 'whatsapp',
          contact_value: '+5571999887766',
          is_primary: true,
          is_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AdvertiserContact,
        {
          id: `demo-contact-${advertiserId}-2`,
          advertiser_id: advertiserId,
          contact_type: 'telegram',
          contact_value: '@portal18_vip',
          is_primary: false,
          is_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AdvertiserContact,
      ];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('advertiser_contacts')
        .select('*')
        .eq('advertiser_id', advertiserId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (!error && data) {
        return (data as AdvertiserContact[]) || [];
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async addContact(
    advertiserId: string,
    contactType: ContactType,
    contactValue: string,
    isPrimary: boolean = false,
    isVisible: boolean = true
  ): Promise<{ success: boolean; data?: AdvertiserContact; error?: string }> {
    const supabase = createClient();
    // Normalize phone/WhatsApp (Requirement 20)
    let normalizedValue = contactValue.trim();
    if (contactType === 'whatsapp' || contactType === 'phone') {
      const digitsOnly = contactValue.replace(/\D/g, '');
      if (digitsOnly.length === 10 || digitsOnly.length === 11) {
        normalizedValue = `+55${digitsOnly}`;
      } else if (digitsOnly.length > 11 && !contactValue.startsWith('+')) {
        normalizedValue = `+${digitsOnly}`;
      }
    } else if (contactType === 'telegram') {
      normalizedValue = normalizedValue.startsWith('@') ? normalizedValue : `@${normalizedValue}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_contacts') as any)
      .insert({
        advertiser_id: advertiserId,
        contact_type: contactType,
        contact_value: normalizedValue,
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

  async updateContact(
    contactId: string,
    updates: Partial<AdvertiserContact>
  ): Promise<{ success: boolean; data?: AdvertiserContact; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_contacts') as any)
      .update(updates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserContact };
  },

  async setPrimaryContact(
    advertiserId: string,
    contactId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // Setting is_primary = true triggers enforce_single_primary_contact in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('advertiser_contacts') as any)
      .update({ is_primary: true })
      .eq('id', contactId)
      .eq('advertiser_id', advertiserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
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
