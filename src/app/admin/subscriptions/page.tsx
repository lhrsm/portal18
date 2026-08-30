'use client';

import React, { useState, useEffect } from 'react';
import { billingService } from '@/services/billingService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Crown, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await billingService.getAdminSubscriptions({ status: statusFilter || undefined });
    setSubscriptions(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Assinaturas da Plataforma</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Controle de planos recorrentes ativos, renovações e cancelamentos de anunciantes
          </p>
        </div>
        <Badge variant="gold">{totalCount} assinaturas</Badge>
      </div>

      {/* Filter */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ minWidth: '220px' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholderOption="Todos os Status">
            <option value="active">Ativas (Pagas e Trials)</option>
            <option value="trial">Em Período de Experiência (Trial)</option>
            <option value="grace_period">Período de Tolerância (Grace Period)</option>
            <option value="pending">Pendentes</option>
            <option value="cancelled">Canceladas</option>
            <option value="past_due">Atrasadas (Past Due)</option>
            <option value="expired">Expiradas</option>
          </Select>
        </div>
      </Card>

      {/* Subscriptions List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Crown size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhuma assinatura encontrada</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Assinaturas contratadas ou trials ativos de anunciantes serão exibidos nesta fila.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {subscriptions.map((sub) => {
            const isTrial = sub.provider === 'portal18_trial' || (sub.trial_end && new Date(sub.trial_end).getTime() > Date.now());

            return (
              <Card key={sub.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                      {sub.advertiser_profiles?.stage_name || 'Anunciante'}
                    </span>
                    {isTrial ? (
                      <Badge variant="gold">PREMIUM TRIAL</Badge>
                    ) : (
                      <Badge variant={sub.status === 'active' ? 'success' : sub.status === 'cancelled' ? 'ruby' : 'warning'}>
                        {sub.status.toUpperCase()}
                      </Badge>
                    )}
                    {sub.cancel_at_period_end && (
                      <Badge variant="warning">Cancela no fim do ciclo</Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Plano: <strong>{isTrial ? 'Premium (Trial 7d)' : sub.subscription_plans?.name || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Início: {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    <span>•</span>
                    <span>Renovação/Fim: {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('pt-BR') : 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                    {sub.subscription_plans?.price_amount ? formatPrice(sub.subscription_plans.price_amount) : 'R$ 0,00'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mês</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
