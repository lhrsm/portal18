import { PaymentStatus, SubscriptionStatus, PaymentType, BillingInterval } from '@/types/app.types';

export type ProviderCapabilityStatus = 'supported' | 'unsupported' | 'unknown' | 'requires_approval';
export type CapabilityCertificationStatus = 'supported' | 'unsupported' | 'unknown' | 'not_tested' | 'passed' | 'failed';

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

export type TechnicalHomologationStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'SANDBOX_READY'
  | 'SANDBOX_TESTING'
  | 'SANDBOX_PASSED'
  | 'SANDBOX_PARTIAL'
  | 'SANDBOX_FAILED'
  | 'PRODUCTION_REVIEW'
  | 'PRODUCTION_APPROVED'
  | 'PRODUCTION_BLOCKED';

export type ProviderHomologationStage = TechnicalHomologationStatus;

export type CommercialApprovalStatus =
  | 'candidate'
  | 'commercial_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'NOT_APPLICABLE';

export type CommercialContactStatus =
  | 'not_contacted'
  | 'contacted'
  | 'awaiting_response'
  | 'additional_information_requested'
  | 'underwriting'
  | 'approved'
  | 'approved_with_restrictions'
  | 'rejected'
  | 'suspended';

export type ComplianceApprovalStatus =
  | 'candidate'
  | 'compliance_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'NOT_APPLICABLE';

export type ComplianceReviewStatus =
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'approved_with_conditions'
  | 'rejected';

export type AdultBusinessReviewStatus =
  | 'not_reviewed'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'restricted'
  | 'not_applicable';

export type ProductApprovalState = 'not_requested' | 'pending' | 'approved' | 'restricted' | 'rejected';

export interface ProductMethodApprovalMatrix {
  advertiser_subscription: {
    pix: ProductApprovalState;
    credit_card: ProductApprovalState;
    recurring_card: ProductApprovalState;
  };
  consumer_subscription: {
    pix: ProductApprovalState;
    credit_card: ProductApprovalState;
    recurring_card: ProductApprovalState;
  };
  boost: {
    pix: ProductApprovalState;
    credit_card: ProductApprovalState;
    recurring_card: ProductApprovalState;
  };
}

export interface MCCClassificationData {
  requested_mcc: string;
  requested_description: string;
  assigned_mcc: string | null;
  assigned_description: string | null;
  notes: string | null;
}

export interface ApprovalEvidenceData {
  protocol_number: string | null;
  contact_date: string | null;
  last_interaction: string | null;
  reviewer_name: string | null;
  evidence_document_url: string | null;
  restrictions_notes: string | null;
}

export interface HomologationTimelineEvent {
  id: string;
  stage: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  reference?: string;
}

export interface ExternalActionItem {
  id: string;
  action: string;
  owner: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: string;
  reference?: string;
  notes?: string;
}

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

export type CanonicalOrderStatus =
  | 'draft'
  | 'pending'
  | 'pending_payment'
  | 'processing'
  | 'paid'
  | 'fulfilled'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed';

export type ChargebackStatus =
  | 'received'
  | 'under_review'
  | 'evidence_required'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'closed';

export type BillingCycleStatus =
  | 'scheduled'
  | 'due'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'grace_period'
  | 'expired'
  | 'cancelled'
  | 'requires_reconciliation';

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

export interface DetailedCapabilityCertification {
  key: string;
  name: string;
  category: 'authentication' | 'payment_methods' | 'webhooks' | 'lifecycle' | 'security';
  status: CapabilityCertificationStatus;
  testedAt?: string;
  errorDetail?: string;
}

export interface PaymentProviderMetadata {
  id?: string;
  code: string;
  name: string;
  description: string;
  website: string;
  is_internal_driver?: boolean;
  technical_status: TechnicalHomologationStatus;
  commercial_status: CommercialApprovalStatus;
  compliance_status: ComplianceApprovalStatus;
  adult_business_review_status: AdultBusinessReviewStatus;
  contact_status: CommercialContactStatus;
  product_approvals: ProductMethodApprovalMatrix;
  mcc_classification: MCCClassificationData;
  approval_evidence: ApprovalEvidenceData;
  external_actions: ExternalActionItem[];
  timeline_events?: HomologationTimelineEvent[];
  is_sandbox_configured: boolean;
  is_production_configured: boolean;
  is_production_eligible: boolean;
  priority: number;
  supported_methods: string[];
  capabilities: ProviderCapabilityMatrix;
  detailed_certifications?: DetailedCapabilityCertification[];
  business_model_review: BusinessModelReviewData;
  health_status: ProviderHealthState;
  last_health_check?: string | null;
  last_sandbox_test?: string | null;
}

