import { createClient } from '@/lib/supabase/client';
import { 
  DataExportRequest, 
  AccountDeletionRequest, 
  LegalHold, 
  DataRetentionPolicy 
} from '@/types/app.types';

export const dataLifecycleService = {
  /**
   * Requests an asynchronous LGPD data export bundle (Section 79 & 80).
   */
  async requestDataExport(): Promise<{ success: boolean; exportId?: string; status?: string; error?: string }> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('request_data_export');

      if (error) {
        console.error('Error requesting data export:', error);
        return { success: false, error: error.message };
      }

      return data as { success: boolean; exportId?: string; status?: string };
    } catch (err: any) {
      console.error('Exception requesting data export:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetches data export history for current user.
   */
  async getUserExportRequests(profileId: string): Promise<DataExportRequest[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('data_export_requests') as any)
      .select('*')
      .eq('profile_id', profileId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching export requests:', error);
      return [];
    }

    return (data || []) as DataExportRequest[];
  },

  /**
   * Requests account deletion with grace period (Section 92 & 94).
   */
  async requestAccountDeletion(reason?: string): Promise<{
    success: boolean;
    deletionId?: string;
    status?: string;
    scheduledFor?: string;
    error?: string;
  }> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('request_account_deletion', {
        p_reason: reason || null,
      });

      if (error) {
        console.error('Error requesting account deletion:', error);
        return { success: false, error: error.message };
      }

      return data as any;
    } catch (err: any) {
      console.error('Exception requesting account deletion:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Cancels a scheduled account deletion during grace period (Section 97).
   */
  async cancelAccountDeletion(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('cancel_account_deletion');

      if (error) {
        return { success: false, error: error.message };
      }

      return data as { success: boolean; message?: string };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetches active deletion request for current user.
   */
  async getActiveDeletionRequest(profileId: string): Promise<AccountDeletionRequest | null> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('account_deletion_requests') as any)
      .select('*')
      .eq('profile_id', profileId)
      .in('status', ['requested', 'scheduled'])
      .maybeSingle();

    if (error || !data) return null;
    return data as AccountDeletionRequest;
  },

  /**
   * Lists legal holds for compliance / admin (Section 121).
   */
  async getLegalHolds(): Promise<LegalHold[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('legal_holds') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching legal holds:', error);
      return [];
    }

    return (data || []) as LegalHold[];
  },

  /**
   * Creates a legal hold.
   */
  async createLegalHold(params: {
    entityType: 'profile' | 'advertiser' | 'payment' | 'media' | 'ticket';
    entityId: string;
    reason: string;
    createdBy: string;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('legal_holds') as any).insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      reason: params.reason,
      created_by: params.createdBy,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Releases a legal hold.
   */
  async releaseLegalHold(holdId: string, releasedBy: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('legal_holds') as any)
      .update({
        released_at: new Date().toISOString(),
        released_by: releasedBy,
      })
      .eq('id', holdId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Fetches data retention policies (Section 118).
   */
  async getRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('data_retention_policies') as any)
      .select('*')
      .order('policy_key', { ascending: true });

    if (error) {
      console.error('Error fetching retention policies:', error);
      return [];
    }

    return (data || []) as DataRetentionPolicy[];
  },
};
