'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { caseManagementService } from '@/services/trust-safety/caseManagementService';
import { riskSignalsService } from '@/services/trust-safety/riskSignalsService';
import { sanctionsService } from '@/services/trust-safety/sanctionsService';
import { appealsService } from '@/services/trust-safety/appealsService';
import {
  TrustSafetyCase,
  RiskSignal,
  Sanction,
  Appeal,
  RiskSubjectType,
  SanctionType
} from '@/services/trust-safety/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  Lock,
  UserX,
  RotateCcw,
  RefreshCw,
  Plus,
  ArrowRight,
  Filter,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function AdminTrustSafetyPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'cases' | 'signals' | 'sanctions' | 'appeals'>('cases');
  const [cases, setCases] = useState<TrustSafetyCase[]>([]);
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  // New Case Modal
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseSubjectType, setCaseSubjectType] = useState<RiskSubjectType>('profile');
  const [caseSubjectId, setCaseSubjectId] = useState('');
  const [caseTitle, setCaseTitle] = useState('');
  const [casePriority, setCasePriority] = useState<'critical' | 'high' | 'normal' | 'low'>('high');
  const [caseDescription, setCaseDescription] = useState('');
  const [creatingCase, setCreatingCase] = useState(false);

  // New Sanction Modal
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [sanctionSubjectType, setSanctionSubjectType] = useState<RiskSubjectType>('profile');
  const [sanctionSubjectId, setSanctionSubjectId] = useState('');
  const [sanctionType, setSanctionType] = useState<SanctionType>('temporary_account_hold');
  const [sanctionDurationDays, setSanctionDurationDays] = useState(7);
  const [reasonInternal, setReasonInternal] = useState('');
  const [reasonPublic, setReasonPublic] = useState('');
  const [applyingSanction, setApplyingSanction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [c, s, san, app] = await Promise.all([
      caseManagementService.getCases(),
      riskSignalsService.getSignals(),
      sanctionsService.getAllSanctions(),
      appealsService.getAppeals(),
    ]);
    setCases(c);
    setSignals(s);
    setSanctions(san);
    setAppeals(app);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseSubjectId || !caseTitle) return;
    setCreatingCase(true);
    const res = await caseManagementService.createOrEscalateCase({
      subjectType: caseSubjectType,
      subjectId: caseSubjectId,
      title: caseTitle,
      priority: casePriority,
      description: caseDescription,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Caso Criado',
        message: `Caso ${res.caseNumber} aberto com sucesso.`,
      });
      setShowCaseModal(false);
      setCaseSubjectId('');
      setCaseTitle('');
      setCaseDescription('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro ao Criar Caso',
        message: res.error || 'Falha na criação do caso.',
      });
    }
    setCreatingCase(false);
  };

  const handleApplySanction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctionSubjectId || !reasonInternal || !reasonPublic || !profile) return;
    setApplyingSanction(true);
    const res = await sanctionsService.applySanction({
      subjectType: sanctionSubjectType,
      subjectId: sanctionSubjectId,
      sanctionType,
      duration: sanctionDurationDays > 0 ? 'temporary' : 'permanent',
      durationDays: sanctionDurationDays > 0 ? sanctionDurationDays : undefined,
      reasonInternal,
      reasonPublic,
      appliedBy: profile.id,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Sanção Aplicada',
        message: 'Penalidade registrada com sucesso no livro de auditoria.',
      });
      setShowSanctionModal(false);
      setSanctionSubjectId('');
      setReasonInternal('');
      setReasonPublic('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Falha ao Aplicar Sanção',
        message: res.error || 'Erro ao gravar penalidade.',
      });
    }
    setApplyingSanction(false);
  };

  const criticalCasesCount = cases.filter((c) => c.priority === 'critical' && c.status !== 'closed' && c.status !== 'resolved').length;
  const activeSanctionsCount = sanctions.filter((s) => s.status === 'active').length;
  const pendingAppealsCount = appeals.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Central de Trust & Safety & Antifraude
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Inteligência de risco, casos operacionais, sanções proporcionais e gestão de recursos
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData} isLoading={loading}>
            Atualizar
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Lock size={14} />} onClick={() => setShowSanctionModal(true)}>
            Nova Sanção
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCaseModal(true)}>
            Abrir Caso T&S
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Casos Críticos Abertos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: criticalCasesCount > 0 ? 'var(--accent-ruby)' : 'var(--color-success)' }}>
            {criticalCasesCount}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sinais de Risco Ingeridos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {signals.length}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sanções Ativas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>
            {activeSanctionsCount}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Recursos Pendentes</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)' }}>
            {pendingAppealsCount}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <Button
          variant={activeTab === 'cases' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('cases')}
        >
          Fila de Casos ({cases.length})
        </Button>
        <Button
          variant={activeTab === 'signals' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('signals')}
        >
          Feed de Sinais ({signals.length})
        </Button>
        <Button
          variant={activeTab === 'sanctions' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('sanctions')}
        >
          Sanções ({sanctions.length})
        </Button>
        <Button
          variant={activeTab === 'appeals' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('appeals')}
        >
          Recursos ({appeals.length})
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'cases' && (
        <Card variant="glass" padding="none">
          {loading ? (
            <div style={{ padding: '2rem' }}>
              <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
              <Skeleton width="100%" height="40px" />
            </div>
          ) : cases.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <ShieldAlert size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum caso ativo na fila
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Casos serão escalados automaticamente com base na severidade dos sinais de risco.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Número</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Prioridade</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Título / Assunto</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Tipo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>SLA Limite</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                        {c.case_number}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={c.priority === 'critical' ? 'ruby' : c.priority === 'high' ? 'gold' : 'neutral'}>
                          {c.priority.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{c.title}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant="neutral">{c.subject_type}</Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={c.status === 'open' ? 'gold' : c.status === 'resolved' ? 'success' : 'ruby'}>
                          {c.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {c.sla_due_at ? new Date(c.sla_due_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <Link href={`/admin/trust-safety/${c.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm" leftIcon={<Eye size={12} />}>
                            Investigar
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'signals' && (
        <Card variant="glass" padding="none">
          {signals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <AlertTriangle size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum sinal registrado
              </h4>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Tipo de Sinal</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Severidade</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Confiança</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Alvo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Origem</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Data / Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{s.signal_type}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={s.severity === 'critical' ? 'ruby' : s.severity === 'high' ? 'gold' : 'neutral'}>
                          {s.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{s.confidence}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{s.subject_type}:{s.subject_id.substring(0, 8)}...</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{s.source}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {new Date(s.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'sanctions' && (
        <Card variant="glass" padding="none">
          {sanctions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Lock size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhuma sanção em vigor
              </h4>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Tipo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Escopo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Duração</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Motivo Público</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Expira em</th>
                  </tr>
                </thead>
                <tbody>
                  {sanctions.map((san) => (
                    <tr key={san.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{san.sanction_type}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{san.scope}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{san.duration}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={san.status === 'active' ? 'ruby' : 'success'}>
                          {san.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{san.reason_public}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {san.ends_at ? new Date(san.ends_at).toLocaleDateString('pt-BR') : 'Permanente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'appeals' && (
        <Card variant="glass" padding="none">
          {appeals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <FileCheck2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum recurso pendente
              </h4>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Usuário / Alvo</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Motivo do Recurso</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Submetido em</th>
                  </tr>
                </thead>
                <tbody>
                  {appeals.map((app) => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{app.subject_type}:{app.subject_id.substring(0, 8)}...</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{app.reason}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={app.status === 'submitted' ? 'gold' : app.status === 'overturned' ? 'success' : 'ruby'}>
                          {app.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {new Date(app.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* New Case Modal */}
      {showCaseModal && (
        <Modal
          isOpen={showCaseModal}
          onClose={() => setShowCaseModal(false)}
          title="Abrir Caso de Trust & Safety"
          maxWidth="550px"
        >
          <form onSubmit={handleCreateCase}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Tipo de Alvo
                </label>
                <select
                  value={caseSubjectType}
                  onChange={(e) => setCaseSubjectType(e.target.value as RiskSubjectType)}
                  className="input"
                >
                  <option value="profile">Perfil de Anunciante</option>
                  <option value="user">Conta de Usuário</option>
                  <option value="review">Avaliação / Review</option>
                  <option value="referral">Programa de Indicação</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Identificador do Alvo (UUID)
                </label>
                <input
                  type="text"
                  required
                  value={caseSubjectId}
                  onChange={(e) => setCaseSubjectId(e.target.value)}
                  className="input"
                  placeholder="Informe o UUID do perfil ou usuário"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Título do Caso
                </label>
                <input
                  type="text"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="input"
                  placeholder="Ex: Suspeita de duplicação em massa de perfis"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Prioridade & SLA
                </label>
                <select
                  value={casePriority}
                  onChange={(e) => setCasePriority(e.target.value as any)}
                  className="input"
                >
                  <option value="critical">Crítica (SLA: 4 horas)</option>
                  <option value="high">Alta (SLA: 12 horas)</option>
                  <option value="normal">Normal (SLA: 24 horas)</option>
                  <option value="low">Baixa (SLA: 48 horas)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Descrição / Contexto Inicial
                </label>
                <textarea
                  rows={3}
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  className="input"
                  placeholder="Evidências iniciais e contexto da investigação..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCaseModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Plus size={14} />} isLoading={creatingCase}>
                Criar Caso
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Apply Sanction Modal */}
      {showSanctionModal && (
        <Modal
          isOpen={showSanctionModal}
          onClose={() => setShowSanctionModal(false)}
          title="Aplicar Sanção Proporcional"
          maxWidth="550px"
        >
          <form onSubmit={handleApplySanction}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Tipo de Penalidade
                </label>
                <select
                  value={sanctionType}
                  onChange={(e) => setSanctionType(e.target.value as SanctionType)}
                  className="input"
                >
                  <option value="warning">Advertência Formal (Warning)</option>
                  <option value="feature_restriction">Restrição de Funcionalidades</option>
                  <option value="upload_restriction">Bloqueio de Uploads</option>
                  <option value="contact_change_hold">Retenção de Troca de Contato</option>
                  <option value="temporary_account_hold">Bloqueio Temporário de Conta</option>
                  <option value="profile_unpublished">Despublicação de Perfil</option>
                  <option value="account_suspended">Suspensão de Conta</option>
                  <option value="account_terminated">Encerramento Definitivo</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Identificador do Alvo (UUID)
                </label>
                <input
                  type="text"
                  required
                  value={sanctionSubjectId}
                  onChange={(e) => setSanctionSubjectId(e.target.value)}
                  className="input"
                  placeholder="UUID da conta ou perfil"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Duração em Dias (0 = Permanente)
                </label>
                <input
                  type="number"
                  min={0}
                  value={sanctionDurationDays}
                  onChange={(e) => setSanctionDurationDays(parseInt(e.target.value, 10))}
                  className="input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Motivo Interno (Auditoria / Confidencial)
                </label>
                <textarea
                  required
                  rows={2}
                  value={reasonInternal}
                  onChange={(e) => setReasonInternal(e.target.value)}
                  className="input"
                  placeholder="Detalhamento técnico para auditoria interna..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Mensagem Pública (Exibida ao Usuário)
                </label>
                <input
                  type="text"
                  required
                  value={reasonPublic}
                  onChange={(e) => setReasonPublic(e.target.value)}
                  className="input"
                  placeholder="Ex: Violação das diretrizes de autenticidade de fotos"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowSanctionModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="ruby" size="sm" leftIcon={<Lock size={14} />} isLoading={applyingSanction}>
                Confirmar Sanção
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
