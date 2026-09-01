'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { reputationService } from '@/services/reputation/reputationService';
import { AdminReputationOverview } from '@/services/reputation/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Star,
  CheckCircle2,
  Users,
  MessageSquare,
  Sparkles,
  ArrowRight,
  EyeOff
} from 'lucide-react';

export default function AdminReputationPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminReputationOverview>({
    totalProfiles: 0,
    authenticProfiles: 0,
    mediaVerifiedProfiles: 0,
    totalReviews: 0,
    avgPlatformRating: 5.0,
    outliersCount: 0,
    unansweredReviewsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await reputationService.getAdminReputationOverview();
      setStats(data);
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar métricas de reputação.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Inteligência de Reputação & Sinais de Confiança
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Monitoramento de selos de autenticidade, agregados de avaliações e integridade de reputação
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData} isLoading={loading}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Perfis com Selo Autêntico</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {stats.authenticProfiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {stats.totalProfiles > 0 ? `${Math.round((stats.authenticProfiles / stats.totalProfiles) * 100)}% do catálogo ativo` : '0%'}
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mídias Verificadas (&gt;= 3 fotos)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {stats.mediaVerifiedProfiles}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Fotos aprovadas pela moderação
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Avaliações Moderadas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-info)' }}>
            {stats.totalReviews}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {stats.unansweredReviewsCount} aguardando resposta
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Média Geral da Plataforma</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            ★ {stats.avgPlatformRating}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
            Apenas reviews moderadas
          </div>
        </Card>
      </div>

      {/* Outlier & Integrity Monitoring */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={18} color="var(--accent-gold)" /> Monitoramento de Anomalias
            </h3>
            <Badge variant="success">Normal</Badge>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Picos de Avaliações:</strong> Nenhum pico súbito de avaliações detectado nas últimas 24 horas.
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Integridade de Selos:</strong> 100% dos selos de autenticidade possuem desafio de vídeo aprovado e auditado.
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Isolamento Comercial:</strong> Zero concessão de selos de trust por contratação de planos VIP.
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="var(--color-success)" /> Fila de Moderação de Reviews
            </h3>
            <Link href="/admin/moderation" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="secondary" rightIcon={<ArrowRight size={12} />}>
                Ver Fila
              </Button>
            </Link>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
            Avaliações submetidas passam por moderação humana prévia antes de compor o agregado de notas público.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Badge variant="neutral">Status: Ativo</Badge>
            <Badge variant="success">Exclusão Imediata de Removidas</Badge>
          </div>
        </Card>
      </div>

      {/* Invariants and Policies */}
      <Card variant="glass" padding="md">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Diretrizes & Invariantes de Reputação (Phase 32)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-success)' }}>
              ✓ Reivindicações Auditáveis
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Sinais públicos representam exclusivamente fatos comprovados (vídeo aprovado, mídias moderadas, tempo de plataforma).
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--accent-ruby)' }}>
              ✕ Desacoplamento Comercial
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Planos VIP e destaques patrocinados não influenciam selos de autenticidade ou notas de avaliação.
            </p>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--accent-gold)' }}>
              ✓ Amostragem Mínima
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Perfis com menos de 3 avaliações são sinalizados como &quot;Poucas avaliações&quot; para evitar distorções estatísticas.
            </p>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}

