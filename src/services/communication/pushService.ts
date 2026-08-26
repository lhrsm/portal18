import { createClient } from '@/lib/supabase/client';
import { PushSubscriptionRecord } from '@/types/app.types';

export const pushService = {
  /**
   * Registers or updates a device push subscription.
   */
  async registerSubscription(
    profileId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
      userAgent?: string;
    }
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('push_subscriptions') as any)
        .upsert(
          {
            profile_id: profileId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            user_agent_hash: subscription.userAgent ? hashString(subscription.userAgent) : null,
            last_used_at: new Date().toISOString(),
            revoked_at: null,
          },
          { onConflict: 'profile_id,endpoint' }
        )
        .select('id')
        .single();

      if (error) {
        console.error('Error saving push subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, subscriptionId: data?.id };
    } catch (err: any) {
      console.error('Exception registering push subscription:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Revokes a push subscription.
   */
  async removeSubscription(
    profileId: string,
    endpoint: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('push_subscriptions') as any)
        .update({ revoked_at: new Date().toISOString() })
        .eq('profile_id', profileId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Error revoking push subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Exception revoking push subscription:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Lists active subscriptions for current user.
   */
  async getUserSubscriptions(profileId: string): Promise<PushSubscriptionRecord[]> {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('push_subscriptions') as any)
      .select('*')
      .eq('profile_id', profileId)
      .is('revoked_at', null)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return [];
    }

    return (data || []) as PushSubscriptionRecord[];
  },

  /**
   * Creates a discreet push notification payload protecting privacy (Section 33 & 34).
   */
  formatDiscreetPayload(title: string, message: string, targetUrl = '/account/notifications') {
    return {
      title: title || 'Portal Nacional',
      body: message || 'Você possui uma nova notificação em sua conta.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: targetUrl,
      },
    };
  },
};

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
