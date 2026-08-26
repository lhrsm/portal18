'use client';

import React, { useState, useEffect } from 'react';
import { billingService } from '@/services/billingService';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const { roles } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = roles.includes('super_admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payments, setPayments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Refund Modal State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [refundTarget, setRefundTarget] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [paymentsRes, metricsRes] = await Promise.all([
      billingService.getAdminPayments({ status: statusFilter || undefined }),
      billingService.getAdminBillingMetrics(),
    ]);

    setPayments(paymentsRes.data);
    setTotalCount(paymentsRes.totalCount);
    setMetrics(metricsRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleConfirmRefund = async (reason: string) => {
    if (!refundTarget) return;
    const res = await billingService.adminRefundPayment(refundTarget.id, reason);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Estorno Realizado',
        message: 'O pagamento foi marcado como estornado com registro de auditoria.',
      });
      setRefundTarget(null);
      await loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao processar estorno.' });
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Faturamento & Pagamentos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Auditoria de transações financeiras, receita bruta e emissão de estornos
          </p>
        </div>
        <Badge variant="gold">{totalCount} transações</Badge>
      </div>

      {/* Financial Metrics Cards (Section 77 & 78) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receita Bruta Total</span>
            <DollarSign size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {loading ? <Skeleton width="100px" height="32px" /> : formatPrice(metrics?.totalRevenueCents || 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {metrics?.paidPaymentsCount || 0} pagamentos aprovados
          </span>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MRR Recorrente Ativo</span>
            <TrendingUp size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {loading ? <Skeleton width="100px" height="32px" /> : formatPrice(metrics?.mrrCents || 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {metrics?.activeSubscriptionsCount || 0} assinaturas ativas
          </span>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total de Estornos</span>
            <RotateCcw size={18} color="var(--accent-ruby)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>
            {loading ? <Skeleton width="100px" height="32px" /> : formatPrice(metrics?.totalRefundsCents || 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {metrics?.refundedPaymentsCount || 0} transações estornadas
          </span>
        </Card>
      </div>

      {/* Filter */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ minWidth: '200px' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholderOption="Todos os Status">
            <option value="paid">Pagos (Aprovados)</option>
            <option value="pending">Pendentes</option>
            <option value="refunded">Estornados (Refunded)</option>
            <option value="failed">Falhos</option>
            <option value="chargeback">Chargebacks</option>
          </Select>
        </div>
      </Card>

      {/* Payments List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : payments.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <CreditCard size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum pagamento registrado</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            As transações de assinaturas e destaques aparecerão aqui.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {payments.map((p) => (
            <Card key={p.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {p.advertiser_profiles?.stage_name || 'Anunciante'}
                  </span>
                  <Badge variant={p.status === 'paid' ? 'success' : p.status === 'refunded' ? 'ruby' : 'warning'}>
                    {p.status.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.payment_type} • {p.provider}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Ref: <code>{p.provider_payment_reference}</code></span>
                  <span>•</span>
                  <span>Data: {new Date(p.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {formatPrice(p.amount)}
                </span>

                {isSuperAdmin && p.status === 'paid' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRefundTarget(p)}
                    style={{ color: 'var(--accent-ruby)' }}
                  >
                    Estornar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Refund Modal */}
      {refundTarget && (
        <ActionConfirmModal
          isOpen={Boolean(refundTarget)}
          title="Estornar Pagamento"
          description={`Deseja processar o estorno no valor de ${formatPrice(refundTarget.amount)} para ${refundTarget.advertiser_profiles?.stage_name || 'o anunciante'}?`}
          confirmLabel="Confirmar Estorno"
          variant="ruby"
          requireReason={true}
          onClose={() => setRefundTarget(null)}
          onConfirm={handleConfirmRefund}
        />
      )}
    </AdminLayout>
  );
}
