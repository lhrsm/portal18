'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ShieldCheck, 
  Eye, 
  Keyboard, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  MessageSquare,
  Contrast,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';

export default function AccessibilityStatementPage() {
  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '1000px' }}>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
        <ChevronRight size={10} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>Acessibilidade</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold"><FileCheck size={12} /> DECLARAÇÃO OFICIAL</Badge>
          <Badge variant="neutral">WCAG 2.2 Nível AA</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Compromisso com a Acessibilidade Digital
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '800px' }}>
          O Portal18 tem o compromisso contínuo de assegurar que sua plataforma seja acessível e utilizável por todas as pessoas, incluindo indivíduos com deficiência visual, auditiva, motora ou cognitiva, em conformidade com as Diretrizes de Acessibilidade para Conteúdo Web (WCAG 2.2) em nível AA.
        </p>
      </div>

      {/* Grid of Principles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Keyboard size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Navegação por Teclado</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
            Todos os fluxos essenciais de navegação, modais, formulários de busca e filtros são operáveis sem o uso de mouse, com atalho de salto direto para o conteúdo principal.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Contrast size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Contraste e Legibilidade</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
            A paleta visual do Portal18 é calibrada para atender aos requisitos mínimos de contraste WCAG AA (4.5:1 para texto padrão e 3:1 para elementos de interface e foco).
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Eye size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Leitores de Tela (ARIA)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
            Uso de HTML semântico com landmarks estruturados (`header`, `nav`, `main`, `footer`), nomes acessíveis explícitos em botões de ação e anúncios discretos via live regions.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <SlidersHorizontal size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Redução de Movimento</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
            Respeito nativo às preferências do sistema operacional (`prefers-reduced-motion: reduce`), desativando transições bruscas, loops e animações não essenciais.
          </p>
        </Card>
      </div>

      {/* Known Limitations and Continuous Improvement */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Limitações Conhecidas e Melhoria Contínua
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Apesar de nossos esforços rigorosos para garantir conformidade abrangente, reconhecemos que algumas áreas podem apresentar desafios pontuais:
        </p>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          <li><strong>Mídias enviadas por terceiros:</strong> Fotos de anunciantes recebem descrições padronizadas e neutras geradas pelo sistema, podendo não conter descrições detalhadas de contexto visual artístico.</li>
          <li><strong>Safe Mode & Age Gate:</strong> O mecanismo de proteção de maioridade (18+) sobrepõe modais que requerem interação explícita do usuário antes da liberação de dados de contato.</li>
          <li><strong>Documentos de terceiros:</strong> Links ou integrações com gateways externos de pagamento ou verificação de identidade operam sob as diretrizes de acessibilidade de seus respectivos provedores.</li>
        </ul>
      </section>

      {/* Feedback & Support Channel */}
      <Card variant="elevated" padding="lg" style={{ background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.08) 0%, rgba(18, 22, 31, 0.95) 100%)', border: '1px solid rgba(212, 160, 23, 0.25)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={22} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Encontrou alguma barreira de acessibilidade?</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Valorizamos imensamente seu feedback. Se você encontrar dificuldades ao navegar no Portal18 ou precisar de suporte específico em formato acessível, nossa equipe técnica está pronta para atendê-lo.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
            <Link href="/support/novo">
              <Button variant="primary" size="md" leftIcon={<MessageSquare size={16} />}>
                Relatar Barreira de Acessibilidade
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="secondary" size="md">
                Central de Ajuda
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Revision Meta */}
      <div style={{ marginTop: '2.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Última revisão desta declaração: 30 de agosto de 2026.
      </div>
    </div>
  );
}
