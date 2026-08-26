'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TrustMinorsPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/trust" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Trust Center
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="ruby">TOLERÂNCIA ZERO</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Proteção de Menores e Maioridade Estrita 18+
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          O Portal Nacional adota uma política inflexível de tolerância zero contra qualquer forma de exploração, abuso ou presença de menores de 18 anos.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        <Card variant="glass" padding="md" style={{ borderLeft: '3px solid var(--accent-ruby)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Verificação Obrigatória de Maioridade Civil</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Nenhum anúncio é publicado sem a conclusão e aprovação de verificação de identidade com documento oficial com foto e prova de vida facial (liveness test).
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Age Gate e Bloqueio de Acesso</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Todas as páginas da plataforma exigem confirmação explícita de maioridade legal antes de liberar o catálogo, operando em conformidade com o Estatuto da Criança e do Adolescente (ECA) e a legislação federal brasileira.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Cooperação com Autoridades Policiais e Judiciais</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Qualquer tentativa de inclusão de menores de idade resulta no bloqueio imediato da conta, preservação probatória dos logs e comunicação direta com as autoridades competentes.
          </p>
        </Card>
      </div>

      <Card variant="elevated" padding="lg" style={{ border: '1px solid var(--accent-ruby)', textAlign: 'center' }}>
        <ShieldAlert size={36} color="var(--accent-ruby)" style={{ margin: '0 auto 0.75rem auto' }} />
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Suspeita de Menor de Idade?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
          Denuncie imediatamente. Nossa equipe tratará o chamado em regime de prioridade crítica instantânea.
        </p>
        <Link href="/trust/content-removal">
          <Button variant="ruby" size="lg">Acionar Canal de Urgência</Button>
        </Link>
      </Card>
    </div>
  );
}
