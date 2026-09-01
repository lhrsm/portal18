'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { communicationService } from '@/services/communications/communicationService';
import { templateEngine } from '@/services/communications/templateEngine';
import { crmCampaignService } from '@/services/communications/crmCampaignService';
import { emailProviderRegistry } from '@/services/communications/emailProviderRegistry';
import {
  CanonicalNotificationEvent,
  NotificationDelivery,
  NotificationTemplate,
  CommunicationCampaign,
  EmailProviderMetadata
} from '@/services/communications/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Bell,
  Mail,
  Send,
  RefreshCw,
  Plus,
  Layers,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Radio,
  Eye
} from 'lucide-react';

export default function AdminCommunicationsPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'queue' | 'templates' | 'campaigns' | 'providers'>('queue');
  const [events, setEvents] = useState<CanonicalNotificationEvent[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<CommunicationCampaign[]>([]);
  const [providers, setProviders] = useState<EmailProviderMetadata[]>([]);
  const [stats, setStats] = useState<{ queued: number; delivered: number; failed: number; totalEvents: number }>({
    queued: 0,
    delivered: 0,
    failed: 0,
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  // New Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateKey, setTemplateKey] = useState('');
  const [templateChannel, setTemplateChannel] = useState<'in_app' | 'email' | 'push'>('in_app');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // New Campaign Modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState<'institutional' | 'marketing' | 'advertiser_education' | 'consumer_discovery'>('advertiser_education');
  const [campaignChannel, setCampaignChannel] = useState<'in_app' | 'email' | 'push'>('in_app');
  const [campaignTemplateKey, setCampaignTemplateKey] = useState('');
  const [savingCampaign, setSavingCampaign] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [evs, dels, tmpls, camps, st] = await Promise.all([
      communicationService.getEvents(),
      communicationService.getDeliveries(),
      templateEngine.getTemplates(),
      crmCampaignService.getCampaigns(),
      communicationService.getDeliveryStats(),
    ]);
    setEvents(evs);
    setDeliveries(dels);
    setTemplates(tmpls);
    setCampaigns(camps);
    setStats(st);
    setProviders(emailProviderRegistry.getProviders());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateKey || !templateSubject || !templateBody) return;
    setSavingTemplate(true);
    const res = await templateEngine.saveTemplate({
      templateKey,
      channel: templateChannel,
      subject: templateSubject,
      bodyTemplate: templateBody,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Template Salvo',
        message: 'Versão do template gravada com sucesso.',
      });
      setShowTemplateModal(false);
      setTemplateKey('');
      setTemplateSubject('');
      setTemplateBody('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao gravar template.',
      });
    }
    setSavingTemplate(false);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !campaignTemplateKey || !profile) return;
    setSavingCampaign(true);
    const res = await crmCampaignService.createCampaign({
      name: campaignName,
      campaignType,
      channel: campaignChannel,
      templateKey: campaignTemplateKey,
      createdBy: profile.id,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Campanha Criada',
        message: 'Rascunho de campanha CRM registrado.',
      });
      setShowCampaignModal(false);
      setCampaignName('');
      setCampaignTemplateKey('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Falha ao criar campanha.',
      });
    }
    setSavingCampaign(false);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            Central de Comunicações, Notificações & CRM
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Gestão de eventos canônicos, templates versionados, fila multi-canal e jornadas de CRM
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData} isLoading={loading}>
            Atualizar
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowTemplateModal(true)}>
            Novo Template
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCampaignModal(true)}>
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Eventos Canônicos</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {stats.totalEvents}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Entregas Pendentes na Fila</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)' }}>
            {stats.queued}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Entregas Concluídas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {stats.delivered}
          </div>
        </Card>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Provedor de E-mail</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            <Badge variant="gold">TEST DRIVER (MOCK)</Badge>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <Button
          variant={activeTab === 'queue' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('queue')}
        >
          Fila de Entregas ({deliveries.length})
        </Button>
        <Button
          variant={activeTab === 'templates' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('templates')}
        >
          Templates Versionados ({templates.length})
        </Button>
        <Button
          variant={activeTab === 'campaigns' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('campaigns')}
        >
          Campanhas CRM & Jornadas ({campaigns.length})
        </Button>
        <Button
          variant={activeTab === 'providers' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('providers')}
        >
          Governança de Provedores
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'queue' && (
        <Card variant="glass" padding="none">
          {deliveries.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Layers size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Fila de entregas vazia
              </h4>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Canal</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Provedor</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Tentativas</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Data de Criação</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>
                        <Badge variant="neutral">{d.channel.toUpperCase()}</Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{d.provider}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{d.attempt_count}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={d.status === 'delivered' ? 'success' : d.status === 'queued' ? 'gold' : 'ruby'}>
                          {d.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {new Date(d.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'templates' && (
        <Card variant="glass" padding="none">
          {templates.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhum template cadastrado
              </h4>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Chave</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Canal</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Assunto</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Versão</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 700 }}>
                        {t.template_key}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant="neutral">{t.channel}</Badge>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{t.subject}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>v{t.version}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <Badge variant={t.status === 'active' ? 'success' : 'gold'}>
                          {t.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'campaigns' && (
        <Card variant="glass" padding="none">
          <div style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
              Jornadas de Ciclo de Vida (CRM Lifecycle)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {crmCampaignService.getLifecycleJourneys().map((j) => (
                <div key={j.id} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{j.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
                    Gatilho: {j.trigger}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {j.description}
                  </p>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
              Campanhas Avulsas & Comunicados
            </h3>
            {campaigns.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Nenhuma campanha avulsa programada.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {campaigns.map((c) => (
                  <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Tipo: {c.campaign_type} | Canal: {c.channel}
                      </div>
                    </div>
                    <Badge variant={c.status === 'completed' ? 'success' : 'gold'}>
                      {c.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'providers' && (
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
            Adapters de Envio & Governança de Provedores
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {providers.map((p) => (
              <div key={p.code} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</span>
                  <Badge variant={p.status === 'mock_mode' ? 'gold' : 'ruby'}>
                    {p.status.toUpperCase()}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Código: <code>{p.code}</code> | Produção: {p.is_production_eligible ? 'Apto' : 'Bloqueado (Kill Switch)'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* New Template Modal */}
      {showTemplateModal && (
        <Modal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          title="Novo Template de Notificação"
          maxWidth="550px"
        >
          <form onSubmit={handleSaveTemplate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Chave do Template (Snake Case)
                </label>
                <input
                  type="text"
                  required
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="input"
                  placeholder="Ex: payment_reminder"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Canal de Envio
                </label>
                <select
                  value={templateChannel}
                  onChange={(e) => setTemplateChannel(e.target.value as any)}
                  className="input"
                >
                  <option value="in_app">In-App (Central de Notificações)</option>
                  <option value="email">E-mail Transacional</option>
                  <option value="push">Web Push Notification</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Assunto / Título
                </label>
                <input
                  type="text"
                  required
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="input"
                  placeholder="Ex: Seu plano foi renovado com sucesso"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Corpo do Template (Suporta variáveis &#123;&#123;display_name&#125;&#125;, &#123;&#123;plan_name&#125;&#125;)
                </label>
                <textarea
                  required
                  rows={4}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="input"
                  placeholder="Olá {{display_name}}, informamos que..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowTemplateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Plus size={14} />} isLoading={savingTemplate}>
                Salvar Template
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Campaign Modal */}
      {showCampaignModal && (
        <Modal
          isOpen={showCampaignModal}
          onClose={() => setShowCampaignModal(false)}
          title="Nova Campanha CRM"
          maxWidth="550px"
        >
          <form onSubmit={handleSaveCampaign}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="input"
                  placeholder="Ex: Dicas de Otimização para Anunciantes"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Tipo de Campanha
                </label>
                <select
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value as any)}
                  className="input"
                >
                  <option value="advertiser_education">Educacional para Anunciantes</option>
                  <option value="consumer_discovery">Descoberta para Membros</option>
                  <option value="institutional">Comunicado Institucional</option>
                  <option value="marketing">Novidades & Ofertas</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Canal
                </label>
                <select
                  value={campaignChannel}
                  onChange={(e) => setCampaignChannel(e.target.value as any)}
                  className="input"
                >
                  <option value="in_app">In-App Notification</option>
                  <option value="email">E-mail</option>
                  <option value="push">Push</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Chave do Template Vinculado
                </label>
                <input
                  type="text"
                  required
                  value={campaignTemplateKey}
                  onChange={(e) => setCampaignTemplateKey(e.target.value)}
                  className="input"
                  placeholder="Ex: security_alert"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowCampaignModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Plus size={14} />} isLoading={savingCampaign}>
                Salvar Rascunho
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
