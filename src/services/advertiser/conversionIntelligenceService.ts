import { createClient } from '@/lib/supabase/client';

export interface ConversionFunnel {
  impressions: number;
  profile_views: number;
  interactions: number;
  contact_intents: number;
  profile_open_rate: number;
  contact_ctr: number;
  overall_ctr: number;
}

export interface PeriodComparison {
  prev_impressions: number;
  prev_profile_views: number;
  prev_contact_intents: number;
  views_trend: string;
  contacts_trend: string;
  insufficient_sample: boolean;
}

export interface ContactChannels {
  whatsapp: number;
  phone: number;
  telegram: number;
  website: number;
}

export interface MediaPerformanceItem {
  media_id: string;
  media_type: 'photo' | 'video' | 'audio';
  views: number;
  interactions: number;
  position: number;
}

export interface DeterministicRecommendation {
  id: string;
  title: string;
  reason: string;
  impact: string;
  cta_label: string;
  cta_url: string;
}

export interface PerformanceInsight {
  type: 'growth' | 'observation' | 'warning';
  message: string;
}

export interface AdvertiserConversionIntelligence {
  funnel: ConversionFunnel;
  comparison: PeriodComparison;
  channels: ContactChannels;
  engagement: {
    favorites: number;
    followers: number;
  };
  sources: {
    search_organic: number;
    city_page: number;
    category_page: number;
    recommendations: number;
    direct_and_favorites: number;
  };
  search_keywords: Array<{ keyword: string; count: number }>;
  media_performance: MediaPerformanceItem[];
  insights: PerformanceInsight[];
  recommendations: DeterministicRecommendation[];
}

export const conversionIntelligenceService = {
  /**
   * Retrieves server-authoritative conversion intelligence for an advertiser profile.
   */
  async getConversionIntelligence(
    advertiserId: string,
    periodDays: 0 | 7 | 30 | 90 = 30
  ): Promise<AdvertiserConversionIntelligence | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_advertiser_conversion_intelligence_v1', {
        p_advertiser_id: advertiserId,
        p_period_days: periodDays,
      });

      if (!error && data) {
        return data as AdvertiserConversionIntelligence;
      }
    } catch {
      // Fallback
    }

    // Default safe fallback structure
    return {
      funnel: {
        impressions: 0,
        profile_views: 0,
        interactions: 0,
        contact_intents: 0,
        profile_open_rate: 0,
        contact_ctr: 0,
        overall_ctr: 0,
      },
      comparison: {
        prev_impressions: 0,
        prev_profile_views: 0,
        prev_contact_intents: 0,
        views_trend: 'estável',
        contacts_trend: 'estável',
        insufficient_sample: true,
      },
      channels: {
        whatsapp: 0,
        phone: 0,
        telegram: 0,
        website: 0,
      },
      engagement: {
        favorites: 0,
        followers: 0,
      },
      sources: {
        search_organic: 0,
        city_page: 0,
        category_page: 0,
        recommendations: 0,
        direct_and_favorites: 0,
      },
      search_keywords: [],
      media_performance: [],
      insights: [
        {
          type: 'observation',
          message: 'Seu perfil ainda está começando a receber dados. Mantenha suas informações atualizadas para ampliar seu alcance.',
        },
      ],
      recommendations: [
        {
          id: 'rec_init',
          title: 'Adicione fotos de alta qualidade',
          reason: 'Anúncios com 3 ou mais fotos aprovadas geram até 3x mais intenções de contato.',
          impact: 'Mais confiança e visualizações',
          cta_label: 'Gerenciar Galeria',
          cta_url: '/advertiser/gallery',
        },
      ],
    };
  },

  /**
   * Records media interaction event (view / click).
   */
  async recordMediaInteraction(
    advertiserId: string,
    mediaId: string,
    eventType: 'view' | 'click' = 'view'
  ): Promise<boolean> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.rpc as any)('record_media_interaction_event', {
        p_advertiser_id: advertiserId,
        p_media_id: mediaId,
        p_event_type: eventType,
      });
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Generates a sanitized CSV string for advertiser analytics export (Zero visitor PII).
   */
  exportToCSV(intelligence: AdvertiserConversionIntelligence): string {
    const headers = ['Métrica', 'Valor'];
    const rows = [
      ['Impressões Totais', intelligence.funnel.impressions],
      ['Visualizações do Perfil', intelligence.funnel.profile_views],
      ['Intenções de Contato Totais', intelligence.funnel.contact_intents],
      ['Taxa de Abertura (%)', intelligence.funnel.profile_open_rate],
      ['CTR de Contato (%)', intelligence.funnel.contact_ctr],
      ['Intenções WhatsApp', intelligence.channels.whatsapp],
      ['Intenções Telefone', intelligence.channels.phone],
      ['Favoritos', intelligence.engagement.favorites],
      ['Seguidores', intelligence.engagement.followers],
    ];

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
