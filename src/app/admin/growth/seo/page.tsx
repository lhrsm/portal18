'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { indexabilityEngine } from '@/services/growth/indexabilityEngine';
import { GrowthPagePolicy } from '@/services/growth/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  FileCheck2,
  Layers
} from 'lucide-react';

export default function AdminGrowthSeoPage() {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState<GrowthPagePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // New Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [pagePath, setPagePath] = useState('');
  const [pageType, setPageType] = useState<'state' | 'city' | 'category' | 'landing' | 'filter_combination'>('city');
  const [isIndexable, setIsIndexable] = useState(true);
  const [minThreshold, setMinThreshold] = useState(1);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const pols = await indexabilityEngine.getPagePolicies();
    setPolicies(pols);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagePath) return;
    setSavingPolicy(true);
    const res = await indexabilityEngine.savePagePolicy({
      pagePath,
      pageType,
      isIndexable,
      minProfileThreshold: minThreshold,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Política Salva',
        message: 'Regra de indexabilidade registrada com sucesso.',
      });
      setShowPolicyModal(false);
      setPagePath('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao salvar política.',
      });
    }
    setSavingPolicy(false);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Governança de SEO Programático & Oportunidades
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Controle de indexabilidade, prevenção de thin content (páginas vazias) e integridade de sitemaps
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData} isLoading={loading}>
            Atualizar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowPolicyModal(true)}>
            Nova Regra de Indexabilidade
          </Button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <Link href="/admin/growth/seo" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">
            SEO & Indexabilidade
          </Button>
        </Link>
        <Link href="/admin/growth/regions" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="sm">
            Expansão Regional
          </Button>
        </Link>
        <Link href="/admin/growth/experiments" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="sm">
            Testes A/B & Experimentos
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Políticas de Indexabilidade</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {policies.length}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Prevenção de Thin Content</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-info)', marginTop: '0.4rem' }}>
            <Badge variant="info">0 Perfis = Noindex</Badge>
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Filtros de Descoberta</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            <Badge variant="neutral">Canonical Base Limpa</Badge>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card variant="glass" padding="none">
        {policies.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Globe size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Nenhuma política de indexabilidade customizada
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              O motor de indexabilidade está operando na regra padrão (0 perfis = noindex automático).
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Rota / Caminho</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Indexável?</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Mínimo de Perfis</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Score de Qualidade</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                      {p.page_path}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant="neutral">{p.page_type.toUpperCase()}</Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={p.is_indexable ? 'success' : 'ruby'}>
                        {p.is_indexable ? 'INDEXÁVEL' : 'NOINDEX'}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{p.min_profile_threshold}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{p.quality_score} / 100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Policy Modal */}
      {showPolicyModal && (
        <Modal
          isOpen={showPolicyModal}
          onClose={() => setShowPolicyModal(false)}
          title="Nova Política de Indexabilidade"
          maxWidth="550px"
        >
          <form onSubmit={handleSavePolicy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Caminho da Página
                </label>
                <input
                  type="text"
                  required
                  value={pagePath}
                  onChange={(e) => setPagePath(e.target.value)}
                  className="input"
                  placeholder="Ex: /acompanhantes/ba/salvador"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Tipo de Página
                </label>
                <select
                  value={pageType}
                  onChange={(e) => setPageType(e.target.value as any)}
                  className="input"
                >
                  <option value="city">Cidade</option>
                  <option value="state">Estado</option>
                  <option value="category">Categoria</option>
                  <option value="landing">Landing Page</option>
                  <option value="filter_combination">Combinação de Filtros</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Indexável por Motores de Busca?
                </label>
                <select
                  value={isIndexable ? 'true' : 'false'}
                  onChange={(e) => setIsIndexable(e.target.value === 'true')}
                  className="input"
                >
                  <option value="true">Sim (Indexable)</option>
                  <option value="false">Não (noindex)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Limite Mínimo de Perfis para Indexação
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(Number(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowPolicyModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Plus size={14} />} isLoading={savingPolicy}>
                Salvar Política
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
