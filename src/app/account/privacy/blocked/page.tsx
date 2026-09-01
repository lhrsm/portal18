'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { privacyService } from '@/services/account/privacyService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  UserX,
  ArrowLeft,
  Unlock,
  MapPin,
  ShieldCheck
} from 'lucide-react';

interface BlockedItem {
  advertiser_id: string;
  slug: string;
  stage_name: string;
  headline: string | null;
  city_name: string;
  state_code: string;
  verification_status: string;
  blocked_at: string;
}

export default function BlockedProfilesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [blocked, setBlocked] = useState<BlockedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBlocked = async () => {
    if (profile) {
      const data = await privacyService.getUserBlocks(profile.id);
      setBlocked(data as BlockedItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadBlocked();
    }
  }, [profile, authLoading]);

  const handleUnblock = async (advertiserId: string) => {
    if (!profile) return;
    const prev = [...blocked];
    setBlocked(blocked.filter((b) => b.advertiser_id !== advertiserId));

    const res = await privacyService.toggleBlock(advertiserId);
    if (res.success) {
      showToast({ type: 'info', title: 'Perfil Desbloqueado', message: 'O anúncio poderá voltar a aparecer em suas buscas.' });
    } else {
      setBlocked(prev);
      showToast({ type: 'error', title: 'Erro ao desbloquear', message: res.error });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="180px" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account/privacy" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Privacidade
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <UserX size={28} color="var(--accent-ruby)" />
          <h1 style={{ fontSize: '2.2rem' }}>Perfis Bloqueados</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Anunciantes bloqueados por você não aparecem em recomendações, listas ou destaques ({blocked.length})
        </p>
      </div>

      {blocked.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <UserX size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Você não possui perfis bloqueados</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto', fontSize: '0.9rem' }}>
            Caso deseje ocultar completamente um anúncio de todas as suas recomendações, utilize a opção &quot;Bloquear&quot; no menu do card.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {blocked.map((item) => (
            <Card
              key={item.advertiser_id}
              variant="glass"
              padding="md"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{item.stage_name}</h3>
                  {item.verification_status === 'verified' && (
                    <Badge variant="gold">
                      <ShieldCheck size={12} style={{ marginRight: '2px' }} /> 18+
                    </Badge>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={13} color="var(--accent-gold)" />
                  <span>{item.city_name}, {item.state_code}</span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleUnblock(item.advertiser_id)}
                leftIcon={<Unlock size={14} />}
              >
                Desbloquear Perfil
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
