'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { incidentService } from '@/services/incidents/incidentService';
import { telemetryService } from '@/services/observability/telemetryService';
import { PlatformKillSwitch, Incident } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  ShieldAlert, 
  ArrowLeft, 
  ToggleLeft, 
  ToggleRight, 
  Activity, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Lock, 
  Server 
} from 'lucide-react';

export default function AdminSecurityCenterPage() {
  const router = useRouter();
  const { user, isStaff, isAdmin, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [killSwitches, setKillSwitches] = useState<PlatformKillSwitch[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSwitch, setIsUpdatingSwitch] = useState(false);

  // New incident modal state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'minor' | 'major' | 'critical'>('minor');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalSummary, setInternalSummary] = useState('');
  const [isCreatingIncident, setIsCreatingIncident] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [switches, incList] = await Promise.all([
        incidentService.getKillSwitches(),
        incidentService.getAdminIncidents(),
      ]);
      setKillSwitches(switches);
      setIncidents(incList);
      setMetrics(telemetryService.getMetrics());
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
  }, [isStaff, authLoading]);

  const handleToggleSwitch = async (sw: PlatformKillSwitch) => {
    if (!isAdmin) {
      showToast({ type: 'error', title: 'Permissão Negada', message: 'Apenas administradores podem alterar kill switches.' });
      return;
    }

    const nextState = !sw.enabled;
    const confirmMsg = nextState 
      ? `ATENÇÃO: Deseja ATIVAR a trava de segurança [${sw.switch_key}]? Isto bloqueará recursos da plataforma.`
      : `Deseja desativar a trava [${sw.switch_key}] e restaurar a operação normal?`;

    if (!confirm(confirmMsg)) return;

    setIsUpdatingSwitch(true);
    const res = await incidentService.toggleKillSwitch(sw.switch_key, nextState, 'Alteração manual pelo Admin Security Center');
    setIsUpdatingSwitch(false);

    if (res.success) {
      showToast({ type: 'success', title: 'Kill Switch Atualizado', message: `Trava [${sw.switch_key}] ${nextState ? 'ativada' : 'desativada'}.` });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao alterar trava.' });
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreatingIncident(true);
    const res = await incidentService.createIncident({
      title: incidentTitle,
      severity: incidentSeverity,
      publicMessage,
      internalSummary,
      createdBy: user.id,
    });
    setIsCreatingIncident(false);

    if (res.success) {
      showToast({ type: 'success', title: 'Incidente Registrado', message: 'Notificação pública atualizada.' });
      setIsIncidentModalOpen(false);
      setIncidentTitle('');
      setPublicMessage('');
      setInternalSummary('');
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao registrar incidente.' });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <ShieldAlert size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Admin Security & Incident Center</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Controles de travamento de emergência (Kill Switches), gestão de incidentes e métricas de proteção.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/risk">
            <Button variant="secondary" size="sm">
              Fila de Risco & Antifraude
            </Button>
          </Link>
          <Button variant="ruby" size="sm" onClick={() => setIsIncidentModalOpen(true)} leftIcon={<Plus size={14} />}>
            Novo Incidente
          </Button>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Requisições Observadas</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.request_count}</div>
          </Card>
          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Falhas de Autenticação</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{metrics.auth_failures}</div>
          </Card>
          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rate Limits Acionados</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>{metrics.rate_limits_triggered}</div>
          </Card>
          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Latência Média DB</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics.db_latency_ms}ms</div>
          </Card>
        </div>
      )}

      {/* Age Assurance (ECA Digital) Metrics */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Garantia de Maioridade (ECA Digital & Age Gate)</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Provedor homologado, status de sandbox/produção e controle de enforcement
            </p>
          </div>
          <Badge variant="gold">FAIL-CLOSED PRIVACY</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Provedor Selecionado</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>Verifica ID (Primário)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Fallback: Sumsub Age</div>
          </Card>

          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status de Sandbox</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)' }}>Validado (Sandbox)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginTop: '0.2rem' }}>Credenciais Reais: Pendentes</div>
          </Card>

          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Comercial / DPA</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>Homologação Pendente</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Contratação B2B em andamento</div>
          </Card>

          <Card variant="glass" padding="md">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enforcement em Produção</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Modo Seguro Ativo</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.2rem' }}>● Fail-Closed Ativo</div>
          </Card>
        </div>
      </div>

      {/* Kill Switches Grid (Section 117) */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Travas de Emergência (Kill Switches)</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Permite desativar componentes específicos instantaneamente em caso de ataque ou sobrecarga.
            </p>
          </div>
        </div>

        {isLoading ? (
          <Skeleton height="150px" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {killSwitches.map((sw) => (
              <Card key={sw.id} variant="glass" padding="md" style={{ border: sw.enabled ? '1px solid var(--accent-ruby)' : '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: sw.enabled ? 'var(--accent-ruby)' : 'var(--text-primary)' }}>
                      {sw.switch_key}
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {sw.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSwitch(sw)}
                    disabled={isUpdatingSwitch}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: sw.enabled ? 'var(--accent-ruby)' : 'var(--text-muted)' }}
                  >
                    {sw.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Status: <strong>{sw.enabled ? 'BLOQUEADO' : 'LIBERADO'}</strong></span>
                  <span>Atualizado: {new Date(sw.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Incidents Management (Section 112) */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Painel de Incidentes Operacionais</h2>
        {incidents.length === 0 ? (
          <Card variant="glass" padding="md" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum incidente registrado no painel.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {incidents.map((inc) => (
              <Card key={inc.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{inc.title}</span>
                      <Badge variant={inc.severity === 'critical' ? 'ruby' : inc.severity === 'major' ? 'gold' : 'neutral'}>
                        {inc.severity}
                      </Badge>
                      <Badge variant={inc.status === 'resolved' ? 'neutral' : 'ruby'}>
                        {inc.status}
                      </Badge>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Mensagem Pública: {inc.public_message}
                    </p>
                    {inc.internal_summary && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Nota Interna: {inc.internal_summary}
                      </p>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Iniciado em {new Date(inc.started_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {isIncidentModalOpen && (
        <div
          onClick={() => setIsIncidentModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '520px', width: '100%' }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Registrar Novo Incidente</h3>
            <form onSubmit={handleCreateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Título do Incidente *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Instabilidade no processamento de mídia"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="label">Severidade *</label>
                <select
                  className="input"
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value as any)}
                  style={{ width: '100%' }}
                >
                  <option value="minor">Minor (Baixo impacto)</option>
                  <option value="major">Major (Impacto parcial)</option>
                  <option value="critical">Critical (Interrupção total)</option>
                </select>
              </div>

              <div>
                <label className="label">Mensagem Pública (Exibida em /status) *</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Estamos investigando lentidão temporária no envio de fotos..."
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                  required
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div>
                <label className="label">Sumário Técnico Interno (Sigiloso)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Logs, trace id ou hipótese de causa raiz..."
                  value={internalSummary}
                  onChange={(e) => setInternalSummary(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="secondary" onClick={() => setIsIncidentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="ruby" isLoading={isCreatingIncident}>
                  Publicar Incidente
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
