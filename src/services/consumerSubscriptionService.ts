import { createClient } from '@/lib/supabase/client';
import { ConsumerCatalog, ConsumerEntitlements, ConsumerSubscription } from '@/types/app.types';

export const consumerSubscriptionService = {
  /**
   * Fetches the public consumer plans catalog and multi-period pricing.
   */
  async getCatalog(): Promise<ConsumerCatalog | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_consumer_catalog');
      if (error || !data) {
        return null;
      }
      return data as ConsumerCatalog;
    } catch {
      return null;
    }
  },

  /**
   * Evaluates server-authoritative entitlements for a consumer.
   */
  async getConsumerEntitlements(userId?: string): Promise<ConsumerEntitlements> {
    const defaultEntitlements: ConsumerEntitlements = {
      is_authenticated: false,
      is_premium: false,
      lifecycle_state: 'anonymous',
      plan_name: 'Visitante Anônimo',
      entitlements: {
        can_watch_premium_videos: false,
        full_review_access: false,
        advanced_favorites: false,
        advanced_lists: false,
        extended_history: false,
        new_profile_alerts: false,
      },
    };

    if (!userId) return defaultEntitlements;

    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_consumer_entitlements', {
        p_user_id: userId,
      });

      if (error || !data) {
        return defaultEntitlements;
      }
      return data as ConsumerEntitlements;
    } catch {
      return defaultEntitlements;
    }
  },

  /**
   * Fetches the current subscription and entitlements for a consumer account.
   */
  async getSubscriptionDetails(userId: string): Promise<{ subscription: ConsumerSubscription | null; entitlements: ConsumerEntitlements }> {
    const supabase = createClient();
    const entitlements = await this.getConsumerEntitlements(userId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('consumer_subscriptions') as any)
        .select('*')
        .eq('user_profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { subscription: null, entitlements };
      }
      return { subscription: data as ConsumerSubscription, entitlements };
    } catch {
      return { subscription: null, entitlements };
    }
  },
};
