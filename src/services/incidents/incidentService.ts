import { createClient } from '@/lib/supabase/client';
import { Incident, IncidentSeverity, IncidentStatus, PlatformKillSwitch } from '@/types/app.types';

export const incidentService = {
  /**
   * Fetches public incidents for status page (Section 111 & 115).
   */
  async getPublicIncidents(): Promise<Incident[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('incidents')
      .select('id, title, severity, status, started_at, resolved_at, public_message, created_at, updated_at')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching public incidents:', error);
      return [];
    }

    return (data || []).map((inc: any) => ({
      ...inc,
      internal_summary: '', // Excluded from public
      created_by: '',
    }));
  },

  /**
   * Fetches all incidents for administrative panel (Section 112).
   */
  async getAdminIncidents(): Promise<Incident[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin incidents:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Creates a new incident (Section 112).
   */
  async createIncident(params: {
    title: string;
    severity: IncidentSeverity;
    publicMessage: string;
    internalSummary: string;
    createdBy: string;
  }): Promise<{ success: boolean; incidentId?: string; error?: string }> {
    const supabase = createClient();
    const { data, error } = await (supabase.from('incidents') as any)
      .insert({
        title: params.title,
        severity: params.severity,
        status: 'investigating',
        public_message: params.publicMessage,
        internal_summary: params.internalSummary,
        created_by: params.createdBy,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, incidentId: data?.id };
  },

  /**
   * Updates incident status (Section 113).
   */
  async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    publicMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    if (publicMessage) {
      updateData.public_message = publicMessage;
    }

    const { error } = await (supabase.from('incidents') as any)
      .update(updateData)
      .eq('id', incidentId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Fetches all platform kill switches (Section 117).
   */
  async getKillSwitches(): Promise<PlatformKillSwitch[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('platform_kill_switches')
      .select('*')
      .order('switch_key', { ascending: true });

    if (error) {
      console.error('Error fetching kill switches:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Updates a kill switch status via RPC (Section 118).
   */
  async toggleKillSwitch(
    switchKey: string,
    enabled: boolean,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('update_kill_switch', {
      p_switch_key: switchKey,
      p_enabled: enabled,
      p_reason: reason || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Checks if a platform feature is disabled by a kill switch (Section 117).
   */
  async isFeatureDisabled(switchKey: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await (supabase.from('platform_kill_switches') as any)
      .select('enabled')
      .eq('switch_key', switchKey)
      .maybeSingle();

    return !!(data as any)?.enabled;
  },
};
