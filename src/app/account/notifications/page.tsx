'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/account/notificationService';
import { Notification, NotificationPreference } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Bell, 
  ArrowLeft, 
  CheckCheck, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle, 
  Info, 
  UserCheck 
} from 'lucide-react';

export default function NotificationsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<'inbox' | 'preferences'>('inbox');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (profile) {
      const [list, unread, prefs] = await Promise.all([
        notificationService.getUserNotifications(profile.id),
        notificationService.getUnreadCount(profile.id),
        notificationService.getNotificationPreferences(profile.id),
      ]);
      setNotifications(list);
      setUnreadCount(unread);
      setNotifPrefs(prefs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(notifications.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    await notificationService.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    setNotifications(notifications.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    const res = await notificationService.markAllAsRead(profile.id);
    if (res.success) {
      showToast({ type: 'success', title: 'Tudo Lido', message: 'Todas as notificações foram marcadas como lidas.' });
    }
  };

  const handleTogglePref = async (channel: 'in_app' | 'email' | 'push', category: any, currentEnabled: boolean) => {
    if (!profile) return;
    const newEnabled = !currentEnabled;
    const res = await notificationService.updateNotificationPreference(profile.id, channel, category, newEnabled);
    if (res.success) {
      const updated = notifPrefs.map((p) => (p.channel === channel && p.category === category) ? { ...p, enabled: newEnabled } : p);
      if (!updated.some((p) => p.channel === channel && p.category === category)) {
        updated.push({ id: '', profile_id: profile.id, channel, category, enabled: newEnabled, created_at: '', updated_at: '' });
      }
      setNotifPrefs(updated);
      showToast({ type: 'success', title: 'Preferência Atualizada', message: 'Configuração de notificação salva.' });
    }
  };

  const isPrefEnabled = (channel: string, category: string) => {
    const found = notifPrefs.find((p) => p.channel === channel && p.category === category);
    return found ? found.enabled : true; // Default true
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'followed_profile_new_media':
      case 'followed_profile_updated':
        return <Sparkles size={18} color="var(--accent-gold)" />;
      case 'security_alert':
        return <AlertTriangle size={18} color="var(--accent-ruby)" />;
      case 'profile_approved':
      case 'identity_verified':
        return <ShieldCheck size={18} color="var(--color-success)" />;
      default:
        return <Info size={18} color="var(--color-info)" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="200px" />
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

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Bell size={28} color="var(--color-warning)" />
            <h1 style={{ fontSize: '2.2rem' }}>Notificações</h1>
            {unreadCount > 0 && (
              <Badge variant="ruby">
                {unreadCount > 99 ? '99+' : unreadCount} não lidas
              </Badge>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Avisos de perfis seguidos, novidades e alertas importantes da sua conta
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={tab === 'inbox' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTab('inbox')}
          >
            Caixa de Entrada
          </Button>
          <Button
            variant={tab === 'preferences' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setTab('preferences')}
            leftIcon={<Sliders size={14} />}
          >
            Preferências de Canais
          </Button>
          {tab === 'inbox' && unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck size={14} />}
            >
              Marcar Todas Lidas
            </Button>
          )}
        </div>
      </div>

      {tab === 'inbox' ? (
        notifications.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <Bell size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Você não tem notificações</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', fontSize: '0.9rem' }}>
              Quando perfis que você segue atualizarem fotos ou a plataforma enviar alertas de segurança, você verá aqui.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => {
              const isUnread = !n.read_at;
              const dateStr = new Date(n.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={n.id}
                  variant="glass"
                  padding="md"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: isUnread ? 'rgba(218, 165, 32, 0.05)' : undefined,
                    borderLeft: isUnread ? '3px solid var(--accent-gold)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ marginTop: '2px' }}>{getIconForType(n.type)}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: isUnread ? 700 : 500 }}>{n.title}</h4>
                        {isUnread && <Badge variant="gold">Novo</Badge>}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '0.4rem' }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                    </div>
                  </div>

                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(n.id)}
                      title="Marcar como lida"
                    >
                      <CheckCheck size={16} />
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* Tab: Notification Preferences (Section 60 to 65) */
        <Card variant="glass" padding="lg">
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Canais e Categorias de Notificação
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Escolha como e quando deseja receber comunicações. Alertas transacionais e de segurança de conta são sempre prioritários.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category: Profile Updates */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Perfis Seguidos (Novas Mídias e Reativação)</h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Avisos quando anunciantes seguidos publicarem fotos ou vídeos aprovados</p>
              </div>
              <input
                type="checkbox"
                checked={isPrefEnabled('in_app', 'profile_updates')}
                onChange={() => handleTogglePref('in_app', 'profile_updates', isPrefEnabled('in_app', 'profile_updates'))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>

            {/* Category: Platform News */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Novidades da Plataforma e Recursos</h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Atualizações sobre novas ferramentas, filtros e melhorias do portal</p>
              </div>
              <input
                type="checkbox"
                checked={isPrefEnabled('in_app', 'platform_news')}
                onChange={() => handleTogglePref('in_app', 'platform_news', isPrefEnabled('in_app', 'platform_news'))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>

            {/* Category: Security Alerts */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Alertas de Segurança e Sessão</h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Avisos de redefinição de senha e acessos em novos navegadores (Obrigatório)</p>
              </div>
              <Badge variant="success">Sempre Ativo</Badge>
            </div>

            {/* Category: Marketing */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Ofertas e Destaques Comerciais</h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Comunicações promocionais e anúncios de campanhas parceiras</p>
              </div>
              <input
                type="checkbox"
                checked={isPrefEnabled('in_app', 'marketing')}
                onChange={() => handleTogglePref('in_app', 'marketing', isPrefEnabled('in_app', 'marketing'))}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
