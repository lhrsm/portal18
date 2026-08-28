'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  Eye, 
  ArrowRight, 
  Check, 
  Lock, 
  UserCheck, 
  Zap,
  HelpCircle
} from 'lucide-react';

export default function SalvadorCommercialLandingPage() {
  const steps = [
    {
      num: '01',
      title: 'Cadastro Simples & Seguro',
      desc: 'Crie sua conta em 1 clique com Google ou E-mail com total sigilo.',
    },
    {
      num: '02',
      title: 'Monte seu Anúncio',
      desc: 'Escolha seu nome artístico, informe seus bairros de Salvador (ex: Barra, Pituba, Caminho das Árvores) e selecione suas melhores fotos.',
    },
    {
      num: '03',
      title: 'Validação 18+ Discreta',
      desc: 'Confirmação rápida da maioridade pela nossa moderação sem expor documentos.',
    },
    {
      num: '04',
      title: 'Publicação Imediata',
      desc: 'Seu perfil passa a ser exibido para milhares de pessoas que buscam acompanhantes em Salvador e região.',
    },
  ];

  const highlights = [
    {
      title: 'Máxima Discrição & LGPD',
      desc: 'Seus dados pessoais reais nunca são compartilhados ou tornados públicos.',
      icon: <Lock size={22} color="var(--accent-gold)" />,
    },
    {
      title: 'WhatsApp Direto',
      desc: 'Clientes entram em contato direto com você, sem taxas, comissões ou intermediários.',
      icon: <Phone size={22} color="var(--color-success)" />,
    },
    {
      title: 'Alta Visibilidade Local',
      desc: 'Destaque focado nas buscas de Salvador, Lauro de Freitas e Litoral Norte.',
      icon: <MapPin size={22} color="var(--accent-ruby)" />,
    },
    {
      title: 'Painel Profissional',
      desc: 'Acompanhe visualizações, cliques no WhatsApp e pause seu perfil com 1 clique quando quiser.',
      icon: <Zap size={22} color="var(--accent-gold)" />,
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1rem 6rem 1rem', maxWidth: '1000px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold"><Sparkles size={13} /> LANÇAMENTO REGIONAL</Badge>
          <Badge variant="ruby"><MapPin size={13} /> SALVADOR & REGIÃO METROPOLITANA</Badge>
        </div>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
          Anuncie seu Perfil com Elegância e Destaque em Salvador
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '750px', margin: '0 auto 2rem auto' }}>
          O Portal18 é a plataforma moderna, rápida e segura para acompanhantes profissionais anunciarem na capital baiana com total privacidade e autonomia.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/advertiser/start">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
              Criar meu Anúncio Gratuitamente
            </Button>
          </Link>
          <Link href="/plans">
            <Button variant="secondary" size="lg">
              Conhecer Planos e Recursos
            </Button>
          </Link>
        </div>
      </div>

      {/* Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '4rem' }}>
        {highlights.map((h, idx) => (
          <Card key={idx} variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <div style={{ marginBottom: '0.75rem' }}>{h.icon}</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>{h.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              {h.desc}
            </p>
          </Card>
        ))}
      </div>

      {/* 4 Steps Section */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Como Funciona o Anúncio no Portal18
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Processo ágil, seguro e 100% sob seu controle
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem' }}>
          {steps.map((s, idx) => (
            <Card key={idx} variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
                {s.num}
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.35rem' }}>{s.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                {s.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Neighborhood Coverage */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '4rem', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="var(--accent-gold)" /> Cobertura em Todos os Bairros de Salvador
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Seja encontrada por clientes que procuram especificamente na sua região de atendimento:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            'Barra',
            'Ondina',
            'Rio Vermelho',
            'Pituba',
            'Itaigara',
            'Caminho das Árvores',
            'Costa Azul',
            'Armação',
            'Imbuí',
            'Boca do Rio',
            'Patamares',
            'Stella Maris',
            'Itapuã',
            'Lauro de Freitas',
            'Vilas do Atlântico',
          ].map((bairro, idx) => (
            <span
              key={idx}
              style={{
                padding: '0.35rem 0.75rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {bairro}
            </span>
          ))}
        </div>
      </Card>

      {/* Bottom CTA */}
      <Card variant="premium" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 900, marginBottom: '0.75rem' }}>
          Pronta para ser destaque em Salvador?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Cadastre seu anúncio agora e faça parte da vitrine mais moderna e segura da Bahia.
        </p>
        <Link href="/advertiser/start">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            Começar Meu Cadastro Agora
          </Button>
        </Link>
      </Card>
    </div>
  );
}
