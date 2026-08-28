'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { billingService } from '@/services/billingService';
import { entitlementService, UsageMeters } from '@/services/entitlementService';
import { Subscription, SubscriptionPlan, AdvertiserEntitlements, Payment } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { useToast } from '@/hooks/useToast';
import { 
  CreditCard, 
  Crown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Sparkles,
  Zap,
  Info,
  Image as ImageIcon,
  Video,
  Layers
} from 'lucide-react';

export default function AdvertiserSubscriptionDashboardPage() {
  const { showToast } = useToast();

  const [subData, setSubData] = useState<(Subscription & { subscription_plans?: SubscriptionPlan }) | null>(null);
  const [entitlements, setEntitlements] = useState<AdvertiserEntitlements | null>(null);
  const [usageMeters, setUsageMeters] = useState<UsageMeters | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [subRes, paymentsRes] = await Promise.all([
      billingService.getOwnSubscription(),
      billingService.getOwnPayments(),
    ]);

    setSubData(subRes.subscription);
    setEntitlements(subRes.entitlements);
    setPayments(paymentsRes);

    if (subRes.subscription?.advertiser_id) {
      const meters = await entitlementService.getUsageMeters(subRes.subscription.advertiser_id);
      setUsageMeters(meters);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelSubscription = async () => {
    if (!subData) return;
    const res = await billingService.cancelSubscription(subData.id, true);
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Cancelamento Agendado',
        message: 'Sua assinatura não será renovada e continuará ativa até o fim do período vigente.',
      });
      await loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Não foi possível cancelar.' });
    }
    setIsCancelModalOpen(false);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '900px' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  const hasActivePlan = subData && subData.status === 'active';
  const plan = subData?.subscription_plans;

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '900px' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/advertiser" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Painel do Anunciante
        </Link>
        <Link href="/advertiser/promote">
          <Button variant="secondary" size="sm" leftIcon={<Zap size={14} />}>
            Impulsionar Anúncio
          </Button>
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Minha Assinatura & Plano
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gerencie seu plano de divulgação, limites de fotos, renovações e faturas
        </p>
      </div>

      {/* Over Limit Warning if any */}
      {usageMeters?.isOverLimit && (
        <Alert type="warning" title="Aviso sobre Limite do Plano" style={{ marginBottom: '1.5rem' }}>
          {usageMeters.overLimitNotice}
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card variant="premium" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Badge variant={hasActivePlan ? 'gold' : 'neutral'}>
                {hasActivePlan ? 'PLANO ATIVO' : 'SEM PLANO PAGO'}
              </Badge>
              {subData?.cancel_at_period_end && (
                <Badge variant="warning">Cancelamento agendado no fim do ciclo</Badge>
              )}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {plan ? plan.name : entitlements?.plan_name || 'Básico Inicial'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {plan?.description || 'Plano de presença inicial com recursos essenciais.'}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            {plan && (
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                {formatPrice(plan.price_amount)}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/mês</span>
              </div>
            )}
            {subData?.current_period_end && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Ciclo vigente até: {new Date(subData.current_period_end).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>

        {/* Real Usage Meters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1.25rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <ImageIcon size={13} /> Limite de Fotos
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {usageMeters ? `${usageMeters.photos.current} / ${usageMeters.photos.limit}` : `${entitlements?.media_limit || 10} fotos`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {usageMeters?.photos.canAddMore ? 'Disponível para envio' : 'Limite atingido'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <Video size={13} /> Vídeos na Galeria
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {usageMeters ? `${usageMeters.videos.current} / ${usageMeters.videos.limit}` : (entitlements?.video_limit ? 'Liberado' : '0 vídeos')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {entitlements?.video_limit ? 'Ativo' : 'Requer Plano Premium'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <Zap size={13} /> Impulsionamentos Inclusos
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {usageMeters ? `${usageMeters.boosts.remaining} restantes` : `${entitlements?.boost_allowance || 0}/mês`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Renovação mensal
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <Layers size={13} /> Analytics & Métricas
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {entitlements?.analytics_level || 'Básico'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Relatórios no painel
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem' }}>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={16} />}
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            {hasActivePlan ? 'Alterar Plano (Upgrade / Downgrade)' : 'Contratar um Plano'}
          </Button>

          {hasActivePlan && !subData?.cancel_at_period_end && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              style={{ color: 'var(--accent-ruby)' }}
            >
              Cancelar Renovação
            </Button>
          )}
        </div>
      </Card>

      {/* Invoices & Payments History */}
      <Card variant="glass" padding="lg">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--accent-gold)" /> Histórico de Pagamentos & Faturas
        </h3>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Nenhum pagamento registrado no momento. A plataforma está em fase de homologação gratuita.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {payments.map((p) => (
              <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>
                    {p.payment_type.toUpperCase()} • {p.provider_payment_reference}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(p.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700 }}>{formatPrice(p.amount)}</span>
                  <Badge variant={p.status === 'paid' ? 'success' : p.status === 'refunded' ? 'ruby' : 'warning'}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Modal */}
      <ActionConfirmModal
        isOpen={isCancelModalOpen}
        title="Cancelar Renovação Automática"
        description="Tem certeza de que deseja cancelar a renovação da sua assinatura? Seu plano continuará ativo com todos os benefícios vigentes até a data de expiração do ciclo atual."
        confirmLabel="Confirmar Cancelamento"
        variant="ruby"
        requireReason={false}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
      />

      {/* Upgrade / Commercial Homologation Modal */}
      <ActionConfirmModal
        isOpen={isUpgradeModalOpen}
        title="Contratação em Fase de Homologação"
        description="O gateway de pagamentos automatizados está em processo de homologação técnica. Todos os recursos básicos, galerias e ferramentas de contato estão liberados gratuitamente no momento!"
        confirmLabel="Ver Todos os Planos"
        variant="primary"
        requireReason={false}
        onClose={() => setIsUpgradeModalOpen(false)}
        onConfirm={async () => {
          setIsUpgradeModalOpen(false);
          window.location.href = '/plans';
        }}
      />
    </div>
  );
}
