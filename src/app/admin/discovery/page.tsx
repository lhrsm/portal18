'use client';

import React, { useState, useEffect } from 'react';
import { discoveryRankingService } from '@/services/discovery/discoveryRankingService';
import { CommercialInventorySlot, RankingDiagnostics } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Layers,
  Search,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function AdminDiscoveryPage() {
  const { showToast } = useToast();

  const [inventorySlots, setInventorySlots] = useState<CommercialInventorySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // Diagnostics State
  const [diagAdvId, setDiagAdvId] = useState('');
  const [diagCity, setDiagCity] = useState('');
  const [diagCategory, setDiagCategory] = useState('');
  const [diagResult, setDiagResult] = useState<RankingDiagnostics | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const slots = await discoveryRankingService.getInventorySlots();
    setInventorySlots(slots);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecalculateBatch = async () => {
    setRecalculating(true);
    try {
      const res = await discoveryRankingService.recalculateRankingScores();
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Ranking Recalculado',
          message: `${res.profiles_scored || 0} perfis processados com suavização Bayesiana.`,
        });
      } else {
        showToast({ type: 'error', title: 'Erro', message: res.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao recalcular rankings.' });
    } finally {
      setRecalculating(false);
    }
  };

  const handleRunDiagnostics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagAdvId.trim()) {
      showToast({ type: 'warning', title: 'ID Obrigatório', message: 'Informe o UUID do perfil de anunciante.' });
      return;
    }

    setDiagnosing(true);
    try {
      const res = await discoveryRankingService.diagnoseAdvertiser(diagAdvId.trim(), diagCity.trim(), diagCategory.trim());
      setDiagResult(res);
      if (!res.found) {
        showToast({ type: 'error', title: 'Não Encontrado', message: res.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Falha na consulta diagnóstica.' });
    } finally {
      setDiagnosing(false);
    }
  };

  const handleToggleSlot = async (slot: CommercialInventorySlot) => {
    const res = await discoveryRankingService.updateInventorySlot(slot.id, {
      is_active: !slot.is_active,
    });
    if (res.success) {
      showToast({ type: 'success', title: 'Slot Atualizado' });
      await loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error });
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">SEARCH & DISCOVERY ENGINE</Badge>
            <Badge variant="neutral">Policy v1</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Motor de Descoberta & Inventário Comercial</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Controle de slots patrocinados, cálculo Bayesiano de relevância orgânica e ferramenta de diagnóstico de posição
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={handleRecalculateBatch}
          isLoading={recalculating}
          leftIcon={<RefreshCw size={16} />}
        >
          Recalcular Scores Orgânicos
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Commercial Inventory Slots */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Inventário Comercial de Slots</h2>
            </div>
            <Badge variant="neutral">{inventorySlots.length} regras ativas</Badge>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
            Limites máximos de cards patrocinados por página e proporção máxima de inventário comercial (Cap de 25%).
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height="50px" />
              <Skeleton height="50px" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {inventorySlots.map((slot) => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {slot.scope_name || slot.placement}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Placement: <code>{slot.placement}</code> • Max: <strong>{slot.max_slots} slots</strong> ({Number(slot.max_sponsored_ratio) * 100}%)
                    </div>
                  </div>

                  <Button
                    variant={slot.is_active ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleSlot(slot)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {slot.is_active ? 'Ativo' : 'Pausado'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ranking Diagnostics Tool */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Diagnóstico de Ranking</h2>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
            Inspecione a composição detalhada do score orgânico e status de elegibilidade de qualquer anunciante.
          </p>

          <form onSubmit={handleRunDiagnostics} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FormField label="UUID do Anunciante">
              <Input
                value={diagAdvId}
                onChange={(e) => setDiagAdvId(e.target.value)}
                placeholder="Ex.: 8f8d4a98-..."
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <FormField label="Cidade (Slug opcional)">
                <Input
                  value={diagCity}
                  onChange={(e) => setDiagCity(e.target.value)}
                  placeholder="salvador"
                />
              </FormField>

              <FormField label="Categoria (Slug opcional)">
                <Input
                  value={diagCategory}
                  onChange={(e) => setDiagCategory(e.target.value)}
                  placeholder="massagistas"
                />
              </FormField>
            </div>

            <Button variant="primary" size="md" type="submit" isLoading={diagnosing} leftIcon={<Search size={16} />}>
              Executar Diagnóstico
            </Button>
          </form>

          {diagResult && diagResult.found && (
            <div style={{
              marginTop: '0.5rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{diagResult.stage_name}</strong>
                {diagResult.is_eligible ? (
                  <Badge variant="success">Elegível para Descoberta</Badge>
                ) : (
                  <Badge variant="ruby">Inelegível</Badge>
                )}
              </div>

              {!diagResult.is_eligible && diagResult.ineligibility_reasons && (
                <div style={{ color: 'var(--accent-ruby)', fontSize: '0.8rem' }}>
                  Motivos: {diagResult.ineligibility_reasons.join(', ')}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginTop: '0.4rem' }}>
                <div>Score Orgânico: <strong>{diagResult.scores?.organic_score}</strong></div>
                <div>Qualidade: <strong>{diagResult.scores?.quality_score}</strong></div>
                <div>Freshness: <strong>{diagResult.scores?.freshness_score}</strong></div>
                <div>Bayesian CTR: <strong>{((diagResult.scores?.bayesian_ctr || 0) * 100).toFixed(2)}%</strong></div>
                <div>Boost Novo Perfil: <strong>+{diagResult.scores?.new_profile_boost}</strong></div>
                <div>Campanha Ativa: <strong>{diagResult.has_active_campaign ? 'Sim' : 'Não'}</strong></div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
