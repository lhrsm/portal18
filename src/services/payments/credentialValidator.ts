export interface ProviderConfigurationStatus {
  isConfigured: boolean;
  environment: 'sandbox' | 'production';
  configuredKeys: string[];
  missingKeys: string[];
}

export class ProviderCredentialValidator {
  /**
   * Evaluates if a provider has all required credentials configured in the environment
   * without logging or exposing any secret values.
   */
  public static validate(providerCode: string, env: 'sandbox' | 'production' = 'sandbox'): ProviderConfigurationStatus {
    const code = providerCode.toLowerCase();
    const isSandbox = env === 'sandbox';

    let requiredKeys: string[] = [];

    switch (code) {
      case 'mercadopago':
        requiredKeys = isSandbox
          ? ['MERCADOPAGO_SANDBOX_ACCESS_TOKEN', 'MERCADOPAGO_SANDBOX_PUBLIC_KEY']
          : ['MERCADOPAGO_PROD_ACCESS_TOKEN', 'MERCADOPAGO_PROD_PUBLIC_KEY'];
        break;

      case 'pagbank':
        requiredKeys = isSandbox
          ? ['PAGBANK_SANDBOX_TOKEN']
          : ['PAGBANK_PROD_TOKEN'];
        break;

      case 'pagarme':
        requiredKeys = isSandbox
          ? ['PAGARME_SANDBOX_API_KEY']
          : ['PAGARME_PROD_API_KEY'];
        break;

      case 'asaas':
        requiredKeys = isSandbox
          ? ['ASAAS_SANDBOX_API_KEY']
          : ['ASAAS_PROD_API_KEY'];
        break;

      case 'adyen':
        requiredKeys = isSandbox
          ? ['ADYEN_SANDBOX_API_KEY', 'ADYEN_SANDBOX_MERCHANT_ACCOUNT']
          : ['ADYEN_PROD_API_KEY', 'ADYEN_PROD_MERCHANT_ACCOUNT'];
        break;

      case 'stripe':
        // Stripe is strictly unsupported
        return {
          isConfigured: false,
          environment: env,
          configuredKeys: [],
          missingKeys: ['STRIPE_PROHIBITED_FOR_ADULT_MODEL'],
        };

      case 'unconfigured':
      case 'internal_test_driver':
        // Internal test driver is always available for local dev / tests
        return {
          isConfigured: true,
          environment: env,
          configuredKeys: ['MOCK_INTERNAL_DRIVER'],
          missingKeys: [],
        };

      default:
        return {
          isConfigured: false,
          environment: env,
          configuredKeys: [],
          missingKeys: ['UNKNOWN_PROVIDER'],
        };
    }

    const configuredKeys: string[] = [];
    const missingKeys: string[] = [];

    for (const key of requiredKeys) {
      const val = process.env[key];
      if (val && val.trim().length > 5 && !val.includes('your_') && !val.includes('placeholder')) {
        configuredKeys.push(key);
      } else {
        missingKeys.push(key);
      }
    }

    return {
      isConfigured: missingKeys.length === 0,
      environment: env,
      configuredKeys,
      missingKeys,
    };
  }
}
