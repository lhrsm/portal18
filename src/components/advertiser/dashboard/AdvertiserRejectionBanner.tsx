'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Camera, FileText, Phone, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdvertiserProfile } from '@/types/app.types';

export interface AdvertiserRejectionBannerProps {
  advertiser: AdvertiserProfile;
}

export function AdvertiserRejectionBanner({ advertiser }: AdvertiserRejectionBannerProps) {
  if (advertiser.profile_status !== 'rejected') return null;

  return (
    <Card
      variant="glass"
      padding="lg"
      style={{
        border: '1px solid var(--accent-ruby)',
        background: 'linear-gradient(135deg, rgba(163, 0, 33, 0.12) 0%, rgba(18, 18, 20, 0.95) 100%)',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(163, 0, 33, 0.2)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={22} color="var(--accent-ruby)" />
        </div>

        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-ruby)', margin: '0 0 0.35rem 0' }}>
            Ajustes Necessários para Aprovação
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Nossa equipe de moderação analisou seu perfil e identificou pendências que precisam ser corrigidas antes da publicação pública.
          </p>
        </div>
      </div>

      {/* Specific Reason Box */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: '3px solid var(--accent-ruby)',
          marginBottom: '1.25rem',
        }}
      >
        <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block', marginBottom: '0.25rem' }}>
          Motivo informado pela moderação:
        </strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {advertiser.rejection_reason || advertiser.review_feedback || 'Por favor, revise suas fotos e informações para garantir conformidade com as diretrizes do portal.'}
        </p>
      </div>

      {/* Quick Fix Links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/advertiser/gallery">
            <Button variant="secondary" size="sm" leftIcon={<Camera size={14} />}>
              Ajustar Fotos
            </Button>
          </Link>
          <Link href="/advertiser/profile">
            <Button variant="secondary" size="sm" leftIcon={<FileText size={14} />}>
              Ajustar Bio / Dados
            </Button>
          </Link>
          <Link href="/advertiser/contacts">
            <Button variant="secondary" size="sm" leftIcon={<Phone size={14} />}>
              Ajustar Contatos
            </Button>
          </Link>
        </div>

        <Link href="/advertiser/onboarding">
          <Button variant="ruby" size="sm" rightIcon={<ArrowRight size={14} />}>
            Abrir Onboarding & Reenviar
          </Button>
        </Link>
      </div>
    </Card>
  );
}
