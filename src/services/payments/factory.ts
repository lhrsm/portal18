import { PaymentProvider } from './provider';
import { UnconfiguredPaymentProvider } from './providers/unconfiguredProvider';

export class PaymentProviderFactory {
  private static instance: PaymentProvider | null = null;

  public static getProvider(): PaymentProvider {
    if (!PaymentProviderFactory.instance) {
      const providerName = process.env.PAYMENT_PROVIDER || 'unconfigured';

      switch (providerName.toLowerCase()) {
        case 'unconfigured':
        default:
          PaymentProviderFactory.instance = new UnconfiguredPaymentProvider();
          break;
      }
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
