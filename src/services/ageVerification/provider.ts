import { AgeVerificationResult } from './types';

export interface InitiateVerificationOptions {
  returnUrl: string;
  isReturningVisitor?: boolean;
  state?: string;
  userLocale?: string;
}

export interface InitiateVerificationResponse {
  redirectUrl: string;
  sessionId: string;
  state: string;
  provider: string;
}

export interface ValidateCallbackParams {
  code?: string;
  state?: string;
  token?: string;
  signature?: string;
}

export interface AgeVerificationProvider {
  readonly name: string;
  readonly isConfigured: boolean;

  /**
   * Generates a secure external redirect URL for visitor age verification.
   */
  initiateVerification(options: InitiateVerificationOptions): Promise<InitiateVerificationResponse>;

  /**
   * Validates the return callback from the provider.
   */
  validateCallback(params: ValidateCallbackParams): Promise<AgeVerificationResult>;

  /**
   * Revalidates an existing credential reference or returning visitor subject.
   */
  checkCredentialStatus(providerSubjectHash: string): Promise<AgeVerificationResult>;

  /**
   * Revokes local verification credential when requested by user or provider.
   */
  revokeCredential?(providerSubjectHash: string): Promise<boolean>;
}
