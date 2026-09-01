'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { completenessService } from '@/services/completenessService';
import { AdvertiserProfile, CompletenessResult } from '@/types/app.types';
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
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Crown
} from 'lucide-react';
import { consumerSubscriptionService } from '@/services/consumerSubscriptionService';
import { ConsumerEntitlements } from '@/types/app.types';

export default function AccountPage() {
  const { user, profile, roles, isLoading, isAdvertiser } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessResult | null>(null);
  const [consumerEntitlements, setConsumerEntitlements] = useState<ConsumerEntitlements | null>(null);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const [entitlements] = await Promise.all([
          consumerSubscriptionService.getConsumerEntitlements(profile.id),
        ]);
        setConsumerEntitlements(entitlements);

        if (isAdvertiser) {
          const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
          if (adv) {
            setAdvertiser(adv);
            const [media, contacts, catIds] = await Promise.all([
              mediaService.getAdvertiserMedia(adv.id),
              contactsService.getContactsByAdvertiser(adv.id),
              advertisersService.getAdvertiserCategoryIds(adv.id),
            ]);
            const comp = completenessService.calculateProfileCompleteness(adv, media, contacts, catIds.length);
            setCompleteness(comp);
          }
        }
      }
    }
    if (!isLoading) {
      loadData();
    }
  }, [profile, isAdvertiser, isLoading]);

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
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '1020px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">ÁREA DO USUÁRIO</Badge>
            <Badge variant="neutral">{profile?.account_type || 'user'}</Badge>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 800, margin: 0 }}>
            Minha Conta
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Gerencie suas preferências, dados pessoais, listas e histórico privado
          </p>
        </div>

        {!isAdvertiser ? (
          <Link href="/advertiser/start">
            <Button variant="ruby" size="md" leftIcon={<Megaphone size={16} />}>
              Quero Anunciar
            </Button>
          </Link>
        ) : (
          <Link href="/advertiser">
            <Button variant="primary" size="md" leftIcon={<Sparkles size={16} />}>
              Painel do Anunciante
            </Button>
          </Link>
        )}
      </div>

      {/* PORTAL18 PREMIUM MEMBERSHIP BANNER */}
      <Card
        variant="glass"
        padding="md"
        style={{
          border: consumerEntitlements?.is_premium ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
          background: consumerEntitlements?.is_premium ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(0, 0, 0, 0.4) 100%)' : 'var(--bg-secondary)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Crown size={18} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--accent-gold)' }}>
                {consumerEntitlements?.is_premium ? 'Membro Portal18 Premium Ativo' : 'Portal18 Premium (Membro)'}
              </h3>
              <Badge variant={consumerEntitlements?.is_premium ? 'gold' : 'neutral'}>
                {consumerEntitlements?.is_premium ? 'Assinante' : 'Plano Gratuito'}
              </Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {consumerEntitlements?.is_premium
                ? 'Você tem acesso liberado a vídeos exclusivos, leitura de avaliações completas e alertas inteligentes.'
                : 'Acesse vídeos exclusivos de anunciantes, leia avaliações completas moderadas e receba alertas.'}
            </p>
          </div>

          <Link href="/premium">
            <Button variant={consumerEntitlements?.is_premium ? 'outline' : 'primary'} size="sm" rightIcon={<ArrowRight size={14} />}>
              {consumerEntitlements?.is_premium ? 'Gerenciar Benefícios' : 'Conhecer Portal18 Premium'}
            </Button>
          </Link>
        </div>
      </Card>

      {/* ADVERTISER ONBOARDING RESUME BANNER (If advertiser with draft or incomplete profile) */}
      {isAdvertiser && advertiser && (advertiser.profile_status === 'draft' || !advertiser.onboarding_completed) && (
        <Card
          variant="glass"
          padding="md"
          style={{
            border: '1px solid var(--accent-gold)',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Clock size={18} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--accent-gold)' }}>
                  Seu Perfil Profissional está em Configuração ({completeness?.score || 0}% completo)
                </h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                {completeryMissingText(completeness)}
              </p>
            </div>

            <Link href="/advertiser/onboarding">
              <Button variant="ruby" size="sm" rightIcon={<ArrowRight size={14} />}>
                Continuar Onboarding
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Main Profile Summary Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Avatar src={profile?.avatar_path} fallback={profile?.display_name || user?.email || 'U'} size="xl" />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.2rem 0' }}>
                {profile?.display_name || 'Usuário do Portal'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{user?.email}</p>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Heart size={22} color="var(--accent-ruby)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Favoritos</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Users size={22} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Perfis Seguidos</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <History size={22} color="var(--color-info)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Visualizados Recentemente</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <ListFilter size={22} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Listas</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Bell size={22} color="var(--color-warning)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Notificações</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Sliders size={22} color="var(--color-info)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Preferências</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Shield size={22} color="var(--color-success)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Privacidade</h3>
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
        <Card variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Key size={22} color="var(--color-info)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Segurança</h3>
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

function completeryMissingText(completeness: CompletenessResult | null): string {
  if (!completeness || completeness.score === 0) return 'Complete as informações do seu anúncio para publicar.';
  const pending = completeness.items.filter((i) => !i.completed);
  if (pending.length > 0) {
    return `Próximo passo: ${pending[0].label}.`;
  }
  return 'Seu perfil está pronto para envio para análise!';
}
