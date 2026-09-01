import { createClient } from '@/lib/supabase/client';
import {
  DispatchNotificationParams,
  CanonicalNotificationEvent,
  NotificationDelivery
} from './types';

export const communicationService = {
  /**
   * Dispatches a canonical notification event through multi-channel policy engine.
   */
  async dispatch(params: DispatchNotificationParams): Promise<{
    success: boolean;
    eventId?: string;
    alreadyDispatched?: boolean;
    error?: string;
  }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('dispatch_canonical_notification', {
        p_event_type: params.eventType,
        p_recipient_profile_id: params.recipientProfileId,
        p_recipient_role: params.recipientRole || 'user',
        p_subject_type: params.subjectType,
        p_subject_id: params.subjectId,
        p_priority: params.priority || 'normal',
        p_category: params.category,
        p_payload: params.payload || {},
        p_dedupe_key: params.dedupeKey || null,
      });

      if (error || !data || !data.success) {
        return { success: false, error: error?.message || 'Falha ao despachar notificação.' };
      }

      return {
        success: true,
        eventId: data.event_id,
        alreadyDispatched: data.already_dispatched || false,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro inesperado ao despachar notificação.' };
    }
  },

  /**
   * Retrieves canonical notification events with optional filtering.
   */
  async getEvents(filters?: { category?: string; status?: string; limit?: number }): Promise<CanonicalNotificationEvent[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('notification_events') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
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
      return data as CanonicalNotificationEvent[];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves delivery attempts from the delivery queue.
   */
  async getDeliveries(filters?: { channel?: string; status?: string; limit?: number }): Promise<NotificationDelivery[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('notification_deliveries') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.channel && filters.channel !== 'all') {
        query = query.eq('channel', filters.channel);
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
      return data as NotificationDelivery[];
    } catch {
      return [];
    }
  },

  /**
   * Returns high-level delivery operational statistics.
   */
  async getDeliveryStats(): Promise<{
    queued: number;
    delivered: number;
    failed: number;
    totalEvents: number;
  }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [eventsRes, queuedRes, deliveredRes, failedRes] = await Promise.all([
        (supabase.from('notification_events') as any).select('id', { count: 'exact', head: true }),
        (supabase.from('notification_deliveries') as any).select('id', { count: 'exact', head: true }).eq('status', 'queued'),
        (supabase.from('notification_deliveries') as any).select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
        (supabase.from('notification_deliveries') as any).select('id', { count: 'exact', head: true }).eq('status', 'failed'),
      ]);

      return {
        totalEvents: eventsRes.count || 0,
        queued: queuedRes.count || 0,
        delivered: deliveredRes.count || 0,
        failed: failedRes.count || 0,
      };
    } catch {
      return { totalEvents: 0, queued: 0, delivered: 0, failed: 0 };
    }
  },
};
