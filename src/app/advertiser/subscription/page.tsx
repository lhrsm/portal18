'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { commercialCatalogService } from '@/services/commercialCatalogService';
import { commercialLifecycleService, CommercialLifecycleDetails } from '@/services/commercialLifecycleService';
import { referralService } from '@/services/referralService';
import { AdvertiserCommercialSummary, ReferralStats } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  CreditCard, 
  Crown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Zap,
  Info,
  Image as ImageIcon,
  Video,
  Layers,
  Gift,
  ShieldCheck,
  Phone
} from 'lucide-react';

export default function AdvertiserSubscriptionDashboardPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<AdvertiserCommercialSummary | null>(null);
  const [lifecycle, setLifecycle] = useState<CommercialLifecycleDetails | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
    if (adv) {
      const [sumData, lifeData, refData] = await Promise.all([
        commercialCatalogService.getAdvertiserCommercialSummary(adv.id),
        commercialLifecycleService.getCommercialLifecycle(adv.id),
        referralService.getAdvertiserReferralStats(adv.id),
      ]);
      setSummary(sumData);
      setLifecycle(lifeData);
      setReferralStats(refData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '900px' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  const entitlements = summary?.entitlements;
  const usage = summary?.usage;

  const badgeVariant = (lifecycle?.statusBadge.variant === 'gold' || lifecycle?.statusBadge.variant === 'ruby' || lifecycle?.statusBadge.variant === 'success')
    ? lifecycle.statusBadge.variant
    : 'neutral';

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/advertiser" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Painel do Anunciante
        </Link>
        <Badge variant="gold"><Crown size={12} /> GESTÃO DE PLANO</Badge>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Plano & Benefícios Ativos
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Acompanhe seu ciclo comercial, limites de mídia na galeria e bônus acumulados
        </p>
      </div>

      {/* Lifecycle Status Banner */}
      {lifecycle && (
        <Card variant="glass" padding="lg" style={{ marginBottom: '2rem', border: '1px solid var(--border-accent)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Badge variant={badgeVariant}>{lifecycle.statusBadge.label}</Badge>
                {referralStats && referralStats.active_bonus_days > 0 && (
                  <Badge variant="success">+{referralStats.active_bonus_days} dias de bônus</Badge>
                )}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                {lifecycle.planName}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
                {lifecycle.statusBadge.description}
              </p>
            </div>

            <Link href="/advertiser/subscription/plans">
              <Button variant="primary" size="md">
                Ver Opções de Planos
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Usage Meters */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Uso de Recursos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {/* Photos Usage */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fotos na Galeria</span>
            <ImageIcon size={16} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {usage?.photos.current || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {usage?.photos.limit || 10}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {usage?.photos.can_add_more ? 'Capacidade disponível' : 'Limite do plano atingido'}
          </span>
        </Card>

        {/* Videos Usage */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Vídeos Comerciais</span>
            <Video size={16} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {usage?.videos.current || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {usage?.videos.limit || 0}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {(usage?.videos.limit || 0) > 0 ? 'Vídeos liberados na galeria' : 'Disponível em planos superiores'}
          </span>
        </Card>

        {/* Categories Usage */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categorias Vinculadas</span>
            <Layers size={16} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {usage?.categories.current || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {usage?.categories.limit || 3}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classificação taxonômica do perfil</span>
        </Card>
      </div>

      {/* Active Benefits Details */}
      <Card variant="glass" padding="lg">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Benefícios & Entitlements Autorizados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Áudio de Apresentação</div>
            <strong>{entitlements?.audio_allowed ? 'Liberado' : 'Bloqueado no plano'}</strong>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Selo de Autenticidade</div>
            <strong>{entitlements?.authenticity_verified ? 'Verificado & Ativo' : 'Disponível (Grátis)'}</strong>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Nível de Analytics</div>
            <strong style={{ textTransform: 'capitalize' }}>{entitlements?.analytics_level || 'Básico'}</strong>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Visualização de Contatos</div>
            <strong>{entitlements?.contacts_strategy === 'full' ? 'Todos os canais' : 'WhatsApp prioritário'}</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}
