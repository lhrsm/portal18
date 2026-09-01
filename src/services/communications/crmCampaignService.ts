import { createClient } from '@/lib/supabase/client';
import { CommunicationCampaign } from './types';

export const crmCampaignService = {
  /**
   * Retrieves registered CRM communication campaigns.
   */
  async getCampaigns(filters?: { status?: string }): Promise<CommunicationCampaign[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('communication_campaigns') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error || !data) return [];
      return data as CommunicationCampaign[];
    } catch {
      return [];
    }
  },

  /**
   * Creates a new CRM lifecycle campaign draft.
   */
  async createCampaign(params: {
    name: string;
    campaignType: 'institutional' | 'marketing' | 'advertiser_education' | 'consumer_discovery';
    channel: 'in_app' | 'email' | 'push';
    templateKey: string;
    audienceFilter?: Record<string, any>;
    scheduledAt?: string;
    createdBy?: string;
  }): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('communication_campaigns') as any)
        .insert({
          name: params.name,
          campaign_type: params.campaignType,
          channel: params.channel,
          template_key: params.templateKey,
          audience_filter: params.audienceFilter || {},
          status: params.scheduledAt ? 'scheduled' : 'draft',
          scheduled_at: params.scheduledAt || null,
          created_by: params.createdBy || null,
        })
        .select('id')
        .single();

      if (error || !data) return { success: false, error: error?.message };
      return { success: true, campaignId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao criar campanha CRM.' };
    }
  },

  /**
   * Returns pre-configured CRM lifecycle journeys.
   */
  getLifecycleJourneys() {
    return [
      {
        id: 'journey-new-advertiser',
        name: 'Boas-Vindas & Onboarding de Anunciante',
        trigger: 'Conta de anunciante criada',
        channel: 'in_app' as const,
        description: 'Orientações passo a passo para preenchimento de perfil e autenticidade.',
      },
      {
        id: 'journey-published-profile',
        name: 'Perfil Publicado com Sucesso',
        trigger: 'Primeira aprovação de perfil',
        channel: 'in_app' as const,
        description: 'Dicas para otimização de visibilidade e regras de atendimento seguro.',
      },
      {
        id: 'journey-trial-ending',
        name: 'Aviso Prévio de Encerramento de Degustação',
        trigger: '3 dias antes do fim do período de trial',
        channel: 'email' as const,
        description: 'Explicação transparente sobre os planos disponíveis sem dark patterns.',
      },
      {
        id: 'journey-consumer-welcome',
        name: 'Boas-Vindas ao Membro',
        trigger: 'Cadastro de usuário comum',
        channel: 'in_app' as const,
        description: 'Apresentação dos recursos de busca, filtros regionais e segurança.',
      },
    ];
  },
};
