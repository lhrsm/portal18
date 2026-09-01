'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Lock,
  FileText,
  ShieldAlert,
  UserCheck,
  Trash2,
  Scale,
  Eye,
  ArrowRight
} from 'lucide-react';

export default function TrustCenterHub() {
  const sections = [
    {
      title: 'Segurança da Plataforma',
      slug: 'security',
      icon: <ShieldCheck size={28} color="var(--accent-gold)" />,
      description: 'Criptografia em trânsito e repouso, isolamento por RLS, proteção contra ataques e monitoramento contínuo.',
    },
    {
      title: 'Privacidade e Zero-Tracking',
      slug: 'privacy',
      icon: <Lock size={28} color="var(--accent-gold)" />,
      description: 'Compromisso com o sigilo. Histórico privado, isolamento de favoritos e proteção de dados comportamentais.',
    },
    {
      title: 'LGPD e Direitos do Titular',
      slug: 'lgpd',
      icon: <Scale size={28} color="var(--accent-gold)" />,
      description: 'Exercício integral de direitos: acesso, portabilidade via exportação, retificação e exclusão definitiva de conta.',
    },
    {
      title: 'Proteção Estrita de Menores 18+',
      slug: 'minors',
      icon: <UserCheck size={28} color="var(--accent-ruby)" />,
      description: 'Tolerância zero contra menores. Verificação de identidade (KYC), Age Gate mandatório e canal de denúncia imediato.',
    },
    {
      title: 'Diretrizes de Moderação',
      slug: 'moderation',
      icon: <Eye size={28} color="var(--accent-gold)" />,
      description: 'Processo rigoroso de revisão prévia de mídias, sanitização de textos e prevenção contra abusos.',
    },
    {
      title: 'Remoção de Conteúdo e Violações',
      slug: 'content-removal',
      icon: <Trash2 size={28} color="var(--accent-ruby)" />,
      description: 'Canal rápido para solicitações de takedown por uso indevido de imagem, falsidade ideológica ou violação de direitos.',
    },
  ];

  return (
    <div className="container" style={{ padding: '3.5rem 1rem 5rem 1rem', maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold">TRUST & TRANSPARENCY CENTER</Badge>
        </div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Central de Confiança, Segurança e Legalidade
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          Conheça nossos padrões éticos, conformidade regulatória brasileira e compromisso inegociável com a segurança de usuários e anunciantes.
        </p>
      </div>

      {/* Sections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {sections.map((s) => (
          <Link key={s.slug} href={`/trust/${s.slug}`} style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="lg" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.2s' }}>
              <div>
                <div style={{ marginBottom: '1rem' }}>{s.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {s.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {s.description}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--accent-gold)', marginTop: '1.5rem', fontWeight: 600 }}>
                Acessar diretrizes <ArrowRight size={14} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Direct Report Callout */}
      <Card variant="elevated" padding="lg" style={{ border: '1px solid var(--accent-ruby)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Badge variant="ruby">CANAL DE URGÊNCIA</Badge>
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>Precisa relatar uma violação urgente?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Para suspeitas de envolvimento de menores ou uso não autorizado de imagem, nosso canal prioritário opera 24/7 sem necessidade de cadastro prévio.
            </p>
          </div>
          <Link href="/trust/content-removal">
            <Button variant="ruby" size="lg" leftIcon={<ShieldAlert size={18} />}>
              Solicitar Remoção Imediata
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
