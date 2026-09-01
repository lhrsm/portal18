'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { financialOpsService } from '@/services/payments/financialOpsService';
import { orderService } from '@/services/payments/orderService';
import {
  PaymentRefund,
  PaymentDispute,
  CanonicalOrder,
  RefundPolicy,
  DisputeReasonCategory,
  DisputeLifecycleStatus
} from '@/services/payments/types';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  RotateCcw,
  AlertTriangle,
  Scale,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  Search
} from 'lucide-react';

export default function AdminFinancialDisputesPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'refunds' | 'disputes' | 'exports'>('refunds');
  const [refunds, setRefunds] = useState<PaymentRefund[]>([]);
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  const [orders, setOrders] = useState<CanonicalOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // New Refund Modal state
  const [showNewRefundModal, setShowNewRefundModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [refundAmountBRL, setRefundAmountBRL] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundPolicy, setRefundPolicy] = useState<RefundPolicy>('NO_ENTITLEMENT_CHANGE');
  const [processingRefund, setProcessingRefund] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [refundsData, disputesData, ordersData] = await Promise.all([
      financialOpsService.getAllRefunds(),
      financialOpsService.getDisputesQueue(),
      orderService.getAdminOrders(),
    ]);
    setRefunds(refundsData);
    setDisputes(disputesData);
    setOrders(ordersData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !refundAmountBRL || !profile) return;
    setProcessingRefund(true);

    const amountCents = Math.round(parseFloat(refundAmountBRL.replace(',', '.')) * 100);

    const res = await financialOpsService.processRefund({
      orderId: selectedOrderId,
      amountCents,
      reason: refundReason,
      entitlementPolicy: refundPolicy,
      requestedBy: profile.id,
      idempotencyKey: `adm_ref_${selectedOrderId}_${amountCents}_${Date.now()}`,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Estorno Processado com Sucesso',
        message: `Estorno ${res.refundType === 'full' ? 'total' : 'parcial'} registrado no livro-razão imutável.`,
      });
      setShowNewRefundModal(false);
      setSelectedOrderId('');
      setRefundAmountBRL('');
      setRefundReason('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Falha no Estorno',
        message: res.error || 'Erro ao processar o estorno.',
      });
    }
    setProcessingRefund(false);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csv = await financialOpsService.exportFinancialLedgerCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `portal18_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast({
        type: 'success',
        title: 'Exportação Concluída',
        message: 'Arquivo CSV gerado sem dados sensíveis de pagamento.',
      });
    } finally {
      setExporting(false);
    }
  };

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Disputas, Estornos & Livro-Razão Financeiro
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Gestão de estornos parciais/totais, chargebacks e exportação contábil
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowNewRefundModal(true)}
          >
            Novo Estorno
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExportCSV}
            isLoading={exporting}
          >
            Exportar CSV Contábil
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Button
          variant={activeTab === 'refunds' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('refunds')}
        >
          Estornos (Refunds) ({refunds.length})
        </Button>
        <Button
          variant={activeTab === 'disputes' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('disputes')}
        >
          Disputas & Chargebacks ({disputes.length})
        </Button>
        <Button
          variant={activeTab === 'exports' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('exports')}
        >
          Exportações Contábeis
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'refunds' && (
        <Card variant="glass" padding="none">
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
              <Skeleton width="100%" height="40px" />
            </div>
          ) : refunds.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <RotateCcw size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum estorno registrado
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Todos os pedidos pagos permanecem com saldo integral.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>ID Estorno</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Pedido</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Tipo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Valor Estornado</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Política Entitlement</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Motivo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {r.provider_refund_id || r.id.substring(0, 8)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>
                        {r.order_id?.substring(0, 8) || 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={r.refund_type === 'full' ? 'ruby' : 'gold'}>
                          {r.refund_type === 'full' ? 'TOTAL' : 'PARCIAL'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--accent-ruby)' }}>
                        {formatBRL(r.amount_cents)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                        {r.entitlement_policy}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                        {r.reason || 'Sem motivo registrado'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'disputes' && (
        <Card variant="glass" padding="none">
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
              <Skeleton width="100%" height="40px" />
            </div>
          ) : disputes.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Scale size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhuma disputa ou chargeback aberta
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                A plataforma opera sem contestações financeiras ativas.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Provedor</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Ref. Disputa</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Valor</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Categoria</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status Disputa</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Retenção Financeira</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{d.provider_code}</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>{d.provider_dispute_id}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        {formatBRL(d.amount_cents)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize' }}>{d.reason_category}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={d.dispute_status === 'won' ? 'success' : d.dispute_status === 'lost' ? 'ruby' : 'gold'}>
                          {d.dispute_status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={d.financial_hold ? 'ruby' : 'neutral'}>
                          {d.financial_hold ? 'RETENÇÃO ATIVA' : 'LIBERADO'}
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

      {activeTab === 'exports' && (
        <Card variant="glass" padding="lg">
          <div style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Exportação para Conciliação Contábil & Fiscal
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Gera relatório em formato CSV de todas as ordens, liquidações e estornos registrados na plataforma. Por estrito cumprimento da LGPD e normas PCI-DSS, dados de pagamento sensíveis (PAN, CVV, senhas e biometria) são permanentemente omitidos da exportação.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Download size={16} />}
              onClick={handleExportCSV}
              isLoading={exporting}
            >
              Baixar CSV Consolidado
            </Button>
          </div>
        </Card>
      )}

      {/* New Refund Modal */}
      {showNewRefundModal && (
        <Modal
          isOpen={showNewRefundModal}
          onClose={() => setShowNewRefundModal(false)}
          title="Emitir Estorno Financeiro (Refund)"
          maxWidth="560px"
        >
          <form onSubmit={handleProcessRefund}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Selecione o Pedido
                </label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="input"
                  style={{ width: '100%', background: 'var(--bg-input)' }}
                >
                  <option value="">Selecione um pedido pago...</option>
                  {orders
                    .filter((o) => o.status === 'fulfilled' || o.payment_status === 'paid')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} — {o.commercial_snapshot.product_name} ({formatBRL(o.total_minor || 0)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Valor do Estorno (R$)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 50,00"
                  value={refundAmountBRL}
                  onChange={(e) => setRefundAmountBRL(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Política de Impacto no Entitlement
                </label>
                <select
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value as RefundPolicy)}
                  className="input"
                  style={{ width: '100%', background: 'var(--bg-input)' }}
                >
                  <option value="NO_ENTITLEMENT_CHANGE">Manter Benefícios / Cortesia Comercial (NO_ENTITLEMENT_CHANGE)</option>
                  <option value="REVOKE_REMAINING_PERIOD">Revogar Acesso Imediatamente (REVOKE_REMAINING_PERIOD)</option>
                  <option value="END_AT_PERIOD">Manter até o Fim do Ciclo (END_AT_PERIOD)</option>
                  <option value="MANUAL_REVIEW">Aguardar Revisão Manual (MANUAL_REVIEW)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Motivo / Justificativa
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="input"
                  placeholder="Informe a justificativa do estorno para fins de auditoria..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewRefundModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="ruby" size="sm" leftIcon={<RotateCcw size={14} />} isLoading={processingRefund}>
                Processar Estorno
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
