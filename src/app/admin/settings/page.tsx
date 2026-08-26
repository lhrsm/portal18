'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Settings, ShieldCheck, Lock } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações Globais da Plataforma</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Parâmetros de moderação, limites de upload e diretrizes de conformidade
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ShieldCheck size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Parâmetros de Moderação</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div><strong>Moderação Prévia de Fotos:</strong> Obrigatória (Ativa)</div>
            <div><strong>Limite Máximo por Galeria:</strong> 15 imagens</div>
            <div><strong>Tamanho Máximo por Foto:</strong> 10 MB (JPG, PNG, WEBP)</div>
            <div><strong>Limpeza de Metadados EXIF:</strong> Automática no upload</div>
          </div>
        </Card>

        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Lock size={20} color="var(--accent-ruby)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Segurança & Proteção 18+</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div><strong>Age Gate Obrigatório:</strong> Ativo</div>
            <div><strong>Blindagem de Nascimento (LGPD):</strong> Ativa</div>
            <div><strong>Suspeita de Menores:</strong> Severidade Crítica Automática</div>
            <div><strong>Trilha de Auditoria:</strong> Imutável</div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
