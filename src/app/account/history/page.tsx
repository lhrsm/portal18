'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { historyService } from '@/services/account/historyService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  History, 
  ArrowLeft, 
  Trash2, 
  ExternalLink, 
  MapPin, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';

interface HistoryItem {
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
  last_viewed_at: string;
  view_count: number;
}

export default function HistoryPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    if (profile) {
      const data = await historyService.getUserHistory(profile.id);
      setHistory(data as HistoryItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadHistory();
    }
  }, [profile, authLoading]);

  const handleRemoveSingle = async (advertiserId: string) => {
    if (!profile) return;
    const prev = [...history];
    setHistory(history.filter((h) => h.advertiser_id !== advertiserId));

    const res = await historyService.removeHistoryItem(profile.id, advertiserId);
    if (res.success) {
      showToast({ type: 'info', title: 'Removido', message: 'Item removido do seu histórico.' });
    } else {
      setHistory(prev);
      showToast({ type: 'error', title: 'Erro', message: res.error });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja realmente limpar todo o seu histórico de navegação? Esta ação é irreversível.')) {
      return;
    }

    setIsClearing(true);
    const res = await historyService.clearHistory();
    if (res.success) {
      setHistory([]);
      showToast({ type: 'success', title: 'Histórico Limpo', message: 'Seu histórico foi totalmente apagado.' });
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error });
    }
    setIsClearing(false);
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

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <History size={28} color="var(--color-info)" />
            <h1 style={{ fontSize: '2.2rem' }}>Histórico de Visualizações</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Perfis que você visitou recentemente no portal ({history.length})
          </p>
        </div>

        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            isLoading={isClearing}
            style={{ color: 'var(--accent-ruby)' }}
            leftIcon={<Trash2 size={14} />}
          >
            Limpar Todo o Histórico
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <History size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Seu histórico está vazio</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Os perfis que você visitar ficarão salvos aqui de forma privada para que você possa revisitá-los a qualquer momento.
          </p>
          <Link href="/explorar">
            <Button variant="primary" size="md">
              Explorar Perfis
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {history.map((item) => {
            const dateStr = new Date(item.last_viewed_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card
                key={item.advertiser_id}
                variant="glass"
                padding="none"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Photo */}
                <div style={{ height: '160px', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
                  {item.primary_photo_url ? (
                    <img
                      src={item.primary_photo_url}
                      alt={item.stage_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Sem foto
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.3rem' }}>
                    <Badge variant="neutral">
                      {item.view_count}x visto
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>{item.stage_name}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <MapPin size={13} color="var(--accent-gold)" />
                    <span>{item.city_name}, {item.state_code}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <Clock size={12} />
                    <span>Última visita: {dateStr}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <Link
                      href={`/perfil/sp/sao-paulo/${item.slug}`}
                      style={{ flex: 1 }}
                    >
                      <Button variant="secondary" size="sm" fullWidth rightIcon={<ExternalLink size={13} />}>
                        Visitar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSingle(item.advertiser_id)}
                      aria-label="Remover do histórico"
                      style={{ color: 'var(--accent-ruby)' }}
                    >
                      <Trash2 size={15} />
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
