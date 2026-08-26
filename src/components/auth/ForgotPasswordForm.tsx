'use client';

import React, { useState, useRef } from 'react';
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
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    setError(null);
    setSuccess(null);

    const result = ForgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'E-mail inválido.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Always show generic discreet message preventing account enumeration (Section 14 & 56)
      setSuccess('Se existir uma conta associada a esse e-mail, enviaremos as instruções de recuperação.');
    } catch (err) {
      // Even on error, show the generic safe feedback
      setSuccess('Se existir uma conta associada a esse e-mail, enviaremos as instruções de recuperação.');
      console.error(err);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {error && (
        <Alert type="error" title="Atenção">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" title="Instruções de Recuperação">
          {success}
        </Alert>
      )}

      <FormField label="E-mail" required error={error || undefined}>
        <Input
          type="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          autoComplete="email"
          disabled={isLoading}
          required
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        size="lg"
        isLoading={isLoading}
        disabled={isLoading}
        leftIcon={<Send size={18} />}
      >
        Enviar link de recuperação
      </Button>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para o Login
        </Link>
      </div>
    </form>
  );
}
