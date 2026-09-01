import { createClient } from '@/lib/supabase/client';
import { PaymentProviderRegistry } from './registry';
import { 
  PaymentProviderMetadata, 
  ProviderHomologationStage, 
  ProviderHealthCheckResult 
} from './types';

export const multiGatewayService = {
  /**
   * Fetches all registered payment providers with live and DB-backed metadata.
   */
  async getProviders(): Promise<PaymentProviderMetadata[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_payment_providers');
      if (!error && data && data.success && Array.isArray(data.providers)) {
        return data.providers as PaymentProviderMetadata[];
      }
    } catch {
      // fallback to registry metadata below
    }

    // Fallback to static registry instances
    const allProviders = PaymentProviderRegistry.getAll();
    const metadataList: PaymentProviderMetadata[] = [];
    for (const p of allProviders) {
      const meta = await p.getMetadata();
      metadataList.push(meta);
    }
    return metadataList;
  },

  /**
   * Fetches details of a single provider by its code.
   */
  async getProviderDetails(code: string): Promise<PaymentProviderMetadata | null> {
    const provider = PaymentProviderRegistry.get(code);
    if (!provider) return null;
    return provider.getMetadata();
  },

  /**
   * Records an official homologation step for a provider in the audit trail.
   */
  async recordHomologationStep(
    providerCode: string,
    stage: ProviderHomologationStage,
    action: string,
    referenceNumber?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('record_provider_homologation_step', {
        p_provider_code: providerCode,
        p_stage: stage,
        p_action: action,
        p_reference_number: referenceNumber || null,
        p_notes: notes || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: data?.success ?? true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar homologação.' };
    }
  },

  /**
   * Runs an isolated live health check on a registered provider.
   */
  async checkProviderHealth(code: string): Promise<ProviderHealthCheckResult> {
    const provider = PaymentProviderRegistry.get(code);
    if (!provider) {
      return {
        status: 'unavailable',
        latencyMs: 0,
        message: 'Provedor não registrado no sistema.',
        checkedAt: new Date().toISOString(),
      };
    }

    return provider.healthCheck();
  },
};
