import { PaymentStatus, SubscriptionStatus, PaymentType, BillingInterval } from '@/types/app.types';

export type ProviderCapabilityStatus = 'supported' | 'unsupported' | 'unknown' | 'requires_approval';

export interface ProviderCapabilityMatrix {
  pix: ProviderCapabilityStatus;
  pix_qr_code: ProviderCapabilityStatus;
  pix_copy_paste: ProviderCapabilityStatus;
  credit_card: ProviderCapabilityStatus;
  tokenization: ProviderCapabilityStatus;
  recurring_card: ProviderCapabilityStatus;
  recurring_pix: ProviderCapabilityStatus;
  boleto?: ProviderCapabilityStatus;
  refund: ProviderCapabilityStatus;
  partial_refund: ProviderCapabilityStatus;
  chargeback_webhook: ProviderCapabilityStatus;
  subscription_webhook: ProviderCapabilityStatus;
  payment_webhook: ProviderCapabilityStatus;
  split: ProviderCapabilityStatus;
  marketplace?: ProviderCapabilityStatus;
  antifraud: ProviderCapabilityStatus;
  '3ds': ProviderCapabilityStatus;
  idempotency: ProviderCapabilityStatus;
  sandbox: ProviderCapabilityStatus;
  webhook_signature: ProviderCapabilityStatus;
  reconciliation: ProviderCapabilityStatus;
  settlement_reports: ProviderCapabilityStatus;
}

export type ProviderHomologationStage =
  | 'candidate'
  | 'technical_review'
  | 'commercial_review'
  | 'compliance_review'
  | 'sandbox_ready'
  | 'homologating'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'deprecated';

export type PaymentFailureCategory =
  | 'insufficient_funds'
  | 'card_declined'
  | 'expired_card'
  | 'invalid_payment_method'
  | 'fraud_suspected'
  | 'provider_error'
  | 'network_error'
  | 'timeout'
  | 'unknown';

export type NormalizedPaymentStatus =
  | 'created'
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'partially_refunded'
  | 'chargeback'
  | 'disputed';

export type ChargebackStatus =
  | 'received'
  | 'under_review'
  | 'evidence_required'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'closed';

export type ProviderHealthState = 'unknown' | 'healthy' | 'degraded' | 'unavailable';

export interface BusinessModelReviewData {
  adult_platform_disclosed: boolean;
  subscriptions_disclosed: boolean;
  consumer_premium_disclosed: boolean;
  boost_products_disclosed: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reference_number: string | null;
  notes: string | null;
  approved_products: string[];
}

export interface PaymentProviderMetadata {
  id?: string;
  code: string;
  name: string;
  description: string;
  website: string;
  technical_status: ProviderHomologationStage;
  commercial_status: ProviderHomologationStage;
  compliance_status: ProviderHomologationStage;
  overall_status: ProviderHomologationStage;
  is_sandbox_enabled: boolean;
  is_production_enabled: boolean;
  priority: number;
  supported_methods: string[];
  capabilities: ProviderCapabilityMatrix;
  business_model_review: BusinessModelReviewData;
  health_status: ProviderHealthState;
  last_health_check?: string | null;
}

export interface CreateCheckoutParams {
  orderId: string;
  orderNumber: string;
  advertiserId?: string;
  userProfileId?: string;
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

export interface CreatePixPaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in cents BRL
  currency: string;
  description: string;
  payerEmail?: string;
  payerName?: string;
  payerDocument?: string;
  expirationMinutes?: number;
  idempotencyKey?: string;
}

export interface PixPaymentResult {
  providerPaymentReference: string;
  status: NormalizedPaymentStatus;
  qrCodeText: string;
  qrCodeBase64?: string;
  expiresAt: string;
}

export interface CreateCardPaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number; // in cents BRL
  currency: string;
  cardToken?: string;
  installments?: number;
  capture?: boolean;
  idempotencyKey?: string;
}

export interface CardPaymentResult {
  providerPaymentReference: string;
  status: NormalizedPaymentStatus;
  authorizationCode?: string;
  cardBrand?: string;
  lastFourDigits?: string;
  failureCategory?: PaymentFailureCategory;
  failureMessage?: string;
}

export interface CreateSubscriptionParams {
  planId: string;
  planSlug: string;
  customerReference?: string;
  amount: number; // in cents BRL
  currency: string;
  billingInterval: BillingInterval;
  paymentMethod: 'credit_card' | 'pix';
  cardToken?: string;
  idempotencyKey?: string;
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
  failureCategory?: PaymentFailureCategory;
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
  failureReason?: string;
}

export interface NormalizedPaymentDetails {
  providerPaymentReference: string;
  status: NormalizedPaymentStatus;
  amount: number;
  currency: string;
  paidAt?: string | null;
  paymentMethod: string;
  failureCategory?: PaymentFailureCategory;
  metadata?: Record<string, any>;
}

export interface ProviderHealthCheckResult {
  status: ProviderHealthState;
  latencyMs: number;
  message?: string;
  checkedAt: string;
}

export interface PaymentRouteRule {
  paymentMethod: 'pix' | 'credit_card' | 'recurring_card' | 'boost_instant';
  productScope: 'all' | 'advertiser_subscription' | 'consumer_subscription' | 'boost';
  primaryProviderCode: string;
  secondaryProviderCode?: string;
  isActive: boolean;
}
