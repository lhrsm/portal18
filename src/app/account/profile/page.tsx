'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { profilesService } from '@/services/profilesService';
import { ProfileUpdateSchema } from '@/lib/validation/profile';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/hooks/useToast';
import { User, AtSign, Save, Camera, ArrowLeft } from 'lucide-react';

export default function AccountProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ displayName?: string; username?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setAvatarPath(profile.avatar_path || null);
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const res = await profilesService.uploadAvatar(file);
      if (!res.success || !res.avatarUrl) {
        showToast({
          type: 'error',
          title: 'Erro no Upload',
          message: res.error || 'Não foi possível enviar o avatar.',
        });
        return;
      }

      setAvatarPath(res.avatarUrl);
      await refreshProfile();
      showToast({
        type: 'success',
        title: 'Avatar Atualizado',
        message: 'Sua foto de perfil foi salva com sucesso.',
      });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast({
        type: 'error',
        title: 'Erro inesperado',
        message: 'Falha ao processar arquivo de imagem.',
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
        setFeedback({ type: 'error', message: res.error || 'Não foi possível salvar as alterações.' });
        return;
      }

      await refreshProfile();
      showToast({
        type: 'success',
        title: 'Perfil atualizado com sucesso.',
      });
      setFeedback({ type: 'success', message: 'Alterações salvas com sucesso!' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Não foi possível salvar as alterações. Tente novamente.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '640px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Minha Conta
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Meu Perfil</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Atualize sua foto de perfil, nome de exibição e identificador público (@)
      </p>

      {/* Avatar Upload Section */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Avatar src={avatarPath} fallback={displayName || user?.email || 'U'} size="xl" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
          />
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isUploadingAvatar}
              leftIcon={<Camera size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingAvatar ? 'Enviando...' : 'Alterar Foto de Perfil'}
            </Button>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)
            </div>
          </div>
        </div>
      </Card>

      {/* Form Fields Card */}
      <Card variant="glass" padding="lg">
        {feedback && (
          <Alert type={feedback.type} title={feedback.type === 'success' ? 'Sucesso' : 'Atenção'}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="E-mail (Não editável)" hint="Para alterar seu e-mail, acesse a página de segurança.">
            <Input type="email" value={user?.email || ''} disabled />
          </FormField>

          <FormField label="Nome de Exibição" required error={errors.displayName}>
            <Input
              type="text"
              placeholder="Ex: Carlos Santos ou Sofia"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={!!errors.displayName}
              leftIcon={<User size={18} />}
              disabled={isLoading}
              required
            />
          </FormField>

          <FormField
            label="Username (@)"
            error={errors.username}
            hint="Identificador para menções e URLs (letras minúsculas, números e hífens)."
          >
            <Input
              type="text"
              placeholder="ex: carlos_santos"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              error={!!errors.username}
              leftIcon={<AtSign size={18} />}
              disabled={isLoading}
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
