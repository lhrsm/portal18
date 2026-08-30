import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Definir Nova Senha | Portal18',
  description: 'Defina uma nova senha para sua conta no Portal18.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>Nova Senha</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Crie uma senha forte para proteger sua conta e anúncios
          </p>
        </div>

        <Card variant="glass" padding="lg">
          <Suspense fallback={<div>Carregando formulário...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
