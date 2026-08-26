'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Megaphone, 
  ShieldCheck, 
  Image as ImageIcon, 
  Sparkles, 
  UserCheck, 
  BarChart3, 
  CreditCard, 
  MapPin, 
  Sliders, 
  Lock, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export default function AdvertiserDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdvertiser() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        setAdvertiser(adv);
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadAdvertiser();
    }
  }, [profile, authLoading]);

  // Calculate profile completeness score
  const calculateCompleteness = (adv: AdvertiserProfile | null): number => {
    if (!adv) return 0;
    let score = 20; // Base creation
    if (adv.stage_name && adv.stage_name !== 'Novo Anunciante') score += 15;
    if (adv.bio) score += 15;
    if (adv.headline) score += 10;
    if (adv.state_id && adv.city_id) score += 20;
    if (adv.onboarding_completed) score += 20;
    return Math.min(score, 100);
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="180px" />
      </div>
    );
  }

  const completeness = calculateCompleteness(advertiser);

  const menuTabs = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'profile', label: 'Meu perfil' },
    { id: 'gallery', label: 'Galeria' },
    { id: 'location', label: 'Localização' },
    { id: 'verification', label: 'Verificação' },
    { id: 'stats', label: 'Estatísticas' },
    { id: 'promotion', label: 'Divulgação' },
    { id: 'subscription', label: 'Assinatura' },
    { id: 'security', label: 'Segurança' },
    { id: 'settings', label: 'Configurações' },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">ÁREA DO ANUNCIANTE</Badge>
            {advertiser && (
              <Badge variant={advertiser.profile_status === 'approved' ? 'success' : 'warning'}>
                {advertiser.profile_status}
              </Badge>
            )}
          </div>
          <h1 style={{ fontSize: '2.2rem' }}>
            {advertiser && advertiser.stage_name !== 'Novo Anunciante' ? advertiser.stage_name : 'Painel do Anunciante'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie seu perfil de anúncios, mídias, métricas e status de verificação
          </p>
        </div>

        {advertiser && (
          <Link href="/advertiser/onboarding">
            <Button variant="primary" size="md" leftIcon={<Sparkles size={16} />}>
              Continuar Onboarding
            </Button>
          </Link>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={menuTabs} activeTab={activeTab} onChange={setActiveTab} />

      {!advertiser ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Megaphone size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Você ainda não possui um perfil de anunciante</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Crie seu perfil profissional com fotos, descrição dos seus serviços, localização e horários de atendimento para começar a receber contatos.
          </p>
          <Link href="/advertiser/start">
            <Button variant="ruby" size="lg">
              Ativar Perfil de Anunciante
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div>
              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {/* Status do perfil */}
                <Card variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status do Perfil</span>
                    <ShieldCheck size={18} color="var(--accent-gold)" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', textTransform: 'capitalize' }}>
                    {advertiser.profile_status.replace('_', ' ')}
                  </div>
                  <Badge variant={advertiser.profile_status === 'approved' ? 'success' : 'warning'}>
                    Visibilidade: {advertiser.visibility}
                  </Badge>
                </Card>

                {/* Completude */}
                <Card variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completude</span>
                    <CheckCircle2 size={18} color="var(--color-success)" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.3rem' }}>
                    {completeness}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {completeness === 100 ? 'Perfil 100% preenchido' : 'Complete seu cadastro no onboarding'}
                  </div>
                </Card>

                {/* Verificação */}
                <Card variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verificação KYC</span>
                    <UserCheck size={18} color="var(--color-info)" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem', textTransform: 'capitalize' }}>
                    {advertiser.verification_status.replace('_', ' ')}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Documentação privada</span>
                </Card>

                {/* Galeria */}
                <Card variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Galeria de Mídias</span>
                    <ImageIcon size={18} color="var(--accent-ruby)" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    0 mídias
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Moderação prévia ativa</span>
                </Card>

                {/* Visualizações */}
                <Card variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visualizações</span>
                    <TrendingUp size={18} color="var(--color-success)" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    0
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total de visitas</span>
                </Card>

                {/* Assinatura */}
                <Card variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Plano de Assinatura</span>
                    <CreditCard size={18} color="var(--accent-gold)" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    Gratuito
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plano Inicial</span>
                </Card>
              </div>

              {/* Action Banner */}
              <Card variant="elevated" padding="lg">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Finalize a Configuração do seu Anúncio</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Preencha suas especialidades, bairros e canais de contato para aprovação.
                    </p>
                  </div>
                  <Link href="/advertiser/onboarding">
                    <Button variant="ruby" rightIcon={<ArrowRight size={16} />}>
                      Abrir Wizard de Onboarding
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: MEU PERFIL */}
          {activeTab === 'profile' && (
            <Card variant="glass" padding="lg">
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Dados do Anúncio</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <div><strong>Nome Artístico:</strong> {advertiser.stage_name}</div>
                <div><strong>Slug Público:</strong> <code>{advertiser.slug}</code></div>
                <div><strong>Slogan / Chamada:</strong> {advertiser.headline || 'Não informado'}</div>
                <div><strong>Biografia:</strong> {advertiser.bio || 'Não informada'}</div>
              </div>
              <Link href="/advertiser/profile">
                <Button variant="primary" size="sm">Editar Dados do Anúncio</Button>
              </Link>
            </Card>
          )}

          {/* EMPTY STATES PARA DEMAIS ABAS PREPARADAS ARQUITETURALMENTE */}
          {['gallery', 'location', 'verification', 'stats', 'promotion', 'subscription', 'security', 'settings'].includes(activeTab) && (
            <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⚙️</div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                {activeTab.replace('_', ' ')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                Este módulo está estruturado na arquitetura do backend e será liberado nas próximas fases.
              </p>
              <Badge variant="neutral">Ainda não disponível</Badge>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
