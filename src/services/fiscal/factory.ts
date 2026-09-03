import { FiscalProvider } from './provider';
import { UnconfiguredFiscalProvider } from './providers/unconfiguredProvider';

export class FiscalProviderFactory {
  private static instance: FiscalProvider | null = null;

  public static getProvider(): FiscalProvider {
    if (!FiscalProviderFactory.instance) {
      const providerName = (process.env.PORTAL18_FISCAL_PROVIDER || 'unconfigured').toLowerCase();

      switch (providerName) {
        case 'unconfigured':
        default:
          FiscalProviderFactory.instance = new UnconfiguredFiscalProvider();
          break;
      }
    }

    return FiscalProviderFactory.instance;
  }

  public static setProvider(provider: FiscalProvider): void {
    FiscalProviderFactory.instance = provider;
  }

  public static resetProvider(): void {
    FiscalProviderFactory.instance = null;
  }
}
