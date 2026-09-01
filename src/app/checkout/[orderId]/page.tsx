'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/payments/orderService';
import { CanonicalOrder, InitiatePaymentResult } from '@/services/payments/types';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { PixPaymentPanel } from '@/components/checkout/PixPaymentPanel';
import { CardPaymentPanel } from '@/components/checkout/CardPaymentPanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { QrCode, CreditCard, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default function OrderCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const { showToast } = useToast();

  const orderId = params.orderId as string;
  const [order, setOrder] = useState<CanonicalOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'credit_card'>('pix');
  const [paymentResult, setPaymentResult] = useState<InitiatePaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !profile) {
      router.push(`/login?redirect=/checkout/${orderId}`);
      return;
    }

    async function loadOrder() {
      setLoading(true);
      const data = await orderService.getOrder(orderId, profile!.id);
      if (!data) {
        showToast({
          type: 'error',
          title: 'Pedido Não Encontrado',
          message: 'Você não possui permissão para acessar este pedido ou ele expirou.',
        });
        router.push('/plans');
        return;
      }

      if (data.status === 'fulfilled' || data.payment_status === 'paid') {
        router.push(`/checkout/${orderId}/status`);
        return;
      }

      setOrder(data);
      // Initiate payment for default method (PIX)
      await handleSelectMethod('pix', data);
      setLoading(false);
    }

    loadOrder();
  }, [isLoading, user, profile, orderId, router, showToast]);

  const handleSelectMethod = async (method: 'pix' | 'credit_card', currentOrder?: CanonicalOrder) => {
    setSelectedMethod(method);
    const targetOrder = currentOrder || order;
    if (!targetOrder) return;

    setInitiating(true);
    const res = await orderService.initiatePayment({
      orderId: targetOrder.id,
      paymentMethod: method,
    });
    setPaymentResult(res);
    setInitiating(false);
  };

  if (loading || !order) {
    return (
      <div style={{ maxWidth: '1100px', margin: '3rem auto', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div>
            <Skeleton width="100%" height="60px" style={{ marginBottom: '1rem' }} />
            <Skeleton width="100%" height="320px" />
          </div>
          <div>
            <Skeleton width="100%" height="280px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <Lock size={14} color="var(--accent-gold)" />
          <span>Checkout Seguro SSL 256-bit</span>
        </div>
      </div>

      {/* Main 2-Column Checkout Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(300px, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Payment Methods & Panels */}
        <div>
          {/* Method Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => handleSelectMethod('pix')}
              style={{
                background: selectedMethod === 'pix' ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-card)',
                border: selectedMethod === 'pix' ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                color: selectedMethod === 'pix' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              <QrCode size={24} color={selectedMethod === 'pix' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>PIX Instantâneo</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aprovação em segundos</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectMethod('credit_card')}
              style={{
                background: selectedMethod === 'credit_card' ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-card)',
                border: selectedMethod === 'credit_card' ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                color: selectedMethod === 'credit_card' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
              }}
            >
              <CreditCard size={24} color={selectedMethod === 'credit_card' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Cartão de Crédito</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>À vista com 3DS</span>
              </div>
            </button>
          </div>

          {/* Active Payment Panel */}
          {selectedMethod === 'pix' ? (
            <PixPaymentPanel
              order={order}
              paymentResult={paymentResult}
              onRefresh={() => handleSelectMethod('pix')}
            />
          ) : (
            <CardPaymentPanel order={order} />
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div>
          <CheckoutSummary order={order} />
        </div>
      </div>
    </div>
  );
}
