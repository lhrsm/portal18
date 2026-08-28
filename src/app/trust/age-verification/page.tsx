'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  EyeOff, 
  FileText, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';

export default function TrustAgeVerificationPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem 6rem 1rem', maxWidth: '850px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold"><ShieldCheck size={13} /> TRUST CENTER</Badge>
          <Badge variant="ruby"><Lock size={13} /> ECA DIGITAL & LGPD</Badge>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Verificação de Maioridade com Privacidade Total
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto' }}>
          Conheça como o Portal18 assegura a proteção integral a menores sem armazenar seus dados biométricos ou documentos pessoais.
        </p>
      </div>

      {/* 3 Core Principles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3.5rem' }}>
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <EyeOff size={28} color="var(--accent-gold)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>Zero Biometria</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
            O Portal18 <u>nunca</u> armazena suas fotos, selfies, biometria facial, CPF ou documentos em nossos servidores.
          </p>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <ShieldCheck size={28} color="var(--color-success)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>Sinal Técnico Mínimo</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
            Recebemos exclusivamente a confirmação criptográfica (18+) emitida por provedores externos de verificação credenciados.
          </p>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <UserCheck size={28} color="var(--accent-ruby)" style={{ marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem' }}>Reutilização Inteligente</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
            Em acessos futuros, seu provedor pode reconhecer sua credencial válida sem exigir novos processos se ainda estiver vigente.
          </p>
        </Card>
      </div>

      {/* Explainer Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
        <Card variant="glass" padding="lg">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            1. Por que realizamos a verificação de idade?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, margin: 0 }}>
            O Portal18 é um ambiente publicitário exclusivo para adultos. Em conformidade com o Estatuto da Criança e do Adolescente (ECA Digital), termos constitucionais e melhores práticas internacionais de moderação, garantimos que o acesso a anúncios, fotos e contatos seja estritamente restrito a pessoas com 18 anos ou mais.
          </p>
        </Card>

        <Card variant="glass" padding="lg">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            2. Como funciona a verificação sem expor meus dados?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            Adotamos a arquitetura de <em>Privacidade por Design</em>:
          </p>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, paddingLeft: '1.25rem', margin: 0 }}>
            <li>Você é direcionado para um provedor externo credenciado e especializado em validação de identidade.</li>
            <li>O provedor processa a verificação com isolamento de dados.</li>
            <li>O Portal18 recebe apenas um token anônimo contendo o sinal de aprovação técnica.</li>
            <li>Sua sessão local é liberada sem qualquer vínculo a documentos reais.</li>
          </ul>
        </Card>

        <Card variant="glass" padding="lg">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            3. Como funciona a reutilização com Google no provedor?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, margin: 0 }}>
            Caso você já tenha verificado sua maioridade anteriormente junto ao provedor, ao selecionar a opção &ldquo;Já Sou Verificado&rdquo;, o provedor utiliza sua conta (como Google ou e-mail) para localizar sua credencial existente e liberar seu acesso instantaneamente, dispensando novas fotos enquanto sua credencial permanecer válida.
          </p>
        </Card>

        <Card variant="glass" padding="lg">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            4. Seus Direitos de Privacidade e Revogação (LGPD)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Você pode revogar ou limpar sua sessão de maioridade neste dispositivo a qualquer momento com apenas 1 clique:
          </p>
          <Link href="/age-verification">
            <Button variant="secondary" size="sm">
              Gerenciar Verificação Neste Dispositivo
            </Button>
          </Link>
        </Card>
      </div>

      {/* Bottom CTA */}
      <Card variant="premium" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pronto para validar sua idade com segurança?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
          O processo leva poucos segundos e garante acesso completo e contínuo ao portal.
        </p>
        <Link href="/age-verification">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            Iniciar Verificação de Idade
          </Button>
        </Link>
      </Card>
    </div>
  );
}
