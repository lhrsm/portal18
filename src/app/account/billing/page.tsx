'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/payments/orderService';
import { billingRecoveryService } from '@/services/payments/billingRecoveryService';
import { consumerSubscriptionService } from '@/services/consumerSubscriptionService';
import { CanonicalOrder } from '@/services/payments/types';
import { ConsumerSubscription, ConsumerEntitlements } from '@/types/app.types';
import { ReceiptModal } from '@/components/billing/ReceiptModal';
import { PaymentMethodUpdateModal } from '@/components/billing/PaymentMethodUpdateModal';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Crown,
  ArrowRight,
  ArrowLeft,
  Calendar,
  RefreshCw,
  CreditCard
} from 'lucide-react';

export default function ConsumerBillingPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<CanonicalOrder[]>([]);
  const [subscription, setSubscription] = useState<{ subscription: ConsumerSubscription | null; entitlements: ConsumerEntitlements } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<CanonicalOrder | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const loadConsumerBillingData = async () => {
    if (!profile) return;
    setLoading(true);
    const [ordersData, subData] = await Promise.all([
      orderService.getUserOrderHistory(profile.id),
      consumerSubscriptionService.getSubscriptionDetails(profile.id),
    ]);
    setOrders(ordersData.filter((o: CanonicalOrder) => o.product_type === 'consumer_subscription'));
    setSubscription(subData);
    setLoading(false);
  };

  useEffect(() => {
    loadConsumerBillingData();
  }, [profile]);

  const handleCancelSubscription = async () => {
    if (!subscription?.subscription?.id) return;
    setCancelling(true);
    const res = await orderService.cancelSubscriptionRenewal('consumer', subscription.subscription.id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Cancelamento Agendado',
        message: 'Sua assinatura Consumer Premium continuará ativa até o término do ciclo atual.',
      });
      setShowCancelModal(false);
      await loadConsumerBillingData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao cancelar assinatura.',
      });
    }
    setCancelling(false);
  };

  const handleUndoCancellation = async () => {
    if (!subscription?.subscription?.id || !profile) return;
    const res = await billingRecoveryService.undoSubscriptionCancellation(
      'consumer',
      subscription.subscription.id,
      profile.id
    );
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Assinatura Mantida',
        message: 'A renovação automática do Portal18 Premium foi restabelecida com sucesso.',
      });
      await loadConsumerBillingData();
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
        type: 'success',
        title: 'Renovação Concluída com Sucesso',
        message: 'O pagamento foi confirmado e seu acesso Premium foi estendido!',
      });
      await loadConsumerBillingData();
    } finally {
      setRetrying(false);
    }
  };

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isGracePeriod = subscription?.subscription?.status === 'grace_period';

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link href="/account" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Voltar para Minha Conta
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Minhas Assinaturas & Recibos
          </h1>
        </div>
        <Link href="/premium" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="md" leftIcon={<Sparkles size={16} />}>
            Conhecer Portal18 Premium
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
                Problema com a Renovação do Portal18 Premium
              </strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                A cobrança automática não foi concluída. Seus benefícios Premium permanecem ativos temporariamente enquanto aguardamos a regularização.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={handleRetryPayment} isLoading={retrying}>
                  Tentar Novamente
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<CreditCard size={14} />} onClick={() => setShowMethodModal(true)}>
                  Atualizar Forma de Pagamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Subscription Status Card */}
      {subscription?.subscription && (
        <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Crown size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Portal18 Premium Member
                </h3>
                <Badge variant={subscription.subscription.status === 'active' ? 'success' : isGracePeriod ? 'ruby' : 'gold'}>
                  {subscription.subscription.status.toUpperCase()}
                </Badge>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                Acesso liberado até:{' '}
                <strong style={{ color: '#fff' }}>
                  {subscription.subscription.current_period_end
                    ? new Date(subscription.subscription.current_period_end).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {subscription.subscription.cancel_at_period_end ? (
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
                  Cancelar Assinatura
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Orders List */}
      {loading ? (
        <Card variant="glass" padding="lg">
          <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
          <Skeleton width="100%" height="40px" />
        </Card>
      ) : orders.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center' }}>
          <Crown size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Nenhuma assinatura ativa
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Torne-se membro do Portal18 Premium para liberar acesso exclusivo a vídeos e avaliações completas.
          </p>
          <Link href="/premium" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">
              Assinar Agora
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map((ord) => {
            const isPaid = ord.status === 'fulfilled' || ord.payment_status === 'paid';
            const snapshot = ord.commercial_snapshot;

            return (
              <Card key={ord.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{snapshot.product_name}</strong>
                      <Badge variant={isPaid ? 'success' : 'gold'}>
                        {ord.payment_status?.toUpperCase() || ord.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Pedido: <strong style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ord.order_number}</strong></span>
                      <span>Data: {new Date(ord.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>Duração: {snapshot.duration_days} dias</span>
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
                        Recibo
                      </Button>
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
      {subscription?.subscription && profile && (
        <PaymentMethodUpdateModal
          isOpen={showMethodModal}
          onClose={() => setShowMethodModal(false)}
          subscriptionType="consumer"
          subscriptionId={subscription.subscription.id}
          profileId={profile.id}
          onSuccess={loadConsumerBillingData}
        />
      )}

      {/* Cancellation Modal */}
      <ActionConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Cancelar Assinatura Premium"
        description="Ao confirmar o cancelamento, seu acesso Premium continuará disponível até o fim do período já pago. Deseja prosseguir?"
        confirmLabel="Confirmar Cancelamento"
        variant="ruby"
      />
    </div>
  );
}
