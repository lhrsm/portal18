'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { User, Shield, Megaphone, Key, Settings, AlertCircle } from 'lucide-react';

export default function AccountPage() {
  const { user, profile, roles, isLoading, isAdvertiser } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="150px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="200px" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.25rem' }}>Painel do Usuário</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie seus dados de acesso, perfil e anúncios</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/account/profile">
            <Button variant="secondary" leftIcon={<User size={16} />}>
              Editar Perfil
            </Button>
          </Link>
          <Link href="/account/security">
            <Button variant="secondary" leftIcon={<Key size={16} />}>
              Segurança
            </Button>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* User Identity Card */}
        <Card variant="glass" padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <Avatar fallback={profile?.display_name || user?.email || 'U'} size="lg" />
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.2rem' }}>
                {profile?.display_name || 'Usuário do Portal'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {roles.length > 0 ? (
                  roles.map((r, i) => (
                    <Badge key={i} variant={r === 'admin' || r === 'super_admin' ? 'ruby' : r === 'advertiser' ? 'gold' : 'neutral'}>
                      {r}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">user</Badge>
                )}
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '1rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ID do Perfil:</span>
              <code style={{ color: 'var(--accent-gold)' }}>{profile?.id ? `${profile.id.slice(0, 8)}...` : 'N/A'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status da Conta:</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{profile?.status || 'Ativo'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Data de Cadastro:</span>
              <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</span>
            </div>
          </div>
        </Card>

        {/* Advertiser Promotion Card */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Megaphone size={22} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.25rem' }}>Deseja Publicar Anúncios?</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Profissionais adultos independentes podem criar seu perfil de anunciante com fotos, vídeos, localização e horários de atendimento.
            </p>
          </div>

          {isAdvertiser ? (
            <Link href="/advertiser">
              <Button variant="ruby" fullWidth>
                Acessar Painel do Anunciante
              </Button>
            </Link>
          ) : (
            <Link href="/advertiser/profile">
              <Button variant="primary" fullWidth>
                Criar Perfil de Anunciante
              </Button>
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
