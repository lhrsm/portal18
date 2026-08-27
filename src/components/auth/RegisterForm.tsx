'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { RegisterSchema } from '@/lib/validation/auth';
import { consentService } from '@/services/consentService';
import { advertisersService } from '@/services/advertisersService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useToast } from '@/hooks/useToast';
import { Mail, Lock, User, Sparkles, Megaphone, Heart, ShieldCheck } from 'lucide-react';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronous lock to prevent double-submit clicks
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    setServerError(null);
    setSuccessMessage(null);
    setErrors({});

    // Validate with Zod
    const result = RegisterSchema.safeParse({
      displayName,
      email,
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
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?intent=${accountType}&next=${accountType === 'advertiser' ? '/advertiser/onboarding' : '/account'}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      if (data.user) {
        // Retrieve newly created profile to record formal consent in database
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        if (profile) {
          // Persist legal consents in consent_records
          await Promise.allSettled([
            consentService.recordConsent((profile as { id: string }).id, 'age_18_verification', null, true, 'registration'),
            consentService.recordConsent((profile as { id: string }).id, 'terms_of_service', null, true, 'registration'),
            consentService.recordConsent((profile as { id: string }).id, 'privacy_policy', null, true, 'registration'),
          ]);
        }

        // If registering as advertiser, convert account via RPC
        if (accountType === 'advertiser') {
          await advertisersService.becomeAdvertiser(true, true).catch(() => {});
        }

        showToast({
          type: 'success',
          title: 'Cadastro realizado com sucesso!',
          message: accountType === 'advertiser' ? 'Bem-vindo(a)! Configurando seu anúncio...' : 'Sua conta foi criada com sucesso.',
        });

        const targetDestination = accountType === 'advertiser' ? '/advertiser/onboarding' : '/account';
        setSuccessMessage('Conta criada com sucesso! Redirecionando...');
        
        setTimeout(() => {
          router.push(targetDestination);
          router.refresh();
        }, 800);
      }
    } catch (err) {
      setServerError('Ocorreu um erro inesperado durante o cadastro. Tente novamente.');
      console.error(err);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. TRACK SELECTOR (SEGMENTED CONTROL) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          padding: '0.35rem',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => setAccountType('user')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.65rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: accountType === 'user' ? 'var(--bg-secondary)' : 'transparent',
            color: accountType === 'user' ? '#fff' : 'var(--text-muted)',
            boxShadow: accountType === 'user' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Heart size={15} color={accountType === 'user' ? 'var(--accent-ruby)' : 'currentColor'} />
          <span>Quero Explorar</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType('advertiser')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            padding: '0.65rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: accountType === 'advertiser' ? 'var(--bg-secondary)' : 'transparent',
            color: accountType === 'advertiser' ? '#fff' : 'var(--text-muted)',
            boxShadow: accountType === 'advertiser' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Megaphone size={15} color={accountType === 'advertiser' ? 'var(--accent-gold)' : 'currentColor'} />
          <span>Quero Anunciar</span>
        </button>
      </div>

      {/* Account Type Description Badge */}
      <div
        style={{
          padding: '0.75rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: accountType === 'advertiser' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          borderLeft: accountType === 'advertiser' ? '3px solid var(--accent-gold)' : '3px solid var(--text-muted)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45,
          marginBottom: '1.25rem',
        }}
      >
        {accountType === 'advertiser' ? (
          <div>
            <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: '0.15rem' }}>Perfil Profissional 18+</strong>
            Crie sua conta para divulgar fotos, contatos de atendimento e gerenciar seu anúncio.
          </div>
        ) : (
          <div>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '0.15rem' }}>Conta Pessoal</strong>
            Salve acompanhantes favoritos, organize listas e personalize sua busca com discrição.
          </div>
        )}
      </div>

      {/* 2. GOOGLE OAUTH ACTION */}
      <div style={{ marginBottom: '1.25rem' }}>
        <GoogleButton
          intent={accountType}
          nextRoute={accountType === 'advertiser' ? '/advertiser/onboarding' : '/account'}
          label={accountType === 'advertiser' ? 'Criar conta profissional com Google' : 'Criar conta com Google'}
          disabled={isLoading}
        />
      </div>

      {/* 3. DIVIDER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.25rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
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
          <Alert type="error" title="Erro no cadastro">
            {serverError}
          </Alert>
        )}

        {successMessage && (
          <Alert type="success" title="Sucesso">
            {successMessage}
          </Alert>
        )}

        <FormField label={accountType === 'advertiser' ? 'Nome Artístico / Profissional' : 'Nome de Exibição'} required error={errors.displayName}>
          <Input
            type="text"
            placeholder={accountType === 'advertiser' ? 'Ex: Isabela Martins' : 'Ex: Carlos'}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={!!errors.displayName}
            leftIcon={<User size={18} />}
            disabled={isLoading}
            required
          />
        </FormField>

        <FormField label="E-mail" required error={errors.email}>
          <Input
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            leftIcon={<Mail size={18} />}
            autoComplete="email"
            inputMode="email"
            disabled={isLoading}
            required
          />
        </FormField>

        <FormField label="Senha" required error={errors.password}>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            leftIcon={<Lock size={18} />}
            autoComplete="new-password"
            disabled={isLoading}
            required
          />
        </FormField>

        {password && (
          <div style={{ marginBottom: '1rem' }}>
            <PasswordStrength password={password} />
          </div>
        )}

        <FormField label="Confirmar Senha" required error={errors.confirmPassword}>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            leftIcon={<Lock size={18} />}
            autoComplete="new-password"
            disabled={isLoading}
            required
          />
        </FormField>

        {/* Legal Consent Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1.25rem 0' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={isAdult}
              onChange={(e) => setIsAdult(e.target.checked)}
              disabled={isLoading}
              style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '16px', height: '16px' }}
              required
            />
            <span>
              Declaro que sou <strong>maior de 18 anos</strong> de idade e civilmente capaz perante as leis brasileiras.
            </span>
          </label>
          {errors.isAdult && <div style={{ color: 'var(--accent-ruby)', fontSize: '0.8rem' }}>{errors.isAdult}</div>}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={isLoading}
              style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '16px', height: '16px' }}
              required
            />
            <span>
              Li e concordo com os{' '}
              <Link href="/trust/terms" target="_blank" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/trust/privacy" target="_blank" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && <div style={{ color: 'var(--accent-ruby)', fontSize: '0.8rem' }}>{errors.acceptTerms}</div>}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
          leftIcon={<Sparkles size={18} />}
        >
          {accountType === 'advertiser' ? 'Criar Perfil de Anunciante' : 'Criar Minha Conta'}
        </Button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Já possui uma conta?{' '}
          <Link href="/login" style={{ color: 'var(--accent-gold)', fontWeight: 600, textDecoration: 'none' }}>
            Entrar
          </Link>
        </div>
      </form>
    </div>
  );
}
