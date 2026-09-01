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

export class AdyenPaymentProvider implements PaymentProvider {
  readonly code = 'adyen';
  readonly name = 'Adyen';
  readonly environment: 'sandbox' | 'production' = 'sandbox';

  readonly capabilities: ProviderCapabilityMatrix = {
    pix: 'supported',
    pix_qr_code: 'supported',
    pix_copy_paste: 'supported',
    credit_card: 'supported',
    tokenization: 'supported',
    recurring_card: 'supported',
    recurring_pix: 'unknown',
    boleto: 'supported',
    refund: 'supported',
    partial_refund: 'supported',
    chargeback_webhook: 'supported',
    subscription_webhook: 'supported',
    payment_webhook: 'supported',
    split: 'supported',
    marketplace: 'supported',
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
      description: 'Plataforma global de processamento financeiro com suporte a múltiplos adquirentes internacionais e antifraude de ponta.',
      website: 'https://adyen.com',
      technical_status: 'technical_review',
      commercial_status: 'commercial_review',
      compliance_status: 'compliance_review',
      overall_status: 'candidate',
      is_sandbox_enabled: false,
      is_production_enabled: false,
      priority: 50,
      supported_methods: ['pix', 'credit_card', 'recurring_card'],
      capabilities: this.capabilities,
      business_model_review: {
        adult_platform_disclosed: false,
        subscriptions_disclosed: false,
        consumer_premium_disclosed: false,
        boost_products_disclosed: false,
        reviewed_at: null,
        reviewed_by: null,
        reference_number: null,
        notes: 'Exige alto volume de processamento prévio e avaliação por comitê de risco global.',
        approved_products: [],
      },
      health_status: 'unknown',
      last_health_check: null,
    };
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    throw new Error('Provedor Adyen não está homologado para produção. Kill Switch ativo.');
  }

  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    throw new Error('Provedor Adyen não está homologado para produção. Kill Switch ativo.');
  }

  async createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult> {
    throw new Error('Provedor Adyen não está homologado para produção. Kill Switch ativo.');
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionProviderResult> {
    throw new Error('Provedor Adyen não está homologado para produção. Kill Switch ativo.');
  }

  async cancelSubscription(providerSubscriptionReference: string, atPeriodEnd: boolean): Promise<boolean> {
    return false;
  }

  async getSubscription(providerSubscriptionReference: string): Promise<SubscriptionProviderResult> {
    return {
      providerSubscriptionReference,
      status: 'pending',
    };
  }

  async getPayment(providerPaymentReference: string): Promise<NormalizedPaymentDetails> {
    return {
      providerPaymentReference,
      status: 'pending',
      amount: 0,
      currency: 'BRL',
      paymentMethod: 'unknown',
    };
  }

  async refundPayment(providerPaymentReference: string, amount?: number, reason?: string): Promise<RefundResult> {
    return {
      providerRefundReference: '',
      status: 'failed',
      amount: 0,
      failureReason: 'Provedor não homologado.',
    };
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    const signature = headers['x-adyen-signature'] || headers['hmacsignature'];
    return Boolean(signature && signature.length > 10);
  }

  async parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookPaymentEventData> {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = {};
    }

    const item = parsed.notificationItems?.[0]?.NotificationRequestItem || {};
    return {
      eventId: item.pspReference || `adyen_evt_${Date.now()}`,
      eventType: item.eventCode || 'AUTHORISATION',
      providerPaymentReference: item.pspReference || 'unknown',
      status: item.success === 'true' ? 'paid' : 'failed',
      amount: item.amount?.value || 0,
      currency: item.amount?.currency || 'BRL',
      rawPayloadHash: `sha256_${Date.now()}`,
      metadata: item,
    };
  }

  async healthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      status: 'unknown',
      latencyMs: 0,
      message: 'Aguardando credenciais sandbox e homologação Adyen.',
      checkedAt: new Date().toISOString(),
    };
  }
}
