'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  User, 
  Key, 
  Heart, 
  Users, 
  History, 
  ListFilter, 
  Bell, 
  Sliders, 
  Shield, 
  Megaphone, 
  ArrowRight 
} from 'lucide-react';

export default function AccountPage() {
  const { user, profile, roles, isLoading, isAdvertiser } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">ÁREA DO USUÁRIO</Badge>
            <Badge variant="neutral">{profile?.account_type || 'user'}</Badge>
          </div>
          <h1 style={{ fontSize: '2.2rem' }}>Minha Conta</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas preferências, dados pessoais, listas e histórico privado</p>
        </div>

        {!isAdvertiser && (
          <Link href="/advertiser/start">
            <Button variant="ruby" leftIcon={<Megaphone size={16} />}>
              Quero Anunciar
            </Button>
          </Link>
        )}
      </div>

      {/* Main Profile Summary Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Avatar src={profile?.avatar_path} fallback={profile?.display_name || user?.email || 'U'} size="xl" />
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>
                {profile?.display_name || 'Usuário do Portal'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                {roles.length > 0 ? (
                  roles.map((r, i) => (
                    <Badge key={i} variant={r === 'admin' || r === 'super_admin' ? 'ruby' : r === 'advertiser' ? 'gold' : 'neutral'}>
                      {r}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">user</Badge>
                )}
                <Badge variant={profile?.status === 'active' ? 'success' : 'warning'}>
                  {profile?.status || 'Ativo'}
                </Badge>
              </div>
            </div>
          </div>

          <Link href="/account/profile">
            <Button variant="secondary" size="sm">
              Alterar Foto & Perfil
            </Button>
          </Link>
        </div>
      </Card>

      {/* Section Cards Grid (Sections 3 & 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Card 1: Favoritos */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Heart size={22} color="var(--accent-ruby)" />
              <h3 style={{ fontSize: '1.2rem' }}>Favoritos</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Acesse e gerencie seus anúncios salvos com remoção individual ou em lote.
            </p>
          </div>
          <Link href="/account/favorites">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver Favoritos
            </Button>
          </Link>
        </Card>

        {/* Card 2: Perfis Seguidos */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Users size={22} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem' }}>Perfis Seguidos</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Acompanhe novidades, mídias recém-aprovadas e notificações de perfis que você segue.
            </p>
          </div>
          <Link href="/account/following">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver Perfis Seguidos
            </Button>
          </Link>
        </Card>

        {/* Card 3: Histórico de Visualizações */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <History size={22} color="var(--color-info)" />
              <h3 style={{ fontSize: '1.2rem' }}>Visualizados Recentemente</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Consulte seu histórico de navegação privado, com opção de limpeza total ou exclusão individual.
            </p>
          </div>
          <Link href="/account/history">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver Histórico
            </Button>
          </Link>
        </Card>

        {/* Card 4: Listas Personalizadas */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <ListFilter size={22} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem' }}>Listas</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Organize seus anúncios em coleções particulares como &quot;Viagem Salvador&quot; ou &quot;Quero ver depois&quot;.
            </p>
          </div>
          <Link href="/account/lists">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Gerenciar Listas
            </Button>
          </Link>
        </Card>

        {/* Card 5: Centro de Notificações */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Bell size={22} color="var(--color-warning)" />
              <h3 style={{ fontSize: '1.2rem' }}>Notificações</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Alertas de segurança, atualizações de perfis seguidos e comunicados da plataforma.
            </p>
          </div>
          <Link href="/account/notifications">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Centro de Notificações
            </Button>
          </Link>
        </Card>

        {/* Card 6: Preferências & Personalização */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Sliders size={22} color="var(--color-info)" />
              <h3 style={{ fontSize: '1.2rem' }}>Preferências</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Defina sua cidade padrão, filtros favoritos e personalize suas recomendações.
            </p>
          </div>
          <Link href="/account/preferences">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Ajustar Preferências
            </Button>
          </Link>
        </Card>

        {/* Card 7: Privacidade & Bloqueios */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Shield size={22} color="var(--color-success)" />
              <h3 style={{ fontSize: '1.2rem' }}>Privacidade</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Gerencie histórico de navegação, perfis bloqueados, consentimentos e exportação LGPD.
            </p>
          </div>
          <Link href="/account/privacy">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Opções de Privacidade
            </Button>
          </Link>
        </Card>

        {/* Card 8: Segurança */}
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Key size={22} color="var(--color-info)" />
              <h3 style={{ fontSize: '1.2rem' }}>Segurança</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              Altere sua senha de acesso, veja o status da sessão e criptografia.
            </p>
          </div>
          <Link href="/account/security">
            <Button variant="secondary" fullWidth size="sm" rightIcon={<ArrowRight size={14} />}>
              Configurar Segurança
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
