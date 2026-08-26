import { 
  CreateSessionParams, 
  VerificationSessionResult, 
  WebhookEventData, 
  VerificationResult 
} from './types';

export interface IdentityVerificationProvider {
  readonly name: string;

  /**
   * Creates an external verification session with the KYC provider.
   */
  createVerificationSession(params: CreateSessionParams): Promise<VerificationSessionResult>;

  /**
   * Verifies the cryptographic signature of an incoming webhook.
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean>;

  /**
   * Parses and normalizes the incoming webhook payload into a standard event.
   */
  parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookEventData>;

  /**
   * Directly fetches the verification status from the KYC provider.
   */
  getVerificationStatus(providerReference: string): Promise<VerificationResult>;

  /**
   * Cancels an ongoing verification session.
   */
  cancelVerification?(providerReference: string): Promise<boolean>;
}
