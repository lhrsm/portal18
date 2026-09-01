'use client';

import React from 'react';
import {
  Activity,
  ShieldCheck,
  Camera,
  MessageCircle,
  Heart,
  Eye,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ActivityEvent } from '@/services/advertiserDashboardService';

export interface AdvertiserActivityFeedProps {
  activities: ActivityEvent[];
}

export function AdvertiserActivityFeed({ activities }: AdvertiserActivityFeedProps) {
  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'profile_approved':
        return <ShieldCheck size={16} color="var(--color-success)" />;
      case 'media_approved':
        return <Camera size={16} color="var(--accent-gold)" />;
      case 'contact_click':
        return <MessageCircle size={16} color="var(--color-success)" />;
      case 'favorite':
        return <Heart size={16} color="var(--accent-ruby)" />;
      case 'view':
      default:
        return <Eye size={16} color="var(--color-info)" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      if (diffMinutes < 5) return 'Agora mesmo';
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Há ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Ontem';
      return `${date.toLocaleDateString('pt-BR')}`;
    } catch {
      return 'Recente';
    }
  };

  return (
    <Card variant="glass" padding="md" style={{ marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Activity size={18} color="var(--accent-gold)" />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Atividade Recente</h3>
      </div>

      {activities.length === 0 ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Nenhuma atividade registrada nas últimas horas. Suas interações recentes aparecerão aqui.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {activities.slice(0, 5).map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getEventIcon(act.type)}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {act.description}
                </span>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {formatRelativeTime(act.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
