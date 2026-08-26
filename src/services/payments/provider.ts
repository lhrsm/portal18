import { 
  CreateCheckoutParams, 
  CheckoutSessionResult, 
  WebhookPaymentEventData, 
  SubscriptionProviderResult, 
  RefundResult 
} from './types';

export interface PaymentProvider {
  readonly name: string;

  /**
   * Generates a hosted, tokenized checkout session for a one-time product or subscription.
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSessionResult>;

  /**
   * Verifies the HMAC cryptographic signature of incoming payment webhooks.
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean>;

  /**
   * Parses and normalizes the incoming payment event into a standard webhook payload.
   */
  parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookPaymentEventData>;

  /**
   * Cancels a recurring subscription at the provider level.
   */
  cancelSubscription(providerSubscriptionReference: string, atPeriodEnd: boolean): Promise<boolean>;

  /**
   * Fetches the current subscription status directly from the provider.
   */
  getSubscription(providerSubscriptionReference: string): Promise<SubscriptionProviderResult>;

  /**
   * Executes a refund for a previously processed transaction.
   */
  refundPayment(providerPaymentReference: string, amount?: number, reason?: string): Promise<RefundResult>;
}
