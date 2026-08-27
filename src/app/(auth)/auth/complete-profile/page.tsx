'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { consentService } from '@/services/consentService';
import { advertisersService } from '@/services/advertisersService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { ShieldCheck, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

function CompleteProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const intent = searchParams.get('intent') || 'user';
  const rawNext = searchParams.get('next') || (intent === 'advertiser' ? '/advertiser/onboarding' : '/account');

  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    if (!isAdult || !acceptTerms || !acceptPrivacy) {
      setError('Todos os consentimentos legais são obrigatórios para acessar a plataforma 18+.');
      return;
    }

    if (!profile) {
      setError('Perfil de usuário não localizado. Tente fazer login novamente.');
      return;
    }

    setError(null);
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      // 1. Record legal consents in database
      await Promise.allSettled([
        consentService.recordConsent(profile.id, 'age_18_verification', null, true, 'oauth_complete_profile'),
        consentService.recordConsent(profile.id, 'terms_of_service', null, true, 'oauth_complete_profile'),
        consentService.recordConsent(profile.id, 'privacy_policy', null, true, 'oauth_complete_profile'),
      ]);

      // 2. If intent was advertiser, convert to advertiser
      if (intent === 'advertiser') {
        await advertisersService.becomeAdvertiser(true, true);
        await refreshProfile();
      }

      showToast({
        type: 'success',
        title: 'Consentimentos Confirmados!',
        message: 'Acesso liberado com sucesso.',
      });

      router.push(rawNext);
      router.refresh();
    } catch (err) {
      setError('Erro ao salvar os consentimentos. Tente novamente.');
      console.error(err);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 140px)', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Badge variant="ruby">18+ OBRIGATÓRIO</Badge>
            <Badge variant="gold">CONFORMIDADE LEGAL</Badge>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Confirmação de Maioridade
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Para concluir o acesso via Google, confirme sua maioridade e concorde com os termos da plataforma.
          </p>
        </div>

        <Card variant="glass" padding="lg" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert type="error" title="Atenção" style={{ marginBottom: '1.25rem' }}>
                {error}
              </Alert>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={isAdult}
                  onChange={(e) => setIsAdult(e.target.checked)}
                  disabled={isLoading}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                  required
                />
                <span>
                  Declaro sob as penas da lei que tenho <strong>18 anos ou mais</strong> de idade.
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={isLoading}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                  required
                />
                <span>
                  Li e aceito os{' '}
                  <Link href="/trust/terms" target="_blank" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                    Termos de Uso do Portal 18+
                  </Link>
                  .
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  disabled={isLoading}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }}
                  required
                />
                <span>
                  Li e aceito a{' '}
                  <Link href="/trust/privacy" target="_blank" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                    Política de Privacidade & LGPD
                  </Link>
                  .
                </span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
              leftIcon={<CheckCircle2 size={18} />}
            >
              Confirmar e Continuar
            </Button>
          </form>
        </Card>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <ShieldCheck size={14} color="var(--color-success)" />
          <span>Consentimento criptografado e registrado conforme o Marco Civil e LGPD</span>
        </div>
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>Carregando verificação...</div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}
