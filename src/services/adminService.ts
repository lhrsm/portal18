import { createClient } from '@/lib/supabase/client';
import { 
  AdminDashboardMetrics, 
  AdvertiserProfile, 
  AdvertiserMedia, 
  Report, 
  AuditLog, 
  Profile, 
  UserRole, 
  ModerationNote 
} from '@/types/app.types';

export const adminService = {
  // 1. Dashboard Consolidated Metrics (Requirement 7)
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const supabase = createClient();

    const [
      usersCount,
      advCount,
      activeAdvCount,
      pendingAdvCount,
      pendingMediaCount,
      openReportsCount,
      criticalReportsCount,
      verificationsCount,
      suspendedCount,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'active'),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'pending_review'),
      supabase.from('advertiser_media').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending').is('deleted_at', null),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('severity', 'critical').eq('status', 'open'),
      supabase.from('verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'suspended'),
    ]);

    return {
      totalUsers: usersCount.count || 0,
      totalAdvertisers: advCount.count || 0,
      activeProfiles: activeAdvCount.count || 0,
      pendingProfiles: pendingAdvCount.count || 0,
      pendingMedia: pendingMediaCount.count || 0,
      openReports: openReportsCount.count || 0,
      criticalReports: criticalReportsCount.count || 0,
      pendingVerifications: verificationsCount.count || 0,
      suspendedProfiles: suspendedCount.count || 0,
    };
  },

  // 2. Profiles Moderation Queue (Requirements 9, 10, 11)
  async getPendingProfilesQueue(filters: { search?: string; stateId?: string; sort?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('advertiser_profiles')
      .select('*, brazil_states(name, code), brazil_cities(name), profiles(display_name, username)', { count: 'exact' })
      .eq('profile_status', 'pending_review');

    if (filters.search) {
      query = query.ilike('stage_name', `%${filters.search.trim()}%`);
    }

    if (filters.stateId) {
      query = query.eq('state_id', filters.stateId);
    }

    query = query.order('submitted_at', { ascending: filters.sort === 'oldest' });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching pending profiles:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  async getProfileForReview(advertiserId: string) {
    const supabase = createClient();
    const [advRes, mediaRes, contactsRes, catRes, notesRes, reportsRes] = await Promise.all([
      supabase
        .from('advertiser_profiles')
        .select('*, brazil_states(name, code), brazil_cities(name), profiles(display_name, username)')
        .eq('id', advertiserId)
        .single() as any,
      supabase
        .from('advertiser_media')
        .select('*')
        .eq('advertiser_id', advertiserId)
        .is('deleted_at', null)
        .order('position', { ascending: true }) as any,
      supabase
        .from('advertiser_contacts')
        .select('*')
        .eq('advertiser_id', advertiserId) as any,
      supabase
        .from('advertiser_categories')
        .select('category_id, categories(name, slug)')
        .eq('advertiser_id', advertiserId) as any,
      supabase
        .from('moderation_notes')
        .select('*, profiles(display_name)')
        .eq('entity_type', 'advertiser')
        .eq('entity_id', advertiserId)
        .order('created_at', { ascending: false }) as any,
      supabase
        .from('reports')
        .select('*')
        .eq('target_type', 'advertiser')
        .eq('target_id', advertiserId)
        .order('created_at', { ascending: false }) as any,
    ]);

    if (advRes.error || !advRes.data) return null;

    return {
      advertiser: advRes.data,
      media: (mediaRes.data as AdvertiserMedia[]) || [],
      contacts: (contactsRes.data as any[]) || [],
      categories: (catRes.data as any[]) || [],
      notes: (notesRes.data as any[]) || [],
      reports: (reportsRes.data as Report[]) || [],
    };
  },

  // Profile Action RPCs
  async approveProfile(advertiserId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('approve_advertiser_profile', {
      p_advertiser_id: advertiserId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: data?.message };
  },

  async requestChangesProfile(advertiserId: string, feedback: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('request_changes_advertiser_profile', {
      p_advertiser_id: advertiserId,
      p_feedback: feedback,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async rejectProfile(advertiserId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('reject_advertiser_profile', {
      p_advertiser_id: advertiserId,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async suspendProfile(advertiserId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('suspend_advertiser_profile', {
      p_advertiser_id: advertiserId,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async reactivateProfile(advertiserId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('reactivate_advertiser_profile', {
      p_advertiser_id: advertiserId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // 3. Media Moderation Queue (Requirements 22, 23, 24, 25, 26)
  async getPendingMediaQueue(filters: { limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 24;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, count, error } = await (supabase
      .from('advertiser_media')
      .select('*, advertiser_profiles(stage_name, slug, state_id, city_id)', { count: 'exact' })
      .eq('moderation_status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(from, to) as any);

    if (error) {
      console.error('Error fetching pending media:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      data: (data || []) as (AdvertiserMedia & { advertiser_profiles?: { stage_name: string; slug: string } })[],
      totalCount: count || 0,
    };
  },

  async approveMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('approve_advertiser_media', {
      p_media_id: mediaId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async rejectMedia(mediaId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('reject_advertiser_media', {
      p_media_id: mediaId,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async blockMedia(mediaId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('block_advertiser_media', {
      p_media_id: mediaId,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // 4. Reports Queue & Action (Requirements 29 to 36)
  async getReportsQueue(filters: { status?: string; severity?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('reports')
      .select('*, reporter_profile:profiles!reporter_profile_id(display_name, username)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    // Critical reports at top (Section 34)
    query = query
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching reports queue:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  async getReportDetails(reportId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter_profile:profiles!reporter_profile_id(display_name, username), assigned_profile:profiles!assigned_to(display_name)')
      .eq('id', reportId)
      .single();

    if (error || !data) return null;
    return data;
  },

  async assignReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('assign_report', {
      p_report_id: reportId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  async updateReportStatus(reportId: string, status: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('update_report_status', {
      p_report_id: reportId,
      p_status: status,
      p_notes: notes || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // 5. User & Role Management (Requirements 47 to 53)
  async getUsersList(filters: { search?: string; role?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('profiles')
      .select('*, user_roles(role)', { count: 'exact' });

    if (filters.search) {
      query = query.or(`display_name.ilike.%${filters.search.trim()}%,username.ilike.%${filters.search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching users:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  async grantRole(profileId: string, role: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('grant_role', {
      p_target_profile_id: profileId,
      p_role: role,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, message: data?.message };
  },

  async revokeRole(profileId: string, role: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('revoke_role', {
      p_target_profile_id: profileId,
      p_role: role,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  // 6. Immutable Audit Logs Viewer (Requirements 80 & 81)
  async getAuditLogs(filters: { action?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 30;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('audit_logs')
      .select('*, profiles:profiles!actor_profile_id(display_name, username)', { count: 'exact' });

    if (filters.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  // 7. Internal Notes (Staff only) (Requirement 37)
  async addModerationNote(entityType: string, entityId: string, note: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado.' };

    const { data: profile } = await (supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single() as any);

    if (!profile) return { success: false, error: 'Perfil não encontrado.' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('moderation_notes') as any)
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        author_profile_id: profile.id,
        note: note.trim(),
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
