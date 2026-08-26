'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ForgotPasswordSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const result = ForgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'E-mail inválido.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess('Instruções de recuperação foram enviadas para o seu e-mail caso exista uma conta cadastrada.');
    } catch (err) {
      setError('Ocorreu um erro ao tentar recuperar a senha.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {error && (
        <Alert type="error" title="Erro">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" title="E-mail Enviado">
          {success}
        </Alert>
      )}

      <FormField label="Seu E-mail Cadastrado" required error={error || undefined}>
        <Input
          type="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          autoComplete="email"
          required
        />
      </FormField>

      <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading} leftIcon={<Send size={18} />}>
        Enviar Link de Recuperação
      </Button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para o Login
        </Link>
      </div>
    </form>
  );
}
