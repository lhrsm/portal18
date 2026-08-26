'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { followingService } from '@/services/account/followingService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Users, 
  ArrowLeft, 
  Bell, 
  BellOff, 
  UserMinus, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface FollowingCardItem {
  advertiser_id: string;
  slug: string;
  stage_name: string;
  headline: string | null;
  city_name: string;
  city_slug: string;
  state_code: string;
  verification_status: string;
  profile_status: string;
  primary_photo_url: string | null;
  notifications_enabled: boolean;
  followed_at: string;
}

export default function FollowingPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [following, setFollowing] = useState<FollowingCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFollowing = async () => {
    if (profile) {
      const data = await followingService.getFollowedProfiles(profile.id);
      setFollowing(data as FollowingCardItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadFollowing();
    }
  }, [profile, authLoading]);

  const handleUnfollow = async (advertiserId: string) => {
    if (!profile) return;
    const prev = [...following];
    setFollowing(following.filter((f) => f.advertiser_id !== advertiserId));

    const res = await followingService.toggleFollow(advertiserId);
    if (res.success) {
      showToast({ type: 'info', title: 'Deixou de Seguir', message: 'Você não receberá mais atualizações deste perfil.' });
    } else {
      setFollowing(prev);
      showToast({ type: 'error', title: 'Erro', message: res.error });
    }
  };

  const handleToggleNotifications = async (advertiserId: string, currentEnabled: boolean) => {
    if (!profile) return;
    const newStatus = !currentEnabled;
    setFollowing(following.map((f) => f.advertiser_id === advertiserId ? { ...f, notifications_enabled: newStatus } : f));

    const res = await followingService.updateFollowNotification(profile.id, advertiserId, newStatus);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Notificações Atualizadas',
        message: newStatus ? 'Notificações ativadas para este perfil.' : 'Notificações silenciadas.',
      });
    } else {
      setFollowing(following.map((f) => f.advertiser_id === advertiserId ? { ...f, notifications_enabled: currentEnabled } : f));
      showToast({ type: 'error', title: 'Erro', message: res.error });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Minha Conta
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Users size={28} color="var(--accent-gold)" />
          <h1 style={{ fontSize: '2.2rem' }}>Perfis Seguidos</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Receba notificações quando seus anunciantes favoritos publicarem novas mídias ou atualizarem o perfil ({following.length})
        </p>
      </div>

      {following.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Você ainda não segue nenhum perfil</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Ao seguir um anunciante, você é avisado sobre novas fotos, vídeos aprovados e retornos de atividade.
          </p>
          <Link href="/explorar">
            <Button variant="primary" size="md">
              Explorar Perfis
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {following.map((adv) => {
            const isAvailable = adv.profile_status === 'active';

            return (
              <Card
                key={adv.advertiser_id}
                variant="glass"
                padding="none"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Photo Header */}
                <div style={{ height: '180px', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
                  {adv.primary_photo_url ? (
                    <img
                      src={adv.primary_photo_url}
                      alt={adv.stage_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Sem foto
                    </div>
                  )}

                  {adv.verification_status === 'verified' && (
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                      <Badge variant="gold">
                        <ShieldCheck size={12} style={{ marginRight: '2px' }} /> 18+
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{adv.stage_name}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    <MapPin size={13} color="var(--accent-gold)" />
                    <span>{adv.city_name}, {adv.state_code}</span>
                  </div>

                  {!isAvailable ? (
                    <div style={{ padding: '0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={14} color="var(--color-warning)" />
                      <span>Este perfil não está disponível no momento.</span>
                    </div>
                  ) : adv.headline ? (
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {adv.headline}
                    </p>
                  ) : null}

                  {/* Actions & Notification Toggle (Section 15) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <Button
                      variant={adv.notifications_enabled ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleToggleNotifications(adv.advertiser_id, adv.notifications_enabled)}
                      title={adv.notifications_enabled ? 'Notificações ativadas' : 'Notificações silenciadas'}
                      leftIcon={adv.notifications_enabled ? <Bell size={14} color="var(--accent-gold)" /> : <BellOff size={14} color="var(--text-muted)" />}
                    >
                      {adv.notifications_enabled ? 'Notificações' : 'Silenciado'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnfollow(adv.advertiser_id)}
                      style={{ color: 'var(--text-muted)' }}
                      title="Deixar de seguir"
                      leftIcon={<UserMinus size={14} />}
                    >
                      Deixar de seguir
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
