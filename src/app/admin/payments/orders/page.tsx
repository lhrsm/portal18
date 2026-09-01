'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { orderService } from '@/services/payments/orderService';
import { CanonicalOrder } from '@/services/payments/types';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  ShoppingBag,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AdminOrdersPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<CanonicalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<CanonicalOrder | null>(null);

  // Refund Modal
  const [refundOrder, setRefundOrder] = useState<CanonicalOrder | null>(null);
  const [refunding, setRefunding] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    const data = await orderService.getAdminOrders({
      status: statusFilter || undefined,
      productType: typeFilter || undefined,
      search: search || undefined,
    });
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleConfirmRefund = async (reason: string) => {
    if (!refundOrder || !profile) return;
    setRefunding(true);
    const res = await orderService.adminRefundOrder(refundOrder.id, reason, profile.id);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Estorno Executado',
        message: `O pedido ${refundOrder.order_number} foi estornado com sucesso.`,
      });
      setRefundOrder(null);
      setSelectedOrder(null);
      await loadOrders();
    } else {
      showToast({
        type: 'error',
        title: 'Erro no Estorno',
        message: res.error || 'Falha ao processar estorno.',
      });
    }
    setRefunding(false);
  };

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Gerenciamento de Pedidos (Orders)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Livro-razão canônico de pedidos, snapshots comerciais e operações de estorno
          </p>
        </div>
        <Badge variant="gold">{orders.length} pedidos encontrados</Badge>
      </div>

      {/* Search & Filters */}
      <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por número do pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select"
          >
            <option value="">Todos os Status</option>
            <option value="paid">Pagos (Paid)</option>
            <option value="pending">Pendentes</option>
            <option value="refunded">Estornados</option>
            <option value="failed">Falhos</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="select"
          >
            <option value="">Todos os Produtos</option>
            <option value="advertiser_subscription">Assinatura Anunciante</option>
            <option value="consumer_subscription">Consumer Premium</option>
            <option value="boost">Boost / Impulsionamento</option>
          </select>

          <Button type="submit" variant="secondary" size="md">
            Filtrar
          </Button>
        </form>
      </Card>

      {/* Orders Table */}
      <Card variant="glass" padding="none">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width="100%" height="40px" />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <ShoppingBag size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Nenhum pedido encontrado com estes filtros.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Número</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Produto</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Valor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Método</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Data</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const isPaid = ord.status === 'fulfilled' || ord.payment_status === 'paid';
                  const snapshot = ord.commercial_snapshot;

                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                        {ord.order_number}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>{snapshot.product_name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.product_type}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                        {formatBRL(ord.total_minor || ord.total_amount || 0)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textTransform: 'uppercase' }}>
                        {ord.selected_payment_method || 'PIX'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={isPaid ? 'success' : ord.status === 'refunded' ? 'ruby' : 'gold'}>
                          {ord.payment_status?.toUpperCase() || ord.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {new Date(ord.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedOrder(ord)}
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Detalhes do Pedido ${selectedOrder.order_number}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem' }}>
            {/* Commercial Snapshot */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent-gold)' }}>
                Snapshot Comercial Imutável
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Item:</span> {selectedOrder.commercial_snapshot.product_name}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Período:</span> {selectedOrder.commercial_snapshot.billing_period} ({selectedOrder.commercial_snapshot.duration_days} dias)</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Subtotal:</span> {formatBRL(selectedOrder.commercial_snapshot.unit_price_minor)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Total:</span> {formatBRL(selectedOrder.commercial_snapshot.total_minor)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Política Pricing:</span> {selectedOrder.commercial_snapshot.pricing_policy_version}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Política Entitlement:</span> {selectedOrder.commercial_snapshot.entitlement_policy_version}</div>
              </div>
            </div>

            {/* Gateway Information */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                Execução & Gateway
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Provedor:</span> {selectedOrder.provider_code || 'internal_driver'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Ref. PSP:</span> {selectedOrder.provider_payment_reference || 'N/A'}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Status Pedido:</span> {selectedOrder.status}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Status Pagamento:</span> {selectedOrder.payment_status}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              {(selectedOrder.status === 'fulfilled' || selectedOrder.payment_status === 'paid') && (
                <Button
                  variant="ruby"
                  size="sm"
                  leftIcon={<RotateCcw size={14} />}
                  onClick={() => setRefundOrder(selectedOrder)}
                >
                  Processar Estorno (Refund)
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Action Refund Modal */}
      <ActionConfirmModal
        isOpen={!!refundOrder}
        onClose={() => setRefundOrder(null)}
        onConfirm={handleConfirmRefund}
        title="Confirmar Estorno de Pedido"
        description={`Deseja registrar o estorno total do pedido ${refundOrder?.order_number} no valor de ${formatBRL(refundOrder?.total_minor || 0)}? Esta ação registrará o evento no livro-razão financeiro.`}
        confirmLabel="Confirmar Estorno"
        variant="ruby"
      />
    </AdminLayout>
  );
}
