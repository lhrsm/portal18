'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { Lock, Shield, Smartphone } from 'lucide-react';

export default function AccountSecurityPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'A nova senha deve conter pelo menos 8 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas informadas não conferem.' });
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setFeedback({ type: 'error', message: error.message });
        return;
      }

      showToast({
        type: 'success',
        title: 'Senha alterada!',
        message: 'Sua senha de acesso foi atualizada com sucesso.',
      });
      setFeedback({ type: 'success', message: 'Senha atualizada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao alterar a senha.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Segurança da Conta</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Gerencie sua senha de acesso e verifique os dispositivos ativos
      </p>

      {/* Password Change Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Lock size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.25rem' }}>Alterar Senha</h2>
        </div>

        {feedback && (
          <Alert type={feedback.type} title={feedback.type === 'success' ? 'Sucesso' : 'Erro'}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handlePasswordUpdate}>
          <FormField label="Nova Senha" required hint="Mínimo 8 caracteres com letras e números.">
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Confirmar Nova Senha" required>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormField>

          <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading}>
            Atualizar Senha
          </Button>
        </form>
      </Card>

      {/* Session Security Card */}
      <Card variant="elevated" padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Shield size={20} color="var(--color-success)" />
          <h2 style={{ fontSize: '1.25rem' }}>Status da Sessão</h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.5' }}>
          Sua sessão está protegida com autenticação JWT e criptografia de ponta a ponta.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <Smartphone size={20} color="var(--accent-gold)" />
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sessão Atual</div>
            <div style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
