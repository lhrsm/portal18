import { PaymentProvider } from './provider';
import { PaymentProviderRegistry } from './registry';
import { UnconfiguredPaymentProvider } from './providers/unconfiguredProvider';

export class PaymentProviderFactory {
  private static instance: PaymentProvider | null = null;

  public static getProvider(providerCode?: string): PaymentProvider {
    if (providerCode) {
      const specific = PaymentProviderRegistry.get(providerCode);
      if (specific) return specific;
    }

    if (!PaymentProviderFactory.instance) {
      const defaultCode = process.env.PAYMENT_PROVIDER || 'unconfigured';
      const provider = PaymentProviderRegistry.get(defaultCode);
      PaymentProviderFactory.instance = provider || new UnconfiguredPaymentProvider();
    }

    return PaymentProviderFactory.instance;
  }

  /**
   * Allows injecting a custom mock provider during testing.
   */
  public static setProvider(provider: PaymentProvider): void {
    PaymentProviderFactory.instance = provider;
  }

  public static resetProvider(): void {
    PaymentProviderFactory.instance = null;
  }
}
