import { createClient } from '@/lib/supabase/client';
import { UserSessionRecord, TrustedDevice } from '@/types/app.types';

export const sessionService = {
  /**
   * Fetches active sessions for the user (Section 11 & 12).
   */
  async getUserSessions(profileId: string): Promise<UserSessionRecord[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return (data || []).map((s: any, idx: number) => ({
      ...s,
      is_current: idx === 0, // Mocking first active session as current browser
    }));
  },

  /**
   * Fetches trusted devices (Section 14).
   */
  async getTrustedDevices(profileId: string): Promise<TrustedDevice[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('profile_id', profileId)
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('Error fetching trusted devices:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Revokes a specific session (Section 15).
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('revoke_user_session', {
      p_session_id: sessionId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Record security event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('record_security_event', {
      p_event_type: 'session_revoked',
      p_severity: 'info',
      p_risk_score: 0,
      p_metadata: { session_id: sessionId },
    });

    return { success: true };
  },

  /**
   * Revokes all other sessions (Section 15).
   */
  async revokeAllOtherSessions(currentSessionId?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('revoke_all_other_sessions', {
      p_current_session_id: currentSessionId || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Record security event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)('record_security_event', {
      p_event_type: 'session_revoked',
      p_severity: 'medium',
      p_risk_score: 5,
      p_metadata: { action: 'revoke_all_other' },
    });

    return { success: true };
  },

  /**
   * Validates if user authenticated within the recent time window (Section 81 & 82).
   */
  async requireRecentAuthentication(maxAgeMinutes: number = 15): Promise<{ isRecent: boolean; authenticatedAt?: string }> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { isRecent: false };
    }

    // Supabase auth stores access token issue time or last login in user object
    const authTime = session.user.last_sign_in_at || session.user.created_at;
    if (!authTime) {
      return { isRecent: false };
    }

    const elapsedMinutes = (Date.now() - new Date(authTime).getTime()) / (1000 * 60);
    const isRecent = elapsedMinutes <= maxAgeMinutes;

    return {
      isRecent,
      authenticatedAt: authTime,
    };
  },
};
