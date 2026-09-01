'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/payments/orderService';
import { CanonicalOrder } from '@/services/payments/types';
import { ReceiptModal } from '@/components/billing/ReceiptModal';
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
  Calendar
} from 'lucide-react';

export default function ConsumerBillingPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<CanonicalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<CanonicalOrder | null>(null);

  const loadConsumerOrders = async () => {
    if (!profile) return;
    setLoading(true);
    const data = await orderService.getUserOrderHistory(profile.id);
    setOrders(data.filter((o) => o.product_type === 'consumer_subscription'));
    setLoading(false);
  };

  useEffect(() => {
    loadConsumerOrders();
  }, [profile]);

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

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
    </div>
  );
}
