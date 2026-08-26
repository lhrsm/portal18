import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Criar Conta 18+ | Portal Nacional 18+',
  description: 'Cadastre-se na plataforma nacional de anúncios para adultos.',
};

export default function RegisterPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Badge variant="ruby">18+ OBRIGATÓRIO</Badge>
            <Badge variant="neutral">CADASTRO GRATUITO</Badge>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Criar Nova Conta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Junte-se à maior comunidade de anunciantes e usuários independentes
          </p>
        </div>

        <Card variant="glass" padding="lg">
          <Suspense fallback={<div>Carregando formulário...</div>}>
            <RegisterForm />
          </Suspense>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <ShieldCheck size={14} color="var(--color-success)" />
          <span>Contas provisionadas exclusivamente como usuário básico</span>
        </div>
      </div>
    </div>
  );
}
