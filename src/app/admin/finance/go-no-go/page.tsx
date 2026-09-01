'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { goNoGoService } from '@/services/finance/goNoGoService';
import { ProductionReadinessReport, ProductionGoNoGoGate } from '@/services/payments/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Lock,
  FileCheck2,
  Scale
} from 'lucide-react';

export default function ProductionGoNoGoPage() {
  const [report, setReport] = useState<ProductionReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    const data = await goNoGoService.evaluateProductionReadiness();
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <AdminLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/finance" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar para Gestão Financeira
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              Checklist Go/No-Go para Ativação Produtiva
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Matriz de decisão server-authoritative através de 8 portões mandatórios de governança
            </p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadReport} isLoading={loading}>
            Reavaliar Portões
          </Button>
        </div>
      </div>

      {/* Decision Summary Banner */}
      <div style={{ background: 'rgba(255, 69, 58, 0.12)', border: '2px solid var(--accent-ruby)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={28} color="var(--accent-ruby)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#fff', display: 'block' }}>
              DECISÃO ATUAL: PAGAMENTOS REAIS BLOQUEADOS (NO-GO)
            </strong>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              O Kill Switch permanece ativo (`PORTAL18_PAYMENT_KILL_SWITCH=true`). Existem portões externos pendentes de deliberação formal.
            </span>
          </div>
        </div>
        <Badge variant="ruby" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
          KILL SWITCH ATIVO
        </Badge>
      </div>

      {/* Gates Matrix */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="100%" height="90px" />
          <Skeleton width="100%" height="90px" />
          <Skeleton width="100%" height="90px" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {report?.gates.map((g) => {
            const isPass = g.status === 'PASS';
            const isPending = g.status === 'PENDING_EXTERNAL_REVIEW' || g.status === 'NOT_CONFIGURED';

            return (
              <Card key={g.gate} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPass ? (
                      <CheckCircle2 size={20} color="var(--color-success)" />
                    ) : (
                      <AlertTriangle size={20} color="var(--accent-gold)" />
                    )}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                      {g.title}
                    </h3>
                  </div>
                  <Badge variant={isPass ? 'success' : isPending ? 'gold' : 'ruby'}>
                    {g.status}
                  </Badge>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                  {g.description}
                </p>

                {/* Requirements */}
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Requisitos Avaliados:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {g.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                {/* Blockers */}
                {g.blockers.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-ruby)' }}>
                    <XCircle size={14} style={{ flexShrink: 0 }} />
                    <span><strong>Bloqueio Ativo:</strong> {g.blockers.join('; ')}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
