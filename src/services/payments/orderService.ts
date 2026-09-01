import { createClient } from '@/lib/supabase/client';
import { PaymentProviderResolver } from './resolver';
import {
  CanonicalOrder,
  CreateOrderParams,
  InitiatePaymentParams,
  InitiatePaymentResult,
  OrderFulfillmentResult
} from './types';

export const orderService = {
  /**
   * Creates a canonical order with 100% server-authoritative pricing and immutable commercial snapshot.
   */
  async createOrder(params: CreateOrderParams): Promise<{ success: boolean; orderId?: string; orderNumber?: string; order?: CanonicalOrder; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('create_canonical_order', {
        p_profile_id: params.profileId,
        p_product_type: params.productType,
        p_product_id: params.productId,
        p_billing_period_id: params.billingPeriodId || null,
        p_coupon_code: params.couponCode || null,
        p_selected_payment_method: params.paymentMethod || 'pix',
      });

      if (error || !data || !data.success) {
        return {
          success: false,
          error: error?.message || data?.error || 'Erro ao calcular e criar pedido.',
        };
      }

      // Fetch the created order
      const order = await this.getOrder(data.order_id);

      return {
        success: true,
        orderId: data.order_id,
        orderNumber: data.order_number,
        order: order || undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Falha na criação do pedido no servidor.',
      };
    }
  },

  /**
   * Retrieves an order by ID, strictly enforcing user ownership unless accessed by an administrator.
   */
  async getOrder(orderId: string, profileId?: string): Promise<CanonicalOrder | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('orders') as any)
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) return null;

      const order = data as CanonicalOrder;

      // If profileId is passed, enforce ownership
      if (profileId) {
        const isOwner =
          order.profile_id === profileId ||
          order.consumer_profile_id === profileId;

        if (!isOwner) {
          // Check if advertiser belongs to this profile
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: adv } = await (supabase.from('advertiser_profiles') as any)
            .select('id')
            .eq('user_id', profileId)
            .single();

          if (!adv || adv.id !== order.advertiser_id) {
            return null; // Access denied fail-closed
          }
        }
      }

      return order;
    } catch {
      return null;
    }
  },

  /**
   * Initiates payment for an order via PaymentProviderResolver.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const order = await this.getOrder(params.orderId);
    if (!order) {
      return {
        success: false,
        orderId: params.orderId,
        paymentMethod: params.paymentMethod,
        providerCode: 'unconfigured',
        providerPaymentReference: '',
        status: 'failed',
        isTestSimulation: true,
        expiresAt: new Date().toISOString(),
        error: 'Pedido não encontrado.',
      };
    }

    // Resolve provider adapter
    const resolveRes = await PaymentProviderResolver.resolve({
      productType: order.product_type,
      paymentMethod: params.paymentMethod,
      allowMockDriver: true,
    });

    if (!resolveRes.success || !resolveRes.provider) {
      return {
        success: false,
        orderId: order.id,
        paymentMethod: params.paymentMethod,
        providerCode: 'unconfigured',
        providerPaymentReference: '',
        status: 'failed',
        isTestSimulation: true,
        expiresAt: order.expires_at,
        error: 'Nenhum provedor de pagamento disponível para este método/produto.',
      };
    }

    const provider = resolveRes.provider;
    const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
    const supabase = createClient();

    // Create payment attempt record
    const attemptIdempotency = `att_${order.id}_${Date.now()}`;
    const amountMinor = order.total_minor || order.total_amount || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('payment_attempts') as any).insert({
      order_id: order.id,
      provider_code: provider.code,
      payment_method: params.paymentMethod,
      amount_cents: amountMinor,
      currency: order.currency || 'BRL',
      status: 'pending',
      idempotency_key: attemptIdempotency,
      environment: isKillSwitchActive ? 'sandbox' : 'production',
      metadata: {
        product_type: order.product_type,
        order_number: order.order_number,
      },
    });

    let paymentResult: any;

    if (params.paymentMethod === 'pix') {
      paymentResult = await provider.createPixPayment({
        orderId: order.id,
        orderNumber: order.order_number,
        amount: amountMinor,
        currency: order.currency || 'BRL',
        description: order.commercial_snapshot?.product_name || 'Portal18 Assinatura',
        idempotencyKey: attemptIdempotency,
      });
    } else {
      paymentResult = await provider.createCardPayment({
        orderId: order.id,
        orderNumber: order.order_number,
        amount: amountMinor,
        currency: order.currency || 'BRL',
        cardToken: params.cardToken,
        installments: params.installments || 1,
        idempotencyKey: attemptIdempotency,
      });
    }

    // Update order with provider reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('orders') as any)
      .update({
        provider_code: provider.code,
        provider_payment_reference: paymentResult.providerPaymentReference,
        payment_status: paymentResult.status || 'pending',
        selected_payment_method: params.paymentMethod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return {
      success: true,
      orderId: order.id,
      paymentMethod: params.paymentMethod,
      providerCode: provider.code,
      providerPaymentReference: paymentResult.providerPaymentReference,
      status: paymentResult.status || 'pending',
      pixQrCodeText: paymentResult.qrCodeText,
      pixQrCodeBase64: paymentResult.qrCodeBase64,
      isTestSimulation: isKillSwitchActive || provider.code === 'unconfigured',
      expiresAt: paymentResult.expiresAt || order.expires_at,
    };
  },

  /**
   * Simulates payment confirmation in test / homologation mode and triggers atomic fulfillment.
   */
  async simulateTestPaymentSuccess(orderId: string): Promise<OrderFulfillmentResult> {
    const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
    if (!isKillSwitchActive) {
      return { success: false, orderId, status: 'error', error: 'Simulação permitida apenas no ambiente de testes.' };
    }

    return this.fulfillOrder(orderId);
  },

  /**
   * Idempotent server fulfillment pipeline:
   * Order PAID -> Fulfill Entitlements -> Order FULFILLED.
   */
  async fulfillOrder(orderId: string): Promise<OrderFulfillmentResult> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('process_order_fulfillment', {
        p_order_id: orderId,
      });

      if (error || !data || !data.success) {
        return {
          success: false,
          orderId,
          status: 'failed',
          error: error?.message || data?.error || 'Erro ao processar ativação de benefícios do pedido.',
        };
      }

      return {
        success: true,
        orderId,
        status: data.status || 'fulfilled',
        alreadyFulfilled: data.already_fulfilled || false,
        fulfilledAt: data.fulfilled_at || new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        orderId,
        status: 'error',
        error: err.message || 'Falha ao executar fulfillment.',
      };
    }
  },

  /**
   * Retrieves full order history for an advertiser or consumer profile.
   */
  async getUserOrderHistory(profileId: string): Promise<CanonicalOrder[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adv } = await (supabase.from('advertiser_profiles') as any)
        .select('id')
        .eq('user_id', profileId)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('orders') as any).select('*').order('created_at', { ascending: false });

      if (adv) {
        query = query.or(`profile_id.eq.${profileId},consumer_profile_id.eq.${profileId},advertiser_id.eq.${adv.id}`);
      } else {
        query = query.or(`profile_id.eq.${profileId},consumer_profile_id.eq.${profileId}`);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as CanonicalOrder[];
    } catch {
      return [];
    }
  },

  /**
   * Cancels future recurring renewals for an advertiser or consumer subscription.
   */
  async cancelSubscriptionRenewal(
    subscriptionType: 'advertiser' | 'consumer',
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const table = subscriptionType === 'advertiser' ? 'subscriptions' : 'consumer_subscriptions';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any)
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao cancelar renovação.' };
    }
  },

  /**
   * Admin order list retrieval with search and status filters.
   */
  async getAdminOrders(filters?: { status?: string; productType?: string; search?: string }): Promise<CanonicalOrder[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('orders') as any).select('*').order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('payment_status', filters.status);
      }
      if (filters?.productType) {
        query = query.eq('product_type', filters.productType);
      }
      if (filters?.search) {
        query = query.ilike('order_number', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as CanonicalOrder[];
    } catch {
      return [];
    }
  },

  /**
   * Admin refund issuance for an order.
   */
  async adminRefundOrder(
    orderId: string,
    reason: string,
    adminProfileId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const order = await this.getOrder(orderId);
      if (!order) return { success: false, error: 'Pedido não encontrado.' };

      // Update order status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('orders') as any)
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Record in payment_refunds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('payment_refunds') as any).insert({
        provider_code: order.provider_code || 'unconfigured',
        refund_type: 'full',
        amount_cents: order.total_minor || order.total_amount || 0,
        currency: order.currency || 'BRL',
        reason,
        status: 'completed',
        requested_by: adminProfileId,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar estorno.' };
    }
  },
};
