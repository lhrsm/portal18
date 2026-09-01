'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { billingRecoveryService } from '@/services/payments/billingRecoveryService';
import { BillingCycle, PaymentFailureCategory } from '@/services/payments/types';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Layers,
  ShieldCheck,
  Scale
} from 'lucide-react';

export default function AdminBillingRecoveryPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [runningTick, setRunningTick] = useState(false);

  const loadRecoveryQueue = async () => {
    setLoading(true);
    const data = await billingRecoveryService.getAdminRecoveryQueue(statusFilter);
    setCycles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRecoveryQueue();
  }, [statusFilter]);

  const handleManualRetry = async (cycleId: string) => {
    setRetryingId(cycleId);
    try {
      const res = await billingRecoveryService.triggerRenewalAttempt(cycleId);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Tentativa de Cobrança Liquidada',
          message: 'O ciclo foi pago e a assinatura foi estendida com sucesso.',
        });
        await loadRecoveryQueue();
      } else {
        showToast({
          type: 'error',
          title: 'Tentativa Não Concluída',
          message: res.error || `Falha registrada: ${res.failureCategory}`,
        });
        await loadRecoveryQueue();
      }
    } finally {
      setRetryingId(null);
    }
  };

  const handleSimulateFailure = async (cycleId: string, category: PaymentFailureCategory) => {
    setRetryingId(cycleId);
    try {
      const res = await billingRecoveryService.triggerRenewalAttempt(cycleId, category);
      showToast({
        type: 'info',
        title: 'Falha Simulada Registrada',
        message: `Ciclo transitou para status: ${res.status.toUpperCase()} (${category}).`,
      });
      await loadRecoveryQueue();
    } finally {
      setRetryingId(null);
    }
  };

  const handleRunScheduler = async () => {
    setRunningTick(true);
    try {
      const res = await billingRecoveryService.runSchedulerTick();
      showToast({
        type: 'success',
        title: 'Scheduler Executado',
        message: `${res.cyclesDue} ciclos processados, ${res.graceExpired} carências expiradas.`,
      });
      await loadRecoveryQueue();
    } finally {
      setRunningTick(false);
    }
  };

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const graceCount = cycles.filter((c) => c.status === 'grace_period').length;
  const reconcilCount = cycles.filter((c) => c.status === 'requires_reconciliation').length;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Recuperação de Cobrança & Dunning
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Gerenciamento de ciclos vencidos, retries de renovação e períodos de tolerância
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={handleRunScheduler}
            isLoading={runningTick}
          >
            Executar Scheduler Tick
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Em Período de Tolerância</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>{graceCount}</div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Aguardando Reconciliação</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{reconcilCount}</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'all', label: 'Fila Ativa' },
          { id: 'grace_period', label: 'Em Tolerância (Grace)' },
          { id: 'requires_reconciliation', label: 'Reconciliação Pendente' },
          { id: 'failed', label: 'Falhas Finais' },
          { id: 'paid', label: 'Recuperados' },
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

      {/* Cycles Queue Table */}
      <Card variant="glass" padding="none">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width="100%" height="40px" />
          </div>
        ) : cycles.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Fila de recuperação limpa
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Nenhum ciclo pendente de regularização no momento.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Ciclo #</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Valor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Falha / Motivo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Retries</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {c.subscription_type}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>Ciclo {c.cycle_number}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {formatBRL(c.amount_minor)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={c.status === 'paid' ? 'success' : c.status === 'grace_period' ? 'ruby' : 'gold'}>
                        {c.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {c.failure_category || 'Nenhuma'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{c.retry_count} / 3</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {c.status !== 'paid' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleManualRetry(c.id)}
                            isLoading={retryingId === c.id}
                          >
                            Retry Seguro
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedCycle(c)}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cycle Detail Modal */}
      {selectedCycle && (
        <Modal
          isOpen={!!selectedCycle}
          onClose={() => setSelectedCycle(null)}
          title={`Detalhes do Ciclo de Cobrança #${selectedCycle.cycle_number}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Assinatura:</span> {selectedCycle.subscription_id}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Tipo:</span> {selectedCycle.subscription_type}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Início:</span> {new Date(selectedCycle.period_start).toLocaleDateString('pt-BR')}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Término:</span> {new Date(selectedCycle.period_end).toLocaleDateString('pt-BR')}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Fim do Grace:</span> {selectedCycle.grace_ends_at ? new Date(selectedCycle.grace_ends_at).toLocaleString('pt-BR') : 'N/A'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Tentativas:</span> {selectedCycle.retry_count}</div>
              </div>
            </div>

            {/* Test Simulation Buttons */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', display: 'block', marginBottom: '0.5rem' }}>
                Simulação de Cenários de Teste (Driver Interno):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSimulateFailure(selectedCycle.id, 'card_declined')}
                >
                  Simular Cartão Recusado
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSimulateFailure(selectedCycle.id, 'insufficient_funds')}
                >
                  Simular Saldo Insuficiente
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSimulateFailure(selectedCycle.id, 'expired_card')}
                >
                  Simular Cartão Expirado
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSimulateFailure(selectedCycle.id, 'timeout')}
                >
                  Simular Timeout / Reconciliação
                </Button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelectedCycle(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
