'use client';

import React, { useState, useEffect } from 'react';
import { billingService } from '@/services/billingService';
import { SubscriptionPlan } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Crown, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await billingService.getSubscriptionPlans();
      setPlans(data);
      setLoading(false);
    }
    load();
  }, []);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Gestão de Planos & Benefícios</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configuração dos pacotes comerciais oficiais e limites de recursos para anunciantes
          </p>
        </div>
        <Badge variant="gold">{plans.length} planos cadastrados</Badge>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <Skeleton height="280px" />
          <Skeleton height="280px" />
          <Skeleton height="280px" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {plans.map((plan) => (
            <Card key={plan.id} variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <Badge variant={plan.status === 'active' ? 'success' : 'neutral'}>
                  {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ordem: {plan.sort_order}</span>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>{plan.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', minHeight: '36px' }}>
                {plan.description}
              </p>

              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                {formatPrice(plan.price_amount)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mês</span>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: 'auto' }}>
                <div><strong>Limite de Fotos:</strong> {plan.media_limit}</div>
                <div><strong>Suporte a Vídeo:</strong> {plan.video_limit ? 'Sim' : 'Não'}</div>
                <div><strong>Impulsionamentos:</strong> {plan.boost_allowance}/mês</div>
                <div><strong>Nível de Analytics:</strong> {plan.analytics_level}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
