import { PaymentStatus, SubscriptionStatus, PaymentType, BillingInterval } from '@/types/app.types';

export interface CreateCheckoutParams {
  orderId: string;
  orderNumber: string;
  advertiserId: string;
  amount: number; // in integer cents BRL
  currency: string;
  productType: PaymentType;
  productId: string;
  productName: string;
  returnUrl: string;
  cancelUrl: string;
  idempotencyKey?: string;
}

export interface CheckoutSessionResult {
  providerReference: string;
  sessionToken: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface WebhookPaymentEventData {
  eventId: string;
  eventType: string;
  providerPaymentReference: string;
  providerSubscriptionReference?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  rawPayloadHash: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionProviderResult {
  providerSubscriptionReference: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface RefundResult {
  providerRefundReference: string;
  status: 'refunded' | 'pending' | 'failed';
  amount: number;
}
