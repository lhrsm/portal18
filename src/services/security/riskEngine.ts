import { createClient } from '@/lib/supabase/client';
import { RiskType, SecuritySeverity, RiskLevel, RiskAction, RiskEvent, AccountRiskScore } from '@/types/app.types';

export const riskEngine = {
  /**
   * Records a risk event (Section 22 & 28).
   */
  async recordEvent(params: {
    profileId?: string | null;
    advertiserId?: string | null;
    riskType: RiskType;
    severity: SecuritySeverity;
    scoreDelta?: number;
    source?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const supabase = createClient();

    const delta = params.scoreDelta ?? (
      params.severity === 'critical' ? 40 :
      params.severity === 'high' ? 25 :
      params.severity === 'medium' ? 15 : 5
    );

    const { data, error } = await (supabase.from('risk_events') as any)
      .insert({
        profile_id: params.profileId || null,
        advertiser_id: params.advertiserId || null,
        risk_type: params.riskType,
        severity: params.severity,
        score_delta: delta,
        source: params.source || 'rule',
        status: 'open',
        metadata: params.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error recording risk event:', error);
      return { success: false, error: error.message };
    }

    // Trigger score recalculation if profileId exists
    if (params.profileId) {
      await this.calculateScore(params.profileId);
    }

    return { success: true, eventId: data?.id };
  },

  /**
   * Calculates account risk score with time decay (Section 24 & 26).
   */
  async calculateScore(profileId: string): Promise<AccountRiskScore> {
    const supabase = createClient();

    // Fetch open risk events
    const { data: events } = await (supabase.from('risk_events') as any)
      .select('score_delta, created_at, status')
      .eq('profile_id', profileId)
      .eq('status', 'open');

    let totalScore = 0;
    const now = Date.now();

    for (const ev of (events || [])) {
      const ageInDays = (now - new Date(ev.created_at).getTime()) / (1000 * 60 * 60 * 24);
      // Decay factor: reduces impact by 10% per week
      const decayFactor = Math.max(0.2, 1 - (ageInDays / 70));
      totalScore += Math.round(ev.score_delta * decayFactor);
    }

    const finalScore = Math.min(100, Math.max(0, totalScore));
    const riskLevel = this.getRiskLevel(finalScore);

    // Upsert calculated score
    await (supabase.from('account_risk_scores') as any).upsert({
      profile_id: profileId,
      score: finalScore,
      risk_level: riskLevel,
      last_calculated_at: new Date().toISOString(),
    });

    return {
      profile_id: profileId,
      score: finalScore,
      risk_level: riskLevel,
      last_calculated_at: new Date().toISOString(),
    };
  },

  /**
   * Determines risk level from score (Section 25).
   */
  getRiskLevel(score: number): RiskLevel {
    if (score >= 85) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  },

  /**
   * Determines if user should face an adaptive challenge (CAPTCHA / MFA) (Section 47).
   */
  async shouldChallenge(profileId: string): Promise<{ challenge: boolean; type?: 'captcha' | 'mfa' }> {
    const supabase = createClient();
    const { data } = await (supabase.from('account_risk_scores') as any)
      .select('score, risk_level')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!data) return { challenge: false };

    if (data.score >= 70) {
      return { challenge: true, type: 'mfa' };
    }
    if (data.score >= 35) {
      return { challenge: true, type: 'captcha' };
    }

    return { challenge: false };
  },

  /**
   * Fetches risk events queue for staff (Section 95).
   */
  async getAdminRiskQueue(filters?: { status?: string; severity?: string }): Promise<RiskEvent[]> {
    const supabase = createClient();
    let query = (supabase.from('risk_events') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin risk queue:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Resolves a risk event (Section 97).
   */
  async resolveRiskEvent(
    eventId: string,
    status: 'resolved' | 'false_positive' | 'confirmed',
    resolvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    const { data: event } = await (supabase.from('risk_events') as any)
      .select('profile_id')
      .eq('id', eventId)
      .single();

    const { error } = await (supabase.from('risk_events') as any)
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    if (event?.profile_id) {
      await this.calculateScore(event.profile_id);
    }

    return { success: true };
  },
};
