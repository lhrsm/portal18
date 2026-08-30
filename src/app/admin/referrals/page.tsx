'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { referralService } from '@/services/referralService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import { 
  Users, 
  Gift, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  Search,
  Ban,
  FileText
} from 'lucide-react';

export default function AdminReferralsPage() {
  const { showToast } = useToast();

  const [referrals, setReferrals] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await referralService.getAdminReferrals({
      status: statusFilter,
      risk_status: riskFilter,
    });
    setReferrals(data);
    setLoading(false);
  }, [statusFilter, riskFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEvaluateBatch = async () => {
    setIsProcessingBatch(true);
    try {
      const res = await referralService.evaluateQualifications();
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Qualificações Processadas',
          message: `${res.qualified_count || 0} novas indicações qualificadas e ${res.rewarded_count || 0} bônus creditados.`,
        });
        await loadData();
      } else {
        showToast({ type: 'error', title: 'Erro', message: res.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao processar lote.' });
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleOpenRevoke = (refItem: any) => {
    setSelectedReferral(refItem);
    setRevokeReason('');
    setIsRevokeModalOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!selectedReferral || !revokeReason || revokeReason.length < 5) {
      showToast({ type: 'warning', title: 'Motivo Obrigatório', message: 'Informe o motivo da revogação (mínimo 5 caracteres).' });
      return;
    }

    const reward = selectedReferral.rewards?.[0];
    if (!reward) {
      showToast({ type: 'warning', title: 'Sem Recompensa', message: 'Esta indicação não possui recompensa ativa para revogar.' });
      return;
    }

    setIsRevoking(true);
    try {
      const res = await referralService.revokeReward(reward.id, revokeReason);
      if (res.success) {
        showToast({ type: 'info', title: 'Recompensa Revogada com Sucesso' });
        setIsRevokeModalOpen(false);
        setSelectedReferral(null);
        await loadData();
      } else {
        showToast({ type: 'error', title: 'Erro ao revogar', message: res.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Falha na comunicação com o servidor.' });
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">GROWTH & PROGRAMA DE INDICAÇÃO</Badge>
            <Badge variant="neutral">{referrals.length} registros</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Gestão de Indicações & Recompensas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Acompanhamento do funil de indicações, maturação de 48h, concessão de dias de bônus e prevenção antifraude
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={handleEvaluateBatch}
          isLoading={isProcessingBatch}
          leftIcon={<RefreshCw size={16} />}
        >
          Processar Maturações
        </Button>
      </div>

      {/* Filters Bar */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ minWidth: '180px' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholderOption="Todos os Status">
            <option value="all">Todos os Status</option>
            <option value="registered">Cadastro Iniciado</option>
            <option value="pending_qualification">Em Maturação (48h)</option>
            <option value="qualified">Qualificada</option>
            <option value="rewarded">Recompensada (+7d)</option>
            <option value="revoked">Revogada</option>
            <option value="rejected">Rejeitada</option>
          </Select>
        </div>

        <div style={{ minWidth: '180px' }}>
          <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} placeholderOption="Todos os Riscos">
            <option value="all">Todos os Riscos</option>
            <option value="normal">Normal</option>
            <option value="manual_review">Revisão Manual</option>
            <option value="blocked">Bloqueado</option>
          </Select>
        </div>
      </Card>

      {/* Referrals List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : referrals.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Users size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nenhuma indicação nesta fila</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum registro encontrado para os filtros selecionados.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {referrals.map((r) => {
            const hasActiveReward = r.rewards && r.rewards.some((rew: any) => rew.status === 'granted');

            return (
              <Card key={r.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                      {r.referrer?.stage_name || 'Referenciador'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>indicou</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-gold)' }}>
                      {r.referred?.stage_name || 'Anunciante Indicado'}
                    </span>

                    {r.status === 'rewarded' && <Badge variant="gold">RECOMPENSADA (+7d)</Badge>}
                    {r.status === 'qualified' && <Badge variant="success">QUALIFICADA</Badge>}
                    {r.status === 'pending_qualification' && <Badge variant="warning">EM MATURAÇÃO</Badge>}
                    {r.status === 'registered' && <Badge variant="neutral">CADASTRO INICIADO</Badge>}
                    {r.status === 'revoked' && <Badge variant="ruby">REVOGADA</Badge>}
                    {r.status === 'rejected' && <Badge variant="ruby">REJEITADA</Badge>}

                    {r.risk_status === 'manual_review' && <Badge variant="warning">RISCO: REVISÃO</Badge>}
                    {r.risk_status === 'blocked' && <Badge variant="ruby">RISCO: BLOQUEADO</Badge>}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>Código: <code>{r.referral_code}</code></span>
                    <span>•</span>
                    <span>Origem: {new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                    {r.qualification_due_at && (
                      <>
                        <span>•</span>
                        <span>Maturação: {new Date(r.qualification_due_at).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                    {r.qualified_at && (
                      <>
                        <span>•</span>
                        <span>Qualificada em: {new Date(r.qualified_at).toLocaleDateString('pt-BR')}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {hasActiveReward && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenRevoke(r)}
                      style={{ color: 'var(--accent-ruby)', fontSize: '0.8rem' }}
                      leftIcon={<Ban size={14} />}
                    >
                      Revogar Recompensa
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revocation Modal */}
      {isRevokeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
          onClick={() => setIsRevokeModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={24} color="var(--accent-ruby)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Revogar Recompensa de Indicação
              </h3>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Esta ação cancelará os 7 dias de bônus creditados no ledger e atualizará o status da indicação para <strong>revogada</strong> com registro de auditoria obrigatório.
            </p>

            <FormField label="Motivo da Revogação (Obrigatório, mín. 5 caracteres)">
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex.: Conta descartável detectada pela conformidade."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="ghost" onClick={() => setIsRevokeModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="ruby"
                onClick={handleConfirmRevoke}
                isLoading={isRevoking}
                disabled={revokeReason.trim().length < 5}
              >
                Confirmar Revogação
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
