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
  TechnicalHomologationStatus,
  CommercialApprovalStatus,
  ComplianceApprovalStatus,
  AdultBusinessReviewStatus,
  ProviderHealthCheckResult,
  SandboxCapabilityTestResult
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
  Layers,
  FlaskConical,
  Play,
  KeyRound
} from 'lucide-react';

export default function AdminPaymentProvidersPage() {
  const { showToast } = useToast();
  const [providers, setProviders] = useState<PaymentProviderMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'candidates' | 'approved' | 'rejected' | 'internal'>('all');

  // Modal / Detail Drawer state
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'sandbox' | 'homologation' | 'products' | 'routing' | 'webhooks' | 'health'>('overview');
  const [healthChecking, setHealthChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<ProviderHealthCheckResult | null>(null);
  const [sandboxTesting, setSandboxTesting] = useState(false);
  const [sandboxTestResult, setSandboxTestResult] = useState<SandboxCapabilityTestResult | null>(null);

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
    setSandboxTestResult(null);
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

  const handleRunSandboxTest = async (code: string) => {
    setSandboxTesting(true);
    try {
      const res = await multiGatewayService.runSandboxCertification(code);
      setSandboxTestResult(res);
      showToast({
        type: res.overallStatus === 'SANDBOX_PASSED' || res.overallStatus === 'SANDBOX_READY' ? 'success' : 'info',
        title: `Certificação Sandbox — ${code.toUpperCase()}`,
        message: `Resultado: ${res.overallStatus} (Aprovados: ${res.passedCount} / Falhas: ${res.failedCount})`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro na Certificação Sandbox',
        message: err.message || 'Falha ao rodar suite de homologação.',
      });
    } finally {
      setSandboxTesting(false);
    }
  };

  const getTechnicalBadgeVariant = (status: TechnicalHomologationStatus): 'success' | 'gold' | 'info' | 'ruby' | 'neutral' => {
    switch (status) {
      case 'SANDBOX_PASSED':
      case 'PRODUCTION_APPROVED': return 'success';
      case 'SANDBOX_READY':
      case 'CONFIGURED': return 'gold';
      case 'SANDBOX_TESTING':
      case 'PRODUCTION_REVIEW': return 'info';
      case 'SANDBOX_FAILED':
      case 'PRODUCTION_BLOCKED': return 'ruby';
      default: return 'neutral';
    }
  };

  const getCommercialBadgeVariant = (status: CommercialApprovalStatus): 'success' | 'gold' | 'info' | 'ruby' | 'neutral' => {
    switch (status) {
      case 'approved': return 'success';
      case 'commercial_review': return 'info';
      case 'candidate': return 'gold';
      case 'rejected':
      case 'suspended': return 'ruby';
      default: return 'neutral';
    }
  };

  const getComplianceBadgeVariant = (status: ComplianceApprovalStatus): 'success' | 'gold' | 'info' | 'ruby' | 'neutral' => {
    switch (status) {
      case 'approved': return 'success';
      case 'compliance_review': return 'info';
      case 'candidate': return 'gold';
      case 'rejected':
      case 'suspended': return 'ruby';
      default: return 'neutral';
    }
  };

  const getAdultReviewBadgeVariant = (status: AdultBusinessReviewStatus): 'success' | 'gold' | 'info' | 'ruby' | 'neutral' => {
    switch (status) {
      case 'approved': return 'success';
      case 'under_review': return 'info';
      case 'not_reviewed': return 'gold';
      case 'rejected':
      case 'restricted': return 'ruby';
      default: return 'neutral';
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (filter === 'internal') return p.is_internal_driver;
    if (filter === 'candidates') return !p.is_internal_driver && p.commercial_status !== 'approved' && p.commercial_status !== 'rejected';
    if (filter === 'approved') return !p.is_internal_driver && p.commercial_status === 'approved';
    if (filter === 'rejected') return p.commercial_status === 'rejected' || p.compliance_status === 'rejected';
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
              Ambiente de Homologação Sandbox • Cobranças Reais Bloqueadas
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Homologação Sandbox & Multi-Gateway</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '800px', marginTop: '0.25rem' }}>
            Certificação técnica, validação de credenciais, auditoria tripartite (Técnico, Comercial, Compliance 18+) e resiliência de pagamentos.
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
          Em Homologação ({providers.filter(p => !p.is_internal_driver && p.commercial_status !== 'approved' && p.commercial_status !== 'rejected').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('approved')}
          className={`btn ${filter === 'approved' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Aprovados ({providers.filter(p => !p.is_internal_driver && p.commercial_status === 'approved').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('rejected')}
          className={`btn ${filter === 'rejected' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Incompatíveis / Proibidos ({providers.filter(p => p.commercial_status === 'rejected' || p.compliance_status === 'rejected').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('internal')}
          className={`btn ${filter === 'internal' ? 'btn-gold' : 'btn-secondary'}`}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
        >
          Driver Interno (Test Only) ({providers.filter(p => p.is_internal_driver).length})
        </button>
      </div>

      {/* Providers Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {filteredProviders.map((provider) => {
          const isStripe = provider.code === 'stripe';
          const isInternal = provider.is_internal_driver;

          return (
            <Card key={provider.code} variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', border: isStripe ? '1px solid rgba(255, 45, 85, 0.3)' : isInternal ? '1px solid rgba(229, 185, 92, 0.4)' : undefined }}>
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
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        CODE: {provider.code}
                      </span>
                      {isInternal && (
                        <Badge variant="gold" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                          TEST ONLY
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={getTechnicalBadgeVariant(provider.technical_status)}>
                    {provider.technical_status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {provider.description}
                </p>

                {/* Configuration & Tripartite Homologation Gates */}
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Credenciais Sandbox
                    </span>
                    <Badge variant={provider.is_sandbox_configured ? 'success' : 'neutral'} style={{ fontSize: '0.7rem' }}>
                      <KeyRound size={11} /> {provider.is_sandbox_configured ? 'CONFIGURADAS' : 'NÃO CONFIGURADAS'}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ padding: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Comercial</span>
                      <strong style={{ color: provider.commercial_status === 'approved' ? 'var(--color-success)' : provider.commercial_status === 'rejected' ? 'var(--accent-ruby)' : 'var(--accent-gold)' }}>
                        {provider.commercial_status.toUpperCase()}
                      </strong>
                    </div>
                    <div style={{ padding: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Compliance</span>
                      <strong style={{ color: provider.compliance_status === 'approved' ? 'var(--color-success)' : provider.compliance_status === 'rejected' ? 'var(--accent-ruby)' : 'var(--accent-gold)' }}>
                        {provider.compliance_status.toUpperCase()}
                      </strong>
                    </div>
                    <div style={{ padding: '0.35rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>Modelo 18+</span>
                      <strong style={{ color: provider.adult_business_review_status === 'approved' ? 'var(--color-success)' : provider.adult_business_review_status === 'rejected' ? 'var(--accent-ruby)' : 'var(--accent-gold)' }}>
                        {provider.adult_business_review_status.toUpperCase()}
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
                  Homologação & Testes
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
          maxWidth="720px"
        >
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem', overflowX: 'auto', gap: '0.25rem', paddingBottom: '0.25rem' }}>
            {[
              { id: 'overview', label: 'Visão Geral', icon: <FileText size={14} /> },
              { id: 'sandbox', label: 'Testes Sandbox', icon: <FlaskConical size={14} /> },
              { id: 'capabilities', label: 'Capacidades', icon: <Sliders size={14} /> },
              { id: 'homologation', label: 'Compliance 18+', icon: <ShieldCheck size={14} /> },
              { id: 'products', label: 'Produtos', icon: <Layers size={14} /> },
              { id: 'routing', label: 'Roteamento', icon: <CreditCard size={14} /> },
              { id: 'webhooks', label: 'Webhooks', icon: <Terminal size={14} /> },
              { id: 'health', label: 'Saúde', icon: <Activity size={14} /> },
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Técnico</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <Badge variant={getTechnicalBadgeVariant(selectedProvider.technical_status)}>
                      {selectedProvider.technical_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Elegibilidade Produção</span>
                  <div style={{ marginTop: '0.35rem' }}>
                    <Badge variant={selectedProvider.is_production_eligible ? 'success' : 'ruby'}>
                      {selectedProvider.is_production_eligible ? 'ELEGÍVEL' : 'BLOQUEADO'}
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

              {selectedProvider.is_internal_driver && (
                <div style={{ background: 'rgba(229, 185, 92, 0.1)', border: '1px solid var(--accent-gold)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--accent-gold)', display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Aviso: Driver Exclusivo para Testes
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Este driver interno serve para execução de testes locais e simulação estrita com Kill Switch. Ele não realiza liquidação financeira e não pode ser configurado em produção.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Sandbox Certification Test */}
          {activeTab === 'sandbox' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Suite de Certificação Sandbox</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Executa verificação automatizada de capabilities no ambiente sandbox</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  onClick={() => handleRunSandboxTest(selectedProvider.code)}
                  isLoading={sandboxTesting}
                >
                  Executar Testes
                </Button>
              </div>

              {sandboxTestResult ? (
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={getTechnicalBadgeVariant(sandboxTestResult.overallStatus)}>
                        {sandboxTestResult.overallStatus}
                      </Badge>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Aprovados: {sandboxTestResult.passedCount} | Falhas: {sandboxTestResult.failedCount} | Ignorados: {sandboxTestResult.skippedCount}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(sandboxTestResult.testedAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '260px', overflowY: 'auto' }}>
                    {sandboxTestResult.certifications.map((c) => (
                      <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <span>{c.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {c.errorDetail && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-ruby)' }}>{c.errorDetail}</span>
                          )}
                          <Badge variant={c.status === 'passed' ? 'success' : c.status === 'failed' ? 'ruby' : 'neutral'} style={{ fontSize: '0.7rem' }}>
                            {c.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-input)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Clique no botão acima para rodar os testes de homologação contra o ambiente sandbox deste provedor.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Capabilities Matrix */}
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

          {/* Tab 4: Homologation & Business Model Review */}
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
                  <div><strong>Referência de Homologação:</strong> {selectedProvider.business_model_review.reference_number || 'Nenhuma (Pendente Dossiê)'}</div>
                  <div><strong>Parecer de Compliance:</strong> {selectedProvider.business_model_review.notes || 'Aguardando avaliação de underwriting.'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Supported Products */}
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

          {/* Tab 6: Routing */}
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

          {/* Tab 7: Webhooks */}
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
                <div><strong>TRANSIÇÃO MONOTÔNICA:</strong> Eventos desordenados/antigos são ignorados com segurança</div>
              </div>
            </div>
          )}

          {/* Tab 8: Health & Telemetry */}
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
        </Modal>
      )}
    </AdminLayout>
  );
}
