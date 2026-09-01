'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/payments/orderService';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';

function CheckoutRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isLoading } = useAuth();
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !profile) {
      const currentQuery = searchParams.toString();
      router.push(`/login?redirect=/checkout?${encodeURIComponent(currentQuery)}`);
      return;
    }

    const productType = (searchParams.get('product_type') || searchParams.get('type') || 'advertiser_subscription') as any;
    const productId = searchParams.get('product_id') || searchParams.get('plan_id');
    const periodId = searchParams.get('period_id') || searchParams.get('billing_period_id');
    const couponCode = searchParams.get('coupon') || undefined;

    if (!productId) {
      router.push('/plans');
      return;
    }

    async function initOrder() {
      setCreating(true);
      const res = await orderService.createOrder({
        profileId: profile!.id,
        productType,
        productId: productId!,
        billingPeriodId: periodId || undefined,
        couponCode,
        paymentMethod: 'pix',
      });

      if (res.success && res.orderId) {
        router.push(`/checkout/${res.orderId}`);
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao Iniciar Checkout',
          message: res.error || 'Não foi possível gerar a sessão de pagamento.',
        });
        router.push('/plans');
      }
    }

    initOrder();
  }, [isLoading, user, profile, searchParams, router, showToast]);

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
      <Card variant="glass" padding="lg">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--accent-gold)' }}>
          Preparando sua Sessão de Checkout
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Calculando valores com segurança e gerando o resumo do seu pedido...
        </p>
        <Skeleton width="100%" height="48px" style={{ marginBottom: '1rem' }} />
        <Skeleton width="80%" height="24px" style={{ margin: '0 auto' }} />
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '1rem', textAlign: 'center' }}>
        <Card variant="glass" padding="lg">
          <Skeleton width="100%" height="48px" />
        </Card>
      </div>
    }>
      <CheckoutRedirectContent />
    </Suspense>
  );
}
