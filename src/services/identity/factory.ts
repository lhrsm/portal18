import { IdentityVerificationProvider } from './provider';
import { UnconfiguredIdentityVerificationProvider } from './providers/unconfiguredProvider';
import { SumsubIdentityVerificationProvider } from './providers/sumsubProvider';
import { DiditIdentityVerificationProvider } from './providers/diditProvider';
import { VerificaIdIdentityVerificationProvider } from './providers/verificaIdProvider';

export class IdentityProviderFactory {
  private static instance: IdentityVerificationProvider | null = null;

  public static getProvider(): IdentityVerificationProvider {
    if (!IdentityProviderFactory.instance) {
      const providerName = (process.env.KYC_PROVIDER || process.env.IDENTITY_PROVIDER || 'unconfigured').toLowerCase();

      switch (providerName) {
        case 'didit':
          IdentityProviderFactory.instance = new DiditIdentityVerificationProvider();
          break;
        case 'verifica_id':
        case 'verificaid':
          IdentityProviderFactory.instance = new VerificaIdIdentityVerificationProvider();
          break;
        case 'sumsub':
          IdentityProviderFactory.instance = new SumsubIdentityVerificationProvider();
          break;
        case 'unconfigured':
        default:
          IdentityProviderFactory.instance = new UnconfiguredIdentityVerificationProvider();
          break;
      }
    }

    return IdentityProviderFactory.instance;
  }

  /**
   * Allows injecting a custom mock provider during testing.
   */
  public static setProvider(provider: IdentityVerificationProvider): void {
    IdentityProviderFactory.instance = provider;
  }

  public static resetProvider(): void {
    IdentityProviderFactory.instance = null;
  }
}
