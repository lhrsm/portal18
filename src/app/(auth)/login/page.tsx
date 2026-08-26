import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Entrar na Conta | Portal Nacional 18+',
  description: 'Acesse seu painel seguro do portal adulto.',
};

export default function LoginPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <Badge variant="gold">ACESSO SEGURO</Badge>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Entrar no Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Informe suas credenciais para gerenciar seus anúncios e preferências
          </p>
        </div>

        <Card variant="glass" padding="lg">
          <Suspense fallback={<div>Carregando formulário...</div>}>
            <LoginForm />
          </Suspense>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <Lock size={14} />
          <span>Sessão protegida por tokens criptografados e SSL</span>
        </div>
      </div>
    </div>
  );
}
