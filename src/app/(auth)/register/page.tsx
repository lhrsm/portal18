import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Sparkles, ArrowLeft, Heart, Megaphone, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Criar Conta 18+ | Portal 18+',
  description: 'Cadastre-se para anunciar seu perfil profissional ou explorar acompanhantes independentes no Portal 18+.',
};

export default function RegisterPage() {
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
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Track Highlights & Benefits */}
          <div style={{ padding: '0.5rem' }}>
            <div style={{ display: 'inline-flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <Badge variant="ruby">18+ OBRIGATÓRIO</Badge>
              <Badge variant="gold">CADASTRO RÁPIDO</Badge>
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.15 }}>
              Junte-se ao <span style={{ color: 'var(--accent-gold)' }}>Portal 18+</span>
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              A plataforma nacional mais segura e refinada para acompanhantes independentes e clientes exigentes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Option 1 Highlight */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <Heart size={18} color="var(--accent-ruby)" />
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Para Visitantes & Clientes</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Salve seus perfis favoritos, organize listas privadas e filtre os melhores anúncios da sua cidade.
                </p>
              </div>

              {/* Option 2 Highlight */}
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <Megaphone size={18} color="var(--accent-gold)" />
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--accent-gold)' }}>Para Anunciantes & Modelos</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  Publique fotos em alta resolução, configure contatos de WhatsApp e ganhe visibilidade com selo de verificação.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} color="var(--color-success)" />
              <span>Verificação de maioridade 18+ e conformidade com a LGPD</span>
            </div>
          </div>

          {/* Right Column: Card with Register Form */}
          <div>
            <Card variant="glass" padding="lg" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>Crie sua conta</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Leva menos de 1 minuto e você escolhe como prefere entrar
                </p>
              </div>

              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando formulário...</div>}>
                <RegisterForm />
              </Suspense>
            </Card>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Lock size={12} />
              <span>Seus dados nunca são compartilhados com terceiros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
