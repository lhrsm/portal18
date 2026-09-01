'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { growthIntelligenceService } from '@/services/growth/growthIntelligenceService';
import { RegionalGrowthStats, OpportunitySignal } from '@/services/growth/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  MapPin,
  TrendingUp,
  Sparkles,
  Users,
  Search,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function AdminGrowthRegionsPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<RegionalGrowthStats[]>([]);
  const [signals, setSignals] = useState<Array<{ city: string; state: string; signal: OpportunitySignal; description: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [st, sigs] = await Promise.all([
      growthIntelligenceService.getRegionalStats(),
      growthIntelligenceService.getOpportunitySignals(),
    ]);
    setStats(st);
    setSignals(sigs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateReadiness = async (stateCode: string, citySlug: string, newStatus: any) => {
    const res = await growthIntelligenceService.updateCityReadiness(stateCode, citySlug, newStatus);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Status Atualizado',
        message: `Prontidão de ${citySlug} alterada para ${newStatus}.`,
      });
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao atualizar prontidão.',
      });
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Inteligência de Expansão Regional & Prontidão de Cidades
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Monitoramento de inventário real, impressões de busca locais e conversão de anunciantes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData} isLoading={loading}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <Link href="/admin/growth/seo" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="sm">
            SEO & Indexabilidade
          </Button>
        </Link>
        <Link href="/admin/growth/regions" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">
            Expansão Regional
          </Button>
        </Link>
        <Link href="/admin/growth/experiments" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="sm">
            Testes A/B & Experimentos
          </Button>
        </Link>
      </div>

      {/* Opportunity Signals */}
      {signals.length > 0 && (
        <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-gold)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} /> Sinais Determinísticos de Oportunidade
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {signals.map((sig, idx) => (
              <div key={idx} style={{ background: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {sig.city}, {sig.state}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {sig.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Table */}
      <Card variant="glass" padding="none">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Skeleton width="100%" height="45px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="100%" height="45px" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Cidade / UF</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status de Prontidão</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Perfis Ativos</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Perfis Verificados</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Buscas Locais</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contatos</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      {s.city_name} ({s.state_code})
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={s.readiness_status === 'active' || s.readiness_status === 'high_activity' ? 'success' : s.readiness_status === 'ready' ? 'gold' : 'neutral'}>
                        {s.readiness_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{s.active_profiles_count}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--color-success)' }}>{s.verified_profiles_count}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{s.search_impressions_count.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{s.contact_clicks_count.toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select
                        value={s.readiness_status}
                        onChange={(e) => handleUpdateReadiness(s.state_code, s.city_slug, e.target.value)}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <option value="inactive">Inactive</option>
                        <option value="emerging">Emerging</option>
                        <option value="ready">Ready</option>
                        <option value="active">Active</option>
                        <option value="high_activity">High Activity</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
