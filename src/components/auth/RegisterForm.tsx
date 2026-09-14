'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { RegisterSchema } from '@/lib/validation/auth';
import { consentService } from '@/services/consentService';
import { advertisersService } from '@/services/advertisersService';
import { onboardingAnalytics } from '@/services/telemetry/onboardingAnalytics';
import { translateAuthError, logAuthEvent } from '@/lib/auth/authErrors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useToast } from '@/hooks/useToast';
import { Mail, Lock, User, Sparkles, Megaphone, Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

function maskEmail(emailStr: string): string {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [local, domain] = emailStr.split('@');
  if (local.length <= 3) {
    return `${local.substring(0, 1)}***@${domain}`;
  }
  return `${local.substring(0, 3)}***@${domain}`;
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialType = searchParams.get('type') === 'advertiser' ? 'advertiser' : 'user';
  const [accountType, setAccountType] = useState<'user' | 'advertiser'>(initialType);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationPendingEmail, setConfirmationPendingEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronous lock to prevent concurrent requests and double-submits
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    setServerError(null);
    setErrors({});

    logAuthEvent('[REGISTER_START]', { accountType, emailLength: email.length });

    // Validate with Zod before touching any backend
    const result = RegisterSchema.safeParse({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      isAdult,
      acceptTerms,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      logAuthEvent(
        '[REGISTER_ERROR]',
        { stage: 'VALIDATION', errorType: 'ZOD_VALIDATION_FAILED', safeMessage: 'Validation errors on fields' },
        true
      );
      return;
    }

    logAuthEvent('[REGISTER_VALIDATION_OK]', { accountType });

    isSubmittingRef.current = true;
    setIsLoading(true);

    // Explicit environment configuration check before executing fetch
    if (!isSupabaseConfigured()) {
      logAuthEvent(
        '[REGISTER_ERROR]',
        { stage: 'AUTH_CLIENT', errorType: 'MISSING_CLIENT_ENV', safeMessage: 'Supabase URL/anon key not configured' },
        true
      );
      setServerError('Não foi possível conectar ao serviço de cadastro. Verifique sua conexão e tente novamente.');
      isSubmittingRef.current = false;
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?intent=${accountType}&next=${accountType === 'advertiser' ? '/advertiser/onboarding' : '/account'}`;

      logAuthEvent('[REGISTER_AUTH_REQUEST]', { accountType });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            account_type: accountType,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        logAuthEvent(
          '[REGISTER_ERROR]',
          { stage: 'SIGN_UP', errorType: error.name || 'AuthApiError', status: error.status, safeMessage: error.message },
          true
        );
        setServerError(translateAuthError(error));
        return;
      }

      logAuthEvent('[REGISTER_AUTH_SUCCESS]', {
        accountType,
        hasUser: !!data.user,
        hasSession: !!data.session,
      });

      if (data.user) {
        // Retrieve newly created profile to record formal legal consents
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        if (profile) {
          await Promise.allSettled([
            consentService.recordConsent((profile as { id: string }).id, 'age_18_verification', null, true, 'registration'),
            consentService.recordConsent((profile as { id: string }).id, 'terms_of_service', null, true, 'registration'),
            consentService.recordConsent((profile as { id: string }).id, 'privacy_policy', null, true, 'registration'),
          ]);
        }

        // If registered as advertiser and session is active, trigger conversion
        if (accountType === 'advertiser' && data.session) {
          await advertisersService.becomeAdvertiser(true, true).catch(() => {});
          onboardingAnalytics.trackEvent('onboarding_started', { step: 1, totalSteps: 8 });
        }

        logAuthEvent('[REGISTER_PROFILE_SUCCESS]', { accountType });

        // Email confirmation check: If no active session was returned, user must confirm email
        if (!data.session) {
          setConfirmationPendingEmail(email.trim());
          showToast({
            type: 'info',
            title: 'Confirmação necessária',
            message: 'Enviamos um e-mail com instruções para validar sua conta.',
          });
          return;
        }

        // Session exists: Proceed with onboarding / account redirect
        showToast({
          type: 'success',
          title: 'Cadastro realizado com sucesso!',
          message: accountType === 'advertiser' ? 'Bem-vindo(a)! Iniciando configuração do anúncio...' : 'Sua conta foi criada com sucesso.',
        });

        const targetDestination = accountType === 'advertiser' ? '/advertiser/onboarding' : '/account';
        logAuthEvent('[REGISTER_REDIRECT]', { destination: targetDestination });

        setTimeout(() => {
          router.push(targetDestination);
          router.refresh();
        }, 500);
      }
    } catch (err: unknown) {
      logAuthEvent(
        '[REGISTER_ERROR]',
        { stage: 'CATCH_UNEXPECTED', errorType: String(err) },
        true
      );
      setServerError(translateAuthError(err));
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW (Email verification pending)
  if (confirmationPendingEmail) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '1.5rem 0.5rem',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.12)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 1.25rem auto',
            border: '1px solid var(--accent-gold)',
          }}
        >
          <Mail size={32} color="var(--accent-gold)" />
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Confira seu e-mail
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Enviamos um link de confirmação para{' '}
          <strong style={{ color: 'var(--accent-gold)' }}>{maskEmail(confirmationPendingEmail)}</strong>.
          <br />
          Por favor, clique no link recebido para ativar seu acesso no Portal 18+.
        </p>

        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: '1.75rem',
          }}
        >
          Não encontrou o e-mail? Verifique também a pasta de spam ou lixo eletrônico.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary" fullWidth size="md">
              Ir para o Login
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setConfirmationPendingEmail(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '0.5rem',
            }}
          >
            Voltar ao formulário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 1. TRACK SELECTOR (SEGMENTED CONTROL) */}
      <div
        role="tablist"
        aria-label="Tipo de conta para cadastro"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.5rem',
          padding: '0.35rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '0.75rem',
        }}
      >
        <button
          type="button"
          role="tab"
          id="tab-account-user"
          aria-selected={accountType === 'user'}
          aria-controls="register-track-description"
          onClick={() => setAccountType('user')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.7rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: accountType === 'user' ? '1px solid var(--accent-ruby)' : '1px solid transparent',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: accountType === 'user' ? 'rgba(224, 30, 90, 0.14)' : 'transparent',
            color: accountType === 'user' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: accountType === 'user' ? '0 2px 10px rgba(224, 30, 90, 0.25)' : 'none',
            transition: 'all var(--transition-fast)',
            minHeight: '44px',
          }}
        >
          <Heart
            size={18}
            color={accountType === 'user' ? 'var(--accent-ruby)' : 'var(--text-muted)'}
            style={{ flexShrink: 0 }}
          />
          <span style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>Visitante / Cliente</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-account-advertiser"
          aria-selected={accountType === 'advertiser'}
          aria-controls="register-track-description"
          onClick={() => setAccountType('advertiser')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.7rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: accountType === 'advertiser' ? '1px solid var(--accent-gold)' : '1px solid transparent',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: accountType === 'advertiser' ? 'rgba(212, 175, 55, 0.14)' : 'transparent',
            color: accountType === 'advertiser' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: accountType === 'advertiser' ? '0 2px 10px rgba(212, 175, 55, 0.25)' : 'none',
            transition: 'all var(--transition-fast)',
            minHeight: '44px',
          }}
        >
          <Megaphone
            size={18}
            color={accountType === 'advertiser' ? 'var(--accent-gold)' : 'var(--text-muted)'}
            style={{ flexShrink: 0 }}
          />
          <span style={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>Quero Anunciar</span>
        </button>
      </div>

      {/* Dynamic Track Description */}
      <div
        id="register-track-description"
        role="region"
        aria-live="polite"
        style={{
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: accountType === 'advertiser' ? 'rgba(212, 175, 55, 0.07)' : 'rgba(255, 255, 255, 0.03)',
          borderLeft: accountType === 'advertiser' ? '3px solid var(--accent-gold)' : '3px solid var(--accent-ruby)',
          borderTop: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          marginBottom: '1rem',
        }}
      >
        {accountType === 'advertiser' ? (
          <div>
            <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: '0.15rem' }}>
              Para Anunciantes & Modelos
            </strong>
            Crie seu perfil profissional, publique suas informações e gerencie sua presença na plataforma.
          </div>
        ) : (
          <div>
            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.15rem' }}>
              Para Visitantes & Clientes
            </strong>
            Salve acompanhantes favoritos, organize listas privadas e personalize suas buscas na sua cidade.
          </div>
        )}
      </div>

      {/* 2. GOOGLE OAUTH ACTION */}
      <div style={{ marginBottom: '1rem' }}>
        <GoogleButton
          intent={accountType}
          nextRoute={accountType === 'advertiser' ? '/advertiser/onboarding' : '/account'}
          label={accountType === 'advertiser' ? 'Continuar com Google (Profissional)' : 'Continuar com Google'}
          disabled={isLoading}
        />
      </div>

      {/* 3. DIVIDER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          margin: '1rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.775rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        <span>ou com e-mail</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      {/* 4. EMAIL/PASSWORD REGISTRATION FORM */}
      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div role="alert" aria-live="polite" style={{ marginBottom: '1rem' }}>
            <Alert type="error" title="Atenção">
              {serverError}
            </Alert>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <FormField
            label={accountType === 'advertiser' ? 'Nome de Exibição / Artístico' : 'Nome de Exibição'}
            required
            error={errors.displayName}
          >
            <Input
              id="register-display-name"
              type="text"
              placeholder={accountType === 'advertiser' ? 'Ex: Isabela Martins' : 'Ex: Carlos'}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={!!errors.displayName}
              aria-invalid={!!errors.displayName}
              aria-describedby={errors.displayName ? 'err-display-name' : undefined}
              leftIcon={<User size={18} />}
              autoComplete="name"
              disabled={isLoading}
              required
            />
          </FormField>

          <FormField label="E-mail" required error={errors.email}>
            <Input
              id="register-email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'err-email' : undefined}
              leftIcon={<Mail size={18} />}
              autoComplete="email"
              inputMode="email"
              disabled={isLoading}
              required
            />
          </FormField>

          <FormField label="Senha" required error={errors.password}>
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'err-password' : undefined}
              leftIcon={<Lock size={18} />}
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </FormField>

          {password && (
            <div style={{ margin: '-0.25rem 0 0.25rem 0' }}>
              <PasswordStrength password={password} />
            </div>
          )}

          <FormField label="Confirmar Senha" required error={errors.confirmPassword}>
            <Input
              id="register-confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'err-confirm-password' : undefined}
              leftIcon={<Lock size={18} />}
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
          </FormField>
        </div>

        {/* Legal Consent Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', margin: '1rem 0' }}>
          <div>
            <label
              htmlFor="register-is-adult"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                cursor: 'pointer',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              <input
                id="register-is-adult"
                type="checkbox"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                disabled={isLoading}
                aria-invalid={!!errors.isAdult}
                aria-describedby={errors.isAdult ? 'err-is-adult' : undefined}
                style={{
                  marginTop: '0.15rem',
                  accentColor: 'var(--accent-gold)',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                required
              />
              <span>
                Declaro que sou <strong>maior de 18 anos</strong> de idade e civilmente capaz perante as leis brasileiras.
              </span>
            </label>
            {errors.isAdult && (
              <div id="err-is-adult" style={{ color: 'var(--accent-ruby)', fontSize: '0.775rem', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
                {errors.isAdult}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="register-accept-terms"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                cursor: 'pointer',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              <input
                id="register-accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
                aria-invalid={!!errors.acceptTerms}
                aria-describedby={errors.acceptTerms ? 'err-accept-terms' : undefined}
                style={{
                  marginTop: '0.15rem',
                  accentColor: 'var(--accent-gold)',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                required
              />
              <span>
                Li e concordo com os{' '}
                <Link
                  href="/trust/terms"
                  target="_blank"
                  style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}
                >
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link
                  href="/trust/privacy"
                  target="_blank"
                  style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}
                >
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms && (
              <div id="err-accept-terms" style={{ color: 'var(--accent-ruby)', fontSize: '0.775rem', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
                {errors.acceptTerms}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button with Spinner & Loading State */}
        <Button
          id="btn-register-submit"
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
          leftIcon={
            isLoading ? undefined : accountType === 'advertiser' ? (
              <Megaphone size={18} />
            ) : (
              <Sparkles size={18} />
            )
          }
        >
          {isLoading
            ? 'Criando sua conta...'
            : accountType === 'advertiser'
            ? 'Criar Perfil de Anunciante'
            : 'Criar Minha Conta'}
        </Button>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Já possui uma conta?{' '}
          <Link href="/login" style={{ color: 'var(--accent-gold)', fontWeight: 600, textDecoration: 'none' }}>
            Entrar
          </Link>
        </div>
      </form>
    </div>
  );
}
