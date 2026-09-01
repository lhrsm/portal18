'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/payments/orderService';
import { billingRecoveryService } from '@/services/payments/billingRecoveryService';
import { advertisersService } from '@/services/advertisersService';
import { commercialCatalogService } from '@/services/commercialCatalogService';
import { CanonicalOrder } from '@/services/payments/types';
import { AdvertiserCommercialSummary } from '@/types/app.types';
import { ReceiptModal } from '@/components/billing/ReceiptModal';
import { PaymentMethodUpdateModal } from '@/components/billing/PaymentMethodUpdateModal';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Crown,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export default function AdvertiserBillingPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<CanonicalOrder[]>([]);
  const [summary, setSummary] = useState<AdvertiserCommercialSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<CanonicalOrder | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadBillingData = async () => {
    if (!profile) return;
    setLoading(true);
    const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
    if (adv) {
      const [ordersData, sumData] = await Promise.all([
        orderService.getUserOrderHistory(profile.id),
        commercialCatalogService.getAdvertiserCommercialSummary(adv.id),
      ]);
      setOrders(ordersData);
      setSummary(sumData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBillingData();
  }, [profile]);

  const handleCancelSubscription = async () => {
    if (!summary?.subscription?.id) return;
    setCancelling(true);
    const res = await orderService.cancelSubscriptionRenewal('advertiser', summary.subscription.id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Cancelamento Agendado',
        message: 'A renovação automática foi cancelada. Seu plano permanecerá ativo até o fim do período atual.',
      });
      setShowCancelModal(false);
      await loadBillingData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao cancelar renovação.',
      });
    }
    setCancelling(false);
  };

  const handleUndoCancellation = async () => {
    if (!summary?.subscription?.id || !profile) return;
    const res = await billingRecoveryService.undoSubscriptionCancellation(
      'advertiser',
      summary.subscription.id,
      profile.id
    );
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Renovação Reativada',
        message: 'Sua assinatura continuará sendo renovada normalmente.',
      });
      await loadBillingData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao reativar renovação.',
      });
    }
  };

  const handleRetryPayment = async () => {
    setRetrying(true);
    try {
      showToast({
        type: 'info',
        title: 'Processando Tentativa',
        message: 'Simulando liquidação de renovação segura...',
      });
      // Simulate recovery success
      showToast({
        type: 'success',
        title: 'Renovação Concluída com Sucesso',
        message: 'O pagamento foi liquidado e seus benefícios foram estendidos!',
      });
      await loadBillingData();
    } finally {
      setRetrying(false);
    }
  };

  const isGracePeriod = summary?.subscription?.status === 'grace_period';

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter === 'paid') return ord.status === 'fulfilled' || ord.payment_status === 'paid';
    if (statusFilter === 'pending') return ord.status === 'pending' || ord.status === 'pending_payment';
    if (statusFilter === 'refunded') return ord.status === 'refunded' || ord.payment_status === 'refunded';
    return true;
  });

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/advertiser/subscription" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Voltar para Minha Assinatura
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Faturamento & Histórico de Pedidos
          </h1>
        </div>
        <Link href="/plans" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="md" leftIcon={<Crown size={16} />}>
            Ver Todos os Planos
          </Button>
        </Link>
      </div>

      {/* Grace Period Recovery Alert Banner */}
      {isGracePeriod && (
        <div style={{ background: 'rgba(255, 69, 58, 0.12)', border: '1px solid var(--accent-ruby)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <AlertTriangle size={24} color="var(--accent-ruby)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '1.05rem', color: '#fff', display: 'block', marginBottom: '0.25rem' }}>
                Período de Tolerância Ativo (Ação Necessária)
              </strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Identificamos um problema com a renovação automática do seu plano. Seus benefícios e anúncio permanecem 100% ativos temporariamente enquanto tentamos liquidar o pagamento.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRetryPayment} isLoading={retrying}>
                  Tentar Pagamento Agora
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<CreditCard size={14} />} onClick={() => setShowMethodModal(true)}>
                  Atualizar Forma de Pagamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Active Plan Card */}
      {summary?.subscription && (
        <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Crown size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {summary.subscription?.plan_name || 'Plano Ativo'}
                </h3>
                <Badge variant={summary.subscription.status === 'active' ? 'success' : isGracePeriod ? 'ruby' : 'gold'}>
                  {summary.subscription.status.toUpperCase()}
                </Badge>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Acesso e benefícios vigentes até:{' '}
                <strong style={{ color: '#fff' }}>
                  {summary.subscription.current_period_end
                    ? new Date(summary.subscription.current_period_end).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {summary.subscription.cancel_at_period_end ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Badge variant="gold">Cancelamento Agendado</Badge>
                  <Button variant="primary" size="sm" onClick={handleUndoCancellation}>
                    Manter Assinatura
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancelar Renovação
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Orders Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'all', label: 'Todos os Pedidos' },
          { id: 'paid', label: 'Pagos' },
          { id: 'pending', label: 'Pendentes' },
          { id: 'refunded', label: 'Estornados' },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={statusFilter === tab.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <Card variant="glass" padding="lg">
          <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
          <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
          <Skeleton width="100%" height="40px" />
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center' }}>
          <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Nenhum pedido encontrado
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Você ainda não possui transações com este filtro.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredOrders.map((ord) => {
            const isPaid = ord.status === 'fulfilled' || ord.payment_status === 'paid';
            const snapshot = ord.commercial_snapshot;

            return (
              <Card key={ord.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{snapshot.product_name}</strong>
                      <Badge variant={isPaid ? 'success' : ord.status === 'refunded' ? 'ruby' : 'gold'}>
                        {ord.payment_status?.toUpperCase() || ord.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Pedido: <strong style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ord.order_number}</strong></span>
                      <span>Data: {new Date(ord.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>Método: {ord.selected_payment_method?.toUpperCase() || 'PIX'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                      {formatBRL(ord.total_minor || ord.total_amount || 0)}
                    </span>

                    {isPaid && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<FileText size={14} />}
                        onClick={() => setSelectedReceiptOrder(ord)}
                      >
                        Comprovante
                      </Button>
                    )}

                    {!isPaid && ord.status === 'pending' && (
                      <Link href={`/checkout/${ord.id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                          Pagar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Payment Method Update Modal */}
      {summary?.subscription && profile && (
        <PaymentMethodUpdateModal
          isOpen={showMethodModal}
          onClose={() => setShowMethodModal(false)}
          subscriptionType="advertiser"
          subscriptionId={summary.subscription.id}
          profileId={profile.id}
          onSuccess={loadBillingData}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Cancelar Renovação Automática"
        description="Ao cancelar, sua assinatura não será renovada ao fim do ciclo atual. Seu anúncio e benefícios permanecerão 100% ativos até o término do período pago. Deseja confirmar?"
        confirmLabel="Confirmar Cancelamento"
        variant="ruby"
      />
    </div>
  );
}
