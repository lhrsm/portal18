'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { AdminDashboardMetrics } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Users, 
  Megaphone, 
  UserCheck, 
  Clock, 
  Image as ImageIcon, 
  AlertTriangle, 
  ShieldAlert, 
  FileCheck2, 
  Ban, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Server,
  Key
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      const data = await adminService.getDashboardMetrics();
      setMetrics(data);
      setLoading(false);
    }
    loadMetrics();
  }, []);

  return (
    <AdminLayout>
      {/* Top Banner Alert if there are Critical Reports (Requirements 8 & 34) */}
      {metrics && metrics.criticalReports > 0 && (
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--accent-ruby)', backgroundColor: 'rgba(163, 0, 33, 0.1)', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert size={26} color="var(--accent-ruby)" />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--accent-ruby)', fontSize: '1rem' }}>
                  {metrics.criticalReports} Denúncia(s) Crítica(s) Aguardando Análise Imediata
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Casos de suspeita de menor de idade ou violações graves requerem ação prioritária.
                </div>
              </div>
            </div>
            <Link href="/admin/reports">
              <Button variant="ruby" size="sm">
                Ver Fila de Denúncias
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Main Metrics Grid (Requirement 7) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Pending Profiles */}
        <Card variant="glass" padding="md" style={{ border: metrics && metrics.pendingProfiles > 0 ? '1px solid var(--accent-gold)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Perfis Pendentes</span>
            <Clock size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {loading ? <Skeleton width="60px" height="32px" /> : metrics?.pendingProfiles}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aguardando moderação</span>
        </Card>

        {/* Pending Media */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fotos Pendentes</span>
            <ImageIcon size={18} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>
            {loading ? <Skeleton width="60px" height="32px" /> : metrics?.pendingMedia}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fila de imagens</span>
        </Card>

        {/* Open Reports */}
        <Card variant="glass" padding="md" style={{ border: metrics && metrics.openReports > 0 ? '1px solid var(--accent-ruby)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Denúncias Abertas</span>
            <AlertTriangle size={18} color="var(--accent-ruby)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>
            {loading ? <Skeleton width="60px" height="32px" /> : metrics?.openReports}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {metrics?.criticalReports} com prioridade crítica
          </span>
        </Card>

        {/* Active Profiles */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Perfis Ativos</span>
            <UserCheck size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {loading ? <Skeleton width="60px" height="32px" /> : metrics?.activeProfiles}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Publicados no portal</span>
        </Card>
      </div>

      {/* Production Readiness Status Card (Sections 85, 86, 87) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem', border: '1px solid rgba(229, 185, 92, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Status Operacional da Plataforma</h3>
          </div>
          <Badge variant="gold">
            STATUS: GO WITH RESTRICTIONS
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={14} color="var(--color-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Supabase & Auth</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conectado (Migrations 00017)</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={14} color="var(--color-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Trust & Safety</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Publication Gate Endurecido</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <AlertCircle size={14} color="var(--accent-gold)" />
              <strong style={{ fontSize: '0.85rem' }}>KYC 18+ (Sumsub)</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sandbox Pronto / Prod Pendente</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <AlertCircle size={14} color="var(--accent-gold)" />
              <strong style={{ fontSize: '0.85rem' }}>Pagamentos & Faturamento</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kill Switch Ativo / Prod Desativada</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <AlertCircle size={14} color="var(--accent-gold)" />
              <strong style={{ fontSize: '0.85rem' }}>E-mail Transacional</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Templates Prontos / Credenciais Pendentes</span>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={14} color="var(--color-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Backup & DR</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Runbook & Manifestos Prontos</span>
          </div>
        </div>
      </Card>

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Usuários Cadastrados</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : metrics?.totalUsers}</div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Anunciantes Totais</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : metrics?.totalAdvertisers}</div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Verificações Pendentes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : metrics?.pendingVerifications}</div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Perfis Suspensos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-ruby)' }}>{loading ? '...' : metrics?.suspendedProfiles}</div>
        </Card>
      </div>

      {/* Quick Action Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <UserCheck size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Moderação de Perfis</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Avalie cadastros completos submetidos pelos anunciantes, valide fotos e libere para publicação.
          </p>
          <Link href="/admin/moderation/profiles">
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Abrir Fila de Perfis ({metrics?.pendingProfiles || 0})
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ImageIcon size={20} color="var(--color-info)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Moderação de Mídias</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Inspecione novas fotos adicionadas às galerias antes de permitir sua exibição pública.
          </p>
          <Link href="/admin/moderation/media">
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Abrir Fila de Imagens ({metrics?.pendingMedia || 0})
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} color="var(--accent-ruby)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Central de Denúncias</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Trate denúncias de usuários, assuma chamados e aplique suspensões preventivas quando necessário.
          </p>
          <Link href="/admin/reports">
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Abrir Denúncias ({metrics?.openReports || 0})
            </Button>
          </Link>
        </Card>
      </div>
    </AdminLayout>
  );
}
