import { createClient } from '@/lib/supabase/client';
import { Appeal, AppealStatus, RiskSubjectType } from './types';

export const appealsService = {
  /**
   * Submits a structured user appeal against a sanction or profile restriction.
   */
  async submitAppeal(params: {
    sanctionId?: string;
    caseId?: string;
    profileId: string;
    subjectType: RiskSubjectType;
    subjectId: string;
    reason: string;
    evidenceUrls?: string[];
  }): Promise<{ success: boolean; appealId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // Check for existing pending appeal on the same sanction
      if (params.sanctionId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase.from('appeals') as any)
          .select('id')
          .eq('sanction_id', params.sanctionId)
          .in('status', ['submitted', 'under_review', 'additional_information_requested'])
          .limit(1);

        if (existing && existing.length > 0) {
          return { success: false, error: 'Já existe um recurso em análise para esta penalidade.' };
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('appeals') as any)
        .insert({
          sanction_id: params.sanctionId || null,
          case_id: params.caseId || null,
          profile_id: params.profileId,
          subject_type: params.subjectType,
          subject_id: params.subjectId,
          reason: params.reason,
          evidence_urls: params.evidenceUrls || [],
          status: 'submitted',
        })
        .select('id')
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || 'Falha ao registrar recurso.' };
      }

      return { success: true, appealId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao enviar recurso.' };
    }
  },

  /**
   * Retrieves appeals for administrative review.
   */
  async getAppeals(filters?: { status?: string; limit?: number }): Promise<Appeal[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('appeals') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as Appeal[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves appeals filed by a specific user profile.
   */
  async getAppealsForUser(profileId: string): Promise<Appeal[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('appeals') as any)
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as Appeal[];
    } catch {
      return [];
    }
  },

  /**
   * Adjudicates an appeal via atomic RPC enforcing four-eyes independent review.
   */
  async resolveAppeal(params: {
    appealId: string;
    decision: 'upheld' | 'modified' | 'overturned';
    decisionNotes: string;
    decidedBy: string;
  }): Promise<{ success: boolean; status?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('resolve_appeal', {
        p_appeal_id: params.appealId,
        p_decision: params.decision,
        p_decision_notes: params.decisionNotes,
        p_decided_by: params.decidedBy,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || data?.error || 'Erro ao julgar recurso.' };
      }

      return { success: true, status: data.status };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao processar julgamento do recurso.' };
    }
  },
};
