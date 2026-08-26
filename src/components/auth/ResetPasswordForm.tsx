'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ResetPasswordSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { Lock, CheckCircle } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const result = ResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      showToast({
        type: 'success',
        title: 'Senha atualizada!',
        message: 'Sua nova senha foi salva com sucesso. Redirecionando...',
      });

      setTimeout(() => {
        router.push('/account/security');
      }, 1500);
    } catch (err) {
      setServerError('Ocorreu um erro ao atualizar a senha.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {serverError && (
        <Alert type="error" title="Erro ao redefinir">
          {serverError}
        </Alert>
      )}

      <FormField label="Nova Senha" required error={errors.password} hint="Mínimo 8 caracteres, 1 maiúscula e 1 número.">
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          leftIcon={<Lock size={18} />}
          required
        />
      </FormField>

      <FormField label="Confirmar Nova Senha" required error={errors.confirmPassword}>
        <Input
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!errors.confirmPassword}
          leftIcon={<Lock size={18} />}
          required
        />
      </FormField>

      <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading} leftIcon={<CheckCircle size={18} />}>
        Salvar Nova Senha
      </Button>
    </form>
  );
}
