'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function AdminReportsQueuePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    const res = await adminService.getReportsQueue({
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
    });
    setReports(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter, severityFilter]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="ruby"><ShieldAlert size={12} /> CRÍTICA</Badge>;
      case 'high':
        return <Badge variant="ruby">Alta</Badge>;
      case 'medium':
        return <Badge variant="warning">Média</Badge>;
      default:
        return <Badge variant="neutral">Baixa</Badge>;
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Central de Denúncias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Chamados abertos por visitantes com priorização automática de casos críticos
          </p>
        </div>
        <Badge variant="ruby">{totalCount} denúncias</Badge>
      </div>

      {/* Filters */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ minWidth: '180px' }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholderOption="Todos os Status">
            <option value="open">Abertas</option>
            <option value="under_review">Em Análise</option>
            <option value="resolved">Resolvidas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="escalated">Escaladas</option>
          </Select>
        </div>

        <div style={{ minWidth: '180px' }}>
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} placeholderOption="Todas as Severidades">
            <option value="critical">🚨 Crítica (Prioritária)</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </Select>
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
      ) : reports.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhuma denúncia pendente!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Todas as denúncias foram tratadas pela equipe de moderação.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reports.map((report) => (
            <Card
              key={report.id}
              variant="glass"
              padding="md"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                border: report.severity === 'critical' ? '1px solid var(--accent-ruby)' : undefined,
                background: report.severity === 'critical' ? 'rgba(163, 0, 33, 0.08)' : undefined,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  {getSeverityBadge(report.severity)}
                  <Badge variant={report.status === 'open' ? 'warning' : 'neutral'}>
                    Status: {report.status}
                  </Badge>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Alvo: {report.target_type}</span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
                  Motivo: {report.reason}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {report.description ? `"${report.description}"` : 'Sem descrição detalhada'} • {new Date(report.created_at).toLocaleString('pt-BR')}
                </div>
              </div>

              <Link href={`/admin/reports/${report.id}`}>
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Tratar Denúncia
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
