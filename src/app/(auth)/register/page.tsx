import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, ArrowLeft, Heart, Megaphone, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Criar Conta 18+ | Portal18',
  description: 'Cadastre-se para anunciar seu perfil profissional ou explorar acompanhantes independentes no Portal18.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 'calc(100vh - 140px)',
        padding: 'clamp(1rem, 2.5vw, 2rem) clamp(0.75rem, 2vw, 1rem)',
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <div style={{ width: '100%', maxWidth: '980px', boxSizing: 'border-box' }}>
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

        {/* Two-column layout on desktop, single column on mobile */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'clamp(1.5rem, 3vw, 2.5rem)',
            alignItems: 'start',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Column: Track Highlights & Brand Value */}
          <div
            style={{
              padding: 'clamp(0.25rem, 1vw, 0.75rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'inline-flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <Badge variant="ruby">18+ OBRIGATÓRIO</Badge>
              <Badge variant="gold">CADASTRO RÁPIDO</Badge>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 2.5rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '0.85rem',
                lineHeight: 1.15,
              }}
            >
              Junte-se ao <span style={{ color: 'var(--accent-gold)' }}>Portal 18+</span>
            </h1>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.55,
                marginBottom: '1.5rem',
              }}
            >
              A plataforma nacional mais segura e refinada para acompanhantes independentes e clientes exigentes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Option 1 Highlight */}
              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <Heart size={18} color="var(--accent-ruby)" />
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Para Visitantes & Clientes</h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: 0, lineHeight: 1.45 }}>
                  Salve seus perfis favoritos, organize listas privadas e filtre os melhores anúncios da sua cidade.
                </p>
              </div>

              {/* Option 2 Highlight */}
              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                  <Megaphone size={18} color="var(--accent-gold)" />
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--accent-gold)' }}>
                    Para Anunciantes & Modelos
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: 0, lineHeight: 1.45 }}>
                  Publique fotos em alta resolução, configure contatos de WhatsApp e ganhe visibilidade com selo de verificação.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.785rem',
              }}
            >
              <ShieldCheck size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
              <span>Verificação de maioridade 18+ e conformidade estrita com a LGPD</span>
            </div>
          </div>

          {/* Right Column: Card with Register Form */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <Card
              variant="glass"
              padding="lg"
              style={{
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.2rem' }}>Crie sua conta</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: 0 }}>
                  Leva menos de 1 minuto e você escolhe como prefere entrar
                </p>
              </div>

              <Suspense
                fallback={
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Carregando formulário...
                  </div>
                }
              >
                <RegisterForm />
              </Suspense>
            </Card>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                marginTop: '1rem',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
              }}
            >
              <Lock size={12} />
              <span>Seus dados nunca são compartilhados com terceiros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
