'use client';

import React, { useState, useEffect } from 'react';
import { verificationService } from '@/services/verificationService';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  UserCheck,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function AdminVerificationsPage() {
  const { roles } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = roles.includes('super_admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Override Modal state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [overrideTarget, setOverrideTarget] = useState<any | null>(null);
  const [overrideStatus, setOverrideStatus] = useState('verified');

  const loadQueue = async () => {
    setLoading(true);
    const res = await verificationService.getVerificationsQueue({
      status: statusFilter || undefined,
    });
    setRequests(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter]);

  const handleConfirmOverride = async (reason: string) => {
    if (!overrideTarget) return;
    const res = await verificationService.overrideVerificationStatus(
      overrideTarget.id,
      overrideStatus,
      reason
    );

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Override Concluído',
        message: `Status alterado para ${overrideStatus} com registro de auditoria.`,
      });
      setOverrideTarget(null);
      await loadQueue();
    } else {
      showToast({
        type: 'error',
        title: 'Erro de Permissão',
        message: res.error || 'Apenas Super Admins podem executar override.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success"><ShieldCheck size={12} /> Verificado</Badge>;
      case 'rejected':
        return <Badge variant="ruby"><ShieldAlert size={12} /> Rejeitado</Badge>;
      case 'requires_review':
        return <Badge variant="warning"><AlertTriangle size={12} /> Em Revisão</Badge>;
      case 'processing':
      case 'pending':
        return <Badge variant="warning"><Clock size={12} /> Em Análise</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Lock size={16} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}>CONFORMIDADE 18+ & KYC</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Central de Verificações de Identidade</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gestão de pedidos de validação documental, selos de perfil e auditoria de maioridade
          </p>
        </div>
        <Badge variant="gold">{totalCount} pedidos registrados</Badge>
      </div>

      {/* Filter */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div style={{ minWidth: '200px' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholderOption="Todos os Status">
            <option value="verified">Verificados</option>
            <option value="requires_review">Necessita Revisão</option>
            <option value="pending">Pendentes</option>
            <option value="processing">Em Processamento</option>
            <option value="rejected">Rejeitados</option>
            <option value="expired">Expirados</option>
          </Select>
        </div>
      </Card>

      {/* Queue List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : requests.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <FileCheck2 size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum pedido na fila</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Não há solicitações correspondentes ao filtro selecionado.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map((req) => (
            <Card key={req.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                    {req.advertiser_profiles?.stage_name || 'Anunciante'}
                  </span>
                  {getStatusBadge(req.status)}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Provider: {req.provider}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Iniciado em: {new Date(req.created_at).toLocaleString('pt-BR')}</span>
                  {req.completed_at && <span>Concluído em: {new Date(req.completed_at).toLocaleString('pt-BR')}</span>}
                  {req.expires_at && <span>Expira em: {new Date(req.expires_at).toLocaleDateString('pt-BR')}</span>}
                </div>
              </div>

              {/* Super Admin Override Control (Section 48 & 86) */}
              {isSuperAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setOverrideTarget(req);
                      setOverrideStatus(req.status === 'verified' ? 'rejected' : 'verified');
                    }}
                  >
                    Super Admin Override
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Super Admin Override Modal */}
      {overrideTarget && (
        <ActionConfirmModal
          isOpen={Boolean(overrideTarget)}
          title={`Override Manual de KYC (${overrideStatus.toUpperCase()})`}
          description={`Atenção: Esta ação altera diretamente o status de verificação de "${overrideTarget.advertiser_profiles?.stage_name || 'Anunciante'}" para "${overrideStatus}". É obrigatório registrar uma justificativa formal para a trilha de auditoria.`}
          confirmLabel={`Confirmar Override para ${overrideStatus}`}
          variant={overrideStatus === 'verified' ? 'primary' : 'ruby'}
          requireReason={true}
          onClose={() => setOverrideTarget(null)}
          onConfirm={handleConfirmOverride}
        />
      )}
    </AdminLayout>
  );
}
