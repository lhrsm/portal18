import { AgeVerificationProvider } from './provider';
import { UnconfiguredAgeVerificationProvider } from './providers/unconfiguredProvider';
import { MockSandboxAgeVerificationProvider } from './providers/mockSandboxProvider';
import { VerificaIdAgeVerificationProvider } from './providers/verificaIdProvider';
import { SumsubAgeVerificationProvider } from './providers/sumsubAgeProvider';

export class AgeVerificationFactory {
  private static instance: AgeVerificationProvider | null = null;

  static getProvider(): AgeVerificationProvider {
    if (this.instance) {
      return this.instance;
    }

    const configuredProvider = (process.env.AGE_VERIFICATION_PROVIDER || '').toLowerCase().trim();

    switch (configuredProvider) {
      case 'mock_sandbox':
      case 'sandbox':
        this.instance = new MockSandboxAgeVerificationProvider();
        break;
      case 'verifica_id':
      case 'verificaid':
        this.instance = new VerificaIdAgeVerificationProvider();
        break;
      case 'sumsub_age':
      case 'sumsub':
        this.instance = new SumsubAgeVerificationProvider();
        break;
      default:
        this.instance = new UnconfiguredAgeVerificationProvider();
        break;
    }

    return this.instance;
  }

  /**
   * Resets cached instance (useful for testing & re-evaluating environment variables).
   */
  static reset(): void {
    this.instance = null;
  }
}
