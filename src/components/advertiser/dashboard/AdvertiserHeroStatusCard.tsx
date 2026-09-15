'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Camera,
  LifeBuoy,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { AdvertiserProfile, AdvertiserMedia, BrazilState, BrazilCity } from '@/types/app.types';
import { ListingPauseResumeModal } from '@/components/advertiser/ListingPauseResumeModal';

export interface AdvertiserHeroStatusCardProps {
  advertiser: AdvertiserProfile;
  mainPhoto: AdvertiserMedia | null;
  state: BrazilState | null;
  city: BrazilCity | null;
  publicUrl: string;
  completenessScore: number;
  onStatusChange?: () => void;
}

export function AdvertiserHeroStatusCard({
  advertiser,
  mainPhoto,
  state,
  city,
  publicUrl,
  completenessScore,
  onStatusChange,
}: AdvertiserHeroStatusCardProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showToast({
        type: 'success',
        title: 'Link Copiado!',
        message: 'O link público do seu anúncio foi copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isPaused = Boolean(advertiser.paused_at) || (advertiser.visibility === 'hidden' && Boolean(advertiser.paused_at));
  const isApproved = advertiser.profile_status === 'approved' || advertiser.profile_status === 'active';
  const isActive = isApproved && !isPaused && advertiser.visibility === 'public';
  const isPending = advertiser.profile_status === 'pending_review';
  const isRejected = advertiser.profile_status === 'rejected';
  const isSuspended = advertiser.profile_status === 'suspended';
  const isIncomplete = advertiser.profile_status === 'draft' || !advertiser.onboarding_completed;

  return (
    <>
      <Card
        variant="glass"
        padding="lg"
        style={{
          border: isPaused
            ? '1px solid var(--accent-gold)'
            : isActive
            ? '1px solid rgba(46, 204, 113, 0.3)'
            : isPending
            ? '1px solid var(--accent-gold)'
            : isRejected || isSuspended
            ? '1px solid var(--accent-ruby)'
            : '1px solid var(--border-subtle)',
          background: isPaused
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 18, 20, 0.95) 100%)'
            : isActive
            ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.06) 0%, rgba(18, 18, 20, 0.95) 100%)'
            : isPending
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 18, 20, 0.95) 100%)'
            : 'var(--bg-card)',
          marginBottom: '2rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          {/* Left: Thumbnail & Main Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Main Photo Thumbnail */}
            <div
              style={{
                position: 'relative',
                width: '84px',
                height: '84px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-tertiary)',
                border: isPaused ? '2px solid var(--accent-gold)' : '2px solid var(--accent-gold)',
                flexShrink: 0,
              }}
            >
              {mainPhoto ? (
                <img
                  src={mainPhoto.thumbnail_path || mainPhoto.storage_path || ''}
                  alt={advertiser.stage_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  <Camera size={28} />
                </div>
              )}
            </div>

            <div>
              {/* Status Badges Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                {isPaused && (
                  <Badge variant="gold">
                    <PauseCircle size={12} /> ⏸ ANÚNCIO PAUSADO
                  </Badge>
                )}
                {isActive && (
                  <Badge variant="success">
                    <CheckCircle2 size={12} /> ● ANÚNCIO ATIVO
                  </Badge>
                )}
                {isPending && (
                  <Badge variant="gold">
                    <Clock size={12} /> EM ANÁLISE PELA MODERAÇÃO
                  </Badge>
                )}
                {isRejected && (
                  <Badge variant="ruby">
                    <AlertTriangle size={12} /> AJUSTES NECESSÁRIOS
                  </Badge>
                )}
                {isSuspended && (
                  <Badge variant="ruby">
                    <ShieldAlert size={12} /> ANÚNCIO SUSPENSO
                  </Badge>
                )}
                {isIncomplete && (
                  <Badge variant="neutral">
                    <Sparkles size={12} /> ONBOARDING ({completenessScore}%)
                  </Badge>
                )}

                {advertiser.verification_status === 'verified' && (
                  <Badge variant="gold">
                    <ShieldCheck size={12} /> IDENTIDADE 18+ VERIFICADA
                  </Badge>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                {advertiser.stage_name !== 'Novo Anunciante' ? advertiser.stage_name : 'Meu Anúncio'}
              </h1>

              {/* Status Explanation Subtitle */}
              {isPaused && (
                <div style={{ fontSize: '0.875rem', color: 'var(--accent-gold)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Seu perfil está temporariamente oculto para visitantes.</span>
                </div>
              )}
              {isActive && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Seu perfil está visível nas superfícies públicas elegíveis.
                </div>
              )}

              {/* Location & Plan Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={14} color="var(--accent-gold)" />
                  {advertiser.neighborhood ? `${advertiser.neighborhood}, ` : ''}
                  {city?.name || 'Cidade'}, {state?.code || 'UF'}
                </span>
                <span>•</span>
                <span>Visibilidade: <strong style={{ textTransform: 'capitalize', color: isPaused ? 'var(--accent-gold)' : '#fff' }}>{isPaused ? 'Pausado' : advertiser.visibility}</strong></span>
                <span>•</span>
                <span>Completude: <strong style={{ color: 'var(--accent-gold)' }}>{completenessScore}%</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Contextual Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isPaused && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setModalOpen(true)}
                leftIcon={<PlayCircle size={16} />}
                style={{ background: 'var(--accent-gold)', color: '#000', fontWeight: 700 }}
              >
                Reativar Anúncio
              </Button>
            )}

            {isActive && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setModalOpen(true)}
                  leftIcon={<PauseCircle size={16} color="var(--accent-gold)" />}
                >
                  Pausar Anúncio
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleCopyLink}
                  leftIcon={copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                >
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </Button>

                <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md" rightIcon={<ExternalLink size={16} />}>
                    Ver Perfil Público
                  </Button>
                </a>
              </>
            )}

            {isPending && (
              <Link href="/advertiser/profile/preview">
                <Button variant="primary" size="md" rightIcon={<ArrowRight size={16} />}>
                  Ver Prévia do Anúncio
                </Button>
              </Link>
            )}

            {isRejected && (
              <Link href="/advertiser/onboarding">
                <Button variant="ruby" size="md" rightIcon={<ArrowRight size={16} />}>
                  Corrigir Pendências
                </Button>
              </Link>
            )}

            {isSuspended && (
              <Link href="/support/novo">
                <Button variant="ruby" size="md" leftIcon={<LifeBuoy size={16} />}>
                  Contatar Suporte / Recurso
                </Button>
              </Link>
            )}

            {isIncomplete && (
              <Link href="/advertiser/onboarding">
                <Button variant="ruby" size="md" rightIcon={<ArrowRight size={16} />}>
                  Continuar Onboarding
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Listing Pause/Resume Modal */}
      <ListingPauseResumeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        advertiserId={advertiser.id}
        stageName={advertiser.stage_name}
        isCurrentlyPaused={isPaused}
        onSuccess={() => {
          onStatusChange?.();
        }}
      />
    </>
  );
}
