'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WifiOff, RotateCcw, Home } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <Card variant="glass" padding="lg" style={{ maxWidth: '520px', margin: '0 auto', padding: '4rem 2rem' }}>
        <WifiOff size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.75rem' }}>Você está sem conexão</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
          Não foi possível carregar a página solicitada. Verifique sua conexão de rede e tente novamente.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Button variant="primary" onClick={handleRetry} leftIcon={<RotateCcw size={16} />}>
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
