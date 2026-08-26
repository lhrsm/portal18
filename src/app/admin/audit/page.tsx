'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { FileSpreadsheet, Search, Lock, ShieldCheck } from 'lucide-react';

export default function AdminAuditPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const res = await adminService.getAuditLogs({ action: actionFilter || undefined });
    setLogs(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Lock size={16} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}>REGISTRO IMUTÁVEL (LGPD COMPLIANT)</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Logs de Auditoria Administrativa</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Trilha completa de ações executadas pelo staff (aprovações, suspensões, bloqueios e cargos)
          </p>
        </div>
        <Badge variant="gold">{totalCount} eventos auditados</Badge>
      </div>

      {/* Filter */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); loadLogs(); }} style={{ display: 'flex', gap: '0.5rem' }}>
          <Input
            type="text"
            placeholder="Filtrar por ação (ex: profile_approved, media_blocked)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="md" leftIcon={<Search size={16} />}>
            Filtrar
          </Button>
        </form>
      </Card>

      {/* Logs Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : logs.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <ShieldCheck size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum log encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Eventos auditados aparecerão aqui conforme as ações forem executadas.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {logs.map((log) => (
            <Card key={log.id} variant="glass" padding="sm" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Badge variant="gold">{log.action}</Badge>
                  <span style={{ fontWeight: 600 }}>Entidade: {log.entity_type}</span>
                  {log.entity_id && <code style={{ fontSize: '0.75rem' }}>{log.entity_id.substring(0, 8)}...</code>}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Ator: <strong>{log.profiles?.display_name || log.profiles?.username || 'Sistema'}</strong> • {new Date(log.created_at).toLocaleString('pt-BR')}
                </div>
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'monospace', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {JSON.stringify(log.metadata)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
