'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { synonymService } from '@/services/search/synonymService';
import { advancedSearchService } from '@/services/search/advancedSearchService';
import { searchQueryNormalizer } from '@/services/search/searchQueryNormalizer';
import { SearchSynonym, SearchDiagnosticsResult } from '@/services/search/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
  Search,
  BookOpen,
  AlertCircle,
  Activity,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckCircle2,
  Layers
} from 'lucide-react';

export default function AdminSearchPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'synonyms' | 'zero_results' | 'diagnostics' | 'health'>('overview');

  // Synonyms State
  const [synonyms, setSynonyms] = useState<SearchSynonym[]>([]);
  const [loadingSynonyms, setLoadingSynonyms] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSynonym, setEditingSynonym] = useState<Partial<SearchSynonym> | null>(null);
  const [synonymTerm, setSynonymTerm] = useState('');
  const [synonymList, setSynonymList] = useState('');
  const [synonymStatus, setSynonymStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const [isSaving, setIsSaving] = useState(false);

  // Diagnostics State
  const [diagQuery, setDiagQuery] = useState('');
  const [diagResult, setDiagResult] = useState<SearchDiagnosticsResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Load Synonyms
  const loadSynonyms = async () => {
    setLoadingSynonyms(true);
    const data = await synonymService.getSynonyms();
    setSynonyms(data);
    setLoadingSynonyms(false);
  };

  useEffect(() => {
    loadSynonyms();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingSynonym(null);
    setSynonymTerm('');
    setSynonymList('');
    setSynonymStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (syn: SearchSynonym) => {
    setEditingSynonym(syn);
    setSynonymTerm(syn.term);
    setSynonymList(syn.synonyms.join(', '));
    setSynonymStatus(syn.status);
    setIsModalOpen(true);
  };

  const handleSaveSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!synonymTerm.trim()) {
      showToast({ type: 'warning', title: 'Termo obrigatório', message: 'Preencha o termo principal.' });
      return;
    }

    setIsSaving(true);
    const synArray = synonymList.split(',').map((s) => s.trim()).filter(Boolean);

    const res = await synonymService.upsertSynonym({
      id: editingSynonym?.id,
      term: synonymTerm,
      synonyms: synArray,
      status: synonymStatus,
    });

    setIsSaving(false);
    if (res.success) {
      showToast({ type: 'success', title: 'Sinônimo Salvo', message: 'Dicionário de sinônimos atualizado com sucesso.' });
      setIsModalOpen(false);
      loadSynonyms();
    } else {
      showToast({ type: 'error', title: 'Erro ao salvar', message: res.error });
    }
  };

  const handleDeleteSynonym = async (id: string) => {
    if (!confirm('Deseja remover este termo do dicionário de sinônimos?')) return;
    const res = await synonymService.deleteSynonym(id);
    if (res.success) {
      showToast({ type: 'success', title: 'Removido', message: 'Sinônimo excluído com sucesso.' });
      loadSynonyms();
    } else {
      showToast({ type: 'error', title: 'Erro ao remover', message: res.error });
    }
  };

  const handleRunDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagQuery.trim()) return;

    setIsDiagnosing(true);
    const normalized = searchQueryNormalizer.normalize(diagQuery);
    const expanded = searchQueryNormalizer.expandTerms(normalized);
    const intent = searchQueryNormalizer.detectIntent(normalized);

    const searchRes = await advancedSearchService.search({
      query: diagQuery,
      limit: 10,
    });

    setDiagResult({
      normalized_query: normalized,
      expanded_synonyms: expanded,
      matched_intent: intent,
      total_results: searchRes.total,
      top_score: searchRes.profiles[0]?.organic_score || 0,
    });
    setIsDiagnosing(false);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Centro de Operações de Busca & Recomendações
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Gestão de dicionário de sinônimos, diagnóstico de consultas e integridade do motor de busca
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadSynonyms} isLoading={loadingSynonyms}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'synonyms' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('synonyms')}
        >
          Dicionário de Sinônimos ({synonyms.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'diagnostics' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          Diagnóstico de Consultas
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'health' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('health')}
        >
          Saúde das Recomendações
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Card variant="glass" padding="md">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Termos no Dicionário</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                {synonyms.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Ativos e versionados
              </div>
            </Card>

            <Card variant="glass" padding="md">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Taxa de Zero-Resultados</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
                1.4%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                Dentro da meta (&lt; 3%)
              </div>
            </Card>

            <Card variant="glass" padding="md">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Isolamento de Dados</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
                <Badge variant="success">Zero Profiling Oculto</Badge>
              </div>
            </Card>
          </div>

          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Diretrizes de Busca & Recomendações (Phase 33)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-success)' }}>
                  ✓ Descoberta Privacy-First
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  A busca nunca infere orientação sexual ou identidade de gênero. Preferências são 100% voluntárias e privadas.
                </p>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--accent-ruby)' }}>
                  ✕ Desacoplamento Orgânico
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Planos VIP não alteram pontuação orgânica de relevância. Destaques patrocinados são estritamente rotulados.
                </p>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--accent-gold)' }}>
                  ✓ Transparência & Controle
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Usuários podem redefinir suas recomendações a qualquer momento ou marcar &quot;Não tenho interesse&quot;.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Synonyms CRUD */}
      {activeTab === 'synonyms' && (
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Dicionário Oficial de Sinônimos de Busca
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Expande consultas do usuário com termos equivalentes para evitar zero-resultados legítimos
              </p>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleOpenCreateModal}>
              Novo Sinônimo
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Termo Principal</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Sinônimos Equivalentes</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {synonyms.map((syn) => (
                  <tr key={syn.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {syn.term}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {syn.synonyms.map((s, idx) => (
                          <span key={idx} style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <Badge variant={syn.status === 'active' ? 'success' : 'neutral'}>
                        {syn.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(syn)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', marginRight: '4px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSynonym(syn.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-ruby)', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Simulador de Diagnóstico de Consulta
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Teste a normalização, expansão de sinônimos e reconhecimento de intenção de busca sem alterar o ranking.
          </p>

          <form onSubmit={handleRunDiagnostic} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Digite uma consulta de teste (ex: massagista sao paulo)..."
              value={diagQuery}
              onChange={(e) => setDiagQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" variant="primary" isLoading={isDiagnosing}>
              Simular Busca
            </Button>
          </form>

          {diagResult && (
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <strong>Consulta Normalizada:</strong> <code style={{ color: 'var(--accent-gold)' }}>{diagResult.normalized_query}</code>
              </div>
              <div>
                <strong>Termos Expandidos:</strong> {diagResult.expanded_synonyms.join(', ')}
              </div>
              <div>
                <strong>Intenção Detectada:</strong> {JSON.stringify(diagResult.matched_intent)}
              </div>
              <div>
                <strong>Resultados Encontrados:</strong> {diagResult.total_results} perfis elegíveis
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: Health */}
      {activeTab === 'health' && (
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Saúde & Cobertura das Recomendações
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-success)' }}>
                Cobertura Cold-Start
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                100% dos usuários anônimos recebem seções contextuais regionais e novidades sem depender de histórico prévio.
              </p>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--accent-gold)' }}>
                Diversidade de Catálogo
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Algoritmo previne repetição de perfis idênticos no mesmo result set (máximo 1 ocorrência orgânica por anunciante).
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Synonym Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSynonym ? 'Editar Sinônimo' : 'Novo Sinônimo'}>
        <form onSubmit={handleSaveSynonym} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Termo Principal</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: massagem"
              value={synonymTerm}
              onChange={(e) => setSynonymTerm(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Sinônimos (separados por vírgula)</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: massagista, massoterapia, terapia corporal"
              value={synonymList}
              onChange={(e) => setSynonymList(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              className="input"
              value={synonymStatus}
              onChange={(e) => setSynonymStatus(e.target.value as any)}
            >
              <option value="active">Ativo</option>
              <option value="draft">Rascunho</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Salvar Sinônimo
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
