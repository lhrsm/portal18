import { createClient } from '@/lib/supabase/client';
import { SubscriptionPlan, PromotionProduct } from '@/types/app.types';

export interface PlanComparisonRow {
  feature: string;
  category: 'Visibilidade & Busca' | 'Galeria & Mídia' | 'Recursos & Métricas' | 'Atendimento & Suporte';
  essencial: string | boolean;
  destaque: string | boolean;
  premium: string | boolean;
  vip: string | boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountCents?: number;
  finalAmountCents?: number;
  message: string;
}

export interface LaunchReadinessMetrics {
  publishedAdvertisers: number;
  pendingAdvertisers: number;
  verifiedAdvertisers: number;
  approvedCoverPhotos: number;
  activeContacts: number;
  openCriticalReports: number;
  openTickets: number;
  salvadorAdvertisersCount: number;
  salvadorActiveCount: number;
  isLaunchReady: boolean;
  blockers: string[];
}

export const commercialService = {
  /**
   * Retrieves all subscription plans from the catalog.
   */
  async getPlans(status: 'all' | 'active' | 'draft' | 'archived' = 'active'): Promise<SubscriptionPlan[]> {
    const supabase = createClient();
    let query = supabase.from('subscription_plans').select('*');

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return (data as SubscriptionPlan[]) || [];
  },

  /**
   * Comparison matrix for the public pricing page.
   */
  getPlanComparisonMatrix(): PlanComparisonRow[] {
    return [
      {
        feature: 'Presença na busca da cidade',
        category: 'Visibilidade & Busca',
        essencial: true,
        destaque: true,
        premium: true,
        vip: true,
      },
      {
        feature: 'Prioridade no algoritmo de busca',
        category: 'Visibilidade & Busca',
        essencial: 'Padrão',
        destaque: 'Média',
        premium: 'Alta',
        vip: 'Máxima (Topo)',
      },
      {
        feature: 'Selo exclusivo de destaque',
        category: 'Visibilidade & Busca',
        essencial: false,
        destaque: false,
        premium: 'Selo Premium',
        vip: 'Selo VIP Ouro',
      },
      {
        feature: 'Limite de fotos na galeria',
        category: 'Galeria & Mídia',
        essencial: 'Até 10 fotos',
        destaque: 'Até 15 fotos',
        premium: 'Até 20 fotos',
        vip: 'Até 30 fotos',
      },
      {
        feature: 'Vídeos na galeria',
        category: 'Galeria & Mídia',
        essencial: false,
        destaque: false,
        premium: '1 vídeo curto',
        vip: 'Até 3 vídeos',
      },
      {
        feature: 'Impulsionamentos inclusos / mês',
        category: 'Recursos & Métricas',
        essencial: false,
        destaque: '1 por mês',
        premium: '2 por mês',
        vip: '4 por mês',
      },
      {
        feature: 'Nível de estatísticas e analytics',
        category: 'Recursos & Métricas',
        essencial: 'Básico (Views)',
        destaque: 'Avançado (+ Cliques)',
        premium: 'Completo (+ Fontes)',
        vip: 'Tempo Real VIP',
      },
      {
        feature: 'Suporte prioritário',
        category: 'Atendimento & Suporte',
        essencial: 'Padrão',
        destaque: 'Padrão',
        premium: 'Prioritário',
        vip: 'Atendimento VIP',
      },
    ];
  },

  /**
   * Retrieves active promotion products catalog.
   */
  async getPromotionProducts(): Promise<PromotionProduct[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('promotion_products')
      .select('*')
      .eq('status', 'active')
      .order('price_amount', { ascending: true });

    if (error) {
      console.error('Error fetching promotion products:', error);
      return [];
    }

    return (data as PromotionProduct[]) || [];
  },

  /**
   * Validates a coupon server-side without client trust.
   */
  async validateCoupon(code: string, subtotalCents: number): Promise<CouponValidationResult> {
    const supabase = createClient();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      return { valid: false, code: '', message: 'Código de cupom inválido.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: coupon, error } = await (supabase
      .from('coupons')
      .select('*')
      .eq('code', cleanCode)
      .eq('status', 'active')
      .maybeSingle() as any);

    if (error || !coupon) {
      return { valid: false, code: cleanCode, message: 'Cupom não encontrado ou expirado.' };
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { valid: false, code: cleanCode, message: 'Este cupom ainda não está ativo.' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { valid: false, code: cleanCode, message: 'Este cupom já expirou.' };
    }

    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, code: cleanCode, message: 'Este cupom atingiu o limite máximo de utilizações.' };
    }

    let discountCents = 0;
    if (coupon.discount_type === 'percentage') {
      discountCents = Math.round((subtotalCents * coupon.discount_value) / 100);
    } else {
      discountCents = coupon.discount_value;
    }

    discountCents = Math.min(discountCents, subtotalCents);
    const finalAmountCents = Math.max(0, subtotalCents - discountCents);

    return {
      valid: true,
      code: cleanCode,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountCents,
      finalAmountCents,
      message: `Cupom aplicado! Desconto de ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${(discountCents / 100).toFixed(2)}`}`,
    };
  },

  /**
   * Salvador regional campaign configuration.
   */
  getSalvadorLaunchCampaign() {
    return {
      name: 'Lançamento Salvador & Região Metropolitana',
      slug: 'salvador-launch',
      targetCity: 'Salvador',
      targetState: 'BA',
      headline: 'A maior vitrine de acompanhantes de Salvador e Litoral Norte',
      subheadline: 'Anuncie seu perfil com máxima discrição, alta velocidade de carregamento e respeito à sua privacidade.',
      status: 'draft', // Draft until official regional campaign kick-off
      benefits: [
        'Destaque exclusivo para anúncios de Salvador, Lauro de Freitas e Região',
        'Verificação 18+ sigilosa com foto ao vivo sem exposição de documentos',
        'Contato direto no seu WhatsApp sem intermediários ou cobrança de comissões',
        'Painel profissional com controle total de fotos, pausa e visibilidade',
      ],
      steps: [
        {
          step: 1,
          title: 'Cadastro Rápido',
          desc: 'Crie sua conta em 1 clique com Google ou E-mail com segurança.',
        },
        {
          step: 2,
          title: 'Monte seu Anúncio',
          desc: 'Preencha suas informações, bio, bairros de atendimento e envie suas melhores fotos.',
        },
        {
          step: 3,
          title: 'Validação 18+',
          desc: 'Confirmação rápida da maioridade pela nossa equipe de moderação.',
        },
        {
          step: 4,
          title: 'Publicação Imediata',
          desc: 'Seu perfil passa a ser exibido para milhares de visitantes em Salvador.',
        },
      ],
    };
  },

  /**
   * Launch Readiness Metrics for Admin Platform Management.
   */
  async getLaunchReadinessMetrics(): Promise<LaunchReadinessMetrics> {
    const supabase = createClient();

    const [
      publishedRes,
      pendingRes,
      verifiedRes,
      mediaRes,
      reportsRes,
      ticketsRes,
      salvadorRes,
      salvadorActiveRes,
    ] = await Promise.all([
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'active'),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('profile_status', 'pending_review'),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('advertiser_media').select('id', { count: 'exact', head: true }).eq('position', 0).eq('moderation_status', 'approved'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('severity', 'critical'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('city_id', 'a1111111-1111-1111-1111-111111111111'),
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('city_id', 'a1111111-1111-1111-1111-111111111111').eq('profile_status', 'active'),
    ]);

    const publishedAdvertisers = publishedRes.count || 0;
    const pendingAdvertisers = pendingRes.count || 0;
    const verifiedAdvertisers = verifiedRes.count || 0;
    const approvedCoverPhotos = mediaRes.count || 0;
    const openCriticalReports = reportsRes.count || 0;
    const openTickets = ticketsRes.count || 0;
    const salvadorAdvertisersCount = salvadorRes.count || 0;
    const salvadorActiveCount = salvadorActiveRes.count || 0;

    const blockers: string[] = [];
    if (openCriticalReports > 0) {
      blockers.push(`Existem ${openCriticalReports} denúncia(s) crítica(s) pendentes de resolução.`);
    }

    return {
      publishedAdvertisers,
      pendingAdvertisers,
      verifiedAdvertisers,
      approvedCoverPhotos,
      activeContacts: publishedAdvertisers,
      openCriticalReports,
      openTickets,
      salvadorAdvertisersCount,
      salvadorActiveCount,
      isLaunchReady: blockers.length === 0,
      blockers,
    };
  },
};
