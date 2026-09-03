import {
  EmailProviderCode,
  EmailProviderMetadata,
  EmailDispatchResult,
  NotificationCategory
} from './types';

// In-memory suppression list for simulated / local environments
const suppressionList = new Set<string>();

export const emailProviderRegistry = {
  isKillSwitchActive(): boolean {
    return process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  },

  getProviders(): EmailProviderMetadata[] {
    const isProduction = process.env.NODE_ENV === 'production';
    const isKillSwitch = this.isKillSwitchActive();

    return [
      {
        code: 'unconfigured',
        name: 'Provedor Externo Não Configurado',
        is_active: false,
        is_production_eligible: false,
        status: 'unconfigured',
      },
      {
        code: 'internal_mock',
        name: 'Simulador Interno de E-mail (Test Driver)',
        is_active: !isProduction || isKillSwitch,
        is_production_eligible: false,
        status: 'mock_mode',
      },
      {
        code: 'resend',
        name: 'Resend Transactional Email Adapter',
        is_active: false,
        is_production_eligible: true,
        status: 'unconfigured',
      },
      {
        code: 'ses',
        name: 'Amazon Simple Email Service (SES)',
        is_active: false,
        is_production_eligible: true,
        status: 'unconfigured',
      },
      {
        code: 'smtp',
        name: 'Custom SMTP Server Adapter',
        is_active: false,
        is_production_eligible: true,
        status: 'unconfigured',
      },
    ];
  },

  isSuppressed(email: string): boolean {
    return suppressionList.has(email.toLowerCase().trim());
  },

  addSuppression(email: string, reason: 'hard_bounce' | 'complaint' | 'manual' | 'invalid_address'): void {
    suppressionList.add(email.toLowerCase().trim());
  },

  /**
   * Safe email dispatch through provider abstraction or fail-closed kill switch.
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    category: NotificationCategory;
    dedupeKey?: string;
  }): Promise<EmailDispatchResult> {
    const email = params.to.toLowerCase().trim();

    // 1. Suppression Check
    if (this.isSuppressed(email)) {
      return {
        success: false,
        status: 'suppressed',
        provider: 'unconfigured',
        is_simulated: false,
        isSimulated: false,
        error: 'Destinatário presente na lista de supressão.',
      };
    }

    // 2. Kill Switch / Mock Safety
    if (this.isKillSwitchActive()) {
      const ref = `MOCK-EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        success: true,
        status: 'disabled_by_policy',
        provider: 'internal_mock',
        provider_reference: ref,
        providerReference: ref,
        is_simulated: true,
        isSimulated: true,
        error: 'Envios externos desativados por política de segurança (PORTAL18_EMAIL_KILL_SWITCH = true).',
      };
    }

    // 3. Fallback when provider not configured
    return {
      success: false,
      status: 'rejected',
      provider: 'unconfigured',
      is_simulated: false,
      isSimulated: false,
      error: 'Nenhum provedor de e-mail de produção configurado.',
    };
  },

  /**
   * Provider health check.
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    active_provider: EmailProviderCode;
    kill_switch: boolean;
  }> {
    const isKillSwitch = this.isKillSwitchActive();
    return {
      status: isKillSwitch ? 'healthy' : 'degraded',
      active_provider: isKillSwitch ? 'internal_mock' : 'unconfigured',
      kill_switch: isKillSwitch,
    };
  },
};
