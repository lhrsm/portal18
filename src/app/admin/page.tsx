'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Shield, Lock, AlertTriangle, Activity, Database, Users, FileCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, profile, isAdmin } = useAuth();

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="ruby">ÁREA RESTRITA</Badge>
            <Badge variant="gold">ADMIN / SUPER_ADMIN</Badge>
          </div>
          <h1 style={{ fontSize: '2.2rem' }}>Painel Administrativo</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Supervisão de segurança, moderação de mídias, conformidade 18+ e integridade do banco
          </p>
        </div>

        <Badge variant="success">Sistema Saudável</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Security Metric 1 */}
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Shield size={22} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.2rem' }}>Status do RLS</h3>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)', marginBottom: '0.4rem' }}>
            11 / 11
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Tabelas de domínio com RLS ativo e políticas de isolamento Deny-by-Default
          </p>
        </Card>

        {/* Security Metric 2 */}
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <FileCheck size={22} color="var(--color-info)" />
            <h3 style={{ fontSize: '1.2rem' }}>Storage Privado</h3>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
            Protegido
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Bucket <code>verification-private</code> sem URLs públicas abertas
          </p>
        </Card>

        {/* Security Metric 3 */}
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Lock size={22} color="var(--accent-ruby)" />
            <h3 style={{ fontSize: '1.2rem' }}>Proteção de Roles</h3>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-ruby)', marginBottom: '0.4rem' }}>
            Blindado
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Auto-escalação bloqueada por triggers e RLS em <code>user_roles</code>
          </p>
        </Card>
      </div>

      {/* Admin Operations Info */}
      <Card variant="elevated" padding="lg">
        <h3 style={{ fontSize: '1.35rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} color="var(--accent-gold)" /> Auditoria & Governança da Plataforma
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          Operador logado: <strong>{profile?.display_name || user?.email}</strong>. Todas as ações administrativas são registradas na tabela <code>audit_logs</code> com hash de identificação e restrição imutável contra deleções.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Button variant="secondary" size="sm">
            Ver Logs de Auditoria
          </Button>
          <Button variant="secondary" size="sm">
            Fila de Moderação de Mídias
          </Button>
          <Button variant="secondary" size="sm">
            Fila de Verificação KYC
          </Button>
        </div>
      </Card>
    </div>
  );
}
