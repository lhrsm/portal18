'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertiserDashboardService, AdvertiserDashboardData } from '@/services/advertiserDashboardService';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  BarChart3, 
  Eye, 
  Phone, 
  Heart, 
  Users, 
  TrendingUp, 
  MessageCircle, 
  Send, 
  Percent, 
  Info,
  Calendar
} from 'lucide-react';

export default function AdvertiserStatisticsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AdvertiserDashboardData | null>(null);
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (selectedPeriod: 7 | 30 | 90) => {
    if (profile) {
      const result = await advertiserDashboardService.getDashboardData(profile.id, selectedPeriod);
      setData(result);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      loadStats(period);
    }
  }, [profile, authLoading, period, loadStats]);

  const handlePeriodChange = (newPeriod: 7 | 30 | 90) => {
    setPeriod(newPeriod);
    loadStats(newPeriod);
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '840px' }}>
        <Skeleton height="3.5rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="120px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  const advertiser = data?.advertiser || null;
  const metrics = data?.metrics || {
    periodDays: period,
    totalViews: 0,
    totalContactClicks: 0,
    whatsAppClicks: 0,
    telegramClicks: 0,
    phoneClicks: 0,
    favoritesCount: 0,
    followersCount: 0,
    conversionRate: 0,
  };

  return (
    <AdvertiserLayout advertiser={advertiser} completenessScore={data?.healthScore.score}>
      {/* Top Header with Period Filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Estatísticas & Alcance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Acompanhe o engajamento, visualizações de perfil e contatos recebidos
          </p>
        </div>

        {/* Period Selector */}
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
              onClick={() => handlePeriodChange(p)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: period === p ? 'var(--accent-gold)' : 'transparent',
                color: period === p ? '#000' : 'var(--text-secondary)',
                fontWeight: period === p ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Últimos {p} dias
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Summary Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visualizações Totais</span>
            <Eye size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0' }}>
            {metrics.totalViews.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visitas no período selecionado</span>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cliques para Contato</span>
            <Phone size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0' }}>
            {metrics.totalContactClicks.toLocaleString('pt-BR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Conversas iniciadas</span>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Taxa de Conversão</span>
            <Percent size={18} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--accent-gold)' }}>
            {metrics.conversionRate}%
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cliques por visualização</span>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interesse & Favoritos</span>
            <Heart size={18} color="var(--accent-ruby)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0' }}>
            {metrics.favoritesCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salvo em listas privadas</span>
        </Card>
      </div>

      {/* Channel Breakdown Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Desempenho por Canal de Atendimento
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <MessageCircle size={16} color="var(--color-success)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>WhatsApp</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.whatsAppClicks}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliques diretos</span>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Send size={16} color="var(--color-info)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Telegram</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.telegramClicks}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliques diretos</span>
          </div>

          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Phone size={16} color="var(--accent-gold)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Telefone / Outros</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics.phoneClicks}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliques diretos</span>
          </div>
        </div>
      </Card>

      {/* Privacy Notice Card */}
      <Card variant="glass" padding="md" style={{ background: 'rgba(212, 175, 55, 0.04)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Info size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent-gold)' }}>Privacidade & Segurança:</strong> Todas as métricas são agregadas de forma anônima. O Portal 18+ nunca rastreia ou exibe a identidade civil de visitantes aos anunciantes.
          </div>
        </div>
      </Card>
    </AdvertiserLayout>
  );
}
