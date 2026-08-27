import { IdentityVerificationProvider } from './provider';
import { UnconfiguredIdentityVerificationProvider } from './providers/unconfiguredProvider';
import { SumsubIdentityVerificationProvider } from './providers/sumsubProvider';

export class IdentityProviderFactory {
  private static instance: IdentityVerificationProvider | null = null;

  public static getProvider(): IdentityVerificationProvider {
    if (!IdentityProviderFactory.instance) {
      const providerName = (process.env.KYC_PROVIDER || process.env.IDENTITY_PROVIDER || 'sumsub').toLowerCase();

      switch (providerName) {
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
