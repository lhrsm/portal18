import { AgeVerificationProvider, InitiateVerificationOptions, InitiateVerificationResponse, ValidateCallbackParams } from '../provider';
import { AgeVerificationResult } from '../types';

export class UnconfiguredAgeVerificationProvider implements AgeVerificationProvider {
  readonly name = 'unconfigured';
  readonly isConfigured = false;

  async initiateVerification(options: InitiateVerificationOptions): Promise<InitiateVerificationResponse> {
    return {
      redirectUrl: `/age-verification?status=unavailable&returnUrl=${encodeURIComponent(options.returnUrl)}`,
      sessionId: `unconf-${Date.now()}`,
      state: options.state || 'unconfigured',
      provider: this.name,
    };
  }

  async validateCallback(params: ValidateCallbackParams): Promise<AgeVerificationResult> {
    return {
      verified: false,
      ageBand: 'unknown',
      provider: this.name,
      providerSubjectHash: 'unconfigured',
      assuranceLevel: 'low',
      verifiedAt: new Date().toISOString(),
      error: 'Provedor de verificação de idade não configurado.',
    };
  }

  async checkCredentialStatus(providerSubjectHash: string): Promise<AgeVerificationResult> {
    return {
      verified: false,
      ageBand: 'unknown',
      provider: this.name,
      providerSubjectHash,
      assuranceLevel: 'low',
      verifiedAt: new Date().toISOString(),
      error: 'Provedor não configurado.',
    };
  }
}
