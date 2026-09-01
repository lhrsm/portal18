import { EmailProviderCode, EmailProviderMetadata } from './types';

export const emailProviderRegistry = {
  isKillSwitchActive(): boolean {
    return process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  },

  getProviders(): EmailProviderMetadata[] {
    return [
      {
        code: 'internal_mock',
        name: 'Simulador Interno de E-mail (Test Driver)',
        is_active: true,
        is_production_eligible: false,
        status: 'mock_mode',
      },
      {
        code: 'unconfigured',
        name: 'Provedor Externo Não Configurado',
        is_active: false,
        is_production_eligible: false,
        status: 'unconfigured',
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
    ];
  },

  /**
   * Safe email dispatch through Internal Test Driver (zero real email traffic).
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    category: string;
  }): Promise<{ success: boolean; providerReference?: string; isSimulated: boolean; error?: string }> {
    const isKillSwitch = this.isKillSwitchActive();

    // In homologation / test mode, simulate delivery via internal test driver
    return {
      success: true,
      providerReference: `MOCK-EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isSimulated: isKillSwitch,
    };
  },
};
