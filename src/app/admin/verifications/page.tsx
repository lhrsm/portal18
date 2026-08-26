'use client';

import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileCheck2, ShieldCheck, Clock } from 'lucide-react';

export default function AdminVerificationsPage() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Verificações de Identidade 18+</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Gestão de pedidos de validação documental e selos de perfil verificado
        </p>
      </div>

      <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <FileCheck2 size={44} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Módulo de Verificação Automatizada</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
          Nesta etapa de fundação, o sistema está configurado para integração com o provedor de biometria facial e checagem de RG/CNH em fases subsequentes.
        </p>
        <Badge variant="neutral">Nenhum pedido manual pendente</Badge>
      </Card>
    </AdminLayout>
  );
}
