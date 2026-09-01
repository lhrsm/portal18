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
} from './types';

export interface PaymentProvider {
  readonly code: string;
  readonly name: string;
  readonly environment: 'sandbox' | 'production';
  readonly capabilities: ProviderCapabilityMatrix;

  /**
   * Retrieves static and live metadata for the provider.
   */
  getMetadata(): Promise<PaymentProviderMetadata>;

  /**
   * Generates a hosted, tokenized checkout session for a one-time product or subscription.
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;

  /**
   * Generates a direct dynamic PIX payment with QR Code and Copy/Paste code.
   */
  createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult>;

  /**
   * Executes a direct, tokenized card payment transaction.
   */
  createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult>;

  /**
   * Registers a recurring subscription contract at the provider level.
   */
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionProviderResult>;

  /**
   * Cancels a recurring subscription at the provider level.
   */
  cancelSubscription(providerSubscriptionReference: string, atPeriodEnd: boolean): Promise<boolean>;

  /**
   * Fetches the current subscription status directly from the provider.
   */
  getSubscription(providerSubscriptionReference: string): Promise<SubscriptionProviderResult>;

  /**
   * Fetches the normalized payment details directly from the provider.
   */
  getPayment(providerPaymentReference: string): Promise<NormalizedPaymentDetails>;

  /**
   * Executes a full or partial refund for a previously processed transaction.
   */
  refundPayment(providerPaymentReference: string, amount?: number, reason?: string): Promise<RefundResult>;

  /**
   * Verifies the HMAC / RSA cryptographic signature of incoming payment webhooks.
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean>;

  /**
   * Parses and normalizes the incoming payment event into a standard webhook payload.
   */
  parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookPaymentEventData>;

  /**
   * Performs an isolated health check without initiating real transactions.
   */
  healthCheck(): Promise<ProviderHealthCheckResult>;

  /**
   * Runs an automated sandbox certification test across capabilities when credentials are present.
   */
  testSandboxCapabilities(): Promise<SandboxCapabilityTestResult>;
}
