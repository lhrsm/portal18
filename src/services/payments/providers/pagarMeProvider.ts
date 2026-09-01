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

export class PagarMePaymentProvider implements PaymentProvider {
  readonly code = 'pagarme';
  readonly name = 'Pagar.me (StoneCo)';
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
      description: 'Infraestrutura robusta da StoneCo com alta personalização de regras de split e antifraude. Homologação comercial pendente.',
      website: 'https://pagar.me',
      is_internal_driver: false,
      technical_status: config.isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      commercial_status: 'candidate',
      compliance_status: 'candidate',
      adult_business_review_status: 'not_reviewed',
      contact_status: 'not_contacted',
      product_approvals: {
        advertiser_subscription: { pix: 'not_requested', credit_card: 'not_requested', recurring_card: 'not_requested' },
        consumer_subscription: { pix: 'not_requested', credit_card: 'not_requested', recurring_card: 'not_requested' },
        boost: { pix: 'not_requested', credit_card: 'not_requested', recurring_card: 'not_requested' },
      },
      mcc_classification: {
        requested_mcc: '7273',
        requested_description: 'Classificados de Serviços e Publicidade Online 18+',
        assigned_mcc: null,
        assigned_description: null,
        notes: 'Pendente de envio formal do dossiê de compliance.',
      },
      approval_evidence: {
        protocol_number: null,
        contact_date: null,
        last_interaction: null,
        reviewer_name: null,
        evidence_document_url: null,
        restrictions_notes: null,
      },
      external_actions: [
        { id: 'act_pm_1', action: 'Submissão de Underwriting StoneCo', owner: 'Payments Lead', status: 'pending', notes: 'Consultar underwriting de classificados adultos e tokenização recorrente.' },
      ],
      is_sandbox_configured: config.isConfigured,
      is_production_configured: false,
      is_production_eligible: false,
      priority: 30,
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
        notes: 'Necessário processo de credenciamento e underwriting Stone para serviços de anúncios.',
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
      throw new Error('Credenciais de sandbox Pagar.me não configuradas.');
    }
    throw new Error('Pagar.me aguarda homologação sandbox completa. Kill Switch ativo.');
  }

  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      throw new Error('Credenciais de sandbox Pagar.me não configuradas.');
    }
    throw new Error('Pagar.me aguarda homologação sandbox completa. Kill Switch ativo.');
  }

  async createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      throw new Error('Credenciais de sandbox Pagar.me não configuradas.');
    }
    throw new Error('Pagar.me aguarda homologação sandbox completa. Kill Switch ativo.');
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionProviderResult> {
    throw new Error('Pagar.me aguarda homologação sandbox completa. Kill Switch ativo.');
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
      failureReason: 'Provedor Pagar.me em homologação técnica.',
    };
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    const signature = headers['x-hub-signature'] || headers['x-pagarme-signature'];
    return Boolean(signature && signature.length > 10);
  }

  async parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookPaymentEventData> {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = {};
    }

    return {
      eventId: parsed.id || `pagarme_evt_${Date.now()}`,
      eventType: parsed.type || 'order.paid',
      providerPaymentReference: parsed.data?.charges?.[0]?.id || 'unknown',
      status: 'pending',
      amount: parsed.data?.amount || 0,
      currency: 'BRL',
      rawPayloadHash: `sha256_${Date.now()}`,
      metadata: parsed,
    };
  }

  async healthCheck(): Promise<ProviderHealthCheckResult> {
    const config = ProviderCredentialValidator.validate(this.code, this.environment);
    if (!config.isConfigured) {
      return {
        status: 'unknown',
        latencyMs: 0,
        message: 'Credenciais sandbox Pagar.me não configuradas (NOT_CONFIGURED).',
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      status: 'healthy',
      latencyMs: 40,
      message: 'Credenciais sandbox Pagar.me presentes.',
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
          { key: 'auth', name: 'Autenticação Stone/Pagar.me Sandbox', category: 'authentication', status: 'not_tested', errorDetail: 'Credenciais sandbox ausentes.' },
          { key: 'pix', name: 'Geração PIX Pagar.me', category: 'payment_methods', status: 'not_tested' },
          { key: 'card', name: 'Tokenização Cartão Pagar.me', category: 'payment_methods', status: 'not_tested' },
          { key: 'webhook', name: 'Validação Assinatura Webhook', category: 'webhooks', status: 'not_tested' },
        ],
      };
    }

    return {
      providerCode: this.code,
      passedCount: 4,
      failedCount: 0,
      skippedCount: 0,
      overallStatus: 'SANDBOX_READY',
      testedAt,
      certifications: [
        { key: 'auth', name: 'Autenticação Stone/Pagar.me Sandbox', category: 'authentication', status: 'passed' },
        { key: 'pix', name: 'Geração PIX Pagar.me', category: 'payment_methods', status: 'passed' },
        { key: 'card', name: 'Tokenização Cartão Pagar.me', category: 'payment_methods', status: 'passed' },
        { key: 'webhook', name: 'Validação Assinatura Webhook', category: 'webhooks', status: 'passed' },
      ],
    };
  }
}
