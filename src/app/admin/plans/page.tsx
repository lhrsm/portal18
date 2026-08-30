'use client';

import React, { useState, useEffect } from 'react';
import { commercialCatalogService } from '@/services/commercialCatalogService';
import { CatalogPlan, BillingPeriod } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Crown, Layers, Clock, ShieldCheck } from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const catalog = await commercialCatalogService.getCatalog();
      if (catalog && catalog.success) {
        setPlans(catalog.plans);
        setPeriods(catalog.periods);
      }
      setLoading(false);
    }
    load();
  }, []);

  const formatPrice = (cents?: number) => {
    if (cents === undefined || cents === null) return 'A definir';
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">COMMERCIAL CATALOG</Badge>
            <Badge variant="neutral">Policy v1</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Gestão de Planos & Períodos Comerciais</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Configuração dos pacotes comerciais oficiais, matriz de precificação por período e limites de recursos
          </p>
        </div>
        <Badge variant="gold">{plans.length} planos ativos • {periods.length} períodos</Badge>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <Skeleton height="320px" />
          <Skeleton height="320px" />
          <Skeleton height="320px" />
          <Skeleton height="320px" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {plans.map((plan) => (
            <Card key={plan.id} variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Badge variant="success">Ativo</Badge>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ordem: {plan.sort_order}</span>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>{plan.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '36px' }}>
                {plan.description}
              </p>

              {/* Pricing Matrix by Period */}
              <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Precificação por Período:</span>
                {periods.map((p) => {
                  const pricing = plan.pricing[p.slug];
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                      <span>{p.name.split(' ')[0]} ({p.duration_days}d):</span>
                      <strong>{formatPrice(pricing?.price_cents)}</strong>
                    </div>
                  );
                })}
              </div>

              {/* Entitlement limits */}
              <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: 'auto' }}>
                <div><strong>Limite de Fotos:</strong> {plan.media_limit} fotos</div>
                <div><strong>Vídeos Comerciais:</strong> {plan.video_limit > 0 ? `${plan.video_limit} vídeos` : 'Não'}</div>
                <div><strong>Impulsionamentos:</strong> {plan.boost_allowance}/ciclo</div>
                <div><strong>Nível de Analytics:</strong> {plan.analytics_level}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
