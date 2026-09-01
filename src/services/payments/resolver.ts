import { PaymentProvider } from './provider';
import { PaymentProviderRegistry } from './registry';
import { PaymentRouteRule } from './types';

export interface ResolveProviderParams {
  productType: 'advertiser_subscription' | 'consumer_subscription' | 'boost' | 'campaign';
  paymentMethod: 'pix' | 'credit_card' | 'recurring_card' | 'boost_instant';
  environment?: 'sandbox' | 'production';
}

export interface ResolveProviderResult {
  success: boolean;
  provider: PaymentProvider | null;
  routeRule?: PaymentRouteRule;
  error?: string;
}

export class PaymentProviderResolver {
  /**
   * Resolves the appropriate PaymentProvider adapter based on business model rules,
   * tripartite homologation approval (Technical + Commercial + Compliance), and Kill Switch status.
   */
  public static async resolve(params: ResolveProviderParams): Promise<ResolveProviderResult> {
    const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';

    // 1. If Kill Switch is active, always return safe unconfigured mock provider
    if (isKillSwitchActive) {
      const mockProvider = PaymentProviderRegistry.get('unconfigured');
      if (mockProvider) {
        return {
          success: true,
          provider: mockProvider,
        };
      }
    }

    // 2. Query registered providers and select the highest priority approved provider
    const allProviders = PaymentProviderRegistry.getAll();
    const env = params.environment || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');

    for (const provider of allProviders) {
      if (provider.code === 'stripe') {
        // Stripe is strictly prohibited for adult advertising platform model
        continue;
      }

      const metadata = await provider.getMetadata();

      // Tripartite Homologation Requirement
      const isApproved = 
        metadata.technical_status === 'approved' &&
        metadata.commercial_status === 'approved' &&
        metadata.compliance_status === 'approved';

      const isEnvEnabled = env === 'production' 
        ? metadata.is_production_enabled 
        : metadata.is_sandbox_enabled;

      const isHealthy = metadata.health_status !== 'unavailable';

      // Check method support
      const methodKey = params.paymentMethod === 'pix' ? 'pix' : 'credit_card';
      const supportsMethod = metadata.capabilities[methodKey] === 'supported';

      if (isApproved && isEnvEnabled && isHealthy && supportsMethod) {
        return {
          success: true,
          provider,
        };
      }
    }

    // If no provider satisfies all strict approval criteria, reject fail-closed
    return {
      success: false,
      provider: null,
      error: 'PAYMENT_PROVIDER_UNAVAILABLE',
    };
  }
}
