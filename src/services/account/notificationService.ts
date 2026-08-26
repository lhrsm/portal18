import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationPreference } from '@/types/app.types';

export const notificationService = {
  /**
   * Fetches user notifications with pagination.
   */
  async getUserNotifications(profileId: string, limit = 30) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return (data || []) as Notification[];
  },

  /**
   * Gets total unread notifications count.
   */
  async getUnreadCount(profileId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .is('read_at', null);

    if (error) {
      return 0;
    }
    return count || 0;
  },

  /**
   * Marks a notification as read.
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Marks all notifications as read for user (Section 57).
   */
  async markAllAsRead(profileId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('profile_id', profileId)
      .is('read_at', null);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Fetches notification channel and category preferences.
   */
  async getNotificationPreferences(profileId: string): Promise<NotificationPreference[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      return [];
    }
    return (data || []) as NotificationPreference[];
  },

  /**
   * Updates a specific notification preference.
   */
  async updateNotificationPreference(
    profileId: string,
    channel: 'in_app' | 'email' | 'push',
    category: 'transactional' | 'security' | 'profile_updates' | 'platform_news' | 'marketing',
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('notification_preferences') as any)
      .upsert({
        profile_id: profileId,
        channel,
        category,
        enabled,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
