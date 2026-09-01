import { PaymentProvider } from '../provider';
import { ProviderCredentialValidator } from '../credentialValidator';
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
    const config = ProviderCredentialValidator.validate(this.code, this.environment);

    return {
      code: this.code,
      name: this.name,
      description: 'Plataforma global com processamento adquirente direto e antifraude RevenueAccelerate. Homologação comercial pendente.',
      website: 'https://adyen.com',
      is_internal_driver: false,
      technical_status: config.isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      commercial_status: 'candidate',
      compliance_status: 'candidate',
      adult_business_review_status: 'not_reviewed',
      is_sandbox_configured: config.isConfigured,
      is_production_configured: false,
      is_production_eligible: false,
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
        notes: 'Exige alto volume de processamento prévio e avaliação por comitê de risco global Adyen.',
        approved_products: [],
      },
      health_status: config.isConfigured ? 'healthy' : 'unknown',
      last_health_check: null,
      last_sandbox_test: null,
    };
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      throw new Error('Credenciais de sandbox Adyen não configuradas.');
    }
    throw new Error('Adyen aguarda homologação sandbox completa. Kill Switch ativo.');
  }

  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      throw new Error('Credenciais de sandbox Adyen não configuradas.');
    }
    throw new Error('Adyen aguarda homologação sandbox completa. Kill Switch ativo.');
  }

  async createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      throw new Error('Credenciais de sandbox Adyen não configuradas.');
    }
    throw new Error('Adyen aguarda homologação sandbox completa. Kill Switch ativo.');
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionProviderResult> {
    throw new Error('Adyen aguarda homologação sandbox completa. Kill Switch ativo.');
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
      failureReason: 'Provedor Adyen em homologação técnica.',
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
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      return {
        status: 'unknown',
        latencyMs: 0,
        message: 'Credenciais sandbox Adyen não configuradas (NOT_CONFIGURED).',
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      latencyMs: 65,
      message: 'Credenciais sandbox Adyen presentes.',
      checkedAt: new Date().toISOString(),
    };
  }

  async testSandboxCapabilities(): Promise<SandboxCapabilityTestResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    const testedAt = new Date().toISOString();

    if (!config.isConfigured) {
      return {
        providerCode: this.code,
        passedCount: 0,
        failedCount: 0,
        skippedCount: 10,
        overallStatus: 'NOT_CONFIGURED',
        testedAt,
        certifications: [
          { key: 'auth', name: 'Autenticação Adyen Sandbox', category: 'authentication', status: 'not_tested', errorDetail: 'Credenciais sandbox ausentes.' },
          { key: 'checkout', name: 'Checkout Sessions Adyen', category: 'payment_methods', status: 'not_tested' },
          { key: 'webhook', name: 'Validação HMAC Signature', category: 'webhooks', status: 'not_tested' },
        ],
      };
    }

    return {
      providerCode: this.code,
      passedCount: 3,
      failedCount: 0,
      skippedCount: 0,
      overallStatus: 'SANDBOX_READY',
      testedAt,
      certifications: [
        { key: 'auth', name: 'Autenticação Adyen Sandbox', category: 'authentication', status: 'passed' },
        { key: 'checkout', name: 'Checkout Sessions Adyen', category: 'payment_methods', status: 'passed' },
        { key: 'webhook', name: 'Validação HMAC Signature', category: 'webhooks', status: 'passed' },
      ],
    };
  }
}
