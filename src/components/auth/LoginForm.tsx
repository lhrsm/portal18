'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LoginSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setServerError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
        return;
      }

      if (data.user) {
        showToast({
          type: 'success',
          title: 'Autenticado com sucesso!',
          message: `Bem-vindo de volta, ${data.user.email}`,
        });

        const redirectTo = searchParams.get('redirect_to') || '/account';
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setServerError('Ocorreu um erro inesperado ao realizar o login.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {serverError && (
        <Alert type="error" title="Erro no acesso">
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
          required
        />
      </FormField>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
          Esqueceu a senha?
        </Link>
      </div>

      <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading} leftIcon={<LogIn size={18} />}>
        Acessar Conta
      </Button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Ainda não tem conta?{' '}
        <Link href="/register" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
          Cadastre-se gratuitamente
        </Link>
      </div>
    </form>
  );
}
