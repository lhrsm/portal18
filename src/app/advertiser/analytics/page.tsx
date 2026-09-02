'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { conversionIntelligenceService, AdvertiserConversionIntelligence } from '@/services/advertiser/conversionIntelligenceService';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Eye,
  TrendingUp,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Download,
  ExternalLink,
  Phone,
  Search,
  MapPin,
  Heart,
  Users,
  Image as ImageIcon
} from 'lucide-react';

export default function AdvertiserAnalyticsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [intelligence, setIntelligence] = useState<AdvertiserConversionIntelligence | null>(null);
  const [period, setPeriod] = useState<0 | 7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (selectedPeriod: 0 | 7 | 30 | 90) => {
    if (!profile) return;
    setLoading(true);
    const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
    setAdvertiser(adv);
    if (adv) {
      const data = await conversionIntelligenceService.getConversionIntelligence(adv.id, selectedPeriod);
      setIntelligence(data);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      loadData(period);
    }
  }, [authLoading, period, loadData]);

  const handleExportCSV = () => {
    if (!intelligence) return;
    const csvContent = conversionIntelligenceService.exportToCSV(intelligence);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `portal18-analytics-${advertiser?.slug || 'anunciante'}-${period}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ type: 'success', title: 'Exportação Concluída', message: 'Relatório baixado sem dados pessoais de visitantes.' });
  };

  const funnel = intelligence?.funnel || {
    impressions: 0,
    profile_views: 0,
    interactions: 0,
    contact_intents: 0,
    profile_open_rate: 0,
    contact_ctr: 0,
    overall_ctr: 0,
  };

  const comparison = intelligence?.comparison || {
    prev_impressions: 0,
    prev_profile_views: 0,
    prev_contact_intents: 0,
    views_trend: 'estável',
    contacts_trend: 'estável',
    insufficient_sample: true,
  };

  const channels = intelligence?.channels || {
    whatsapp: 0,
    phone: 0,
    telegram: 0,
    website: 0,
  };

  const sources = intelligence?.sources || {
    search_organic: 0,
    city_page: 0,
    category_page: 0,
    recommendations: 0,
    direct_and_favorites: 0,
  };

  const searchKeywords = intelligence?.search_keywords || [];
  const mediaPerf = intelligence?.media_performance || [];
  const insights = intelligence?.insights || [];
  const recommendations = intelligence?.recommendations || [];

  const profileUrl = advertiser ? `/perfil/${(advertiser as any).state_slug || 'br'}/${(advertiser as any).city_slug || 'geral'}/${advertiser.slug}` : '/explorar';

  return (
    <AdvertiserLayout advertiser={advertiser}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
        {/* Top Header & Period Filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Badge variant="gold">CONVERSÃO & DESEMPENHO</Badge>
              <Badge variant="neutral">Dados Auditáveis</Badge>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Inteligência Comercial & Funil</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              Entenda como seu anúncio é descoberto e quais canais geram mais intenções reais de contato
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href={profileUrl} target="_blank">
              <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={14} />}>
                Ver como Visitante
              </Button>
            </Link>

            <Button variant="secondary" size="sm" onClick={handleExportCSV} leftIcon={<Download size={14} />}>
              Exportar CSV
            </Button>

            {/* Period Selector */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`btn btn-sm ${period === 0 ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(0)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
              >
                Hoje
              </button>
              <button
                type="button"
                className={`btn btn-sm ${period === 7 ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(7)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
              >
                7d
              </button>
              <button
                type="button"
                className={`btn btn-sm ${period === 30 ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(30)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
              >
                30d
              </button>
              <button
                type="button"
                className={`btn btn-sm ${period === 90 ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPeriod(90)}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem' }}
              >
                90d
              </button>
            </div>
          </div>
        </div>

        {/* Small Sample Guidance Note */}
        {comparison.insufficient_sample && (
          <Card variant="glass" padding="sm" style={{ background: 'rgba(218, 165, 32, 0.04)', border: '1px solid rgba(218, 165, 32, 0.2)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Info size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Amostra inicial:</strong> O perfil está acumulando histórico. Comparações percentuais aparecerão com maior precisão conforme o volume de visitas aumentar.
              </span>
            </div>
          </Card>
        )}

        {/* 1. Main Conversion Funnel Cards */}
        <section aria-labelledby="funnel-heading">
          <h2 id="funnel-heading" className="sr-only">Funil de Conversão</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {/* Step 1: Impressions */}
            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>1. Descoberta & Impressões</span>
                <Search size={18} color="var(--accent-gold)" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {loading ? <Skeleton height="2.2rem" width="80px" /> : funnel.impressions.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                Vezes que seu card apareceu na busca
              </div>
            </Card>

            {/* Step 2: Profile Views */}
            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>2. Visualizações de Perfil</span>
                <Eye size={18} color="var(--color-info)" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {loading ? <Skeleton height="2.2rem" width="80px" /> : funnel.profile_views.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>Taxa de Abertura: <strong>{funnel.profile_open_rate}%</strong></span>
                {!comparison.insufficient_sample && (
                  <span style={{ color: comparison.views_trend.startsWith('+') ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    ({comparison.views_trend})
                  </span>
                )}
              </div>
            </Card>

            {/* Step 3: Contact Intents */}
            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>3. Intenções de Contato</span>
                <MessageCircle size={18} color="var(--color-success)" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {loading ? <Skeleton height="2.2rem" width="80px" /> : funnel.contact_intents.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>CTR de Contato: <strong>{funnel.contact_ctr}%</strong></span>
                {!comparison.insufficient_sample && (
                  <span style={{ color: comparison.contacts_trend.startsWith('+') ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    ({comparison.contacts_trend})
                  </span>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* 2. Contact Channels Breakdown & Engagement */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Contact Channels */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={16} color="var(--accent-gold)" /> Intenções por Canal de Atendimento
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <MessageCircle size={16} color="#25D366" />
                  <span>WhatsApp</span>
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{channels.whatsapp}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <Phone size={16} color="var(--color-info)" />
                  <span>Ligação Telefônica</span>
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{channels.phone}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <Heart size={16} color="var(--accent-ruby)" />
                  <span>Salvo nos Favoritos</span>
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{intelligence?.engagement.favorites || 0}</strong>
              </div>
            </div>
          </Card>

          {/* Discovery Sources */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--accent-gold)" /> Origem da Descoberta
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Busca Direta & Filtros</span>
                <strong>{sources.search_organic} visualizações</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Página da Cidade ({(advertiser as any)?.city_name || 'Região'})</span>
                <strong>{sources.city_page} visualizações</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Página de Categoria</span>
                <strong>{sources.category_page} visualizações</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recomendações de Semelhantes</span>
                <strong>{sources.recommendations} visualizações</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. Aggregated Search Keywords & Media Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Search Keywords (Privacy Threshold >= 5) */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Search size={16} color="var(--accent-gold)" /> Termos Mais Buscados na Sua Categoria
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Termos anônimos mais procurados pelos visitantes na região (amostra mínima: 5 buscas).
            </p>
            {searchKeywords.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center' }}>
                Acumulando termos agregados para sua cidade...
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {searchKeywords.map((kw, idx) => (
                  <span key={idx} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {kw.keyword} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({kw.count})</span>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Deterministic Actionable Recommendations */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} color="var(--accent-gold)" /> Recomendações de Melhoria
            </h3>
            {recommendations.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                <CheckCircle2 size={18} /> Seu perfil está completo e atendendo a todas as boas práticas!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recommendations.map((rec) => (
                  <div key={rec.id} style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>{rec.title}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{rec.reason}</span>
                    </div>
                    <Link href={rec.cta_url}>
                      <Button variant="outline" size="sm" style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', minHeight: '36px' }}>
                        {rec.cta_label}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdvertiserLayout>
  );
}
