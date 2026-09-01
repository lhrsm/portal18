import { createClient } from '@/lib/supabase/client';
import {
  SubscriptionPlan,
  Subscription,
  Payment,
  PromotionProduct,
  AdvertiserCampaign,
  AdvertiserEntitlements,
  CheckoutResponse
} from '@/types/app.types';

export const billingService = {
  /**
   * Fetches all active subscription plans.
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
    return (data as SubscriptionPlan[]) || [];
  },

  /**
   * Fetches all active promotion & boost products.
   */
  async getPromotionProducts(): Promise<PromotionProduct[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('promotion_products')
      .select('*')
      .eq('status', 'active')
      .order('price_amount', { ascending: true });

    if (error) {
      console.error('Error fetching promotion products:', error);
      return [];
    }
    return (data as PromotionProduct[]) || [];
  },

  /**
   * Initiates a secure server-calculated checkout session.
   */
  async createCheckout(
    productType: 'subscription' | 'boost' | 'featured_placement' | 'campaign',
    productId: string,
    couponCode?: string
  ): Promise<CheckoutResponse> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('create_advertiser_checkout', {
      p_product_type: productType,
      p_product_id: productId,
      p_coupon_code: couponCode ? couponCode.trim().toUpperCase() : null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: data?.success ?? true,
      orderId: data?.order_id,
      orderNumber: data?.order_number,
      subtotal: data?.subtotal,
      discount: data?.discount,
      totalAmount: data?.total_amount,
      sessionToken: data?.session_token,
      redirectUrl: data?.redirect_url,
    };
  },

  /**
   * Retrieves the current advertiser's active subscription and entitlements.
   */
  async getOwnSubscription(): Promise<{
    subscription: (Subscription & { subscription_plans?: SubscriptionPlan }) | null;
    entitlements: AdvertiserEntitlements;
  }> {
    const defaultEntitlements: AdvertiserEntitlements = {
      has_active_subscription: false,
      plan_name: 'Gratuito / Básico',
      plan_slug: 'free',
      media_limit: 10,
      video_limit: 0,
      boost_allowance: 0,
      analytics_level: 'basic',
    };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { subscription: null, entitlements: defaultEntitlements };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle() as any);

    if (!profile) return { subscription: null, entitlements: defaultEntitlements };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adv } = await (supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle() as any);

    if (!adv) return { subscription: null, entitlements: defaultEntitlements };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [subRes, entRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('advertiser_id', adv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as any,
      (supabase.rpc as any)('get_advertiser_entitlements', { p_advertiser_id: adv.id }),
    ]);

    return {
      subscription: subRes.data || null,
      entitlements: entRes.data || defaultEntitlements,
    };
  },

  /**
   * Retrieves payment history for the authenticated advertiser.
   */
  async getOwnPayments(): Promise<Payment[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle() as any);

    if (!profile) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adv } = await (supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle() as any);

    if (!adv) return [];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('advertiser_id', adv.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
    return (data as Payment[]) || [];
  },

  /**
   * Retrieves active & past promotional campaigns for the authenticated advertiser.
   */
  async getOwnCampaigns(): Promise<(AdvertiserCampaign & { promotion_products?: PromotionProduct })[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle() as any);

    if (!profile) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adv } = await (supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle() as any);

    if (!adv) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('advertiser_campaigns')
      .select('*, promotion_products(*)')
      .eq('advertiser_id', adv.id)
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
    return (data || []) as (AdvertiserCampaign & { promotion_products?: PromotionProduct })[];
  },

  /**
   * Cancels recurring subscription renewal.
   */
  async cancelSubscription(subscriptionId: string, atPeriodEnd = true): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('cancel_advertiser_subscription', {
      p_subscription_id: subscriptionId,
      p_cancel_at_period_end: atPeriodEnd,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: data?.success ?? true };
  },

  /**
   * Super Admin Billing Overview Metrics (Section 77 & 78).
   */
  async getAdminBillingMetrics() {
    const supabase = createClient();

    const [paymentsRes, subsRes] = await Promise.all([
      supabase.from('payments').select('amount, status'),
      supabase.from('subscriptions').select('id, status, plan_id, subscription_plans(price_amount)').eq('status', 'active'),
    ]);

    const payments = (paymentsRes.data || []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSubs = (subsRes.data || []) as any[];

    let totalRevenueCents = 0;
    let totalRefundsCents = 0;
    let paidCount = 0;
    let refundCount = 0;

    payments.forEach((p: any) => {
      if (p.status === 'paid') {
        totalRevenueCents += p.amount;
        paidCount++;
      } else if (p.status === 'refunded') {
        totalRefundsCents += p.amount;
        refundCount++;
      }
    });

    // Calculate MRR strictly from recurring active subscriptions (Section 78)
    let mrrCents = 0;
    activeSubs.forEach((s) => {
      if (s.subscription_plans?.price_amount) {
        mrrCents += s.subscription_plans.price_amount;
      }
    });

    return {
      totalRevenueCents,
      totalRefundsCents,
      mrrCents,
      activeSubscriptionsCount: activeSubs.length,
      paidPaymentsCount: paidCount,
      refundedPaymentsCount: refundCount,
    };
  },

  /**
   * Super Admin Payments Queue.
   */
  async getAdminPayments(filters: { status?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('payments')
      .select('*, advertiser_profiles(stage_name, slug)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching admin payments:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  /**
   * Super Admin Subscriptions Queue.
   */
  async getAdminSubscriptions(filters: { status?: string; limit?: number; page?: number } = {}) {
    const supabase = createClient();
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('subscriptions')
      .select('*, advertiser_profiles(stage_name, slug), subscription_plans(name, price_amount)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching admin subscriptions:', error);
      return { data: [], totalCount: 0 };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: (data || []) as any[],
      totalCount: count || 0,
    };
  },

  /**
   * Admin Refund Action (Section 75 & 76).
   */
  async adminRefundPayment(paymentId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('refund_payment', {
      p_payment_id: paymentId,
      p_reason: reason,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: data?.success ?? true };
  },
};
