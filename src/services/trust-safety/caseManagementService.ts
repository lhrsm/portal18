import { createClient } from '@/lib/supabase/client';
import {
  TrustSafetyCase,
  RiskSubjectType,
  TSCasePriority,
  TSCaseStatus,
  CaseInternalNote,
  RiskSignal
} from './types';

export const caseManagementService = {
  /**
   * Retrieves Trust & Safety cases with optional status and priority filters.
   */
  async getCases(filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    limit?: number;
  }): Promise<TrustSafetyCase[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('trust_safety_cases') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as TrustSafetyCase[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves a full case with linked signals and internal staff notes.
   */
  async getCaseById(caseId: string): Promise<TrustSafetyCase | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: caseData, error: caseErr } = await (supabase.from('trust_safety_cases') as any)
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseErr || !caseData) return null;

      // Fetch linked signals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: links } = await (supabase.from('case_signal_links') as any)
        .select('signal_id')
        .eq('case_id', caseId);

      let signals: RiskSignal[] = [];
      if (links && links.length > 0) {
        const signalIds = links.map((l: any) => l.signal_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: sigData } = await (supabase.from('risk_signals') as any)
          .select('*')
          .in('id', signalIds)
          .order('created_at', { ascending: false });
        if (sigData) signals = sigData as RiskSignal[];
      }

      // Fetch internal notes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: notesData } = await (supabase.from('case_internal_notes') as any)
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      return {
        ...(caseData as TrustSafetyCase),
        signals,
        notes: (notesData || []) as CaseInternalNote[],
      };
    } catch {
      return null;
    }
  },

  /**
   * Creates or escalates a Trust & Safety case via atomic RPC.
   */
  async createOrEscalateCase(params: {
    subjectType: RiskSubjectType;
    subjectId: string;
    title: string;
    priority: TSCasePriority;
    description?: string;
    signalIds?: string[];
  }): Promise<{ success: boolean; caseId?: string; caseNumber?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('create_or_escalate_ts_case', {
        p_subject_type: params.subjectType,
        p_subject_id: params.subjectId,
        p_title: params.title,
        p_priority: params.priority,
        p_description: params.description || '',
        p_signal_ids: params.signalIds || [],
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || 'Falha ao criar caso de Trust & Safety.' };
      }

      return { success: true, caseId: data.case_id, caseNumber: data.case_number };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao abrir caso.' };
    }
  },

  /**
   * Assigns a case to a specific staff member.
   */
  async assignCase(caseId: string, assignedTo: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('trust_safety_cases') as any)
        .update({ assigned_to: assignedTo, status: 'investigating', updated_at: new Date().toISOString() })
        .eq('id', caseId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atribuir caso.' };
    }
  },

  /**
   * Updates case status and records resolution notes.
   */
  async updateCaseStatus(
    caseId: string,
    status: TSCaseStatus,
    resolution?: string,
    resolvedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolution = resolution || null;
        updateData.resolved_by = resolvedBy || null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('trust_safety_cases') as any)
        .update(updateData)
        .eq('id', caseId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar status do caso.' };
    }
  },

  /**
   * Adds a private staff-only note to the case investigation.
   */
  async addInternalNote(caseId: string, authorId: string, note: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('case_internal_notes') as any).insert({
        case_id: caseId,
        author_id: authorId,
        note,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar nota interna.' };
    }
  },
};
