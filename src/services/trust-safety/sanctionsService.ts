import { createClient } from '@/lib/supabase/client';
import {
  Sanction,
  RiskSubjectType,
  SanctionType,
  SanctionScope,
  SanctionDuration
} from './types';

export const sanctionsService = {
  /**
   * Applies a proportional, tiered sanction via atomic RPC with audit trail.
   */
  async applySanction(params: {
    subjectType: RiskSubjectType;
    subjectId: string;
    caseId?: string;
    sanctionType: SanctionType;
    scope?: SanctionScope;
    duration?: SanctionDuration;
    durationDays?: number;
    reasonInternal: string;
    reasonPublic: string;
    appliedBy: string;
  }): Promise<{ success: boolean; sanctionId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('apply_sanction', {
        p_subject_type: params.subjectType,
        p_subject_id: params.subjectId,
        p_case_id: params.caseId || null,
        p_sanction_type: params.sanctionType,
        p_scope: params.scope || 'account',
        p_duration: params.duration || 'temporary',
        p_duration_days: params.durationDays || null,
        p_reason_internal: params.reasonInternal,
        p_reason_public: params.reasonPublic,
        p_applied_by: params.appliedBy,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || 'Falha ao aplicar sanção.' };
      }

      return { success: true, sanctionId: data.sanction_id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao aplicar sanção.' };
    }
  },

  /**
   * Retrieves active sanctions for a specific subject (user / advertiser / profile).
   */
  async getActiveSanctions(subjectType: RiskSubjectType, subjectId: string): Promise<Sanction[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('sanctions') as any)
        .select('*')
        .eq('subject_type', subjectType)
        .eq('subject_id', subjectId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Sanction[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves all sanctions with optional filters for admin oversight.
   */
  async getAllSanctions(filters?: { status?: string; sanctionType?: string; limit?: number }): Promise<Sanction[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('sanctions') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.sanctionType && filters.sanctionType !== 'all') {
        query = query.eq('sanction_type', filters.sanctionType);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as Sanction[];
    } catch {
      return [];
    }
  },

  /**
   * Lifts an active sanction with staff identification and justification.
   */
  async liftSanction(sanctionId: string, liftedBy: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('sanctions') as any)
        .update({
          status: 'lifted',
          lifted_by: liftedBy,
          lifted_reason: reason,
        })
        .eq('id', sanctionId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao revogar sanção.' };
    }
  },
};
