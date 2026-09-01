'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Image as ImageIcon,
  MessageCircle,
  HelpCircle,
  Lock,
  ExternalLink
} from 'lucide-react';
import { PublicAdvertiserTrust } from '@/services/reputation/types';

interface TrustPanelProps {
  trust: PublicAdvertiserTrust | null;
  authenticityVerified?: boolean | null;
  publishedSince?: string | null;
}

export function TrustPanel({ trust, authenticityVerified, publishedSince }: TrustPanelProps) {
  const [showModal, setShowModal] = useState(false);

  const isAuth = authenticityVerified || trust?.signals.some((s) => s.signal_type === 'authenticity_verified');
  const isMedia = trust?.signals.some((s) => s.signal_type === 'media_verified');
  const isUpdated = trust?.signals.some((s) => s.signal_type === 'profile_recently_updated');
  const isResponsive = trust?.signals.some((s) => s.signal_type === 'advertiser_responds_to_reviews');

  const rawDate = trust?.published_since || publishedSince;
  const platformSinceFormatted = rawDate ? (() => {
    try {
      const d = new Date(rawDate);
      return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } catch {
      return null;
    }
  })() : null;

  return (
    <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem', border: '1px solid rgba(229, 185, 92, 0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
          <ShieldCheck size={18} color="var(--accent-gold)" /> Confiança & Verificação
        </h3>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'underline' }}
        >
          <HelpCircle size={13} /> Entenda estes selos
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {isAuth && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={13} /> Perfil Autenticado
          </span>
        )}

        {isMedia && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--border-subtle)' }}>
            <ImageIcon size={13} color="var(--accent-gold)" /> Mídias Verificadas
          </span>
        )}

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
          <Lock size={12} /> Maioridade 18+
        </span>

        {platformSinceFormatted && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
            <Calendar size={12} /> Na plataforma desde {platformSinceFormatted}
          </span>
        )}

        {isUpdated && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
            <RefreshCw size={12} /> Atualizado recentemente
          </span>
        )}

        {isResponsive && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', padding: '0.35rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
            <MessageCircle size={12} /> Responde avaliações
          </span>
        )}
      </div>

      {/* Explanatory Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Selos de Confiança e Verificação"
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                ✓ Perfil Autenticado
              </strong>
              O anunciante gravou um vídeo de desafio dinâmico aprovado pela moderação humana, comprovando a posse e identidade do anúncio.
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                ✓ Mídias Verificadas
              </strong>
              A galeria contém fotos reais e moderadas que atendem às diretrizes de qualidade do Portal18.
            </div>

            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
                ✓ Maioridade 18+
              </strong>
              Todos os anunciantes da plataforma passam por processo mandatório de verificação etária para anúncio.
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/trust" style={{ color: 'var(--accent-gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                Conheça nossa Central de Confiança <ExternalLink size={12} />
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setShowModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

