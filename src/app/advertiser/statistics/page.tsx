'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart3, Eye, Phone, Heart, TrendingUp, Calendar } from 'lucide-react';

export default function AdvertiserStatisticsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        setAdvertiser(adv);
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Estatísticas de Desempenho</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Acompanhe o alcance, visualizações e contatos gerados pelo seu anúncio
          </p>
        </div>

        {/* Period Selector (Requirement 74) */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <Button
            variant={period === '7d' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            Últimos 7 dias
          </Button>
          <Button
            variant={period === '30d' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 dias
          </Button>
          <Button
            variant={period === '90d' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('90d')}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visualizações de Perfil</span>
            <Eye size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>0</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No período selecionado</span>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cliques para Contato</span>
            <Phone size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>0</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>WhatsApp / Telefone</span>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Adições a Favoritos</span>
            <Heart size={18} color="var(--accent-ruby)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>0</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Usuários que salvaram</span>
        </Card>
      </div>

      {/* Analytics Chart Placeholder */}
      <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <BarChart3 size={44} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Gráficos em Consolidação</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto' }}>
          Assim que seu perfil for aprovado e começar a receber visitas dos clientes, os gráficos de evolução diária aparecerão aqui.
        </p>
      </Card>
    </AdvertiserLayout>
  );
}
