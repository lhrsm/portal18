import { createClient } from '@/lib/supabase/client';
import {
  CommunicationChannel,
  CommunicationCategory,
  CommunicationPriority,
  CommunicationJob
} from '@/types/app.types';
import { emailProvider } from './emailProvider';

export const communicationService = {
  /**
   * Enqueues or delivers an in-app notification.
   */
  async sendInApp(
    profileId: string,
    templateCode: string,
    payload: Record<string, any>,
    category: CommunicationCategory = 'transactional',
    priority: CommunicationPriority = 'normal',
    dedupeKey?: string
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return this.enqueueJob({
      profileId,
      channel: 'in_app',
      category,
      templateCode,
      payload,
      priority,
      dedupeKey,
    });
  },

  /**
   * Enqueues an email communication job.
   */
  async sendEmail(
    profileId: string | null,
    templateCode: string,
    payload: Record<string, any>,
    category: CommunicationCategory = 'transactional',
    priority: CommunicationPriority = 'normal',
    dedupeKey?: string
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return this.enqueueJob({
      profileId,
      channel: 'email',
      category,
      templateCode,
      payload,
      priority,
      dedupeKey,
    });
  },

  /**
   * Enqueues a push notification job.
   */
  async sendPush(
    profileId: string,
    templateCode: string,
    payload: Record<string, any>,
    category: CommunicationCategory = 'transactional',
    priority: CommunicationPriority = 'normal',
    dedupeKey?: string
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return this.enqueueJob({
      profileId,
      channel: 'push',
      category,
      templateCode,
      payload,
      priority,
      dedupeKey,
    });
  },

  /**
   * Critical security alerts: always bypasses marketing opt-outs and sends with critical priority.
   */
  async sendSecurityAlert(
    profileId: string,
    payload: { activity: string; device?: string; timestamp?: string }
  ): Promise<{ success: boolean }> {
    await this.sendInApp(profileId, 'security_alert', payload, 'security', 'critical');
    await this.sendEmail(profileId, 'security_alert', payload, 'security', 'critical');
    return { success: true };
  },

  /**
   * Transactional notification dispatch helper.
   */
  async sendTransactional(
    profileId: string,
    templateCode: string,
    payload: Record<string, any>,
    channel: CommunicationChannel = 'email'
  ): Promise<{ success: boolean }> {
    if (channel === 'email') {
      await this.sendEmail(profileId, templateCode, payload, 'transactional', 'high');
    } else {
      await this.sendInApp(profileId, templateCode, payload, 'transactional', 'high');
    }
    return { success: true };
  },

  /**
   * Marketing notification: strictly verifies user preferences before enqueuing.
   */
  async sendMarketing(
    profileId: string,
    templateCode: string,
    payload: Record<string, any>
  ): Promise<{ success: boolean; skipped?: boolean }> {
    const supabase = createClient();

    // Check if user has marketing enabled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pref } = await (supabase.from('notification_preferences') as any)
      .select('enabled')
      .eq('profile_id', profileId)
      .eq('category', 'marketing')
      .eq('channel', 'email')
      .maybeSingle();

    if (pref && !(pref as any).enabled) {
      return { success: true, skipped: true };
    }

    await this.sendEmail(profileId, templateCode, payload, 'marketing', 'low');
    return { success: true };
  },

  /**
   * Core job enqueueing helper with deduplication.
   */
  async enqueueJob(params: {
    profileId: string | null;
    channel: CommunicationChannel;
    category: CommunicationCategory;
    templateCode: string;
    payload: Record<string, any>;
    priority: CommunicationPriority;
    dedupeKey?: string;
  }): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('communication_jobs') as any)
        .insert({
          profile_id: params.profileId,
          channel: params.channel,
          category: params.category,
          template_code: params.templateCode,
          payload: params.payload,
          priority: params.priority,
          dedupe_key: params.dedupeKey || null,
          status: 'pending',
          attempts: 0,
          max_attempts: 3,
        })
        .select('id')
        .single();

      if (error) {
        // If deduplication prevented insert, it is expected
        if (error.code === '23505') {
          return { success: true, error: 'deduplicated' };
        }
        console.error('Error enqueueing communication job:', error);
        return { success: false, error: error.message };
      }

      // If email channel and in local/dev execution, execute via emailProvider
      if (params.channel === 'email' && params.payload.to) {
        await emailProvider.sendEmail({
          to: params.payload.to,
          templateCode: params.templateCode,
          variables: params.payload,
          category: params.category,
        });
      }

      return { success: true, jobId: data?.id };
    } catch (err: any) {
      console.error('Exception enqueueing communication job:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch queued jobs for admin inspection / queue worker.
   */
  async getPendingJobs(limit = 50): Promise<CommunicationJob[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('communication_jobs') as any)
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending communication jobs:', error);
      return [];
    }
    return (data || []) as CommunicationJob[];
  },
};
