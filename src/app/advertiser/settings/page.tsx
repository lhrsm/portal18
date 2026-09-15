'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ListingPauseResumeModal } from '@/components/advertiser/ListingPauseResumeModal';
import {
  Eye,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Shield,
  Key,
  Bell,
  ArrowRight,
  Info
} from 'lucide-react';

export default function AdvertiserSettingsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (profile) {
      const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
      if (adv) {
        setAdvertiser(adv);
      }
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '840px' }}>
        <Skeleton height="3.5rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  const isPaused = Boolean(advertiser?.paused_at) || (advertiser?.visibility === 'hidden' && Boolean(advertiser?.paused_at));
  const isApproved = advertiser?.profile_status === 'approved' || advertiser?.profile_status === 'active';
  const isActive = isApproved && !isPaused && advertiser?.visibility === 'public';

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Configurações do Anúncio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
          Gerencie a visibilidade do seu perfil, pausa temporária de atendimento e preferências
        </p>
      </div>

      {/* VISIBILIDADE DO ANÚNCIO (Section 11) */}
      <Card
        variant="glass"
        padding="lg"
        style={{
          marginBottom: '1.75rem',
          border: isPaused ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
          background: isPaused
            ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 18, 20, 0.95) 100%)'
            : 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Eye size={22} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Visibilidade do Anúncio</h3>
          </div>

          {/* Canonical Status Badge */}
          {isPaused ? (
            <Badge variant="gold">
              <PauseCircle size={13} /> ⏸ Anúncio pausado
            </Badge>
          ) : isActive ? (
            <Badge variant="success">
              <CheckCircle2 size={13} /> ● Anúncio ativo
            </Badge>
          ) : (
            <Badge variant="neutral">
              Status: {advertiser?.profile_status}
            </Badge>
          )}
        </div>

        {/* State Description */}
        <div style={{ marginBottom: '1.5rem' }}>
          {isPaused ? (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '0.2rem' }}>
                  ⏸ Anúncio pausado
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Seu perfil está temporariamente oculto para visitantes nas buscas, cidades e categorias.
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => setModalOpen(true)}
                leftIcon={<PlayCircle size={16} />}
                style={{ background: 'var(--accent-gold)', color: '#000', fontWeight: 700 }}
              >
                Reativar anúncio
              </Button>
            </div>
          ) : (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1rem', marginBottom: '0.2rem' }}>
                  ● Anúncio ativo
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Seu perfil está visível nas superfícies públicas elegíveis.
                </div>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setModalOpen(true)}
                leftIcon={<PauseCircle size={16} color="var(--accent-gold)" />}
              >
                Pausar anúncio
              </Button>
            </div>
          )}
        </div>

        {/* Informative Guidance */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.5 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Pausar seu anúncio oculta temporariamente sua página pública mantendo todas as suas fotos, dados, histórico e avaliações salvos.
            A pausa não afeta o ciclo de faturamento da sua assinatura.
          </span>
        </div>
      </Card>

      {/* Account, Privacy & Security Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={18} color="var(--color-success)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Privacidade & Bloqueios</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Gerencie perfis bloqueados e exportação de dados LGPD.
          </p>
          <Link href="/account/privacy" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Opções de Privacidade
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Key size={18} color="var(--color-info)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Segurança & Senha</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Altere sua senha de acesso e monitore sessões ativas.
          </p>
          <Link href="/account/security" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Gerenciar Segurança
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Bell size={18} color="var(--color-warning)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Notificações</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Configure alertas sobre mensagens, moderações e novidades.
          </p>
          <Link href="/account/notifications" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Central de Notificações
            </Button>
          </Link>
        </Card>
      </div>

      {/* Modal Integration */}
      {advertiser && (
        <ListingPauseResumeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          advertiserId={advertiser.id}
          stageName={advertiser.stage_name}
          isCurrentlyPaused={isPaused}
          onSuccess={() => loadData()}
        />
      )}
    </AdvertiserLayout>
  );
}
