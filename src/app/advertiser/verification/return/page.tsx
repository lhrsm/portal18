'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function VerificationReturnPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem 6rem 1rem', maxWidth: '640px', textAlign: 'center' }}>
      <Card variant="glass" padding="lg" style={{ padding: '3.5rem 2rem' }}>
        <RefreshCw size={54} color="var(--accent-gold)" className="spin" style={{ margin: '0 auto 1.25rem auto' }} />

        <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
          <Badge variant="gold">Processando Confirmação</Badge>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Recebemos seu processo de verificação!
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Estamos validando os dados com o provedor de identidade via comunicação segura. O resultado oficial será atualizado no seu painel assim que a checagem for finalizada.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '300px', margin: '0 auto' }}>
          <Link href="/advertiser/verification">
            <Button variant="primary" size="md" fullWidth rightIcon={<ArrowRight size={16} />}>
              Acompanhar Status
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
