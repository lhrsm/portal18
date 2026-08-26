'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { riskEngine } from '@/services/security/riskEngine';
import { RiskEvent } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Filter, 
  UserX, 
  Check, 
  X 
} from 'lucide-react';

export default function AdminRiskQueuePage() {
  const router = useRouter();
  const { user, isStaff, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await riskEngine.getAdminRiskQueue({
        status: selectedStatus,
        severity: selectedSeverity,
      });
      setRiskEvents(data);
    } catch (err) {
      console.error(err);
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
  }, [isStaff, authLoading, selectedStatus, selectedSeverity]);

  const handleResolve = async (eventId: string, resolution: 'resolved' | 'false_positive' | 'confirmed') => {
    if (!user) return;
    const res = await riskEngine.resolveRiskEvent(eventId, resolution, user.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Status Atualizado', message: `Evento marcado como ${resolution}.` });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao resolver evento.' });
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '1140px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/security" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Security Center
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <AlertTriangle size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Fila de Risco e Sinais Antifraude</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Auditoria de anomalias comportamentais, suspeita de takeover, abusos de cadastro e fotos duplicadas.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="all">Todos os Status</option>
            <option value="open">Em Aberto</option>
            <option value="confirmed">Confirmados</option>
            <option value="false_positive">Falsos Positivos</option>
            <option value="resolved">Resolvidos</option>
          </select>

          <select
            className="input"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="all">Todas as Severidades</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <Button variant="secondary" size="sm" onClick={loadData} leftIcon={<RefreshCw size={14} />}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Risk Events List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Skeleton height="85px" />
          <Skeleton height="85px" />
        </div>
      ) : riskEvents.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <CheckCircle2 size={42} color="var(--color-success)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Nenhum sinal pendente</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum evento de risco corresponde aos filtros selecionados.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {riskEvents.map((ev) => {
            const dateStr = new Date(ev.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={ev.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <Badge variant={ev.severity === 'critical' || ev.severity === 'high' ? 'ruby' : 'neutral'}>
                        {ev.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="gold">+{ev.score_delta} pts</Badge>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ev.risk_type}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Origem: <strong>{ev.source}</strong> • Registrado em {dateStr}
                    </div>

                    {ev.profile_id && (
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Profile ID: {ev.profile_id}
                      </div>
                    )}
                  </div>

                  {ev.status === 'open' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Button
                        variant="ruby"
                        size="sm"
                        onClick={() => handleResolve(ev.id, 'confirmed')}
                        leftIcon={<AlertTriangle size={14} />}
                      >
                        Confirmar Abuso
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolve(ev.id, 'false_positive')}
                        leftIcon={<X size={14} />}
                      >
                        Falso Positivo
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleResolve(ev.id, 'resolved')}
                        leftIcon={<Check size={14} />}
                      >
                        Resolver
                      </Button>
                    </div>
                  ) : (
                    <Badge variant={ev.status === 'confirmed' ? 'ruby' : 'neutral'}>
                      {ev.status}
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
