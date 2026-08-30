import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Recuperar Senha | Portal18',
  description: 'Recupere o acesso à sua conta no Portal18.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>Recuperar Senha</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Digite o e-mail cadastrado para receber um link de redefinição seguro
          </p>
        </div>

        <Card variant="glass" padding="lg">
          <Suspense fallback={<div>Carregando formulário...</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
