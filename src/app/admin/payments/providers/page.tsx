'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { multiGatewayService } from '@/services/payments/multiGatewayService';
import { 
  PaymentProviderMetadata, 
  ProviderHomologationStage,
  ProviderHealthCheckResult 
} from '@/services/payments/types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Lock, 
  ExternalLink, 
  QrCode, 
  RotateCcw, 
  RefreshCw, 
  FileText, 
  Sliders, 
  Terminal, 
  Layers
} from 'lucide-react';

export default function AdminPaymentProvidersPage() {
  const { showToast } = useToast();
  const [providers, setProviders] = useState<PaymentProviderMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'candidates' | 'approved' | 'rejected'>('all');
  
  // Modal / Detail Drawer state
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'homologation' | 'products' | 'routing' | 'webhooks' | 'health' | 'audit'>('overview');
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<ProviderHealthCheckResult | null>(null);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await multiGatewayService.getProviders();
      setProviders(data);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao carregar provedores',
        message: err.message || 'Falha ao buscar provedores de pagamento.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleOpenDetails = (provider: PaymentProviderMetadata) => {
    setSelectedProvider(provider);
    setActiveTab('overview');
    setHealthResult(null);
  };

  const handleRunHealthCheck = async (code: string) => {
    setHealthChecking(true);
    try {
      const res = await multiGatewayService.checkProviderHealth(code);
      setHealthResult(res);
      showToast({
        type: res.status === 'healthy' ? 'success' : 'info',
        title: `Health Check — ${code.toUpperCase()}`,
        message: `Status: ${res.status.toUpperCase()} (${res.latencyMs}ms)`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro no Health Check',
        message: err.message || 'Falha ao executar teste de integridade.',
      });
    } finally {
      setHealthChecking(false);
    }
  };

  const getStageBadgeVariant = (stage: ProviderHomologationStage): 'success' | 'gold' | 'info' | 'ruby' | 'neutral' => {
    switch (stage) {
      case 'approved': return 'success';
      case 'homologating':
      case 'sandbox_ready': return 'gold';
      case 'technical_review':
      case 'commercial_review':
      case 'compliance_review': return 'info';
      case 'rejected':
      case 'suspended': return 'ruby';
      default: return 'neutral';
    }
  };

  const formatStageLabel = (stage: ProviderHomologationStage) => {
    switch (stage) {
      case 'candidate': return 'Candidato';
      case 'technical_review': return 'Revisão Técnica';
      case 'commercial_review': return 'Revisão Comercial';
      case 'compliance_review': return 'Revisão Compliance';
      case 'sandbox_ready': return 'Sandbox Pronto';
      case 'homologating': return 'Homologando';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado / Proibido';
      case 'suspended': return 'Suspenso';
      case 'deprecated': return 'Descontinuado';
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (filter === 'candidates') return p.overall_status !== 'approved' && p.overall_status !== 'rejected';
    if (filter === 'approved') return p.overall_status === 'approved';
    if (filter === 'rejected') return p.overall_status === 'rejected';
    return true;
  });

  return (
    <AdminLayout>
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Badge variant="ruby">
              <Lock size={12} /> KILL SWITCH 100% ATIVO
            </Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Cobranças Reais Desativadas (Modo Homologação)
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Provedores de Pagamento & Homologação</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '750px', marginTop: '0.25rem' }}>
            Arquitetura Multi-Gateway: avaliação, triagem de compliance, matriz de capacidades e governança de PSPs para o Portal18.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadProviders} isLoading={loading}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Todos ({providers.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('candidates')}
          className={`btn ${filter === 'candidates' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Em Avaliação ({providers.filter(p => p.overall_status !== 'approved' && p.overall_status !== 'rejected').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('approved')}
          className={`btn ${filter === 'approved' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Aprovados ({providers.filter(p => p.overall_status === 'approved').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('rejected')}
          className={`btn ${filter === 'rejected' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Incompatíveis / Proibidos ({providers.filter(p => p.overall_status === 'rejected').length})
        </button>
      </div>

      {/* Providers Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {filteredProviders.map((provider) => {
          const isStripe = provider.code === 'stripe';
          const isUnconfigured = provider.code === 'unconfigured';

          return (
            <Card key={provider.code} variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', border: isStripe ? '1px solid rgba(255, 45, 85, 0.3)' : isUnconfigured ? '1px solid rgba(229, 185, 92, 0.4)' : undefined }}>
              <div>
                {/* Header with Name & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{provider.name}</h3>
                      {provider.website && (
                        <a href={provider.website} target="_blank" rel="noreferrer" aria-label={`Site oficial do ${provider.name}`} style={{ color: 'var(--text-muted)' }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      CODE: {provider.code}
                    </span>
                  </div>
                  <Badge variant={getStageBadgeVariant(provider.overall_status)}>
                    {formatStageLabel(provider.overall_status)}
                  </Badge>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {provider.description}
                </p>

                {/* Tripartite Homologation Gates */}
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                    Portões de Homologação
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ padding: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Técnico</span>
                      <strong style={{ color: provider.technical_status === 'approved' ? 'var(--color-success)' : provider.technical_status === 'rejected' ? 'var(--accent-ruby)' : 'var(--accent-gold)' }}>
                        {formatStageLabel(provider.technical_status)}
                      </strong>
                    </div>
                    <div style={{ padding: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Comercial</span>
                      <strong style={{ color: provider.commercial_status === 'approved' ? 'var(--color-success)' : provider.commercial_status === 'rejected' ? 'var(--accent-ruby)' : 'var(--accent-gold)' }}>
                        {formatStageLabel(provider.commercial_status)}
                      </strong>
                    </div>
                    <div style={{ padding: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Compliance</span>
                      <strong style={{ color: provider.compliance_status === 'approved' ? 'var(--color-success)' : provider.compliance_status === 'rejected' ? 'var(--accent-ruby)' : 'var(--accent-gold)' }}>
                        {formatStageLabel(provider.compliance_status)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Capability Badges */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {provider.capabilities.pix === 'supported' && (
                    <Badge variant="gold" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      <QrCode size={11} /> PIX
                    </Badge>
                  )}
                  {provider.capabilities.credit_card === 'supported' && (
                    <Badge variant="info" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      <CreditCard size={11} /> Cartão
                    </Badge>
                  )}
                  {provider.capabilities.recurring_card === 'supported' && (
                    <Badge variant="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      <RotateCcw size={11} /> Recorrência
                    </Badge>
                  )}
                  {provider.capabilities.refund === 'supported' && (
                    <Badge variant="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      Estorno
                    </Badge>
                  )}
                  {provider.capabilities.chargeback_webhook === 'supported' && (
                    <Badge variant="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                      Chargeback
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  style={{ flex: 1 }} 
                  onClick={() => handleOpenDetails(provider)}
                >
                  Detalhes & Homologação
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  aria-label={`Testar saúde de ${provider.name}`}
                  onClick={() => handleRunHealthCheck(provider.code)}
                  title="Executar Health Check"
                >
                  <Activity size={16} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 8-Tab Detail Modal */}
      {selectedProvider && (
        <Modal
          isOpen={Boolean(selectedProvider)}
          onClose={() => setSelectedProvider(null)}
          title={`Homologação: ${selectedProvider.name}`}
          maxWidth="680px"
        >
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem', overflowX: 'auto', gap: '0.25rem', paddingBottom: '0.25rem' }}>
            {[
              { id: 'overview', label: 'Visão Geral', icon: <FileText size={14} /> },
              { id: 'capabilities', label: 'Capacidades', icon: <Sliders size={14} /> },
              { id: 'homologation', label: 'Checklist 18+', icon: <ShieldCheck size={14} /> },
              { id: 'products', label: 'Produtos', icon: <Layers size={14} /> },
              { id: 'routing', label: 'Roteamento', icon: <CreditCard size={14} /> },
              { id: 'webhooks', label: 'Webhooks', icon: <Terminal size={14} /> },
              { id: 'health', label: 'Saúde', icon: <Activity size={14} /> },
              { id: 'audit', label: 'Auditoria', icon: <Clock size={14} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.85rem',
                  background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-gold)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Geral</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <Badge variant={getStageBadgeVariant(selectedProvider.overall_status)}>
                      {formatStageLabel(selectedProvider.overall_status)}
                    </Badge>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ambiente Ativo</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <Badge variant={selectedProvider.is_production_enabled ? 'ruby' : selectedProvider.is_sandbox_enabled ? 'gold' : 'neutral'}>
                      {selectedProvider.is_production_enabled ? 'PRODUÇÃO' : selectedProvider.is_sandbox_enabled ? 'SANDBOX' : 'DESATIVADO'}
                    </Badge>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prioridade no Resolver</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.2rem' }}>
                    #{selectedProvider.priority}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                {selectedProvider.description}
              </p>

              <div style={{ background: 'rgba(255, 45, 85, 0.06)', border: '1px solid rgba(255, 45, 85, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <ShieldAlert size={18} color="var(--accent-ruby)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#fff' }}>Regra de Isolamento Financeiro:</strong> Nenhuma credencial de API é exposta no frontend. Todas as transações permanecem bloqueadas pelo Kill Switch até a aprovação formal do comitê de compliance.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Capabilities Matrix */}
          {activeTab === 'capabilities' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Matriz técnica auditada para o provedor <strong>{selectedProvider.name}</strong>:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem', maxHeight: '350px', overflowY: 'auto' }}>
                {Object.entries(selectedProvider.capabilities).map(([key, val]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <Badge variant={val === 'supported' ? 'success' : val === 'unsupported' ? 'ruby' : 'neutral'}>
                      {val === 'supported' ? 'SUPORTADO' : val === 'unsupported' ? 'NÃO SUPORTADO' : 'DESCONHECIDO'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Homologation & Business Model Review */}
          {activeTab === 'homologation' && (
            <div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--accent-gold)' }}>
                  Declaração Formal de Modelo de Negócios (Adult Advertising)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedProvider.business_model_review.adult_platform_disclosed ? (
                      <CheckCircle2 size={16} color="var(--color-success)" />
                    ) : (
                      <XCircle size={16} color="var(--text-muted)" />
                    )}
                    <span>Plataforma 18+ / Classificados Adultos Informada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedProvider.business_model_review.subscriptions_disclosed ? (
                      <CheckCircle2 size={16} color="var(--color-success)" />
                    ) : (
                      <XCircle size={16} color="var(--text-muted)" />
                    )}
                    <span>Planos de Assinatura de Anunciantes (Essencial, Destaque, Premium, VIP)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedProvider.business_model_review.consumer_premium_disclosed ? (
                      <CheckCircle2 size={16} color="var(--color-success)" />
                    ) : (
                      <XCircle size={16} color="var(--text-muted)" />
                    )}
                    <span>Assinatura de Membros Consumer Premium</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedProvider.business_model_review.boost_products_disclosed ? (
                      <CheckCircle2 size={16} color="var(--color-success)" />
                    ) : (
                      <XCircle size={16} color="var(--text-muted)" />
                    )}
                    <span>Produtos de Impulsionamento Rápido (Boost 24h / 3d)</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Referência de Homologação:</strong> {selectedProvider.business_model_review.reference_number || 'Nenhuma (Aguardando Parecer)'}</div>
                  <div><strong>Parecer de Compliance:</strong> {selectedProvider.business_model_review.notes || 'Pendente de envio de dossiê de publicidade digital.'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Supported Products */}
          {activeTab === 'products' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Produtos comerciais do catálogo Portal18 mapeados para processamento futuro:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Planos de Anunciantes (7, 30 e 90 dias)</strong>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Essencial (R$ 49,90/mês), Destaque (R$ 89,90/mês), Premium (R$ 149,90/mês), VIP (R$ 249,90/mês)</span>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Consumer Premium (7, 30 e 90 dias)</strong>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Acesso exclusivo a vídeos restritos e avaliações completas (R$ 24,90/mês)</span>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>Impulsionamento & Campanhas (Boosts)</strong>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Destaque 24h (R$ 19,90) e Destaque 3 Dias (R$ 49,90)</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Routing */}
          {activeTab === 'routing' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Regras de roteamento financeiro configuradas para este gateway:
              </p>
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Roteamento PIX:</span>
                  <Badge variant="neutral">PRIORIDADE #{selectedProvider.priority}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Roteamento Cartão de Crédito:</span>
                  <Badge variant="neutral">PRIORIDADE #{selectedProvider.priority}</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Roteamento Recorrência:</span>
                  <Badge variant="neutral">PRIORIDADE #{selectedProvider.priority}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Webhooks */}
          {activeTab === 'webhooks' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Especificações de segurança de webhooks para o provedor:
              </p>
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                <div><strong>ENDPOINT:</strong> /api/webhooks/payments?provider={selectedProvider.code}</div>
                <div><strong>ASSINATURA HMAC:</strong> Ativa com timing-safe comparison</div>
                <div><strong>IDEMPOTÊNCIA:</strong> Chave única vinculada ao order_id e provider_event_id</div>
                <div><strong>REPLAY PROTECTION:</strong> Timestamp drift máximo de 300s</div>
              </div>
            </div>
          )}

          {/* Tab 7: Health & Telemetry */}
          {activeTab === 'health' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Diagnóstico e integridade do adapter em tempo real:
                </p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => handleRunHealthCheck(selectedProvider.code)} 
                  isLoading={healthChecking}
                >
                  Testar Conexão
                </Button>
              </div>

              {healthResult && (
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Activity size={18} color="var(--accent-gold)" />
                    <strong style={{ textTransform: 'uppercase' }}>Status: {healthResult.status}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Latência:</strong> {healthResult.latencyMs} ms</div>
                    <div><strong>Mensagem:</strong> {healthResult.message}</div>
                    <div><strong>Verificado em:</strong> {new Date(healthResult.checkedAt).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 8: Audit History */}
          {activeTab === 'audit' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Trilha de auditoria das etapas de homologação do provedor:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.775rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>01/09/2026 00:00 • Sistema</span>
                  <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>Cadastro inicial do adaptador na arquitetura Multi-Gateway</div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </AdminLayout>
  );
}
