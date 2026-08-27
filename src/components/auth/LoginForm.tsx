'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LoginSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { useToast } from '@/hooks/useToast';
import { Mail, Lock, LogIn } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronous lock against double submit
  const isSubmittingRef = useRef(false);

  const redirectTo = searchParams.get('redirect_to') || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    setServerError(null);
    setErrors({});

    // Validate with Zod
    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Generic error message preventing account enumeration
        setServerError('E-mail ou senha inválidos.');
        return;
      }

      if (data.user) {
        showToast({
          type: 'success',
          title: 'Autenticado com sucesso!',
          message: 'Sessão iniciada com segurança.',
        });

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setServerError('Ocorreu um erro ao realizar o login. Tente novamente.');
      console.error(err);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. GOOGLE OAUTH PRIMARY ACTION */}
      <div style={{ marginBottom: '1.25rem' }}>
        <GoogleButton
          intent="user"
          nextRoute={redirectTo}
          label="Continuar com Google"
          disabled={isLoading}
        />
      </div>

      {/* 2. DIVIDER */}
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

      {/* 3. EMAIL/PASSWORD FORM */}
      <form onSubmit={handleSubmit} noValidate>
        {serverError && (
          <Alert type="error" title="Acesso negado">
            {serverError}
          </Alert>
        )}

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
            autoComplete="current-password"
            disabled={isLoading}
            required
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <Link
            href="/forgot-password"
            style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', textDecoration: 'none' }}
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isLoading}
          leftIcon={<LogIn size={18} />}
        >
          Entrar
        </Button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Ainda não tem conta?{' '}
          <Link href="/register" style={{ color: 'var(--accent-gold)', fontWeight: 600, textDecoration: 'none' }}>
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  );
}
