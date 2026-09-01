import { createClient } from '@/lib/supabase/client';
import { PaymentProviderRegistry } from './registry';
import {
  PaymentProviderMetadata,
  ProviderHomologationStage,
  ProviderHealthCheckResult,
  SandboxCapabilityTestResult,
  CommercialContactStatus,
  CommercialApprovalStatus,
  ProductApprovalState
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
   * Updates commercial contact status and evidence reference with audit trail.
   */
  async updateCommercialStatus(
    providerCode: string,
    contactStatus: CommercialContactStatus,
    commercialStatus: CommercialApprovalStatus,
    protocolNumber?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('payment_providers') as any)
        .update({
          contact_status: contactStatus,
          commercial_status: commercialStatus,
          approval_evidence: {
            protocol_number: protocolNumber || null,
            contact_date: new Date().toISOString(),
            last_interaction: new Date().toISOString(),
            reviewer_name: 'Admin Staff',
            restrictions_notes: notes || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('code', providerCode);

      if (error) {
        return { success: false, error: error.message };
      }

      await this.recordHomologationStep(
        providerCode,
        commercialStatus === 'approved' ? 'PRODUCTION_APPROVED' : 'PRODUCTION_REVIEW',
        `commercial_status_updated_${contactStatus}`,
        protocolNumber,
        notes
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar status comercial.' };
    }
  },

  /**
   * Updates product-specific and method-specific approval status.
   */
  async updateProductApproval(
    providerCode: string,
    productType: 'advertiser_subscription' | 'consumer_subscription' | 'boost',
    paymentMethod: 'pix' | 'credit_card' | 'recurring_card',
    status: ProductApprovalState
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    try {
      const provider = await this.getProviderDetails(providerCode);
      if (!provider) return { success: false, error: 'Provedor não encontrado.' };

      const currentApprovals = provider.product_approvals || {
        advertiser_subscription: { pix: 'not_requested', credit_card: 'not_requested', recurring_card: 'not_requested' },
        consumer_subscription: { pix: 'not_requested', credit_card: 'not_requested', recurring_card: 'not_requested' },
        boost: { pix: 'not_requested', credit_card: 'not_requested', recurring_card: 'not_requested' },
      };

      currentApprovals[productType][paymentMethod] = status;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('payment_providers') as any)
        .update({
          product_approvals: currentApprovals,
          updated_at: new Date().toISOString(),
        })
        .eq('code', providerCode);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao atualizar aprovação de produto.' };
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

  /**
   * Executes an automated sandbox capability test suite on a registered provider.
   */
  async runSandboxCertification(code: string): Promise<SandboxCapabilityTestResult> {
    const provider = PaymentProviderRegistry.get(code);
    if (!provider) {
      return {
        providerCode: code,
        passedCount: 0,
        failedCount: 1,
        skippedCount: 0,
        overallStatus: 'NOT_CONFIGURED',
        testedAt: new Date().toISOString(),
        certifications: [
          { key: 'init', name: 'Carregamento do Adaptador', category: 'authentication', status: 'failed', errorDetail: 'Provedor não encontrado no registro.' },
        ],
      };
    }

    return provider.testSandboxCapabilities();
  },
};
