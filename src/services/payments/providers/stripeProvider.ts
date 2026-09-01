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
  ProviderHealthCheckResult,
  SandboxCapabilityTestResult
} from '../types';

export class StripePaymentProvider implements PaymentProvider {
  readonly code = 'stripe';
  readonly name = 'Stripe';
  readonly environment: 'sandbox' | 'production' = 'sandbox';

  readonly capabilities: ProviderCapabilityMatrix = {
    pix: 'supported',
    pix_qr_code: 'supported',
    pix_copy_paste: 'supported',
    credit_card: 'supported',
    tokenization: 'supported',
    recurring_card: 'supported',
    recurring_pix: 'unsupported',
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
      description: 'Provedor internacional de pagamentos. POLÍTICA DE NEGÓCIOS RESTRITOS PROÍBE CATEGORIA ADULTA.',
      website: 'https://stripe.com',
      is_internal_driver: false,
      technical_status: 'PRODUCTION_BLOCKED',
      commercial_status: 'rejected',
      compliance_status: 'rejected',
      adult_business_review_status: 'rejected',
      is_sandbox_configured: false,
      is_production_configured: false,
      is_production_eligible: false, // STRICTLY INELIGIBLE
      priority: 9999,
      supported_methods: [],
      capabilities: this.capabilities,
      business_model_review: {
        adult_platform_disclosed: true,
        subscriptions_disclosed: true,
        consumer_premium_disclosed: true,
        boost_products_disclosed: true,
        reviewed_at: '2026-09-01T00:00:00Z',
        reviewed_by: 'Compliance Lead',
        reference_number: 'POLICY-RESTRICTED-ADULT',
        notes: 'INCOMPATÍVEL: A política de negócios restritos do Stripe proíbe expressamente conteúdo, anúncios e serviços para maiores de 18 anos.',
        approved_products: [],
      },
      health_status: 'unavailable',
      last_health_check: new Date().toISOString(),
      last_sandbox_test: null,
    };
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    throw new Error('Stripe é estritamente incompatível com o modelo de negócios de classificados adultos do Portal18.');
  }

  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    throw new Error('Stripe é estritamente incompatível com o modelo de negócios de classificados adultos do Portal18.');
  }

  async createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult> {
    throw new Error('Stripe é estritamente incompatível com o modelo de negócios de classificados adultos do Portal18.');
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionProviderResult> {
    throw new Error('Stripe é estritamente incompatível com o modelo de negócios de classificados adultos do Portal18.');
  }

  async cancelSubscription(providerSubscriptionReference: string, atPeriodEnd: boolean): Promise<boolean> {
    return false;
  }

  async getSubscription(providerSubscriptionReference: string): Promise<SubscriptionProviderResult> {
    return {
      providerSubscriptionReference,
      status: 'cancelled',
    };
  }

  async getPayment(providerPaymentReference: string): Promise<NormalizedPaymentDetails> {
    return {
      providerPaymentReference,
      status: 'failed',
      amount: 0,
      currency: 'BRL',
      paymentMethod: 'none',
      failureCategory: 'invalid_payment_method',
    };
  }

  async refundPayment(providerPaymentReference: string, amount?: number, reason?: string): Promise<RefundResult> {
    return {
      providerRefundReference: '',
      status: 'failed',
      amount: 0,
      failureReason: 'Provedor Stripe proibido pelo modelo de negócio.',
    };
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    return false;
  }

  async parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookPaymentEventData> {
    throw new Error('Stripe webhooks são rejeitados por incompatibilidade de política.');
  }

  async healthCheck(): Promise<ProviderHealthCheckResult> {
    return {
      status: 'unavailable',
      latencyMs: 0,
      message: 'Provedor desativado por restrição de política de negócios adultos.',
      checkedAt: new Date().toISOString(),
    };
  }

  async testSandboxCapabilities(): Promise<SandboxCapabilityTestResult> {
    return {
      providerCode: this.code,
      passedCount: 0,
      failedCount: 1,
      skippedCount: 0,
      overallStatus: 'PRODUCTION_BLOCKED',
      testedAt: new Date().toISOString(),
      certifications: [
        { key: 'policy_check', name: 'Avaliação de Política Adulta', category: 'security', status: 'failed', errorDetail: 'Proibição explícita na política de uso aceitável Stripe.' },
      ],
    };
  }
}
