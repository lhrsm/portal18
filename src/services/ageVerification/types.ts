export type AgeBand = 'unknown' | 'under_18' | '18_plus';

export type AgeAssuranceLevel = 'low' | 'medium' | 'high' | 'very_high';

export type AgeGateState = 
  | 'unverified' 
  | 'starting' 
  | 'redirecting' 
  | 'processing' 
  | 'verified' 
  | 'failed' 
  | 'underage' 
  | 'expired' 
  | 'unavailable';

export interface AgeVerificationResult {
  verified: boolean;
  ageBand: AgeBand;
  provider: string;
  providerSubjectHash: string; // Opaque hash (never raw CPF or email)
  assuranceLevel: AgeAssuranceLevel;
  verifiedAt: string; // ISO 8601
  expiresAt?: string; // ISO 8601
  credentialReference?: string;
  isReused?: boolean;
  metadata?: Record<string, string | number | boolean>;
  error?: string;
}

export interface AgeVerificationSession {
  age_verified: boolean;
  assurance_reference: string;
  provider: string;
  issued_at: number; // Unix epoch ms
  expires_at: number; // Unix epoch ms
  age_band: AgeBand;
  signature: string; // HMAC SHA-256
}

export interface AgeVerificationProviderConfig {
  providerName: string;
  environment: 'sandbox' | 'production';
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  isEnabled: boolean;
}
