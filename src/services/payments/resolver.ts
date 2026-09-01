import { PaymentProvider } from './provider';
import { PaymentProviderRegistry } from './registry';
import { PaymentRouteRule } from './types';

export interface ResolveProviderParams {
  productType: 'advertiser_subscription' | 'consumer_subscription' | 'boost' | 'campaign';
  paymentMethod: 'pix' | 'credit_card' | 'recurring_card' | 'boost_instant';
  environment?: 'sandbox' | 'production';
  allowMockDriver?: boolean;
}

export interface ResolveProviderResult {
  success: boolean;
  provider: PaymentProvider | null;
  routeRule?: PaymentRouteRule;
  error?: string;
  reconciliationRequired?: boolean;
}

export class PaymentProviderResolver {
  /**
   * Resolves the appropriate PaymentProvider adapter based on strict homologation rules,
   * capability matrices, and Kill Switch status.
   *
   * STRICT INVARIANT: NO AUTOMATIC CROSS-PROVIDER RETRIES ON CHARGE TIMEOUTS.
   */
  public static async resolve(params: ResolveProviderParams): Promise<ResolveProviderResult> {
    const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';

    // 1. If Kill Switch is active, always return safe Internal Test Driver (mock)
    if (isKillSwitchActive) {
      const mockDriver = PaymentProviderRegistry.get('unconfigured');
      if (mockDriver) {
        return {
          success: true,
          provider: mockDriver,
        };
      }
    }

    // 2. Query registered providers and evaluate production eligibility
    const allProviders = PaymentProviderRegistry.getAll();
    const env = params.environment || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');

    for (const provider of allProviders) {
      if (provider.code === 'stripe') {
        // Stripe is strictly prohibited for adult advertising platform model
        continue;
      }

      if (provider.code === 'unconfigured') {
        // Internal test driver is not eligible for production financial traffic
        if (env === 'production') continue;
      }

      const metadata = await provider.getMetadata();

      // In production, require full certification + commercial + compliance + adult-business acceptance
      if (env === 'production') {
        const isEligible =
          metadata.technical_status === 'PRODUCTION_APPROVED' &&
          metadata.commercial_status === 'approved' &&
          metadata.compliance_status === 'approved' &&
          metadata.adult_business_review_status === 'approved' &&
          metadata.is_production_configured &&
          metadata.health_status === 'healthy';

        const methodKey = params.paymentMethod === 'pix' ? 'pix' : 'credit_card';
        const supportsMethod = metadata.capabilities[methodKey] === 'supported';

        if (isEligible && supportsMethod) {
          return {
            success: true,
            provider,
          };
        }
      } else {
        // In sandbox environment, require configured credentials and supported method
        const isSandboxReady =
          (metadata.technical_status === 'CONFIGURED' || metadata.technical_status === 'SANDBOX_READY' || metadata.technical_status === 'SANDBOX_PASSED') &&
          metadata.is_sandbox_configured;

        const methodKey = params.paymentMethod === 'pix' ? 'pix' : 'credit_card';
        const supportsMethod = metadata.capabilities[methodKey] === 'supported';

        if (isSandboxReady && supportsMethod) {
          return {
            success: true,
            provider,
          };
        }
      }
    }

    // If allowMockDriver is true in sandbox/test environments, fallback to internal test driver
    if (env === 'sandbox' && params.allowMockDriver !== false) {
      const mockDriver = PaymentProviderRegistry.get('unconfigured');
      if (mockDriver) {
        return {
          success: true,
          provider: mockDriver,
        };
      }
    }

    // Fail closed
    return {
      success: false,
      provider: null,
      error: 'PAYMENT_PROVIDER_UNAVAILABLE',
    };
  }
}
