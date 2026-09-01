'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { advertiserAnalyticsService } from '@/services/advertiserAnalyticsService';
import { AdminPlatformAnalytics } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BarChart3,
  Eye,
  Phone,
  Layers,
  TrendingUp,
  Sparkles,
  Users,
  Megaphone,
  CheckCircle2,
  ShieldCheck,
  Compass
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminPlatformAnalytics | null>(null);
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (selectedPeriod: 7 | 30 | 90) => {
    setLoading(true);
    const data = await advertiserAnalyticsService.getAdminPlatformAnalytics(selectedPeriod);
    setAnalytics(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  const funnel = analytics?.funnel || {
    impressions: 0,
    profile_views: 0,
    contact_clicks: 0,
    profile_open_rate: 0,
    contact_conversion_rate: 0,
  };

  const distribution = analytics?.distribution || {
    organic_impressions: 0,
    sponsored_impressions: 0,
    sponsored_share_percent: 0,
  };

  const ops = analytics?.operations || {
    active_advertisers: 0,
    active_campaigns: 0,
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Badge variant="gold">PLATFORM INTELLIGENCE</Badge>
              <Badge variant="neutral">Funil Agregado</Badge>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Analytics da Plataforma & Descoberta</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              Visão macro da conversão de visitantes em intenções de contato e saúde da distribuição orgânica
            </p>
          </div>

          {/* Period Selector */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Button
              variant={period === 7 ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(7)}
              style={{ fontSize: '0.8rem' }}
            >
              7 Dias
            </Button>
            <Button
              variant={period === 30 ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(30)}
              style={{ fontSize: '0.8rem' }}
            >
              30 Dias
            </Button>
            <Button
              variant={period === 90 ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(90)}
              style={{ fontSize: '0.8rem' }}
            >
              90 Dias
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
        ) : (
          <>
            {/* KPI Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Impressões Nacionais</span>
                  <Layers size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{funnel.impressions.toLocaleString('pt-BR')}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exibições em listas e buscas</span>
              </Card>

              <Card variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Aberturas de Perfil</span>
                  <Eye size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{funnel.profile_views.toLocaleString('pt-BR')}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxa de clique: <strong>{funnel.profile_open_rate}%</strong></span>
              </Card>

              <Card variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Intenções de Contato</span>
                  <Phone size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success)' }}>{funnel.contact_clicks.toLocaleString('pt-BR')}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxa de conversão: <strong>{funnel.contact_conversion_rate}%</strong></span>
              </Card>

              <Card variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-info)', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Share Patrocinado</span>
                  <Megaphone size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-info)' }}>{distribution.sponsored_share_percent}%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{distribution.sponsored_impressions} de {funnel.impressions} impressões</span>
              </Card>
            </div>

            {/* Distribution & Operations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <Card variant="glass" padding="lg">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Distribuição de Tráfego de Descoberta</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                  Proporção de alcance entre busca orgânica e campanhas patrocinadas
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <span>Busca Orgânica</span>
                    <strong>{distribution.organic_impressions.toLocaleString('pt-BR')} ({100 - distribution.sponsored_share_percent}%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <span>Campanhas Patrocinadas</span>
                    <strong>{distribution.sponsored_impressions.toLocaleString('pt-BR')} ({distribution.sponsored_share_percent}%)</strong>
                  </div>
                </div>
              </Card>

              <Card variant="glass" padding="lg">
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Status Operacional</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                  Capacidade de anunciantes e campanhas ativas no período
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} color="var(--accent-gold)" />
                      <span>Anunciantes Ativos Publicados</span>
                    </div>
                    <strong>{ops.active_advertisers}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Megaphone size={16} color="var(--color-success)" />
                      <span>Campanhas Ativas</span>
                    </div>
                    <strong>{ops.active_campaigns}</strong>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
