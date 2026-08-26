import { PaymentProvider } from '../provider';
import { 
  CreateCheckoutParams, 
  CheckoutSessionResult, 
  WebhookPaymentEventData, 
  SubscriptionProviderResult, 
  RefundResult 
} from '../types';

export class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly name = 'unconfigured';

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    // Section 7 & 8: Environment & Production Guard
    if (process.env.NODE_ENV === 'production' && !process.env.PAYMENT_PROVIDER_API_KEY) {
      throw new Error('Pagamentos ainda não estão disponíveis.');
    }

    const token = `dev_pay_${params.orderNumber}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return {
      providerReference: token,
      sessionToken: token,
      checkoutUrl: `${params.returnUrl}?order=${params.orderNumber}&session=${token}`,
      expiresAt,
    };
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET;
      if (!secret) return false;
      const signature = headers['x-provider-signature'] || headers['x-webhook-signature'];
      return Boolean(signature && signature.length > 10);
    }
    return true;
  }

  async parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookPaymentEventData> {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = {};
    }

    const eventId = parsed.event_id || `evt_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventType = parsed.event_type || 'payment.success';
    const providerPaymentReference = parsed.provider_payment_reference || parsed.session_token || 'unknown_ref';
    const status = parsed.status === 'paid' ? 'paid' : parsed.status === 'failed' ? 'failed' : 'pending';
    const amount = parsed.amount || 0;
    const currency = parsed.currency || 'BRL';

    return {
      eventId,
      eventType,
      providerPaymentReference,
      providerSubscriptionReference: parsed.provider_subscription_reference,
      status,
      amount,
      currency,
      rawPayloadHash: `sha256_${Date.now()}`,
      metadata: parsed.metadata || {},
    };
  }

  async cancelSubscription(providerSubscriptionReference: string, atPeriodEnd: boolean): Promise<boolean> {
    return true;
  }

  async getSubscription(providerSubscriptionReference: string): Promise<SubscriptionProviderResult> {
    return {
      providerSubscriptionReference,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    };
  }

  async refundPayment(providerPaymentReference: string, amount?: number, reason?: string): Promise<RefundResult> {
    return {
      providerRefundReference: `ref_${Date.now()}`,
      status: 'refunded',
      amount: amount || 0,
    };
  }
}
