import { AgeVerificationProvider, InitiateVerificationOptions, InitiateVerificationResponse, ValidateCallbackParams } from '../provider';
import { AgeVerificationResult } from '../types';

export class MockSandboxAgeVerificationProvider implements AgeVerificationProvider {
  readonly name = 'mock_sandbox';
  readonly isConfigured = true;

  async initiateVerification(options: InitiateVerificationOptions): Promise<InitiateVerificationResponse> {
    const sessionId = `sandbox-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const state = options.state || `state-${Date.now()}`;
    const returnUrl = encodeURIComponent(options.returnUrl || '/');
    const isReturning = options.isReturningVisitor ? '&returning=1' : '';

    // Direct callback redirection simulation in sandbox mode
    const redirectUrl = `/age-verification/callback?code=${sessionId}&state=${state}&returnUrl=${returnUrl}${isReturning}`;

    return {
      redirectUrl,
      sessionId,
      state,
      provider: this.name,
    };
  }

  async validateCallback(params: ValidateCallbackParams): Promise<AgeVerificationResult> {
    const isUnderage = params.code?.includes('underage');
    const isReturning = params.code?.includes('returning') || params.state?.includes('returning');

    if (isUnderage) {
      return {
        verified: false,
        ageBand: 'under_18',
        provider: this.name,
        providerSubjectHash: 'sandbox-hash-underage',
        assuranceLevel: 'high',
        verifiedAt: new Date().toISOString(),
        error: 'Idade informada inferior a 18 anos.',
      };
    }

    const now = Date.now();
    const expiresAt = new Date(now + 30 * 86400000).toISOString(); // 30 days valid assurance

    return {
      verified: true,
      ageBand: '18_plus',
      provider: this.name,
      providerSubjectHash: `sandbox-hash-${Date.now()}`,
      assuranceLevel: 'high',
      verifiedAt: new Date().toISOString(),
      expiresAt,
      credentialReference: `cred-ref-${Date.now()}`,
      isReused: Boolean(isReturning),
    };
  }

  async checkCredentialStatus(providerSubjectHash: string): Promise<AgeVerificationResult> {
    return {
      verified: true,
      ageBand: '18_plus',
      provider: this.name,
      providerSubjectHash,
      assuranceLevel: 'high',
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      credentialReference: `reused-cred-${providerSubjectHash}`,
      isReused: true,
    };
  }
}
