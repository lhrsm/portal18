import { FiscalProvider } from '../provider';
import {
  FiscalIssueRequest,
  FiscalIssueResult,
  FiscalCancelRequest,
  FiscalCancelResult,
  FiscalEventStatus
} from '../types';

export class UnconfiguredFiscalProvider implements FiscalProvider {
  readonly name = 'unconfigured';

  validateConfiguration(): { configured: boolean; missingKeys?: string[] } {
    return {
      configured: false,
      missingKeys: ['FISCAL_PROVIDER_API_KEY', 'MUNICIPAL_CERTIFICATE', 'MUNICIPAL_SERVICE_CODE'],
    };
  }

  async issue(request: FiscalIssueRequest): Promise<FiscalIssueResult> {
    const isKillSwitchActive = process.env.PORTAL18_FISCAL_KILL_SWITCH !== 'false';

    if (isKillSwitchActive) {
      return {
        success: false,
        status: 'disabled_by_policy',
        provider: this.name,
        isSimulated: true,
        error: 'Emissão fiscal desativada por política de segurança (PORTAL18_FISCAL_KILL_SWITCH = true).',
      };
    }

    return {
      success: false,
      status: 'rejected',
      provider: this.name,
      isSimulated: false,
      error: 'Nenhum provedor fiscal de produção configurado.',
    };
  }

  async getStatus(providerDocumentId: string): Promise<{
    status: FiscalEventStatus;
    municipalDocumentNumber?: string;
    verificationCode?: string;
    issuedAt?: string;
  }> {
    return {
      status: 'disabled_by_policy',
    };
  }

  async cancel(request: FiscalCancelRequest): Promise<FiscalCancelResult> {
    return {
      success: false,
      status: 'disabled_by_policy',
      error: 'Cancelamento fiscal indisponível sob Kill Switch.',
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; status: string; latencyMs: number }> {
    return {
      healthy: true,
      status: 'disabled_by_policy',
      latencyMs: 0,
    };
  }
}
