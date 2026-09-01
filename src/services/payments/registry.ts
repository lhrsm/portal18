import { PaymentProvider } from './provider';
import { UnconfiguredPaymentProvider } from './providers/unconfiguredProvider';
import { MercadoPagoPaymentProvider } from './providers/mercadoPagoProvider';
import { PagBankPaymentProvider } from './providers/pagBankProvider';
import { PagarMePaymentProvider } from './providers/pagarMeProvider';
import { AsaasPaymentProvider } from './providers/asaasProvider';
import { AdyenPaymentProvider } from './providers/adyenProvider';
import { StripePaymentProvider } from './providers/stripeProvider';

export class PaymentProviderRegistry {
  private static providers: Map<string, PaymentProvider> = new Map();

  static {
    // Register canonical provider adapters
    PaymentProviderRegistry.register(new UnconfiguredPaymentProvider());
    PaymentProviderRegistry.register(new MercadoPagoPaymentProvider());
    PaymentProviderRegistry.register(new PagBankPaymentProvider());
    PaymentProviderRegistry.register(new PagarMePaymentProvider());
    PaymentProviderRegistry.register(new AsaasPaymentProvider());
    PaymentProviderRegistry.register(new AdyenPaymentProvider());
    PaymentProviderRegistry.register(new StripePaymentProvider());
  }

  public static register(provider: PaymentProvider): void {
    PaymentProviderRegistry.providers.set(provider.code.toLowerCase(), provider);
  }

  public static get(code: string): PaymentProvider | null {
    return PaymentProviderRegistry.providers.get(code.toLowerCase()) || null;
  }

  public static getAll(): PaymentProvider[] {
    return Array.from(PaymentProviderRegistry.providers.values());
  }

  public static has(code: string): boolean {
    return PaymentProviderRegistry.providers.has(code.toLowerCase());
  }
}
