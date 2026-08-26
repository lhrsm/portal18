import { VerificationStatus } from '@/types/database.types';

export type VerificationType = 'identity_and_age' | 'age_only' | 'identity_only';

export interface CreateSessionParams {
  advertiserId: string;
  verificationType: VerificationType;
  returnUrl: string;
  idempotencyKey?: string;
}

export interface VerificationSessionResult {
  providerReference: string;
  sessionToken: string;
  redirectUrl: string;
  expiresAt: string;
}

export interface WebhookEventData {
  eventId: string;
  eventType: string;
  providerReference: string;
  status: VerificationStatus;
  ageVerified: boolean;
  identityVerified: boolean;
  resultCode: string;
  rawPayloadHash: string;
}

export interface VerificationResult {
  providerReference: string;
  status: VerificationStatus;
  ageVerified: boolean;
  identityVerified: boolean;
  resultCode: string;
  completedAt?: string;
  expiresAt?: string;
}
