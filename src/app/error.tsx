'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error without leaking sensitive context
    console.error('Handled application error:', error.message);
  }, [error]);

  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <Card variant="glass" padding="lg" style={{ maxWidth: '520px', margin: '0 auto', padding: '4rem 2rem' }}>
        <AlertTriangle size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>Ops! Algo deu errado</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Ocorreu uma instabilidade temporária ao carregar este conteúdo. Por favor, tente novamente.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => reset()} leftIcon={<RotateCcw size={16} />}>
            Tentar Novamente
          </Button>
          <Link href="/">
            <Button variant="secondary" leftIcon={<Home size={16} />}>
              Início
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
