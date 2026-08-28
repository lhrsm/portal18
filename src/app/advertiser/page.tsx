'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertiserDashboardService, AdvertiserDashboardData } from '@/services/advertiserDashboardService';
import { completenessService } from '@/services/completenessService';
import { onboardingAnalytics } from '@/services/telemetry/onboardingAnalytics';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { AdvertiserHeroStatusCard } from '@/components/advertiser/dashboard/AdvertiserHeroStatusCard';
import { AdvertiserMetricsGrid } from '@/components/advertiser/dashboard/AdvertiserMetricsGrid';
import { AdvertiserActivityFeed } from '@/components/advertiser/dashboard/AdvertiserActivityFeed';
import { AdvertiserHealthScoreCard } from '@/components/advertiser/dashboard/AdvertiserHealthScoreCard';
import { AdvertiserGallerySummaryCard } from '@/components/advertiser/dashboard/AdvertiserGallerySummaryCard';
import { AdvertiserRejectionBanner } from '@/components/advertiser/dashboard/AdvertiserRejectionBanner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  User, 
  Camera, 
  Phone, 
  MapPin, 
  Settings, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Megaphone
} from 'lucide-react';

export default function AdvertiserDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AdvertiserDashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (period: 7 | 30 | 90) => {
    if (profile) {
      const result = await advertiserDashboardService.getDashboardData(profile.id, period);
      setData(result);
      if (result) {
        onboardingAnalytics.trackEvent('onboarding_resumed', {
          step: result.advertiser?.onboarding_step,
          hasMainPhoto: result.mediaList.length > 0,
          hasContacts: result.contacts.length > 0,
        });
      }
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      loadDashboard(selectedPeriod);
    }
  }, [profile, authLoading, selectedPeriod, loadDashboard]);

  const handlePeriodChange = (newPeriod: 7 | 30 | 90) => {
    setSelectedPeriod(newPeriod);
    loadDashboard(newPeriod);
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '1080px' }}>
        <Skeleton height="3.5rem" width="340px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="140px" style={{ marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
        </div>
        <Skeleton height="260px" />
      </div>
    );
  }

  // If user is not yet an advertiser
  if (!data || !data.advertiser) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center', maxWidth: '600px' }}>
        <Card variant="glass" padding="lg" style={{ padding: '3.5rem 1.5rem' }}>
          <Megaphone size={54} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Você ainda não possui um anúncio ativo
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Ative seu perfil profissional de anunciante para publicar fotos, configurar WhatsApp e ser encontrado(a) por milhares de visitantes.
          </p>
          <Link href="/advertiser/start">
            <Button variant="ruby" size="lg" rightIcon={<ArrowRight size={18} />}>
              Criar Perfil Profissional
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { advertiser, state, city, mediaList, contacts, healthScore, metrics, recentActivity, publicUrl } = data;
  const mainPhoto = mediaList.find((m) => m.position === 0) || mediaList[0] || null;

  return (
    <AdvertiserLayout advertiser={advertiser} completenessScore={healthScore.score}>
      {/* 1. STATE-AWARE HERO STATUS CARD */}
      <AdvertiserHeroStatusCard
        advertiser={advertiser}
        mainPhoto={mainPhoto}
        state={state}
        city={city}
        publicUrl={publicUrl}
        completenessScore={healthScore.score}
      />

      {/* 2. REJECTION / CHANGES REQUESTED BANNER */}
      {advertiser.profile_status === 'rejected' && (
        <AdvertiserRejectionBanner advertiser={advertiser} />
      )}

      {/* 3. MAIN DASHBOARD CONTENT GRID (8 COLS MAIN + 4 COLS SIDEBAR) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN (8 Columns on desktop): Metrics, Shortcuts, Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Metrics Grid */}
          <AdvertiserMetricsGrid
            metrics={metrics}
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
          />

          {/* Quick Shortcuts Cards */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Atalhos Rápidos de Gerenciamento
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link href="/advertiser/profile" style={{ textDecoration: 'none' }}>
                <Card variant="glass" padding="md" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-subtle)', height: '100%' }}>
                  <User size={20} color="var(--accent-gold)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>Editar Perfil</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nome, bio e categorias</span>
                  </div>
                </Card>
              </Link>

              <Link href="/advertiser/gallery" style={{ textDecoration: 'none' }}>
                <Card variant="glass" padding="md" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-subtle)', height: '100%' }}>
                  <Camera size={20} color="var(--color-info)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>Fotos & Mídias</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mediaList.length} fotos salvas</span>
                  </div>
                </Card>
              </Link>

              <Link href="/advertiser/contacts" style={{ textDecoration: 'none' }}>
                <Card variant="glass" padding="md" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-subtle)', height: '100%' }}>
                  <Phone size={20} color="var(--color-success)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>Contatos</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>WhatsApp e canais</span>
                  </div>
                </Card>
              </Link>

              <Link href="/advertiser/location" style={{ textDecoration: 'none' }}>
                <Card variant="glass" padding="md" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border-subtle)', height: '100%' }}>
                  <MapPin size={20} color="var(--accent-ruby)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>Localização</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{city?.name || 'Região'}</span>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <AdvertiserActivityFeed activities={recentActivity} />
        </div>

        {/* RIGHT COLUMN (4 Columns on desktop): Health Score, Gallery Summary, Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile Health Score Card */}
          <AdvertiserHealthScoreCard health={healthScore} />

          {/* Gallery Summary Card */}
          <AdvertiserGallerySummaryCard mediaList={mediaList} />

          {/* Support & Safety Card */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <HelpCircle size={18} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Precisa de Ajuda?</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Dúvidas sobre verificação, moderação de fotos ou segurança? Nossa equipe de suporte está pronta para ajudar.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/help" style={{ textDecoration: 'none', flex: 1 }}>
                <Button variant="secondary" size="sm" fullWidth>
                  Central de Ajuda
                </Button>
              </Link>
              <Link href="/support/novo" style={{ textDecoration: 'none', flex: 1 }}>
                <Button variant="ghost" size="sm" fullWidth>
                  Abrir Chamado
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdvertiserLayout>
  );
}
