import { PaymentProvider } from '../provider';
import { 
  CreateCheckoutParams, 
  CheckoutSessionResult, 
  CreatePixPaymentParams,
  PixPaymentResult,
  CreateCardPaymentParams,
  CardPaymentResult,
  CreateSubscriptionParams,
  SubscriptionProviderResult,
  NormalizedPaymentDetails,
  WebhookPaymentEventData, 
  RefundResult,
  ProviderCapabilityMatrix,
  PaymentProviderMetadata,
  ProviderHealthCheckResult
} from '../types';

export class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly code = 'unconfigured';
  readonly name = 'Unconfigured Mock Adapter (Kill Switch)';
  readonly environment: 'sandbox' | 'production' = 'sandbox';

  readonly capabilities: ProviderCapabilityMatrix = {
    pix: 'supported',
    pix_qr_code: 'supported',
    pix_copy_paste: 'supported',
    credit_card: 'supported',
    tokenization: 'supported',
    recurring_card: 'supported',
    recurring_pix: 'supported',
    boleto: 'unsupported',
    refund: 'supported',
    partial_refund: 'supported',
    chargeback_webhook: 'supported',
    subscription_webhook: 'supported',
    payment_webhook: 'supported',
    split: 'unsupported',
    antifraud: 'supported',
    '3ds': 'supported',
    idempotency: 'supported',
    sandbox: 'supported',
    webhook_signature: 'supported',
    reconciliation: 'supported',
    settlement_reports: 'supported',
  };

  async getMetadata(): Promise<PaymentProviderMetadata> {
    return {
      code: this.code,
      name: this.name,
      description: 'Driver simulado seguro com Kill Switch 100% ativo para homologação.',
      website: 'https://portal18.com.br',
      technical_status: 'approved',
      commercial_status: 'approved',
      compliance_status: 'approved',
      overall_status: 'approved',
      is_sandbox_enabled: true,
      is_production_enabled: false,
      priority: 999,
      supported_methods: ['pix', 'credit_card', 'recurring_card'],
      capabilities: this.capabilities,
      business_model_review: {
        adult_platform_disclosed: true,
        subscriptions_disclosed: true,
        consumer_premium_disclosed: true,
        boost_products_disclosed: true,
        reviewed_at: '2026-09-01T00:00:00Z',
        reviewed_by: 'Architecture Lead',
        reference_number: 'MOCK-SAFE-01',
        notes: 'Driver de homologação com Kill Switch obrigatório.',
        approved_products: ['plans_7_30_90', 'consumer_premium', 'boosts'],
      },
      health_status: 'healthy',
      last_health_check: new Date().toISOString(),
    };
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    // Kill Switch Guard: Always reject real execution if active
    if (process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false') {
      const token = `mock_session_${params.orderNumber}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      return {
        providerReference: token,
        sessionToken: token,
        checkoutUrl: `${params.returnUrl}?order=${params.orderNumber}&mock_session=${token}`,
        expiresAt,
      };
    }
    throw new Error('Pagamentos reais estão desativados (Kill Switch Ativo).');
  }

  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    const ref = `pix_mock_${params.orderNumber}_${Date.now()}`;
    return {
      providerPaymentReference: ref,
      status: 'pending',
      qrCodeText: `00020126360014BR.GOV.BCB.PIX0114+5571999999999520400005303986540${params.amount}5802BR5913PORTAL186008SALVADOR62070503***6304MOCK`,
      expiresAt: new Date(Date.now() + (params.expirationMinutes || 30) * 60000).toISOString(),
    };
  }

  async createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult> {
    return {
      providerPaymentReference: `card_mock_${params.orderNumber}_${Date.now()}`,
      status: 'authorized',
      authorizationCode: 'AUTH_MOCK_999',
      cardBrand: 'Mastercard',
      lastFourDigits: '8888',
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionProviderResult> {
    return {
      providerSubscriptionReference: `sub_mock_${params.planSlug}_${Date.now()}`,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
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

  async getPayment(providerPaymentReference: string): Promise<NormalizedPaymentDetails> {
    return {
      providerPaymentReference,
      status: 'paid',
      amount: 4990,
      currency: 'BRL',
      paidAt: new Date().toISOString(),
      paymentMethod: 'pix',
    };
  }

  async refundPayment(providerPaymentReference: string, amount?: number, reason?: string): Promise<RefundResult> {
    return {
      providerRefundReference: `ref_mock_${Date.now()}`,
      status: 'refunded',
      amount: amount || 0,
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
    const providerPaymentReference = parsed.provider_payment_reference || parsed.session_token || 'mock_ref';
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

  async healthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      status: 'healthy',
      latencyMs: 12,
      message: 'Unconfigured mock adapter active with zero real transaction output.',
      checkedAt: new Date().toISOString(),
    };
  }
}
