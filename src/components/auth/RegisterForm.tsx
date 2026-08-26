'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { RegisterSchema } from '@/lib/validation/auth';
import { consentService } from '@/services/consentService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { useToast } from '@/hooks/useToast';
import { Mail, Lock, User, Sparkles } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const { showToast } = useToast();
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
            consentService.recordConsent((profile as { id: string }).id, 'age_declaration', null, true, 'registration'),
            consentService.recordConsent((profile as { id: string }).id, 'terms', null, true, 'registration'),
            consentService.recordConsent((profile as { id: string }).id, 'privacy', null, true, 'registration'),
          ]);
        }

        showToast({
          type: 'success',
          title: 'Cadastro realizado!',
          message: 'Sua conta foi criada com sucesso.',
        });

        setSuccessMessage('Conta criada com sucesso! Redirecionando para sua conta...');
        setTimeout(() => {
          router.push('/account');
          router.refresh();
        }, 1000);
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
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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

      <FormField label="Nome de Exibição" required error={errors.displayName}>
        <Input
          type="text"
          placeholder="Ex: Carlos ou Sofia"
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
        <PasswordStrength password={password} />
      </FormField>

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

      {/* Mandatory Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1.25rem 0' }}>
        <label className="checkbox-field">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
            disabled={isLoading}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Confirmo que tenho <strong>18 anos ou mais</strong>.
          </span>
        </label>
        {errors.isAdult && <span className="form-error">⚠️ {errors.isAdult}</span>}

        <label className="checkbox-field">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            disabled={isLoading}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Li e aceito os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>.
          </span>
        </label>
        {errors.acceptTerms && <span className="form-error">⚠️ {errors.acceptTerms}</span>}
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
        Criar conta
      </Button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Já possui uma conta?{' '}
        <Link href="/login" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
          Entrar
        </Link>
      </div>
    </form>
  );
}
