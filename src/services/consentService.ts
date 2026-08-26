import { createClient } from '@/lib/supabase/client';
import { ConsentRecord, LegalDocument } from '@/types/app.types';
import { ConsentType } from '@/types/database.types';

export const consentService = {
  async getActiveLegalDocuments(): Promise<LegalDocument[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error fetching legal documents:', error);
      return [];
    }
    return (data as LegalDocument[]) || [];
  },

  async getUserConsents(profileId: string): Promise<ConsentRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user consents:', error);
      return [];
    }
    return (data as ConsentRecord[]) || [];
  },

  async recordConsent(
    profileId: string,
    consentType: ConsentType,
    documentId?: string | null,
    granted: boolean = true,
    source: string = 'web'
  ): Promise<{ success: boolean; data?: ConsentRecord; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('consent_records') as any)
      .insert({
        profile_id: profileId,
        consent_type: consentType,
        document_id: documentId || null,
        granted,
        source,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as ConsentRecord };
  },

  async updateConsent(
    consentId: string,
    granted: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('consent_records') as any)
      .update({
        granted,
        revoked_at: granted ? null : new Date().toISOString(),
      })
      .eq('id', consentId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
