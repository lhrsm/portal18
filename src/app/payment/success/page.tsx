'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div className="container" style={{ padding: '4rem 1rem 6rem 1rem', maxWidth: '640px', textAlign: 'center' }}>
      <Card variant="glass" padding="lg" style={{ padding: '3.5rem 2rem' }}>
        <RefreshCw size={54} color="var(--accent-gold)" className="spin" style={{ margin: '0 auto 1.25rem auto' }} />

        <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
          <Badge variant="gold">Processando Confirmação</Badge>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Estamos confirmando seu pagamento
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {orderNumber ? (
            <span>Pedido <strong>{orderNumber}</strong> recebido. </span>
          ) : null}
          A confirmação financeira é processada de forma assíncrona pelo provedor. Seus benefícios e campanhas serão ativados automaticamente assim que a transação for concluída.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px', margin: '0 auto' }}>
          <Link href="/advertiser/subscription">
            <Button variant="primary" size="md" fullWidth rightIcon={<ArrowRight size={16} />}>
              Acessar Minha Assinatura
            </Button>
          </Link>
          <Link href="/advertiser">
            <Button variant="ghost" size="sm" fullWidth>
              Ir para o Painel Geral
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
