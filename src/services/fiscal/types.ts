export type FiscalEventStatus =
  | 'eligible'
  | 'queued'
  | 'processing'
  | 'issued'
  | 'rejected'
  | 'requires_action'
  | 'cancel_requested'
  | 'cancelled'
  | 'substitution_requested'
  | 'substituted'
  | 'manual_review'
  | 'disabled_by_policy';

export interface FiscalProductClassification {
  productType: 'advertiser_subscription' | 'consumer_subscription' | 'boost';
  fiscalEnabled: boolean;
  serviceCode: string; // MUNICIPAL_CONFIGURATION_PENDING
  descriptionTemplate: string;
  taxRuleReference: string;
  accountingCategory: string; // ACCOUNTING_CONFIGURATION_PENDING
  status: 'PENDING_ACCOUNTING' | 'CONFIGURED';
}

export interface FiscalIssueRequest {
  internalReference: string;
  orderId: string;
  competenceDate: string;
  grossAmountCents: number;
  deductionsCents: number;
  serviceDescription: string;
  customerTaxId?: string; // Masked / compliance only
  customerName?: string;
  customerEmail?: string;
  municipalityCode?: string;
  taxRatePercent?: number; // Configurable / versioned
  dedupeKey: string;
}

export interface FiscalIssueResult {
  success: boolean;
  status: FiscalEventStatus;
  provider: string;
  providerDocumentId?: string;
  municipalDocumentNumber?: string;
  verificationCode?: string;
  issuedAt?: string;
  isSimulated: boolean;
  error?: string;
}

export interface FiscalCancelRequest {
  providerDocumentId: string;
  municipalDocumentNumber?: string;
  cancelReason: string;
  dedupeKey: string;
}

export interface FiscalCancelResult {
  success: boolean;
  status: FiscalEventStatus;
  cancelledAt?: string;
  error?: string;
}
