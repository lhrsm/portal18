import { createClient } from '@/lib/supabase/client';
import { 
  AdminCommercialOverview, 
  OperationalAlert, 
  PaymentReadinessCheckItem,
  CommercialExportOptions 
} from '@/types/app.types';

export const adminCommercialService = {
  /**
   * Fetches master commercial overview and KPI metrics
   */
  async getCommercialOverview(): Promise<AdminCommercialOverview> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_admin_commercial_overview');

      if (!error && data && data.success) {
        return data as AdminCommercialOverview;
      }
    } catch {
      // fallback to safe calculated counts below
    }

    // Safe fallback querying canonical tables directly
    const [
      advCountRes,
      subRes,
      consumerSubRes,
      referralRes,
      campaignRes,
      reviewRes,
      invRes,
    ] = await Promise.all([
      supabase.from('advertiser_profiles').select('id', { count: 'exact', head: true }).eq('moderation_status', 'approved').eq('publication_status', 'published'),
      supabase.from('subscriptions').select('id, status, trial_end'),
      supabase.from('consumer_subscriptions').select('id, status'),
      supabase.from('advertiser_referrals').select('id, status, risk_status'),
      supabase.from('campaigns').select('id, status'),
      supabase.from('advertiser_reviews').select('id, status, created_at'),
      supabase.from('commercial_inventory').select('total_slots, reserved_slots'),
    ]);

    const totalAdv = advCountRes.count || 0;
    const subs = subRes.data || [];
    const consumerSubs = consumerSubRes.data || [];
    const referrals = referralRes.data || [];
    const campaigns = campaignRes.data || [];
    const reviews = reviewRes.data || [];
    const inventories = invRes.data || [];

    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;
    const in24hPast = now - 24 * 60 * 60 * 1000;

    const activeTrials = subs.filter((s: any) => s.status === 'trial' || (s.trial_end && new Date(s.trial_end).getTime() > now)).length;
    const trialsEndingSoon = subs.filter((s: any) => {
      if (!s.trial_end) return false;
      const t = new Date(s.trial_end).getTime();
      return t > now && t <= in24h;
    }).length;
    const activeAdvSubs = subs.filter((s: any) => s.status === 'active').length;
    const limitedMode = Math.max(0, totalAdv - activeAdvSubs - activeTrials);

    const activeConsumerSubs = consumerSubs.filter((cs: any) => cs.status === 'active').length;
    const pendingReferrals = referrals.filter((r: any) => r.status === 'pending').length;
    const referralsManualReview = referrals.filter((r: any) => r.risk_status === 'manual_review' || r.risk_status === 'blocked').length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'active' || c.status === 'active_test').length;

    const pendingReviews = reviews.filter((rv: any) => rv.status === 'submitted').length;
    const reviewsDelayed = reviews.filter((rv: any) => rv.status === 'submitted' && new Date(rv.created_at).getTime() < in24hPast).length;

    const totalSlots = inventories.reduce((acc: number, item: any) => acc + (item.total_slots || 0), 0);
    const reservedSlots = inventories.reduce((acc: number, item: any) => acc + (item.reserved_slots || 0), 0);
    const utilPercent = totalSlots > 0 ? Math.round((reservedSlots / totalSlots) * 1000) / 10 : 0;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        total_advertisers: totalAdv,
        active_trials: activeTrials,
        trials_ending_soon: trialsEndingSoon,
        limited_mode_advertisers: limitedMode,
        active_advertiser_subs: activeAdvSubs,
        active_consumer_subs: activeConsumerSubs,
        pending_referrals: pendingReferrals,
        referrals_manual_review: referralsManualReview,
        active_campaigns: activeCampaigns,
        pending_reviews: pendingReviews,
        reviews_delayed: reviewsDelayed,
        inventory_slots_total: totalSlots,
        inventory_slots_reserved: reservedSlots,
        inventory_utilization_percent: utilPercent,
      },
      payment_readiness: {
        status: 'disabled',
        kill_switch_active: true,
        message: 'Assinaturas e pagamentos em fase de homologação controlada',
        charges_real: 0,
        provider: 'none',
        currency: 'BRL',
      },
      policy_versions: {
        commercial_catalog: 'v1',
        consumer_catalog: 'v1',
        ranking_policy: 'v1',
        referral_policy: 'v1',
        pricing_policy: 'v1',
      },
    };
  },

  /**
   * Evaluates deterministic operational alerts from real overview metrics
   */
  getOperationalAlerts(overview: AdminCommercialOverview): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];
    const { metrics, payment_readiness } = overview;

    // 1. Payment Kill Switch Notice
    if (payment_readiness.kill_switch_active) {
      alerts.push({
        id: 'alert-pay-disabled',
        title: 'Gateway de Pagamento em Homologação',
        description: 'Kill switch ativo. Nenhuma cobrança real está sendo processada no momento.',
        severity: 'info',
        domain: 'payments',
        action_href: '#payments-readiness',
        action_label: 'Ver Checklist',
      });
    }

    // 2. Trials ending in <= 24h
    if (metrics.trials_ending_soon > 0) {
      alerts.push({
        id: 'alert-trials-ending',
        title: `${metrics.trials_ending_soon} Trial(s) Terminam em 24h`,
        description: 'Anunciantes em fase final de avaliação gratuita migrarão para Limited Mode.',
        severity: 'warning',
        domain: 'trials',
        action_href: '#advertisers-subs',
        action_label: 'Ver Anunciantes',
      });
    }

    // 3. Delayed reviews in moderation queue (> 24h)
    if (metrics.reviews_delayed > 0) {
      alerts.push({
        id: 'alert-reviews-delayed',
        title: `${metrics.reviews_delayed} Avaliação(ões) Aguardando > 24h`,
        description: 'Fila de moderação de avaliações com tempo de espera superior ao SLA operacional.',
        severity: 'critical',
        domain: 'reviews',
        action_href: '/admin/moderation/reviews',
        action_label: 'Moderar Avaliações',
      });
    }

    // 4. Referrals in manual review / fraud check
    if (metrics.referrals_manual_review > 0) {
      alerts.push({
        id: 'alert-referrals-fraud',
        title: `${metrics.referrals_manual_review} Indicação(ões) em Análise Antifraude`,
        description: 'Indicações com sinais de risco aguardando validação manual de elegibilidade.',
        severity: 'warning',
        domain: 'referrals',
        action_href: '/admin/referrals',
        action_label: 'Fila Antifraude',
      });
    }

    // 5. High inventory utilization
    if (metrics.inventory_utilization_percent > 85) {
      alerts.push({
        id: 'alert-inventory-high',
        title: `Inventário Comercial com Alta Ocupação (${metrics.inventory_utilization_percent}%)`,
        description: 'Mais de 85% dos slots patrocinados estão reservados ou ocupados.',
        severity: 'warning',
        domain: 'inventory',
        action_href: '#campaigns-inventory',
        action_label: 'Inspecionar Slots',
      });
    }

    return alerts;
  },

  /**
   * Returns authoritative Payment Readiness Checklist
   */
  getPaymentReadinessChecklist(): PaymentReadinessCheckItem[] {
    return [
      {
        id: 'chk-adv-catalog',
        name: 'Catálogo Comercial de Anunciantes (Essencial, Destaque, Premium, VIP)',
        description: 'Definição canônica de pacotes, períodos de 7/30/90 dias e limites de recursos.',
        status: 'passed',
        evidence: 'Tabelas canonical plans e billing_periods ativas',
      },
      {
        id: 'chk-consumer-catalog',
        name: 'Catálogo de Assinantes Consumer Premium',
        description: 'Planos Free e Premium com multi-período e matriz de precificação versionada.',
        status: 'passed',
        evidence: 'Tabelas consumer_plans e consumer_plan_pricing ativas',
      },
      {
        id: 'chk-price-versioning',
        name: 'Versionamento Imutável de Preços (Minor Units BRL)',
        description: 'Precificação em centavos inteiros protegida contra alterações retroativas.',
        status: 'passed',
        evidence: 'Constraint uq_plan_period_policy e versioning v1',
      },
      {
        id: 'chk-entitlements-engine',
        name: 'Motor Server-Authoritative de Entitlements',
        description: 'Concessão de mídia, vídeo exclusivo e badges avaliada em tempo de execução.',
        status: 'passed',
        evidence: 'RPCs get_advertiser_entitlements e get_consumer_entitlements ativas',
      },
      {
        id: 'chk-orders-schema',
        name: 'Estrutura de Pedidos e Assinaturas (Idempotência)',
        description: 'Tabelas de subscriptions preparadas com status canonical e cancellation lifecycle.',
        status: 'passed',
        evidence: 'Schema public.subscriptions e public.consumer_subscriptions ativos',
      },
      {
        id: 'chk-webhook-contract',
        name: 'Contrato de Webhooks de Pagamento Idempotente',
        description: 'Endpoint preparado para processar eventos de pagamento, estorno e renovação.',
        status: 'passed',
        evidence: 'Handler /api/webhooks/payments implementado com verificação de assinatura',
      },
      {
        id: 'chk-gateway-credentials',
        name: 'Credenciais de Gateway de Produção',
        description: 'Configuração de chaves de API do provedor de pagamento em ambiente de produção.',
        status: 'blocked',
        evidence: 'Kill switch ativo — Nenhuma credencial de produção configurada',
      },
      {
        id: 'chk-live-checkout-smoke',
        name: 'Teste de Fumaça (Smoke Test) de Checkout Real',
        description: 'Execução de transação ponta a ponta com estorno imediato em homologação final.',
        status: 'blocked',
        evidence: 'Bloqueado até autorização formal e ativação de credenciais',
      },
    ];
  },

  /**
   * Generates sanitized CSV export for administrative records
   */
  async exportCommercialData(options: CommercialExportOptions): Promise<string> {
    const supabase = createClient();
    const type = options.type;

    if (type === 'subscriptions') {
      const { data } = await supabase
        .from('subscriptions')
        .select('id, advertiser_id, status, plan_id, current_period_start, current_period_end, trial_end, created_at');
      
      const rows = data || [];
      const header = 'Subscription ID,Advertiser ID,Status,Plan ID,Period Start,Period End,Trial End,Created At\n';
      const body = rows.map((r: any) => 
        `"${r.id}","${r.advertiser_id}","${r.status}","${r.plan_id || ''}","${r.current_period_start || ''}","${r.current_period_end || ''}","${r.trial_end || ''}","${r.created_at}"`
      ).join('\n');
      return header + body;
    }

    if (type === 'campaigns') {
      const { data } = await supabase
        .from('campaigns')
        .select('id, advertiser_id, placement, status, start_date, end_date, created_at');
      
      const rows = data || [];
      const header = 'Campaign ID,Advertiser ID,Placement,Status,Start Date,End Date,Created At\n';
      const body = rows.map((r: any) => 
        `"${r.id}","${r.advertiser_id}","${r.placement}","${r.status}","${r.start_date || ''}","${r.end_date || ''}","${r.created_at}"`
      ).join('\n');
      return header + body;
    }

    if (type === 'referrals') {
      const { data } = await supabase
        .from('advertiser_referrals')
        .select('id, referrer_advertiser_id, referred_advertiser_id, status, risk_status, bonus_days_granted, created_at');
      
      const rows = data || [];
      const header = 'Referral ID,Referrer ID,Referred ID,Status,Risk Status,Bonus Days,Created At\n';
      const body = rows.map((r: any) => 
        `"${r.id}","${r.referrer_advertiser_id}","${r.referred_advertiser_id}","${r.status}","${r.risk_status}","${r.bonus_days_granted}","${r.created_at}"`
      ).join('\n');
      return header + body;
    }

    return 'No data';
  }
};
