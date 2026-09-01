'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SecurityEvent } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Activity,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Lock,
  Smartphone,
  AlertCircle,
  Clock
} from 'lucide-react';

export default function SecurityActivityPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching security activity:', error);
      } else {
        setEvents((data as any) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadActivity();
    }
  }, [profile, authLoading]);

  const getEventMeta = (type: string) => {
    switch (type) {
      case 'login_success':
        return { label: 'Login realizado com sucesso', icon: <ShieldCheck size={18} color="var(--color-success)" /> };
      case 'login_failed':
        return { label: 'Tentativa de login incorreta', icon: <AlertCircle size={18} color="var(--accent-ruby)" /> };
      case 'password_changed':
        return { label: 'Senha de acesso alterada', icon: <Lock size={18} color="var(--accent-gold)" /> };
      case 'mfa_enabled':
        return { label: 'Autenticação em duas etapas ativada', icon: <KeyRound size={18} color="var(--color-success)" /> };
      case 'mfa_disabled':
        return { label: 'Autenticação em duas etapas desativada', icon: <AlertCircle size={18} color="var(--accent-ruby)" /> };
      case 'session_revoked':
        return { label: 'Sessão de dispositivo encerrada', icon: <Smartphone size={18} color="var(--text-muted)" /> };
      default:
        return { label: 'Atividade de segurança', icon: <Activity size={18} color="var(--accent-gold)" /> };
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '780px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/account/security" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Segurança
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Activity size={28} color="var(--accent-gold)" />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Histórico de Atividades</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Registro de eventos de autenticação e alterações de segurança realizadas em sua conta.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : events.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <ShieldCheck size={40} color="var(--color-success)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Nenhuma atividade suspeita</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Eventos recentes de login e segurança serão exibidos aqui.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {events.map((ev) => {
            const meta = getEventMeta(ev.event_type);
            const dateStr = new Date(ev.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={ev.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {meta.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} /> {dateStr}
                      </div>
                    </div>
                  </div>

                  <Badge variant={ev.severity === 'critical' || ev.severity === 'high' ? 'ruby' : 'neutral'}>
                    {ev.severity.toUpperCase()}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
