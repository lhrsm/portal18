'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { profilesService } from '@/services/profilesService';
import { ProfileUpdateSchema } from '@/lib/validation/profile';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { User, AtSign, Save } from 'lucide-react';

export default function AccountProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setErrors({});

    const result = ProfileUpdateSchema.safeParse({
      displayName: displayName || undefined,
      username: username || undefined,
    });

    if (!result.success) {
      const fieldErrors: { displayName?: string; username?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'displayName') fieldErrors.displayName = err.message;
        if (err.path[0] === 'username') fieldErrors.username = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!profile) return;

    setIsLoading(true);
    try {
      const res = await profilesService.updateProfile(profile.id, {
        display_name: displayName,
        username: username || null,
      });

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao atualizar o perfil.' });
        return;
      }

      await refreshProfile();
      showToast({
        type: 'success',
        title: 'Perfil Atualizado',
        message: 'Suas informações foram salvas com sucesso.',
      });
      setFeedback({ type: 'success', message: 'Perfil salvo com sucesso!' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro inesperado ao salvar perfil.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Editar Perfil</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Atualize suas informações básicas e nome de usuário
      </p>

      <Card variant="glass" padding="lg">
        {feedback && (
          <Alert type={feedback.type} title={feedback.type === 'success' ? 'Sucesso' : 'Erro'}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="E-mail (Não editável)" hint="Para alterar seu e-mail, acesse as configurações de segurança.">
            <Input type="email" value={user?.email || ''} disabled />
          </FormField>

          <FormField label="Nome de Exibição" required error={errors.displayName}>
            <Input
              type="text"
              placeholder="Ex: Pedro Henrique"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={!!errors.displayName}
              leftIcon={<User size={18} />}
              required
            />
          </FormField>

          <FormField
            label="Username Público (@)"
            error={errors.username}
            hint="Identificador exclusivo para menções (letras minúsculas, números e hífens)."
          >
            <Input
              type="text"
              placeholder="ex: pedro_h"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              error={!!errors.username}
              leftIcon={<AtSign size={18} />}
            />
          </FormField>

          <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading} leftIcon={<Save size={18} />}>
            Salvar Alterações
          </Button>
        </form>
      </Card>
    </div>
  );
}
