'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/payments/orderService';
import { CanonicalOrder } from '@/services/payments/types';
import { ReceiptModal } from '@/components/billing/ReceiptModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileText, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function CheckoutStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  const orderId = params.orderId as string;
  const [order, setOrder] = useState<CanonicalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !profile) {
      router.push(`/login?redirect=/checkout/${orderId}/status`);
      return;
    }

    async function loadOrderStatus() {
      setLoading(true);
      const data = await orderService.getOrder(orderId, profile!.id);
      setOrder(data);
      setLoading(false);
    }

    loadOrderStatus();
  }, [isLoading, user, profile, orderId, router]);

  if (loading || !order) {
    return (
      <div style={{ maxWidth: '640px', margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
        <Card variant="glass" padding="lg">
          <Skeleton width="100%" height="80px" style={{ marginBottom: '1rem' }} />
          <Skeleton width="60%" height="24px" style={{ margin: '0 auto' }} />
        </Card>
      </div>
    );
  }

  const isPaid = order.status === 'fulfilled' || order.payment_status === 'paid';
  const isPending = order.status === 'pending' || order.status === 'pending_payment' || order.payment_status === 'pending' || order.payment_status === 'processing';
  const isFailed = order.status === 'cancelled' || order.status === 'expired' || order.payment_status === 'failed' || order.payment_status === 'expired';

  const snapshot = order.commercial_snapshot;

  return (
    <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '1rem' }}>
      <Card variant="glass" padding="lg" style={{ textAlign: 'center' }}>
        {/* Status Graphic & Badge */}
        {isPaid ? (
          <div>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(52, 199, 89, 0.15)', border: '2px solid var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <CheckCircle2 size={40} color="var(--color-success)" />
            </div>
            <Badge variant="success" style={{ marginBottom: '0.75rem' }}>
              PAGAMENTO CONFIRMADO
            </Badge>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
              Seus Benefícios Estão Ativos!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              O pedido <strong style={{ color: '#fff' }}>{order.order_number}</strong> para o plano/produto <strong style={{ color: 'var(--accent-gold)' }}>{snapshot.product_name}</strong> foi processado e seus acessos já estão liberados.
            </p>
          </div>
        ) : isPending ? (
          <div>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(229, 185, 92, 0.15)', border: '2px solid var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <Clock size={40} color="var(--accent-gold)" />
            </div>
            <Badge variant="gold" style={{ marginBottom: '0.75rem' }}>
              AGUARDANDO CONFIRMAÇÃO
            </Badge>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
              Aguardando Liquidação
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Estamos aguardando o retorno da compensação pelo PSP. Assim que o pagamento for detectado, seus benefícios serão ativados automaticamente.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255, 69, 58, 0.15)', border: '2px solid var(--color-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <XCircle size={40} color="var(--color-error)" />
            </div>
            <Badge variant="ruby" style={{ marginBottom: '0.75rem' }}>
              PAGAMENTO NÃO CONCLUÍDO
            </Badge>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
              Não foi possível concluir o pedido
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              O pedido expirou ou a tentativa de pagamento foi recusada. Nenhuma cobrança foi efetuada no seu cartão ou conta bancária.
            </p>
          </div>
        )}

        {/* Order Details Mini-Card */}
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border-subtle)', textAlign: 'left', marginBottom: '1.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Número do Pedido:</span>
            <strong style={{ fontFamily: 'monospace' }}>{order.order_number}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Produto:</span>
            <span>{snapshot.product_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Período / Duração:</span>
            <span>{snapshot.billing_period || `${snapshot.duration_days} dias`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 700 }}>
            <span>Valor Total:</span>
            <span style={{ color: 'var(--accent-gold)' }}>
              {((order.total_minor || order.total_amount || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isPaid && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FileText size={16} />}
              onClick={() => setShowReceipt(true)}
            >
              Visualizar Comprovante do Pedido
            </Button>
          )}

          {order.product_type === 'advertiser_subscription' || order.product_type === 'boost' ? (
            <Link href="/advertiser/subscription" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" style={{ width: '100%' }} rightIcon={<ArrowRight size={16} />}>
                Ir para o Painel de Anunciante
              </Button>
            </Link>
          ) : (
            <Link href="/account" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" style={{ width: '100%' }} rightIcon={<ArrowRight size={16} />}>
                Ir para Minha Conta
              </Button>
            </Link>
          )}

          {isFailed && (
            <Link href="/plans" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md" style={{ width: '100%' }}>
                Tentar Novamente
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={order}
      />
    </div>
  );
}
