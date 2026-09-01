'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertiserAnalyticsService } from '@/services/advertiserAnalyticsService';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile, AdvertiserFunnelAnalytics } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BarChart3,
  Eye,
  Phone,
  TrendingUp,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

export default function AdvertiserAnalyticsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [analytics, setAnalytics] = useState<AdvertiserFunnelAnalytics | null>(null);
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'impressions' | 'profile_views' | 'contact_clicks'>('profile_views');

  const loadData = useCallback(async (selectedPeriod: 7 | 30 | 90) => {
    if (!profile) return;
    setLoading(true);
    const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
    setAdvertiser(adv);
    if (adv) {
      const data = await advertiserAnalyticsService.getFunnelAnalytics(adv.id, selectedPeriod);
      setAnalytics(data);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      loadData(period);
    }
  }, [authLoading, period, loadData]);

  const funnel = analytics?.funnel || {
    impressions: 0,
    profile_views: 0,
    contact_clicks: 0,
    profile_open_rate: 0,
    contact_conversion_rate: 0,
    overall_contact_rate: 0,
  };

  const trends = analytics?.trends || {
    impressions_trend_percent: 0,
    views_trend_percent: 0,
    contacts_trend_percent: 0,
  };

  const sources = analytics?.sources || {
    organic: { impressions: 0, views: 0, contacts: 0 },
    sponsored: { impressions: 0, views: 0, contacts: 0 },
    direct: { impressions: 0, views: 0, contacts: 0 },
  };

  const channels = analytics?.channels || {
    whatsapp: 0,
    telegram: 0,
    phone: 0,
    website: 0,
  };

  const timeSeries = analytics?.time_series || [];

  return (
    <AdvertiserLayout advertiser={advertiser}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
        {/* Top Header & Period Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Badge variant="gold">ANALYTICS & DESEMPENHO</Badge>
              <Badge variant="neutral">Dados Agregados</Badge>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Desempenho & Inteligência de Funil</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              Entenda como seu anúncio é encontrado nas buscas e quais canais geram mais intenções de contato
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Skeleton height="110px" />
              <Skeleton height="110px" />
              <Skeleton height="110px" />
              <Skeleton height="110px" />
            </div>
            <Skeleton height="220px" />
          </div>
        ) : (
          <>
            {/* KPI Summary Cards (4 Cards) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Descoberta (Impressões)</span>
                  <Layers size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{funnel.impressions.toLocaleString('pt-BR')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  {trends.impressions_trend_percent >= 0 ? (
                    <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <TrendingUp size={12} /> +{trends.impressions_trend_percent}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--accent-ruby)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <TrendingDown size={12} /> {trends.impressions_trend_percent}%
                    </span>
                  )}
                  <span style={{ color: 'var(--text-muted)' }}>vs. período anterior</span>
                </div>
              </Card>

              <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--accent-gold)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Aberturas de Perfil</span>
                  <Eye size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{funnel.profile_views.toLocaleString('pt-BR')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Taxa de Abertura: <strong>{funnel.profile_open_rate}%</strong></span>
                </div>
              </Card>

              <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-success)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Intenções de Contato</span>
                  <Phone size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success)' }}>{funnel.contact_clicks.toLocaleString('pt-BR')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                  {trends.contacts_trend_percent >= 0 ? (
                    <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <TrendingUp size={12} /> +{trends.contacts_trend_percent}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Estável</span>
                  )}
                  <span style={{ color: 'var(--text-muted)' }}>vs. período anterior</span>
                </div>
              </Card>

              <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-info)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Taxa de Conversão</span>
                  <BarChart3 size={16} />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-info)' }}>{funnel.contact_conversion_rate}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Visualizações que clicaram em contato
                </div>
              </Card>
            </div>

            {/* Funnel Visualizer Card */}
            <Card variant="glass" padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Funil de Conversão do Anúncio</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
                    Acompanhe a passagem da descoberta nas buscas até a intenção real de contato
                  </p>
                </div>
                <Badge variant="gold">Funil de 3 Etapas</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                {/* Step 1 */}
                <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>1. Descoberta</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{funnel.impressions.toLocaleString('pt-BR')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aparições em buscas e listas</div>
                </div>

                {/* Step 2 */}
                <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 700 }}>2. Aberturas de Perfil</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.25rem' }}>{funnel.profile_views.toLocaleString('pt-BR')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taxa de clique: <strong>{funnel.profile_open_rate}%</strong></div>
                </div>

                {/* Step 3 */}
                <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(37, 211, 102, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', textTransform: 'uppercase', fontWeight: 700 }}>3. Intenção de Contato</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>{funnel.contact_clicks.toLocaleString('pt-BR')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Taxa de contato: <strong>{funnel.contact_conversion_rate}%</strong></div>
                </div>
              </div>
            </Card>

            {/* Time Series Performance Chart Card */}
            <Card variant="glass" padding="lg">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Desempenho ao Longo do Tempo</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
                    Evolução diária das interações com seu anúncio
                  </p>
                </div>

                {/* Metric Switcher */}
                <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <Button
                    variant={activeMetric === 'profile_views' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveMetric('profile_views')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Visualizações
                  </Button>
                  <Button
                    variant={activeMetric === 'impressions' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveMetric('impressions')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Impressões
                  </Button>
                  <Button
                    variant={activeMetric === 'contact_clicks' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveMetric('contact_clicks')}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Contatos
                  </Button>
                </div>
              </div>

              {/* Time Series Bar Visualization */}
              {timeSeries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  Sem dados para o período selecionado
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    {timeSeries.map((pt) => {
                      const val = pt[activeMetric] || 0;
                      const maxVal = Math.max(...timeSeries.map((t) => t[activeMetric] || 0), 1);
                      const heightPercent = Math.max((val / maxVal) * 100, 8);

                      return (
                        <div key={pt.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '32px',
                              height: `${heightPercent}%`,
                              background: activeMetric === 'contact_clicks' ? 'var(--color-success)' : 'var(--accent-gold)',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease',
                            }}
                            title={`${pt.date}: ${val}`}
                          />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            {pt.date.slice(8, 10)}/{pt.date.slice(5, 7)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Two Column Section: Sources vs Channels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Traffic Origin Breakdown */}
              <Card variant="glass" padding="md">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Origem da Descoberta</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Como as pessoas encontram o seu perfil no Portal18
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <span>Busca Orgânica</span>
                    <strong>{sources.organic.impressions} impressões</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <span>Destaque Patrocinado</span>
                    <strong>{sources.sponsored.impressions} impressões</strong>
                  </div>
                </div>
              </Card>

              {/* Contact Channels Breakdown */}
              <Card variant="glass" padding="md">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Canais de Contato</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Distribuição das intenções de contato pelos botões do perfil
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageCircle size={16} color="var(--color-success)" />
                      <span>WhatsApp</span>
                    </div>
                    <strong>{channels.whatsapp} cliques</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={16} color="var(--color-info)" />
                      <span>Telefone / Chamada</span>
                    </div>
                    <strong>{channels.phone} cliques</strong>
                  </div>
                </div>
              </Card>
            </div>

            {/* Insights & Recommendations */}
            {analytics?.insights && analytics.insights.length > 0 && (
              <Card variant="glass" padding="md" style={{ border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={18} color="var(--accent-gold)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Inteligência de Desempenho</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {analytics.insights.map((ins) => (
                    <div key={ins.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)' }}>
                      <Info size={16} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{ins.title}</strong>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ins.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdvertiserLayout>
  );
}
