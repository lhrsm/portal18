import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Lock, Sparkles, Heart, Search, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Entrar na Conta | Portal18',
  description: 'Acesse seus favoritos, listas, histórico e painel profissional no Portal18.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '960px' }}>
        {/* Navigation Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
          >
            <ArrowLeft size={14} /> Voltar para o início
          </Link>
        </div>

        {/* Two-column layout on desktop, single on mobile */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Portal 18+ Brand & Trust Points */}
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'inline-flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <Badge variant="gold">ACESSO SEGURO</Badge>
              <Badge variant="ruby">18+ PRIVADO</Badge>
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.15 }}>
              Acesse sua conta no <span style={{ color: 'var(--accent-gold)' }}>Portal 18+</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Gerencie seus anúncios verificados, acompanhe métricas de alcance ou sincronize seus acompanhantes favoritos com total discrição e sigilo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={18} color="var(--accent-gold)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Privacidade & Criptografia</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Conexão autenticada via tokens criptográficos e SSL.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(230, 57, 70, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={18} color="var(--accent-ruby)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Favoritos & Histórico</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Acesse perfis salvos em qualquer dispositivo.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={18} color="var(--color-info)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Painel do Anunciante</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gerencie galeria, contatos e destaques em tempo real.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Card with Login Form */}
          <div>
            <Card variant="glass" padding="lg" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>Entrar na sua conta</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Escolha o método de acesso de sua preferência
                </p>
              </div>

              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando formulário...</div>}>
                <LoginForm />
              </Suspense>
            </Card>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Lock size={12} />
              <span>Ambiente seguro protegido por Cloudflare e Supabase Auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
