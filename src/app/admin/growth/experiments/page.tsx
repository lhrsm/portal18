'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { experimentationEngine } from '@/services/growth/experimentationEngine';
import { GrowthExperiment } from '@/services/growth/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
  FlaskConical,
  Plus,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function AdminGrowthExperimentsPage() {
  const { showToast } = useToast();
  const [experiments, setExperiments] = useState<GrowthExperiment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Experiment Modal
  const [showModal, setShowModal] = useState(false);
  const [experimentKey, setExperimentKey] = useState('');
  const [name, setName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [targetPage, setTargetPage] = useState('');
  const [primaryMetric, setPrimaryMetric] = useState('contact_intent');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const exps = await experimentationEngine.getExperiments();
    setExperiments(exps);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!experimentKey || !name || !hypothesis || !targetPage) return;
    setSaving(true);
    const res = await experimentationEngine.createExperiment({
      experimentKey,
      name,
      hypothesis,
      variants: ['control', 'variant_a'],
      targetPage,
      primaryMetric,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Experimento Criado',
        message: 'Rascunho de teste A/B registrado com sucesso.',
      });
      setShowModal(false);
      setExperimentKey('');
      setName('');
      setHypothesis('');
      setTargetPage('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao salvar experimento.',
      });
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Testes A/B & Experimentos de Crescimento
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Estrutura determinística de experimentação sem rastreadores de terceiros
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData} isLoading={loading}>
            Atualizar
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowModal(true)}>
            Novo Experimento
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
          <Button variant="secondary" size="sm">
            Expansão Regional
          </Button>
        </Link>
        <Link href="/admin/growth/experiments" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">
            Testes A/B & Experimentos
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card variant="glass" padding="none">
        {experiments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FlaskConical size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Nenhum experimento ativo no momento
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Cadastre hipóteses de otimização de conversão para páginas públicas.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Experimento</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Página Alvo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Métrica Principal</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Variantes</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{e.experiment_key}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{e.target_page}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{e.primary_metric}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant="neutral">{e.variants.join(', ')}</Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={e.status === 'running' ? 'success' : 'gold'}>
                        {e.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Experiment Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Novo Experimento A/B"
          maxWidth="550px"
        >
          <form onSubmit={handleCreateExperiment}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Chave Única (Snake Case)
                </label>
                <input
                  type="text"
                  required
                  value={experimentKey}
                  onChange={(e) => setExperimentKey(e.target.value)}
                  className="input"
                  placeholder="Ex: exp_hero_cta_copy"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Nome do Experimento
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Ex: Otimização do CTA de Anunciantes"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Hipótese
                </label>
                <textarea
                  required
                  rows={3}
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  className="input"
                  placeholder="Acreditamos que destacar a garantia de autenticidade aumentará os cadastros em 15%..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Página Alvo
                </label>
                <input
                  type="text"
                  required
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value)}
                  className="input"
                  placeholder="Ex: /anunciar"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Métrica Principal
                </label>
                <select
                  value={primaryMetric}
                  onChange={(e) => setPrimaryMetric(e.target.value)}
                  className="input"
                >
                  <option value="contact_intent">Intenção de Contato (Cliques)</option>
                  <option value="advertiser_started">Início de Cadastro de Anunciante</option>
                  <option value="profile_opened">Abertura de Perfil</option>
                  <option value="premium_interest">Interesse em Premium</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Plus size={14} />} isLoading={saving}>
                Salvar Experimento
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