export interface CommercialSnapshot {
  product_name: string;
  plan_name: string;
  billing_period: string;
  duration_days: number;
  unit_price_minor: number; // in cents BRL
  discount_minor: number;
  total_minor: number;
  currency: string;
  pricing_policy_version: string;
  entitlement_policy_version: string;
  created_at?: string;
}

export interface CanonicalOrder {
  id: string;
  profile_id: string;
  advertiser_id?: string | null;
  consumer_profile_id?: string | null;
  order_number: string;
  product_type: 'advertiser_subscription' | 'consumer_subscription' | 'boost' | 'campaign';
  product_id: string;
  billing_period_id?: string | null;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  subtotal_minor: number;
  discount_minor: number;
  total_minor: number;
  currency: string;
  status: CanonicalOrderStatus;
  payment_status: NormalizedPaymentStatus;
  selected_payment_method: 'pix' | 'credit_card' | 'recurring_card' | 'boost_instant';
  provider_code?: string | null;
  provider_payment_reference?: string | null;
  commercial_snapshot: CommercialSnapshot;
  expires_at: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingCycle {
  id: string;
  subscription_type: 'advertiser' | 'consumer';
  subscription_id: string;
  advertiser_id?: string | null;
  user_profile_id?: string | null;
  cycle_number: number;
  period_start: string;
  period_end: string;
  amount_minor: number;
  currency: string;
  pricing_snapshot: {
    plan_name: string;
    billing_period: string;
    duration_days: number;
    unit_price_minor: number;
    discount_minor: number;
    total_minor: number;
  };
  status: BillingCycleStatus;
  payment_due_at: string;
  grace_ends_at?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  failure_category?: PaymentFailureCategory | null;
  failure_message?: string | null;
  retry_count: number;
  next_retry_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingRecoveryEvent {
  id: string;
  billing_cycle_id?: string;
  subscription_id: string;
  subscription_type: string;
  profile_id?: string;
  event_type: string;
  failure_category?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RetryPolicyConfig {
  maxRetries: number;
  retryDelaysHours: number[];
  graceDurationDays: number;
  eligibleFailureCategories: PaymentFailureCategory[];
}

export interface ManualRetryResult {
  success: boolean;
  cycleId: string;
  status: BillingCycleStatus;
  paymentAttemptReference?: string;
  error?: string;
}

export interface CreateOrderParams {
  profileId: string;
  productType: 'advertiser_subscription' | 'consumer_subscription' | 'boost' | 'campaign';
  productId: string;
  billingPeriodId?: string;
  couponCode?: string;
  paymentMethod?: 'pix' | 'credit_card' | 'recurring_card';
}

export interface InitiatePaymentParams {
  orderId: string;
  paymentMethod: 'pix' | 'credit_card' | 'recurring_card';
  cardToken?: string;
  installments?: number;
}

export interface InitiatePaymentResult {
  success: boolean;
  orderId: string;
  paymentMethod: string;
  providerCode: string;
  providerPaymentReference: string;
  status: NormalizedPaymentStatus;
  pixQrCodeText?: string;
  pixQrCodeBase64?: string;
  isTestSimulation: boolean;
  expiresAt: string;
  error?: string;
}

export interface OrderFulfillmentResult {
  success: boolean;
  orderId: string;
  status: string;
  alreadyFulfilled?: boolean;
  fulfilledAt?: string;
  error?: string;
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

export interface SandboxCapabilityTestResult {
  providerCode: string;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  certifications: DetailedCapabilityCertification[];
  overallStatus: TechnicalHomologationStatus;
  testedAt: string;
}

export interface PaymentRouteRule {
  paymentMethod: 'pix' | 'credit_card' | 'recurring_card' | 'boost_instant';
  productScope: 'all' | 'advertiser_subscription' | 'consumer_subscription' | 'boost';
  primaryProviderCode: string;
  secondaryProviderCode?: string;
  isActive: boolean;
}
