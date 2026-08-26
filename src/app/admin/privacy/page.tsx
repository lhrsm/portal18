'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { dataLifecycleService } from '@/services/privacy/dataLifecycleService';
import { LegalHold, DataRetentionPolicy } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Scale, 
  ArrowLeft, 
  Download, 
  Trash2, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Plus 
} from 'lucide-react';

export default function AdminPrivacyDashboard() {
  const router = useRouter();
  const { user, isStaff, isAdmin, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'holds' | 'retention'>('holds');
  const [legalHolds, setLegalHolds] = useState<LegalHold[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [holds, policies] = await Promise.all([
        dataLifecycleService.getLegalHolds(),
        dataLifecycleService.getRetentionPolicies(),
      ]);
      setLegalHolds(holds);
      setRetentionPolicies(policies);
    } catch (err) {
      console.error('Error loading privacy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isStaff) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [isStaff, authLoading]);

  const handleReleaseHold = async (holdId: string) => {
    if (!user) return;
    const res = await dataLifecycleService.releaseLegalHold(holdId, user.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Legal Hold Liberado', message: 'A retenção legal foi cancelada.' });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao liberar retenção.' });
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '1140px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Painel Geral
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Scale size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Privacidade, LGPD e Retenção de Dados</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Monitoramento de legal holds, filas de exportação/exclusão e ciclo de vida de dados.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={activeTab === 'holds' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('holds')}
            leftIcon={<ShieldAlert size={14} />}
          >
            Legal Holds ({legalHolds.length})
          </Button>
          <Button
            variant={activeTab === 'retention' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('retention')}
            leftIcon={<Clock size={14} />}
          >
            Políticas de Retenção ({retentionPolicies.length})
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
      ) : activeTab === 'holds' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Retenções Legais Ativas (Legal Holds)</h2>
          </div>

          {legalHolds.length === 0 ? (
            <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Nenhum legal hold ativo</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Nenhuma conta ou perfil está atualmente sob custódia probatória restritiva.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {legalHolds.map((h) => (
                <Card key={h.id} variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <Badge variant="ruby">{h.entity_type.toUpperCase()}</Badge>
                        <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          ID: {h.entity_id}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        Motivo: {h.reason}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Criado em: {new Date(h.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {!h.released_at ? (
                      <Button variant="secondary" size="sm" onClick={() => handleReleaseHold(h.id)}>
                        Liberar Retenção
                      </Button>
                    ) : (
                      <Badge variant="neutral">Liberado</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Políticas de Retenção e Expiração de Dados</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {retentionPolicies.map((p) => (
              <Card key={p.policy_key} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{p.description}</h3>
                  <Badge variant="gold">{p.retention_days} dias</Badge>
                </div>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  Chave: {p.policy_key}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
