'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { RegisterSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        showToast({
          type: 'success',
          title: 'Cadastro realizado com sucesso!',
          message: 'Sua conta foi criada. Verifique seu e-mail para confirmação se necessário.',
        });

        setSuccessMessage('Conta criada com sucesso! Redirecionando para o painel...');
        setTimeout(() => {
          router.push('/account');
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setServerError('Ocorreu um erro inesperado durante o cadastro.');
      console.error(err);
    } finally {
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
          required
        />
      </FormField>

      <FormField label="Senha" required error={errors.password} hint="Mínimo 8 caracteres, 1 maiúscula e 1 número.">
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          leftIcon={<Lock size={18} />}
          autoComplete="new-password"
          required
        />
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
          required
        />
      </FormField>

      {/* Mandatory 18+ and Terms Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1.25rem 0' }}>
        <label className="checkbox-field">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={isAdult}
            onChange={(e) => setIsAdult(e.target.checked)}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-ruby)' }}>[OBRIGATÓRIO]</strong> Declaro e confirmo que tenho <strong>18 anos de idade ou mais</strong> e plena capacidade civil.
          </span>
        </label>
        {errors.isAdult && <span className="form-error">⚠️ {errors.isAdult}</span>}

        <label className="checkbox-field">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Li e aceito os Termos de Serviço e a Política de Privacidade do portal.
          </span>
        </label>
        {errors.acceptTerms && <span className="form-error">⚠️ {errors.acceptTerms}</span>}
      </div>

      <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading} leftIcon={<Sparkles size={18} />}>
        Criar Conta 18+
      </Button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Já possui uma conta?{' '}
        <Link href="/login" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
          Faça Login
        </Link>
      </div>
    </form>
  );
}
