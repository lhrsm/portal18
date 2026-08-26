'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Scale, Download, Trash2, CheckCircle2 } from 'lucide-react';

export default function TrustLgpdPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/trust" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Trust Center
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">CONFORMIDADE LEGAL</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Conheça seus direitos como titular de dados pessoais e os canais automáticos para exercê-los na plataforma.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3.5rem' }}>
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--accent-gold)' }}>Direitos Garantidos pela LGPD</h3>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.25rem', fontSize: '0.95rem' }}>
            <li><strong>Acesso e Confirmação:</strong> Saber quais dados pessoais tratamos sobre você.</li>
            <li><strong>Portabilidade (Exportação):</strong> Baixar um pacote estruturado em JSON com seu histórico completo e dados cadastrais.</li>
            <li><strong>Retificação:</strong> Corrigir dados incompletos, inexatos ou desatualizados diretamente no painel.</li>
            <li><strong>Anonimização e Exclusão:</strong> Solicitar o apagamento ou desvinculação definitiva de sua conta da plataforma.</li>
            <li><strong>Revogação de Consentimentos:</strong> Gerenciar a qualquer momento aceites de e-mails, cookies e personalização.</li>
          </ul>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <Card variant="glass" padding="md">
            <Download size={24} color="var(--accent-gold)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Exportar Meus Dados</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Gere um pacote assíncrono para download com validade segura de 7 dias.
            </p>
            <Link href="/account/privacy">
              <Button variant="secondary" size="sm">Solicitar Exportação</Button>
            </Link>
          </Card>

          <Card variant="glass" padding="md">
            <Trash2 size={24} color="var(--accent-ruby)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Excluir Minha Conta</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Agendamento de exclusão definitiva com período de tolerância de 7 dias.
            </p>
            <Link href="/account/privacy">
              <Button variant="ruby" size="sm">Gerenciar Exclusão</Button>
            </Link>
          </Card>
        </div>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Encarregado de Proteção de Dados (DPO)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Para dúvidas jurídicas ou requisições formais de autoridades e titulares, nosso canal oficial de comunicação é: <strong style={{ color: 'var(--text-primary)' }}>dpo@portalnacional18.com.br</strong>.
          </p>
        </Card>
      </div>
    </div>
  );
}
