import { IdentityVerificationProvider } from './provider';
import { UnconfiguredIdentityVerificationProvider } from './providers/unconfiguredProvider';

export class IdentityProviderFactory {
  private static instance: IdentityVerificationProvider | null = null;

  public static getProvider(): IdentityVerificationProvider {
    if (!IdentityProviderFactory.instance) {
      const providerName = process.env.IDENTITY_PROVIDER || 'unconfigured';

      switch (providerName.toLowerCase()) {
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
