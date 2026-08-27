'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
      <Card variant="glass" padding="lg" style={{ maxWidth: '520px', margin: '0 auto', padding: '4rem 2rem' }}>
        <Compass size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Página Não Encontrada</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
          O endereço que você tentou acessar não existe, foi removido ou não está mais disponível publicamente.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/">
            <Button variant="primary" leftIcon={<Home size={16} />}>
              Página Inicial
            </Button>
          </Link>
          <Link href="/explorar">
            <Button variant="secondary" leftIcon={<Search size={16} />}>
              Explorar Perfis
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
