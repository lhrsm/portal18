import { AgeVerificationProvider } from './provider';
import { UnconfiguredAgeVerificationProvider } from './providers/unconfiguredProvider';
import { MockSandboxAgeVerificationProvider } from './providers/mockSandboxProvider';
import { VerificaIdAgeVerificationProvider } from './providers/verificaIdProvider';
import { SumsubAgeVerificationProvider } from './providers/sumsubAgeProvider';
import { DiditAgeVerificationProvider } from './providers/diditAgeProvider';

import { serverEnv } from '@/config/env';

export class AgeVerificationFactory {
  private static instance: AgeVerificationProvider | null = null;

  static getProvider(): AgeVerificationProvider {
    if (this.instance) {
      return this.instance;
    }

    const raw = (process.env.AGE_VERIFICATION_PROVIDER || serverEnv.AGE_VERIFICATION_PROVIDER || '');
    const configuredProvider = raw.replace(/['"]/g, '').trim().toLowerCase();

    switch (configuredProvider) {
      case 'didit_age':
      case 'didit':
        this.instance = new DiditAgeVerificationProvider();
        break;
      case 'mock_sandbox':
      case 'sandbox':
        if (process.env.NODE_ENV === 'production') {
          // Strict fail-closed: never activate mock provider in production
          this.instance = new UnconfiguredAgeVerificationProvider();
        } else {
          this.instance = new MockSandboxAgeVerificationProvider();
        }
        break;
      case 'verifica_id':
      case 'verificaid':
        this.instance = new VerificaIdAgeVerificationProvider();
        break;
      case 'sumsub_age':
      case 'sumsub':
        this.instance = new SumsubAgeVerificationProvider();
        break;
      case 'unconfigured':
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
