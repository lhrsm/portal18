import { createClient } from '@/lib/supabase/client';
import {
  RiskSignal,
  RiskSubjectType,
  RiskSeverity,
  RiskConfidence,
  RiskSignalSource,
  BlockedMediaFingerprint
} from './types';

export const riskSignalsService = {
  /**
   * Records a discrete, explainable risk signal with deduplication.
   */
  async recordSignal(params: {
    subjectType: RiskSubjectType;
    subjectId: string;
    signalType: string;
    severity: RiskSeverity;
    confidence: RiskConfidence;
    source: RiskSignalSource;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; signalId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('record_risk_signal', {
        p_subject_type: params.subjectType,
        p_subject_id: params.subjectId,
        p_signal_type: params.signalType,
        p_severity: params.severity,
        p_confidence: params.confidence,
        p_source: params.source,
        p_metadata: params.metadata || {},
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, signalId: data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao registrar sinal de risco.' };
    }
  },

  /**
   * Retrieves risk signals with optional filtering.
   */
  async getSignals(filters?: {
    subjectType?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): Promise<RiskSignal[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('risk_signals') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.subjectType) {
        query = query.eq('subject_type', filters.subjectType);
      }
      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }
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
      return data as RiskSignal[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves all signals associated with a specific subject.
   */
  async getSignalsForSubject(subjectType: RiskSubjectType, subjectId: string): Promise<RiskSignal[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('risk_signals') as any)
        .select('*')
        .eq('subject_type', subjectType)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data as RiskSignal[];
    } catch {
      return [];
    }
  },

  /**
   * Checks if a media hash is present in the blocked fingerprints catalogue.
   */
  async checkBlockedMedia(hash: string): Promise<{ isBlocked: boolean; fingerprint?: BlockedMediaFingerprint }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('blocked_media_fingerprints') as any)
        .select('*')
        .eq('media_hash', hash)
        .limit(1)
        .single();

      if (error || !data) {
        return { isBlocked: false };
      }

      return { isBlocked: true, fingerprint: data as BlockedMediaFingerprint };
    } catch {
      return { isBlocked: false };
    }
  },

  /**
   * Adds a prohibited/blocked media hash to the catalogue.
   */
  async addBlockedMedia(params: {
    mediaHash: string;
    hashType?: 'sha256' | 'phash' | 'md5';
    blockReason: string;
    severity?: 'critical' | 'high' | 'medium';
    createdBy?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('blocked_media_fingerprints') as any).insert({
        media_hash: params.mediaHash,
        hash_type: params.hashType || 'sha256',
        block_reason: params.blockReason,
        severity: params.severity || 'high',
        created_by: params.createdBy || null,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar hash de mídia bloqueada.' };
    }
  },
};
