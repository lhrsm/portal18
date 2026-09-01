'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { financeOpsService } from '@/services/finance/financeOpsService';
import { PaymentSettlement, FinancialPeriod } from '@/services/payments/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  DollarSign,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  FileCheck2,
  Scale,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AdminFinanceOverviewPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'periods' | 'settlements'>('periods');
  const [overview, setOverview] = useState<{
    grossMinor: number;
    refundsMinor: number;
    chargebacksMinor: number;
    feesMinor: number;
    netSettlementMinor: number;
    unresolvedDiscrepancies: number;
    activePeriodKey: string;
  } | null>(null);

  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [settlements, setSettlements] = useState<PaymentSettlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Close period modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingPeriodKey, setClosingPeriodKey] = useState('');
  const [closing, setClosing] = useState(false);

  // Reopen period modal
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenKey, setReopenKey] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const loadFinanceData = async () => {
    setLoading(true);
    const [ov, per, set] = await Promise.all([
      financeOpsService.getFinancialOverview(),
      financeOpsService.getFinancialPeriods(),
      financeOpsService.getSettlements(),
    ]);
    setOverview(ov);
    setPeriods(per);
    setSettlements(set);
    setClosingPeriodKey(ov.activePeriodKey);
    setLoading(false);
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleClosePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingPeriodKey || !profile) return;
    setClosing(true);
    const res = await financeOpsService.closePeriod(closingPeriodKey, profile.id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Período Contábil Encerrado',
        message: `O período ${closingPeriodKey} foi fechado com snapshot imutável.`,
      });
      setShowCloseModal(false);
      await loadFinanceData();
    } else {
      showToast({
        type: 'error',
        title: 'Fechamento Bloqueado',
        message: res.error || 'Não foi possível fechar o período.',
      });
    }
    setClosing(false);
  };

  const handleReopenPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenKey || !reopenReason || !profile) return;
    setReopening(true);
    const res = await financeOpsService.reopenPeriod(reopenKey, profile.id, reopenReason);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Período Reaberto',
        message: `O período ${reopenKey} foi reaberto para ajustes com auditoria.`,
      });
      setShowReopenModal(false);
      setReopenReason('');
      await loadFinanceData();
    } else {
      showToast({
        type: 'error',
        title: 'Falha ao Reabrir',
        message: res.error || 'Erro ao reabrir período.',
      });
    }
    setReopening(false);
  };

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Operações Financeiras & Fechamentos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Controle de liquidações, separação bruta/líquida e fechamento de períodos contábeis
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/finance/fiscal-readiness" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" leftIcon={<FileCheck2 size={14} />}>
              Prontidão Fiscal
            </Button>
          </Link>
          <Link href="/admin/finance/go-no-go" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" leftIcon={<ShieldAlert size={14} />}>
              Checklist Go/No-Go
            </Button>
          </Link>
          <Button variant="primary" size="sm" leftIcon={<Lock size={14} />} onClick={() => setShowCloseModal(true)}>
            Encerrar Período
          </Button>
        </div>
      </div>

      {/* Homologation Mode Banner */}
      <div style={{ background: 'rgba(229, 185, 92, 0.12)', border: '1px solid var(--accent-gold)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={22} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#fff' }}>Ambiente de Homologação Ativo:</strong> Todos os valores expressos abaixo refletem transações controladas no simulador interno. O Kill Switch permanece 100% ativo e zero cobranças reais foram emitidas.
        </div>
      </div>

      {/* Financial KPIs in Minor Units */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Receita Bruta (Homologação)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {formatBRL(overview?.grossMinor || 0)}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Estornos Processados</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>
            - {formatBRL(overview?.refundsMinor || 0)}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Perdas em Chargebacks</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>
            - {formatBRL(overview?.chargebacksMinor || 0)}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Liquidação Líquida Estimada</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {formatBRL(overview?.netSettlementMinor || 0)}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Button
          variant={activeTab === 'periods' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('periods')}
        >
          Períodos Contábeis ({periods.length})
        </Button>
        <Button
          variant={activeTab === 'settlements' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('settlements')}
        >
          Extrato de Liquidações (Settlements) ({settlements.length})
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'periods' && (
        <Card variant="glass" padding="none">
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
              <Skeleton width="100%" height="40px" />
            </div>
          ) : periods.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum período registrado
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                O período corrente ({overview?.activePeriodKey}) será inicializado ao executar o primeiro fechamento.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Mês / Período</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Bruto</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Estornos</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Líquido</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Fechado em</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{p.period_key}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                        {formatBRL(p.snapshot.gross_charges_minor || 0)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--accent-ruby)' }}>
                        {formatBRL(p.snapshot.refunds_minor || 0)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-success)', fontWeight: 700 }}>
                        {formatBRL(p.snapshot.net_settlement_minor || 0)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={p.status === 'closed' ? 'success' : p.status === 'open' ? 'gold' : 'ruby'}>
                          {p.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {p.closed_at ? new Date(p.closed_at).toLocaleDateString('pt-BR') : 'Aberto'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        {p.status === 'closed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RotateCcw size={12} />}
                            onClick={() => {
                              setReopenKey(p.period_key);
                              setShowReopenModal(true);
                            }}
                          >
                            Reabrir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'settlements' && (
        <Card variant="glass" padding="none">
          {settlements.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Layers size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum lote de liquidação registrado
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Os relatórios de liquidação bancária de adquirentes serão integrados após homologação formal.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Provedor</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Ref. Depósito</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Data</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Bruto</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Taxas</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Líquido</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{s.provider_code}</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>{s.settlement_reference}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{s.settlement_date}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{formatBRL(s.gross_minor)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--accent-ruby)' }}>- {formatBRL(s.fees_minor)}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatBRL(s.net_minor)}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={s.status === 'reconciled' ? 'success' : 'gold'}>
                          {s.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Close Period Modal */}
      {showCloseModal && (
        <Modal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          title="Encerrar Período Contábil"
          maxWidth="500px"
        >
          <form onSubmit={handleClosePeriod}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Identificador do Período (AAAA-MM)
                </label>
                <input
                  type="text"
                  required
                  value={closingPeriodKey}
                  onChange={(e) => setClosingPeriodKey(e.target.value)}
                  className="input"
                  placeholder="Ex: 2026-09"
                />
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Verificação de Segurança (P0):</strong>
                O fechamento calcula a consolidação de ordens, estornos e perdas. A operação será estritamente bloqueada se houver discrepâncias críticas ou altas não resolvidas na conciliação.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCloseModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Lock size={14} />} isLoading={closing}>
                Confirmar Fechamento
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reopen Period Modal */}
      {showReopenModal && (
        <Modal
          isOpen={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          title={`Reabrir Período Contábil ${reopenKey}`}
          maxWidth="500px"
        >
          <form onSubmit={handleReopenPeriod}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Justificativa Obrigatória para Auditoria
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="input"
                  placeholder="Informe o motivo da reabertura para registro na trilha de auditoria..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowReopenModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="ruby" size="sm" leftIcon={<RotateCcw size={14} />} isLoading={reopening}>
                Confirmar Reabertura
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
