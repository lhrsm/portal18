import { createClient } from '@/lib/supabase/client';
import { AdvertiserEntitlements, CommercialLifecycleState, SubscriptionPlan } from '@/types/app.types';

export interface CommercialLifecycleDetails {
  advertiserId: string;
  lifecycleState: CommercialLifecycleState;
  planName: string;
  planSlug: string;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  gracePeriodEnd: string | null;
  entitlements: AdvertiserEntitlements;
  statusBadge: {
    label: string;
    variant: 'gold' | 'ruby' | 'success' | 'outline' | 'default';
    description: string;
  };
  recommendation?: {
    title: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
  };
}

export const commercialLifecycleService = {
  /**
   * Retrieves full server-authoritative commercial lifecycle details for an advertiser.
   */
  async getCommercialLifecycle(advertiserId: string): Promise<CommercialLifecycleDetails> {
    const supabase = createClient();
    const defaultEntitlements: AdvertiserEntitlements = {
      has_active_subscription: false,
      plan_name: 'Gratuito / Básico',
      plan_slug: 'free',
      lifecycle_state: 'limited',
      media_limit: 10,
      video_limit: 0,
      boost_allowance: 0,
      analytics_level: 'basic',
      audio_allowed: false,
      commercial_video_allowed: false,
      contacts_strategy: 'limited',
      is_trial: false,
      trial_days_remaining: 0,
      trial_ends_at: null,
      authenticity_verified: false,
    };

    let entitlements: AdvertiserEntitlements = defaultEntitlements;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_advertiser_entitlements', {
        p_advertiser_id: advertiserId,
      });

      if (!error && data) {
        entitlements = data as AdvertiserEntitlements;
      }
    } catch {
      // Fallback
    }

    const state = entitlements.lifecycle_state || 'limited';

    // Compute UI badge & lifecycle recommendations
    let statusBadge: CommercialLifecycleDetails['statusBadge'];
    let recommendation: CommercialLifecycleDetails['recommendation'];

    switch (state) {
      case 'trial':
        statusBadge = {
          label: `Período Premium (${entitlements.trial_days_remaining}d restantes)`,
          variant: 'gold',
          description: `Seu período Premium de 7 dias termina em ${entitlements.trial_ends_at ? new Date(entitlements.trial_ends_at).toLocaleDateString('pt-BR') : 'breve'}. Aproveite todos os recursos liberados.`,
        };
        recommendation = {
          title: 'Garante a continuidade de todos os benefícios',
          description: 'Ao assinar um plano, você mantém seus vídeos na galeria, áudio de apresentação e visualização completa de contatos.',
          ctaText: 'Ver Planos Disponíveis',
          ctaUrl: '/advertiser/subscription/plans',
        };
        break;

      case 'active':
        statusBadge = {
          label: entitlements.plan_name,
          variant: 'success',
          description: `Plano ativo até ${entitlements.current_period_end ? new Date(entitlements.current_period_end).toLocaleDateString('pt-BR') : 'próxima renovação'}.`,
        };
        break;

      case 'grace_period':
        statusBadge = {
          label: 'Período de Tolerância',
          variant: 'ruby',
          description: 'A renovação automática da sua assinatura falhou temporariamente. Seus recursos continuam ativos durante o período de tolerância.',
        };
        recommendation = {
          title: 'Atualize sua forma de pagamento',
          description: 'Evite a transição para o modo limitado atualizando os dados da sua assinatura.',
          ctaText: 'Gerenciar Assinatura',
          ctaUrl: '/advertiser/subscription',
        };
        break;

      case 'suspended':
        statusBadge = {
          label: 'Perfil Suspenso',
          variant: 'ruby',
          description: 'Seu perfil foi suspenso por nossa equipe de moderação e não está visível para visitantes.',
        };
        recommendation = {
          title: 'Suporte e Conformidade',
          description: 'Entre em contato com nossa equipe para entender os motivos e regularizar seu anúncio.',
          ctaText: 'Abrir Chamado',
          ctaUrl: '/support/novo',
        };
        break;

      case 'limited':
      default:
        statusBadge = {
          label: 'Modo Básico / Gratuito',
          variant: 'outline',
          description: 'Seu anúncio continua publicado e visível. Para liberar vídeos, apresentação em áudio e mais fotos, assine um plano Premium.',
        };
        recommendation = {
          title: 'Destaque seu anúncio com um plano Premium',
          description: 'Aumente o alcance e libere áudio de voz, vídeos na galeria e destaque nas buscas.',
          ctaText: 'Conhecer Planos',
          ctaUrl: '/advertiser/subscription/plans',
        };
        break;
    }

    return {
      advertiserId,
      lifecycleState: state,
      planName: entitlements.plan_name,
      planSlug: entitlements.plan_slug,
      isTrial: Boolean(entitlements.is_trial),
      trialDaysRemaining: entitlements.trial_days_remaining || 0,
      trialEndsAt: entitlements.trial_ends_at || null,
      currentPeriodEnd: entitlements.current_period_end || null,
      gracePeriodEnd: entitlements.grace_period_end || null,
      entitlements,
      statusBadge,
      recommendation,
    };
  },
};
