'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notificationService } from '@/services/account/notificationService';
import { Notification, NotificationPreference } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  Lock
} from 'lucide-react';

export default function AdvertiserNotificationsPage() {
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
      showToast({ type: 'success', title: 'Preferência Atualizada', message: 'Configuração salva com sucesso.' });
    }
  };

  const isPrefEnabled = (channel: string, category: string) => {
    const found = notifPrefs.find((p) => p.channel === channel && p.category === category);
    return found ? found.enabled : true;
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/advertiser" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar para o Painel
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Notificações do Anunciante
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Avisos de moderação, avaliações de clientes, faturamento e canais de contato
            </p>
          </div>
          {tab === 'inbox' && unreadCount > 0 && (
            <Button variant="secondary" size="sm" leftIcon={<CheckCheck size={14} />} onClick={handleMarkAllRead}>
              Marcar tudo como lido
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Button
          variant={tab === 'inbox' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('inbox')}
        >
          Caixa de Entrada {unreadCount > 0 && `(${unreadCount})`}
        </Button>
        <Button
          variant={tab === 'preferences' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('preferences')}
        >
          Preferências de Canais
        </Button>
      </div>

      {/* Content */}
      {tab === 'inbox' && (
        <Card variant="glass" padding="none">
          {isLoading ? (
            <div style={{ padding: '1.5rem' }}>
              <Skeleton width="100%" height="45px" style={{ marginBottom: '0.5rem' }} />
              <Skeleton width="100%" height="45px" />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <Bell size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Nenhuma notificação recente
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Você será avisado sobre aprovações de anúncios e contatos de clientes aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                return (
                  <div
                    key={n.id}
                    onClick={() => isUnread && handleMarkAsRead(n.id)}
                    style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isUnread ? 'rgba(229, 185, 92, 0.04)' : 'transparent',
                      cursor: isUnread ? 'pointer' : 'default',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: isUnread ? 700 : 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {n.title}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                        {n.message}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'preferences' && (
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
            Preferências de Comunicação por Canal
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Security Alert (Mandatory) */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="var(--color-success)" /> Alertas de Segurança & Fraude
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Notificações essenciais de login suspeito e sanções de conta (In-App Obrigatório).
                </span>
              </div>
              <Badge variant="success">OBRIGATÓRIO</Badge>
            </div>

            {/* Profile Moderation */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Status de Moderação & Autenticidade</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                  Avisos de aprovação de perfil, fotos rejeitadas e selo de autenticidade.
                </span>
              </div>
              <Button
                variant={isPrefEnabled('in_app', 'transactional') ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleTogglePref('in_app', 'transactional', isPrefEnabled('in_app', 'transactional'))}
              >
                {isPrefEnabled('in_app', 'transactional') ? 'Ativado' : 'Desativado'}
              </Button>
            </div>

            {/* Client Reviews */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Novas Avaliações de Clientes</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                  Notificações sobre comentários e avaliações recebidas no seu anúncio.
                </span>
              </div>
              <Button
                variant={isPrefEnabled('in_app', 'profile_updates') ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleTogglePref('in_app', 'profile_updates', isPrefEnabled('in_app', 'profile_updates'))}
              >
                {isPrefEnabled('in_app', 'profile_updates') ? 'Ativado' : 'Desativado'}
              </Button>
            </div>

            {/* Platform News & Marketing */}
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Novidades & Oportunidades Comerciais</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                  Promoções de pacotes de visibilidade (Boosts) e informativos da plataforma.
                </span>
              </div>
              <Button
                variant={isPrefEnabled('in_app', 'marketing') ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleTogglePref('in_app', 'marketing', isPrefEnabled('in_app', 'marketing'))}
              >
                {isPrefEnabled('in_app', 'marketing') ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
