'use client';

import React, { useState, useEffect } from 'react';
import { searchService } from '@/services/discovery/searchService';
import { RankingWeights } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck, 
  Compass, 
  BarChart3, 
  AlertCircle 
} from 'lucide-react';

export default function AdminDiscoveryPage() {
  const { showToast } = useToast();
  const [weights, setWeights] = useState<RankingWeights | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Form State
  const [formWeights, setFormWeights] = useState({
    completeness_weight: 0.20,
    verification_weight: 0.20,
    activity_weight: 0.15,
    freshness_weight: 0.10,
    quality_weight: 0.15,
    engagement_weight: 0.10,
    trust_weight: 0.10,
    exploration_factor: 0.15,
  });

  const loadData = async () => {
    setLoading(true);
    const data = await searchService.getRankingWeights();
    if (data) {
      setWeights(data);
      setFormWeights({
        completeness_weight: Number(data.completeness_weight),
        verification_weight: Number(data.verification_weight),
        activity_weight: Number(data.activity_weight),
        freshness_weight: Number(data.freshness_weight),
        quality_weight: Number(data.quality_weight),
        engagement_weight: Number(data.engagement_weight),
        trust_weight: Number(data.trust_weight),
        exploration_factor: Number(data.exploration_factor),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSum = Number(
    (
      formWeights.completeness_weight +
      formWeights.verification_weight +
      formWeights.activity_weight +
      formWeights.freshness_weight +
      formWeights.quality_weight +
      formWeights.trust_weight
    ).toFixed(2)
  );

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(totalSum - 1.0) > 0.05) {
      showToast({
        type: 'warning',
        title: 'Soma dos Pesos Inválida',
        message: `A soma dos pesos deve totalizar 1.00 (atualmente ${totalSum}).`,
      });
      return;
    }

    setSaving(true);
    const res = await searchService.updateRankingWeights(formWeights);
    if (res.success) {
      showToast({ type: 'success', title: 'Pesos Atualizados', message: 'Configuração salva com registro de auditoria.' });
      await loadData();
    } else {
      showToast({ type: 'error', title: 'Erro ao Salvar', message: res.error });
    }
    setSaving(false);
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    const res = await searchService.recalculateRankings();
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Ranking Recalculado',
        message: 'Scores orgânicos atualizados para todos os anunciantes.',
      });
    } else {
      showToast({ type: 'error', title: 'Erro no Recálculo', message: res.error });
    }
    setRecalculating(false);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Motor de Descoberta & Ranking Orgânico</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Ajuste de pesos algorítmicos, fatores de exploração justa e recálculo incremental de relevância
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRecalculateAll}
          isLoading={recalculating}
          leftIcon={<RefreshCw size={14} />}
        >
          Recalcular Scores de Todos os Anúncios
        </Button>
      </div>

      {/* Health / Distribution Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Algoritmo Ativo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            Ranking Multivariável v8.0
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
            ● Operação Normal
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Soma Atual dos Pesos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: totalSum === 1.0 ? 'var(--color-success)' : 'var(--accent-gold)' }}>
            {totalSum.toFixed(2)} / 1.00
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {totalSum === 1.0 ? 'Normalizado' : 'Requer ajuste'}
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fator de Exploração (Novos Perfis)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {(formWeights.exploration_factor * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Rotação anti-concentração
          </div>
        </Card>
      </div>

      {/* Weights Tuning Form */}
      {loading ? (
        <Skeleton height="300px" />
      ) : (
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Sliders size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Pesos dos Componentes do Score Orgânico</h3>
          </div>

          <form onSubmit={handleSaveWeights}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Completeness */}
              <div>
                <label className="form-label">Completude do Perfil ({formWeights.completeness_weight * 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formWeights.completeness_weight}
                  onChange={(e) => setFormWeights({ ...formWeights, completeness_weight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bio, apresentação, headline e contatos</span>
              </div>

              {/* Verification */}
              <div>
                <label className="form-label">Verificação 18+ / KYC ({formWeights.verification_weight * 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formWeights.verification_weight}
                  onChange={(e) => setFormWeights({ ...formWeights, verification_weight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Identidade confirmada com selo</span>
              </div>

              {/* Activity */}
              <div>
                <label className="form-label">Atividade Recente ({formWeights.activity_weight * 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formWeights.activity_weight}
                  onChange={(e) => setFormWeights({ ...formWeights, activity_weight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Último acesso e resposta a contatos</span>
              </div>

              {/* Freshness */}
              <div>
                <label className="form-label">Freshness / Cold-Start ({formWeights.freshness_weight * 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formWeights.freshness_weight}
                  onChange={(e) => setFormWeights({ ...formWeights, freshness_weight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impulso inicial para perfis novos</span>
              </div>

              {/* Quality */}
              <div>
                <label className="form-label">Qualidade de Mídia ({formWeights.quality_weight * 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formWeights.quality_weight}
                  onChange={(e) => setFormWeights({ ...formWeights, quality_weight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fotos e vídeos aprovados na galeria</span>
              </div>

              {/* Trust */}
              <div>
                <label className="form-label">Confiança & Moderação ({formWeights.trust_weight * 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.05"
                  value={formWeights.trust_weight}
                  onChange={(e) => setFormWeights({ ...formWeights, trust_weight: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Penalidades por denúncias procedentes</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button type="button" variant="secondary" onClick={loadData}>
                Restaurar
              </Button>
              <Button type="submit" variant="primary" isLoading={saving}>
                Salvar Pesos Algorítmicos
              </Button>
            </div>
          </form>
        </Card>
      )}
    </AdminLayout>
  );
}
