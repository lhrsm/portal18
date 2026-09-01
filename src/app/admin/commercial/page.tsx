'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminCommercialService } from '@/services/adminCommercialService';
import { commercialCatalogService } from '@/services/commercialCatalogService';
import { consumerSubscriptionService } from '@/services/consumerSubscriptionService';
import { discoveryRankingService } from '@/services/discovery/discoveryRankingService';
import {
  AdminCommercialOverview,
  OperationalAlert,
  PaymentReadinessCheckItem,
  CatalogPlan,
  BillingPeriod,
  ConsumerPlan,
  CommercialInventorySlot
} from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Crown,
  Layers,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  Users,
  Gift,
  Compass,
  Star,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  CreditCard,
  Lock,
  ArrowRight,
  TrendingUp,
  Megaphone,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

export default function AdminCommercialOperationsPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [overview, setOverview] = useState<AdminCommercialOverview | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [readinessChecks, setReadinessChecks] = useState<PaymentReadinessCheckItem[]>([]);
  const [advertiserPlans, setAdvertiserPlans] = useState<CatalogPlan[]>([]);
  const [consumerPlans, setConsumerPlans] = useState<ConsumerPlan[]>([]);
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [inventorySlots, setInventorySlots] = useState<CommercialInventorySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ov, advCat, consCat, slots] = await Promise.all([
      adminCommercialService.getCommercialOverview(),
      commercialCatalogService.getCatalog(),
      consumerSubscriptionService.getCatalog(),
      discoveryRankingService.getInventorySlots(),
    ]);

    setOverview(ov);
    setAlerts(adminCommercialService.getOperationalAlerts(ov));
    setReadinessChecks(adminCommercialService.getPaymentReadinessChecklist());

    if (advCat && advCat.success) {
      setAdvertiserPlans(advCat.plans);
      setPeriods(advCat.periods);
    }
    if (consCat && consCat.success) {
      setConsumerPlans(consCat.plans);
    }
    setInventorySlots(slots);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (type: 'subscriptions' | 'campaigns' | 'referrals') => {
    setIsExporting(true);
    try {
      const csv = await adminCommercialService.exportCommercialData({ type, format: 'csv' });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portal18_export_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast({ type: 'success', title: 'Exportação Concluída', message: `Arquivo CSV de ${type} gerado com sucesso.` });
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao exportar dados.' });
    } finally {
      setIsExporting(false);
    }
  };

  const formatPrice = (cents?: number) => {
    if (cents === undefined || cents === null) return 'A definir';
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const metrics = overview?.metrics || {
    total_advertisers: 0,
    active_trials: 0,
    trials_ending_soon: 0,
    limited_mode_advertisers: 0,
    active_advertiser_subs: 0,
    active_consumer_subs: 0,
    pending_referrals: 0,
    referrals_manual_review: 0,
    active_campaigns: 0,
    pending_reviews: 0,
    reviews_delayed: 0,
    inventory_slots_total: 0,
    inventory_slots_reserved: 0,
    inventory_utilization_percent: 0,
  };

  return (
    <AdminLayout>
      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">OPERATIONS & GOVERNANCE</Badge>
            <Badge variant="neutral">Phase 27G</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Centro de Operações Comerciais</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Governança integrada de anunciantes, clientes Consumer Premium, planos, inventário e pagamentos
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={loadData} leftIcon={<RefreshCw size={14} />}>
            Atualizar
          </Button>
          <Badge variant="neutral">Policy v1</Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'overview', label: 'Visão Geral & Alertas', icon: <Layers size={15} /> },
          { id: 'advertisers', label: 'Anunciantes & Planos', icon: <Crown size={15} /> },
          { id: 'consumers', label: 'Consumer Premium', icon: <Users size={15} /> },
          { id: 'pricing', label: 'Matriz de Preços', icon: <CreditCard size={15} /> },
          { id: 'inventory', label: 'Inventário & Campanhas', icon: <Megaphone size={15} /> },
          { id: 'referrals', label: 'Indicações & Antifraude', icon: <Gift size={15} /> },
          { id: 'readiness', label: 'Payment Readiness', icon: <ShieldCheck size={15} /> },
          { id: 'exports', label: 'Auditoria & Exportações', icon: <FileSpreadsheet size={15} /> },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            leftIcon={tab.icon}
            style={{ whiteSpace: 'nowrap', fontSize: '0.825rem' }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* 1. OVERVIEW & OPERATIONAL ALERTS TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Operational Alerts Bar */}
          {alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alerts.map((alt) => (
                <Card
                  key={alt.id}
                  variant="glass"
                  padding="md"
                  style={{
                    borderLeft: `4px solid ${alt.severity === 'critical' ? 'var(--accent-ruby)' : alt.severity === 'warning' ? 'var(--accent-gold)' : 'var(--color-info)'}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {alt.severity === 'critical' ? (
                        <AlertTriangle size={20} color="var(--accent-ruby)" />
                      ) : alt.severity === 'warning' ? (
                        <Clock size={20} color="var(--accent-gold)" />
                      ) : (
                        <AlertCircle size={20} color="var(--color-info)" />
                      )}
                      <div>
                        <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>{alt.title}</strong>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>{alt.description}</p>
                      </div>
                    </div>

                    {alt.action_href && (
                      <Link href={alt.action_href}>
                        <Button variant="secondary" size="sm">
                          {alt.action_label || 'Detalhes'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Master Real KPI Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Card variant="glass" padding="md">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Anunciantes Ativos</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                {loading ? <Skeleton width="60px" height="28px" /> : metrics.total_advertisers}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Perfis publicados no discovery</span>
            </Card>

            <Card variant="glass" padding="md" style={{ border: metrics.active_trials > 0 ? '1px solid var(--accent-gold)' : undefined }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Trials Premium Ativos</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)', margin: '0.25rem 0' }}>
                {loading ? <Skeleton width="60px" height="28px" /> : metrics.active_trials}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{metrics.trials_ending_soon} terminam em 24h</span>
            </Card>

            <Card variant="glass" padding="md">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Limited Mode (Sem Plano)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                {loading ? <Skeleton width="60px" height="28px" /> : metrics.limited_mode_advertisers}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Contatos abertos, sem boosts</span>
            </Card>

            <Card variant="glass" padding="md">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consumer Premium</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)', margin: '0.25rem 0' }}>
                {loading ? <Skeleton width="60px" height="28px" /> : metrics.active_consumer_subs}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clientes com vídeo/reviews</span>
            </Card>

            <Card variant="glass" padding="md">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ocupação do Inventário</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                {loading ? <Skeleton width="60px" height="28px" /> : `${metrics.inventory_utilization_percent}%`}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{metrics.inventory_slots_reserved} de {metrics.inventory_slots_total} slots</span>
            </Card>

            <Card variant="glass" padding="md">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avaliações Pendentes</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: metrics.pending_reviews > 0 ? 'var(--accent-gold)' : 'var(--text-primary)', margin: '0.25rem 0' }}>
                {loading ? <Skeleton width="60px" height="28px" /> : metrics.pending_reviews}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{metrics.reviews_delayed} com mais de 24h</span>
            </Card>
          </div>

          {/* Quick Operations Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Gestão de Planos & Períodos</strong>
                <Crown size={18} color="var(--accent-gold)" />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Configuração de pacotes Essencial, Destaque, Premium e VIP por ciclos de 7, 30 e 90 dias.
              </p>
              <Link href="/admin/plans">
                <Button variant="outline" size="sm" fullWidth>
                  Ver Catálogo de Planos →
                </Button>
              </Link>
            </Card>

            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Moderação de Avaliações</strong>
                <Star size={18} color="var(--accent-gold)" />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Fila de aprovação de avaliações estruturadas da comunidade de clientes.
              </p>
              <Link href="/admin/moderation/reviews">
                <Button variant="outline" size="sm" fullWidth>
                  Fila de Avaliações ({metrics.pending_reviews}) →
                </Button>
              </Link>
            </Card>

            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Discovery & Inventário</strong>
                <Compass size={18} color="var(--accent-gold)" />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Controle de slots patrocinados, suavização Bayesiana e ranking de descoberta.
              </p>
              <Link href="/admin/discovery">
                <Button variant="outline" size="sm" fullWidth>
                  Painel de Ranking →
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}

      {/* 2. ADVERTISERS & SUBSCRIPTIONS TAB */}
      {activeTab === 'advertisers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Planos Comerciais de Anunciantes</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Pacotes comerciais ativos, limites de mídia e períodos homologados
              </p>
            </div>
            <Link href="/admin/subscriptions">
              <Button variant="secondary" size="sm">
                Ver Assinaturas Individuais →
              </Button>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {advertiserPlans.map((plan) => (
              <Card key={plan.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Badge variant="success">Ativo</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordem: {plan.sort_order}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{plan.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minHeight: '32px', margin: '0 0 0.75rem 0' }}>
                  {plan.description}
                </p>

                <div style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>Fotos:</strong> {plan.media_limit} fotos</div>
                  <div><strong>Vídeos:</strong> {plan.video_limit > 0 ? `${plan.video_limit} vídeos` : 'Não'}</div>
                  <div><strong>Boosts:</strong> {plan.boost_allowance}/ciclo</div>
                  <div><strong>Analytics:</strong> {plan.analytics_level}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. CONSUMER PREMIUM TAB */}
      {activeTab === 'consumers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Catálogo Consumer Premium</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Gestão de benefícios para clientes autenticados (vídeos exclusivos, avaliações moderadas e listas)
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {consumerPlans.map((cp) => (
              <Card key={cp.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <Badge variant={cp.slug === 'premium' ? 'gold' : 'neutral'}>
                    {cp.slug.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Policy v1</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{cp.name}</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                  {cp.description}
                </p>

                <div style={{ padding: '0.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {Object.entries(cp.pricing || {}).map(([pSlug, pr]) => (
                    <div key={pSlug} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ textTransform: 'capitalize' }}>{pSlug.replace('_', ' ')}:</span>
                      <strong>{formatPrice(pr.price_cents)}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4. PRICING MATRIX TAB */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Matriz de Precificação Unificada (BRL)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Valores em centavos inteiros com versionamento imutável (Policy v1)
            </p>
          </div>

          <Card variant="glass" padding="md" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th scope="col" style={{ padding: '0.75rem' }}>Plano / Produto</th>
                  <th scope="col" style={{ padding: '0.75rem' }}>Público</th>
                  <th scope="col" style={{ padding: '0.75rem' }}>7 Dias</th>
                  <th scope="col" style={{ padding: '0.75rem' }}>30 Dias</th>
                  <th scope="col" style={{ padding: '0.75rem' }}>90 Dias</th>
                  <th scope="col" style={{ padding: '0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {advertiserPlans.map((pl) => (
                  <tr key={pl.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{pl.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Anunciante</td>
                    <td style={{ padding: '0.75rem' }}>{formatPrice(pl.pricing['7_days']?.price_cents)}</td>
                    <td style={{ padding: '0.75rem' }}>{formatPrice(pl.pricing['30_days']?.price_cents)}</td>
                    <td style={{ padding: '0.75rem' }}>{formatPrice(pl.pricing['90_days']?.price_cents)}</td>
                    <td style={{ padding: '0.75rem' }}><Badge variant="success">Ativo</Badge></td>
                  </tr>
                ))}
                {consumerPlans.map((cp) => (
                  <tr key={cp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{cp.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Cliente / Visitante</td>
                    <td style={{ padding: '0.75rem' }}>{formatPrice(cp.pricing['7_days']?.price_cents)}</td>
                    <td style={{ padding: '0.75rem' }}>{formatPrice(cp.pricing['30_days']?.price_cents)}</td>
                    <td style={{ padding: '0.75rem' }}>{formatPrice(cp.pricing['90_days']?.price_cents)}</td>
                    <td style={{ padding: '0.75rem' }}><Badge variant="gold">Consumer</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* 5. INVENTORY & CAMPAIGNS TAB */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Inventário Comercial de Destaques</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Capacidade de posições patrocinadas por escopo geográfico e taxonômico
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {inventorySlots.map((slot) => {
              return (
                <Card key={slot.id} variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.95rem', textTransform: 'capitalize' }}>{slot.placement.replace('_', ' ')}</strong>
                    <Badge variant={slot.is_active ? 'success' : 'neutral'}>{slot.is_active ? 'Ativo' : 'Pausado'}</Badge>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                    Escopo: {slot.scope_type} {slot.scope_id ? `(${slot.scope_id})` : '(Nacional)'}
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <span>Slots Máximos: <strong>{slot.max_slots}</strong></span>
                    <span>Cap Patrocinado: <strong>{Math.round(slot.max_sponsored_ratio * 100)}%</strong></span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. REFERRALS & FRAUD TAB */}
      {activeTab === 'referrals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Indicações & Motor Antifraude</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Regras de qualificação e auditoria de recompensas em dias de visibilidade
              </p>
            </div>
            <Link href="/admin/referrals">
              <Button variant="secondary" size="sm">
                Abrir Fila de Indicações →
              </Button>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Card variant="glass" padding="md">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Indicações Pendentes</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0' }}>
                {metrics.pending_referrals}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aguardando qualificação</span>
            </Card>

            <Card variant="glass" padding="md" style={{ border: metrics.referrals_manual_review > 0 ? '1px solid var(--accent-ruby)' : undefined }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Em Análise Antifraude</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: metrics.referrals_manual_review > 0 ? 'var(--accent-ruby)' : 'var(--text-primary)', margin: '0.25rem 0' }}>
                {metrics.referrals_manual_review}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sinais de risco ou self-referral</span>
            </Card>
          </div>
        </div>
      )}

      {/* 7. PAYMENT READINESS TAB */}
      {activeTab === 'readiness' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Badge variant="ruby">KILL SWITCH ATIVO</Badge>
              <Badge variant="neutral">Zero Fake Charges</Badge>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Governança & Checklist de Pagamentos</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Status das dependências e prontidão técnica para homologação de gateways futuros
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {readinessChecks.map((chk) => (
              <Card key={chk.id} variant="glass" padding="md">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {chk.status === 'passed' ? (
                      <CheckCircle2 size={20} color="var(--color-success)" />
                    ) : (
                      <Lock size={20} color="var(--accent-ruby)" />
                    )}
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{chk.name}</strong>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>{chk.description}</p>
                    </div>
                  </div>

                  <Badge variant={chk.status === 'passed' ? 'success' : 'ruby'}>
                    {chk.status === 'passed' ? 'PRONTO' : 'BLOQUEADO'}
                  </Badge>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Evidência: {chk.evidence}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 8. AUDIT & EXPORTS TAB */}
      {activeTab === 'exports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Auditoria & Exportações Comerciais</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Exportação segura de relatórios administrativos sem vazamento de dados confidenciais
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Exportar Assinaturas</strong>
                <Download size={18} color="var(--accent-gold)" />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Relatório CSV com histórico de ciclos, planos e status de assinantes.
              </p>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                disabled={isExporting}
                onClick={() => handleExport('subscriptions')}
              >
                Baixar CSV de Assinaturas
              </Button>
            </Card>

            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Exportar Campanhas</strong>
                <Download size={18} color="var(--accent-gold)" />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Relatório CSV de campanhas de destaque e utilização de posições.
              </p>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                disabled={isExporting}
                onClick={() => handleExport('campaigns')}
              >
                Baixar CSV de Campanhas
              </Button>
            </Card>

            <Card variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.95rem' }}>Exportar Indicações</strong>
                <Download size={18} color="var(--accent-gold)" />
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Relatório CSV do ledger de indicações e bônus concedidos.
              </p>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                disabled={isExporting}
                onClick={() => handleExport('referrals')}
              >
                Baixar CSV de Indicações
              </Button>
            </Card>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
