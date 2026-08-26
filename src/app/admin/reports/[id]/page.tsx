'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  UserCheck, 
  Ban, 
  ExternalLink, 
  Clock 
} from 'lucide-react';

export default function AdminReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const reportId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadReport = async () => {
    if (!reportId) return;
    const data = await adminService.getReportDetails(reportId) as any;
    setReport(data);
    if (data?.resolution_notes) setResolutionNotes(data.resolution_notes);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const handleAssignToMe = async () => {
    setIsProcessing(true);
    const res = await adminService.assignReport(report.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Chamado Atribuído', message: 'Você assumiu a análise desta denúncia.' });
      await loadReport();
    }
    setIsProcessing(false);
  };

  const handleUpdateStatus = async (status: string) => {
    setIsProcessing(true);
    const res = await adminService.updateReportStatus(report.id, status, resolutionNotes);
    if (res.success) {
      showToast({ type: 'info', title: `Status Alterado para: ${status}` });
      router.push('/admin/reports');
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="400px" />
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <Card variant="glass" padding="lg" style={{ textAlign: 'center' }}>
          <h2>Denúncia não encontrada.</h2>
          <Link href="/admin/reports">
            <Button variant="secondary" style={{ marginTop: '1rem' }}>Voltar para a Fila</Button>
          </Link>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <Link href="/admin/reports" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Denúncias
        </Link>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!report.assigned_to && (
            <Button variant="secondary" size="sm" onClick={handleAssignToMe} isLoading={isProcessing} leftIcon={<UserCheck size={14} />}>
              Assumir Análise
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('rejected')}>
            Rejeitar Denúncia
          </Button>

          <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus('escalated')} style={{ color: 'var(--accent-gold)' }}>
            Escalar Caso
          </Button>

          <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('resolved')} isLoading={isProcessing} leftIcon={<CheckCircle2 size={14} />}>
            Encerrar como Resolvida
          </Button>
        </div>
      </div>

      {/* Main Detail Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Report Info */}
        <Card
          variant="glass"
          padding="lg"
          style={{
            border: report.severity === 'critical' ? '1px solid var(--accent-ruby)' : undefined,
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <Badge variant={report.severity === 'critical' ? 'ruby' : 'warning'}>
              Severidade: {report.severity.toUpperCase()}
            </Badge>
            <Badge variant="neutral">Status: {report.status}</Badge>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Motivo: {report.reason}
          </h2>

          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            <strong>Descrição do denunciante:</strong>
            <p style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.35rem' }}>
              {report.description || 'Nenhum detalhe adicional fornecido.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div><strong>Tipo de Alvo:</strong> {report.target_type}</div>
            <div><strong>ID do Alvo:</strong> <code>{report.target_id}</code></div>
            <div><strong>Operador Responsável:</strong> {report.assigned_profile?.display_name || 'Ninguém atribuído'}</div>
            <div><strong>Data de Abertura:</strong> {new Date(report.created_at).toLocaleString('pt-BR')}</div>
          </div>
        </Card>

        {/* Right Column: Resolution & Target Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="glass" padding="lg">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Ações sobre o Alvo</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Navegue diretamente até a entidade denunciada para revisar seu conteúdo ou aplicar suspensões:
            </p>

            {report.target_type === 'advertiser' && (
              <Link href={`/admin/moderation/profiles/${report.target_id}`}>
                <Button variant="secondary" size="sm" fullWidth rightIcon={<ExternalLink size={14} />}>
                  Abrir Perfil do Anunciante
                </Button>
              </Link>
            )}

            {report.target_type === 'media' && (
              <Link href="/admin/moderation/media">
                <Button variant="secondary" size="sm" fullWidth rightIcon={<ExternalLink size={14} />}>
                  Ver Mídia na Fila
                </Button>
              </Link>
            )}
          </Card>

          <Card variant="glass" padding="lg">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Notas de Resolução</h3>
            <FormField label="Descreva as providências tomadas para encerramento">
              <textarea
                className="input"
                rows={4}
                placeholder="Ex: Mídia bloqueada e perfil advertido..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </FormField>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
