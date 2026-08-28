'use client';

import React from 'react';
import { 
  Eye, 
  Phone, 
  Heart, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  MessageCircle, 
  Send, 
  Percent 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DashboardMetricsSummary } from '@/services/advertiserDashboardService';

export interface AdvertiserMetricsGridProps {
  metrics: DashboardMetricsSummary;
  selectedPeriod: 7 | 30 | 90;
  onPeriodChange: (period: 7 | 30 | 90) => void;
  isLoading?: boolean;
}

export function AdvertiserMetricsGrid({
  metrics,
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
}: AdvertiserMetricsGridProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Top Header with Period Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
            Desempenho & Métricas Reais
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Dados consolidados de engajamento dos visitantes no seu anúncio
          </p>
        </div>

        {/* Period Selector Tabs (7d / 30d / 90d) */}
        <div
          style={{
            display: 'flex',
            gap: '0.35rem',
            background: 'var(--bg-secondary)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: selectedPeriod === p ? 'var(--accent-gold)' : 'transparent',
                color: selectedPeriod === p ? '#000' : 'var(--text-secondary)',
                fontWeight: selectedPeriod === p ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {p} dias
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Visualizações de Perfil */}
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visualizações Totais</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'grid', placeItems: 'center' }}>
              <Eye size={16} color="var(--accent-gold)" />
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0' }}>
            {metrics.totalViews.toLocaleString('pt-BR')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {metrics.viewsTrendPercent ? (
              <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', fontWeight: 700 }}>
                <TrendingUp size={12} style={{ marginRight: '2px' }} /> +{metrics.viewsTrendPercent}%
              </span>
            ) : (
              <span>Visualizações acumuladas</span>
            )}
          </div>
        </Card>

        {/* Card 2: Cliques em Contato */}
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cliques em Contatos</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', display: 'grid', placeItems: 'center' }}>
              <Phone size={16} color="var(--color-success)" />
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0' }}>
            {metrics.totalContactClicks.toLocaleString('pt-BR')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>WhatsApp: <strong>{metrics.whatsAppClicks}</strong></span>
            <span>•</span>
            <span>Telegram: <strong>{metrics.telegramClicks}</strong></span>
          </div>
        </Card>

        {/* Card 3: Taxa de Conversão */}
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Taxa de Conversão</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(52, 152, 219, 0.1)', display: 'grid', placeItems: 'center' }}>
              <Percent size={16} color="var(--color-info)" />
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--accent-gold)' }}>
            {metrics.conversionRate}%
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Visitantes que clicaram para conversar
          </div>
        </Card>

        {/* Card 4: Favoritos & Seguidores */}
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interesse & Salvos</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(231, 76, 60, 0.1)', display: 'grid', placeItems: 'center' }}>
              <Heart size={16} color="var(--accent-ruby)" />
            </div>
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0' }}>
            {metrics.favoritesCount}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span>Favoritos: <strong>{metrics.favoritesCount}</strong></span>
            <span>•</span>
            <span>Seguidores: <strong>{metrics.followersCount}</strong></span>
          </div>
        </Card>
      </div>
    </div>
  );
}
