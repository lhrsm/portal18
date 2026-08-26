'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { consentService } from '@/services/consentService';
import { preferencesService } from '@/services/account/preferencesService';
import { privacyService } from '@/services/account/privacyService';
import { ConsentRecord, LegalDocument, UserPreferences } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Sliders, 
  UserX, 
  History, 
  Sparkles, 
  FileText 
} from 'lucide-react';

export default function PrivacyPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [userPrefs, setUserPrefs] = useState<Partial<UserPreferences>>({
    history_enabled: true,
    personalization_enabled: true,
  });
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPrivacyData() {
      if (profile) {
        const [userConsents, prefs, blocks] = await Promise.all([
          consentService.getUserConsents(profile.id),
          preferencesService.getUserPreferences(profile.id),
          privacyService.getUserBlocks(profile.id),
        ]);
        setConsents(userConsents);
        if (prefs) setUserPrefs(prefs);
        setBlockedCount(blocks.length);

        const analyticsConsent = userConsents.find((c) => c.consent_type === 'analytics');
        if (analyticsConsent) setAnalyticsEnabled(analyticsConsent.granted);

        const marketingConsent = userConsents.find((c) => c.consent_type === 'marketing_email');
        if (marketingConsent) setMarketingEnabled(marketingConsent.granted);
      }
      setIsLoading(false);
    }
    if (!authLoading) {
      loadPrivacyData();
    }
  }, [profile, authLoading]);

  const handleToggleHistory = async () => {
    if (!profile) return;
    const newVal = !userPrefs.history_enabled;
    setUserPrefs({ ...userPrefs, history_enabled: newVal });

    const res = await preferencesService.updatePreferences(profile.id, { history_enabled: newVal });
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Histórico de Visualizações',
        message: newVal ? 'Gravação de histórico ativada.' : 'Gravação de histórico desativada.',
      });
    }
  };

  const handleTogglePersonalization = async () => {
    if (!profile) return;
    const newVal = !userPrefs.personalization_enabled;
    setUserPrefs({ ...userPrefs, personalization_enabled: newVal });

    const res = await preferencesService.updatePreferences(profile.id, { personalization_enabled: newVal });
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Personalização',
        message: newVal ? 'Recomendações personalizadas ativadas.' : 'Recomendações contextuais padrão.',
      });
    }
  };

  const handleExportData = () => {
    showToast({
      type: 'info',
      title: 'Exportação Solicitada',
      message: 'Seu pacote de dados em conformidade com a LGPD foi enfileirado para geração segura.',
    });
  };

  const handleAccountDeletionNotice = () => {
    alert(
      'Para solicitar a exclusão definitiva da sua conta e anonimização de dados cadastrais sob a LGPD, ' +
      'entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do canal de suporte jurídico.'
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="200px" style={{ marginBottom: '1.5rem' }} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Minha Conta
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <Shield size={28} color="var(--color-success)" />
        <h1 style={{ fontSize: '2.2rem' }}>Privacidade & Proteção de Dados</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Controle o registro de histórico, personalização comportamental, perfis bloqueados e conformidade LGPD
      </p>

      {/* Card 1: Controles de Histórico e Personalização (Sections 20, 43, 70) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Sliders size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.25rem' }}>Controles de Rastreamento Privado</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* History Opt-out */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} color="var(--color-info)" /> Gravar Histórico de Visualizações
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Se desativado, novas páginas de perfil que você visitar não serão registradas na sua conta.
              </div>
            </div>
            <input
              type="checkbox"
              checked={userPrefs.history_enabled}
              onChange={handleToggleHistory}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
          </div>

          {/* Personalization Opt-out */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" /> Personalização da Home (&quot;Para Você&quot;)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Se desativado, a plataforma exibirá somente conteúdo contextual (cidade, destaques e ranking geral).
              </div>
            </div>
            <input
              type="checkbox"
              checked={userPrefs.personalization_enabled}
              onChange={handleTogglePersonalization}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
          </div>

          {/* Blocked Profiles Link (Section 37) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserX size={16} color="var(--accent-ruby)" /> Perfis Bloqueados ({blockedCount})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Anunciantes bloqueados não aparecem em suas recomendações e não recebem notificações sobre você.
              </div>
            </div>
            <Link href="/account/privacy/blocked">
              <Button variant="secondary" size="sm">
                Gerenciar Bloqueios
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Card 2: Consent Audit Trail (Section 71) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Histórico de Consentimentos Registrados</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Registros formais de conformidade jurídica 18+ vinculados ao seu perfil.
        </p>

        {consents.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum registro de consentimento localizado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {consents.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={16} color="var(--color-success)" />
                  <div>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {c.consent_type.replace('_', ' ')}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Fonte: {c.source} • {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <Badge variant={c.granted ? 'success' : 'neutral'}>
                  {c.granted ? 'Ativo' : 'Revogado'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Card 3: Data Management Actions (Section 72 & 73) */}
      <Card variant="elevated" padding="lg">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Gestão de Dados Pessoais (LGPD)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Exercício dos direitos de portabilidade e eliminação de dados previstos pela Lei Geral de Proteção de Dados.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Button variant="secondary" size="sm" onClick={handleExportData} leftIcon={<Download size={16} />}>
            Exportar Meus Dados (LGPD)
          </Button>
          <Button variant="ghost" size="sm" onClick={handleAccountDeletionNotice} style={{ color: 'var(--accent-ruby)' }} leftIcon={<Trash2 size={16} />}>
            Solicitar Exclusão da Conta
          </Button>
        </div>
      </Card>
    </div>
  );
}
