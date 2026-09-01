'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { caseManagementService } from '@/services/trust-safety/caseManagementService';
import { sanctionsService } from '@/services/trust-safety/sanctionsService';
import { TrustSafetyCase, TSCaseStatus } from '@/services/trust-safety/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  Send,
  Lock,
  CheckCircle2,
  XCircle,
  FileText,
  Activity
} from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.caseId as string;
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [tsCase, setTsCase] = useState<TrustSafetyCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadCase = async () => {
    setLoading(true);
    const data = await caseManagementService.getCaseById(caseId);
    setTsCase(data);
    setLoading(false);
  };

  useEffect(() => {
    if (caseId) loadCase();
  }, [caseId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote || !profile) return;
    setSubmittingNote(true);
    const res = await caseManagementService.addInternalNote(caseId, profile.id, newNote);
    if (res.success) {
      showToast({ type: 'success', title: 'Nota Adicionada', message: 'Registro confidencial gravado no caso.' });
      setNewNote('');
      await loadCase();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao gravar nota.' });
    }
    setSubmittingNote(false);
  };

  const handleStatusChange = async (newStatus: TSCaseStatus) => {
    if (!profile) return;
    setUpdatingStatus(true);
    const res = await caseManagementService.updateCaseStatus(caseId, newStatus, 'Status alterado pelo operador', profile.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Status Atualizado', message: `Caso alterado para ${newStatus}.` });
      await loadCase();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao alterar status.' });
    }
    setUpdatingStatus(false);
  };

  const handleAssignToMe = async () => {
    if (!profile) return;
    const res = await caseManagementService.assignCase(caseId, profile.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Caso Atribuído', message: 'Você assumiu a investigação deste caso.' });
      await loadCase();
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem' }}>
          <Skeleton width="100%" height="60px" style={{ marginBottom: '1rem' }} />
          <Skeleton width="100%" height="200px" />
        </div>
      </AdminLayout>
    );
  }

  if (!tsCase) {
    return (
      <AdminLayout>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={40} color="var(--accent-ruby)" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Caso não encontrado</h3>
          <Link href="/admin/trust-safety">
            <Button variant="secondary" size="sm">Voltar</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/admin/trust-safety" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar para Fila de Casos
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              {tsCase.case_number}: {tsCase.title}
            </h2>
            <Badge variant={tsCase.priority === 'critical' ? 'ruby' : tsCase.priority === 'high' ? 'gold' : 'neutral'}>
              {tsCase.priority.toUpperCase()}
            </Badge>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!tsCase.assigned_to && (
              <Button variant="secondary" size="sm" onClick={handleAssignToMe}>
                Assumir Caso
              </Button>
            )}
            {tsCase.status !== 'resolved' && tsCase.status !== 'closed' ? (
              <Button variant="primary" size="sm" onClick={() => handleStatusChange('resolved')} isLoading={updatingStatus}>
                Concluir Investigação
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => handleStatusChange('reopened')} isLoading={updatingStatus}>
                Reabrir Caso
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Split View Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Context & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Metadados do Alvo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>Tipo:</strong> <Badge variant="neutral">{tsCase.subject_type}</Badge></div>
              <div><strong>ID do Alvo:</strong> <code style={{ fontFamily: 'monospace' }}>{tsCase.subject_id}</code></div>
              <div><strong>Status:</strong> <Badge variant={tsCase.status === 'open' ? 'gold' : tsCase.status === 'resolved' ? 'success' : 'ruby'}>{tsCase.status.toUpperCase()}</Badge></div>
              <div><strong>SLA Limite:</strong> {tsCase.sla_due_at ? new Date(tsCase.sla_due_at).toLocaleString('pt-BR') : 'N/A'}</div>
              <div><strong>Criado em:</strong> {new Date(tsCase.created_at).toLocaleString('pt-BR')}</div>
            </div>
          </Card>

          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Descrição & Contexto Inicial
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
              {tsCase.description || 'Nenhum detalhe adicional fornecido.'}
            </p>
          </Card>

          {/* Linked Risk Signals */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Sinais de Risco Vinculados ({tsCase.signals?.length || 0})
            </h3>
            {tsCase.signals && tsCase.signals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tsCase.signals.map((sig) => (
                  <div key={sig.id} style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong>{sig.signal_type}</strong>
                      <Badge variant={sig.severity === 'critical' ? 'ruby' : 'gold'}>{sig.severity}</Badge>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.775rem' }}>
                      Origem: {sig.source} | Confiança: {sig.confidence} | {new Date(sig.created_at).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: 0 }}>
                Nenhum sinal específico anexado ao caso.
              </p>
            )}
          </Card>
        </div>

        {/* Right Column: Staff Notes & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} /> Linha do Tempo & Notas Internas (Confidencial)
            </h3>

            {/* Notes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '350px', overflowY: 'auto' }}>
              {tsCase.notes && tsCase.notes.length > 0 ? (
                tsCase.notes.map((note) => (
                  <div key={note.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span>Operador T&S</span>
                      <span>{new Date(note.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {note.note}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: 0 }}>
                  Nenhuma nota interna registrada ainda.
                </p>
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="input"
                placeholder="Adicionar nota de investigação..."
                style={{ flex: 1 }}
              />
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send size={14} />} isLoading={submittingNote}>
                Salvar
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
