'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function AdminReconciliationPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'all'>('pending');

  const loadReconciliationLogs = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      let query = supabase
        .from('payment_reconciliation_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('resolved', false);
      } else if (statusFilter === 'resolved') {
        query = query.eq('resolved', true);
      }

      const { data, error } = await query;
      if (!error && data) {
        setLogs(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReconciliationLogs();
  }, [statusFilter]);

  const handleResolveDiscrepancy = async (logId: string) => {
    const supabase = createClient();
    try {
      const { error } = await (supabase.from('payment_reconciliation_logs') as any)
        .update({
          resolved: true,
          resolved_by: profile?.id,
          resolution_notes: 'Resolvido manualmente pela mesa de operações financeiras.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', logId);

      if (!error) {
        showToast({
          type: 'success',
          title: 'Discrepância Resolvida',
          message: 'O log de conciliação foi marcado como resolvido.',
        });
        await loadReconciliationLogs();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Falha ao resolver discrepância.',
      });
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Conciliação Financeira & Discrepâncias
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Fila operacional de auditoria para divergências de status, valores e webhooks de PSPs
          </p>
        </div>
        <Badge variant="gold">
          {logs.filter((l) => !l.resolved).length} pendentes de resolução
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Button
          variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === 'resolved' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('resolved')}
        >
          Resolvidos
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Todos os Logs
        </Button>
      </div>

      {/* Logs Table */}
      <Card variant="glass" padding="none">
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <Skeleton width="100%" height="40px" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width="100%" height="40px" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Nenhuma divergência registrada
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Todas as transações e webhooks estão 100% conciliados com o livro-razão local.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Provedor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Tipo de Discrepância</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Referência PSP</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status Local vs PSP</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Data</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                      {log.provider_code?.toUpperCase()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant="gold">{log.discrepancy_type}</Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>
                      {log.provider_reference || 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span>{log.local_status || 'N/A'}</span> <span style={{ color: 'var(--text-muted)' }}>→</span> <strong>{log.provider_status || 'N/A'}</strong>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {!log.resolved ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleResolveDiscrepancy(log.id)}
                        >
                          Resolver
                        </Button>
                      ) : (
                        <Badge variant="success">Resolvido</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
