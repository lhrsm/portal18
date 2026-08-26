'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { consentService } from '@/services/consentService';
import { ConsentRecord, LegalDocument } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { Shield, ArrowLeft, CheckCircle2, Download, Trash2, Sliders } from 'lucide-react';

export default function PrivacyPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPrivacyData() {
      if (profile) {
        const [userConsents, docs] = await Promise.all([
          consentService.getUserConsents(profile.id),
          consentService.getActiveLegalDocuments(),
        ]);
        setConsents(userConsents);
        setLegalDocs(docs);

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

  const handleToggleAnalytics = async () => {
    if (!profile) return;
    const newVal = !analyticsEnabled;
    setAnalyticsEnabled(newVal);

    const existing = consents.find((c) => c.consent_type === 'analytics');
    if (existing) {
      await consentService.updateConsent(existing.id, newVal);
    } else {
      await consentService.recordConsent(profile.id, 'analytics', null, newVal, 'privacy_settings');
    }

    showToast({
      type: 'info',
      title: 'Preferência Atualizada',
      message: `Coleta de dados analíticos ${newVal ? 'ativada' : 'desativada'}.`,
    });
  };

  const handleToggleMarketing = async () => {
    if (!profile) return;
    const newVal = !marketingEnabled;
    setMarketingEnabled(newVal);

    const existing = consents.find((c) => c.consent_type === 'marketing_email');
    if (existing) {
      await consentService.updateConsent(existing.id, newVal);
    } else {
      await consentService.recordConsent(profile.id, 'marketing_email', null, newVal, 'privacy_settings');
    }

    showToast({
      type: 'info',
      title: 'Preferência Atualizada',
      message: `Comunicações por e-mail ${newVal ? 'ativadas' : 'desativadas'}.`,
    });
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
        <h1 style={{ fontSize: '2.2rem' }}>Privacidade & Consentimentos</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Controle o uso dos seus dados, preferências de rastreamento e histórico de termos aceitos
      </p>

      {/* Preferences Toggles */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Sliders size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.25rem' }}>Preferências de Dados</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Dados Analíticos & Métricas de Navegação
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Permite a medição anônima de desempenho e usabilidade para aprimoramento da plataforma.
              </div>
            </div>
            <label className="checkbox-field" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={analyticsEnabled}
                onChange={handleToggleAnalytics}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Comunicações & Novidades por E-mail
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Receba atualizações importantes sobre novas ferramentas e recursos para anunciantes.
              </div>
            </div>
            <label className="checkbox-field" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={marketingEnabled}
                onChange={handleToggleMarketing}
              />
            </label>
          </div>
        </div>
      </Card>

      {/* Consent Audit Trail */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Histórico de Consentimentos Registrados</h2>
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

      {/* Data Management Actions */}
      <Card variant="elevated" padding="lg">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Gestão de Dados Pessoais (LGPD)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Button variant="secondary" size="sm" leftIcon={<Download size={16} />}>
            Exportar Meus Dados
          </Button>
          <Button variant="ghost" size="sm" style={{ color: 'var(--accent-ruby)' }} leftIcon={<Trash2 size={16} />}>
            Solicitar Exclusão da Conta
          </Button>
        </div>
      </Card>
    </div>
  );
}
