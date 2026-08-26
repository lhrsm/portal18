import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Sparkles, UserCheck, Database, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  const architecturalPillars = [
    {
      icon: <Database size={24} color="var(--accent-gold)" />,
      title: 'Supabase PostgreSQL + RLS',
      desc: '11 tabelas com Row Level Security ativo, Deny-by-default e isolamento total entre usuários.',
    },
    {
      icon: <ShieldCheck size={24} color="var(--color-success)" />,
      title: 'Proteção Anti-Escalação',
      desc: 'Triggers em banco bloqueiam qualquer tentativa de auto-promoção para admin ou aprovação de mídia.',
    },
    {
      icon: <Lock size={24} color="var(--accent-ruby)" />,
      title: 'Storage Tripartite',
      desc: 'Buckets dedicados para avatares públicos, mídias aprovadas e documentos 100% privados com URLs não públicas.',
    },
    {
      icon: <UserCheck size={24} color="var(--accent-cyan)" />,
      title: 'Regra de Maioridade 18+',
      desc: 'Restrição de idade no banco (INTERVAL 18 years) e validação no cadastro com termos de consentimento.',
    },
  ];

  const quickRoutes = [
    { name: 'Área do Usuário', path: '/account', badge: 'Autenticado' },
    { name: 'Perfil do Usuário', path: '/account/profile', badge: 'Autenticado' },
    { name: 'Segurança & Senha', path: '/account/security', badge: 'Autenticado' },
    { name: 'Painel do Anunciante', path: '/advertiser', badge: 'Advertiser / Admin' },
    { name: 'Perfil do Anúncio', path: '/advertiser/profile', badge: 'Advertiser / Admin' },
    { name: 'Painel Administrativo', path: '/admin', badge: 'Admin / Super Admin' },
  ];

  return (
    <div style={{ padding: '3.5rem 0' }}>
      <div className="container">
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto 4rem auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Badge variant="ruby">PORTAL NACIONAL 18+</Badge>
            <Badge variant="gold">FASE 1: FUNDAÇÃO TÉCNICA</Badge>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '1.5rem',
            }}
          >
            A Infraestrutura Mais Segura para{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, #ff5277 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Anúncios Adultos Independentes
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
            }}
          >
            Arquitetura em <strong>Next.js (App Router)</strong>, <strong>TypeScript</strong> e <strong>Supabase</strong>{' '}
            preparada para alta performance, conformidade jurídica 18+, SEO nacional e proteção máxima de dados.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
            <Link href="/register">
              <Button variant="primary" size="lg" leftIcon={<Sparkles size={20} />}>
                Criar Conta 18+
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" rightIcon={<ArrowRight size={18} />}>
                Acessar Portal
              </Button>
            </Link>
            <Link href="/advertiser">
              <Button variant="ruby" size="lg">
                Área do Anunciante
              </Button>
            </Link>
          </div>
        </div>

        {/* Security & Architecture Pillars */}
        <div style={{ marginBottom: '4.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>Fundação Técnica & Blindagem de Segurança</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Módulos essenciais já construídos e integrados ao banco de dados oficial</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {architecturalPillars.map((item, idx) => (
              <Card key={idx} variant="glass" padding="lg">
                <div style={{ marginBottom: '1.25rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Route Index & Status Table */}
        <div style={{ marginBottom: '4rem' }}>
          <Card variant="elevated" padding="lg">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={22} color="var(--accent-gold)" /> Rotas & Route Guards Implementados
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Acesso seguro controlado via Next.js Middleware e validado por RLS
                </p>
              </div>
              <Badge variant="success">Fase 1 Pronta</Badge>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
              }}
            >
              {quickRoutes.map((route, i) => (
                <Link key={i} href={route.path}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{route.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{route.path}</div>
                    </div>
                    <Badge variant="neutral">{route.badge}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Requirements Checklist Card */}
        <div>
          <Card variant="glass" padding="lg">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Critérios Técnicos da Fase 1</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {[
                'Next.js 14/15 App Router com SSR/SEO',
                'TypeScript estrito sem uso de `any`',
                'Supabase PostgreSQL Oficial como único backend',
                '11 Tabelas de domínio com migrations versionadas',
                'Row Level Security (RLS) Deny-by-default ativo',
                'Storage Tripartite (avatars, media, private)',
                'Route Guards via Middleware & Cookies SSR',
                'Design System Vanilla CSS com 16 componentes UI',
                'Controle de Maioridade 18+ e Aceite de Termos',
                'Suite de Testes de Segurança A-G Pronta',
              ].map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={18} color="var(--color-success)" />
                  <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
