'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { XCircle, ArrowRight } from 'lucide-react';

export default function PaymentCancelledPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem 6rem 1rem', maxWidth: '640px', textAlign: 'center' }}>
      <Card variant="glass" padding="lg" style={{ padding: '3.5rem 2rem' }}>
        <XCircle size={54} color="var(--accent-ruby)" style={{ margin: '0 auto 1.25rem auto' }} />

        <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
          <Badge variant="ruby">Checkout Cancelado</Badge>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          O pagamento não foi concluído
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          A operação de pagamento foi cancelada ou interrompida. Nenhuma cobrança foi efetuada no seu meio de pagamento.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px', margin: '0 auto' }}>
          <Link href="/plans">
            <Button variant="primary" size="md" fullWidth rightIcon={<ArrowRight size={16} />}>
              Ver Planos Novamente
            </Button>
          </Link>
          <Link href="/advertiser">
            <Button variant="ghost" size="sm" fullWidth>
              Voltar ao Painel
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
