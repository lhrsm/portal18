'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/favoritesService';
import { AdvertiserProfile } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { Heart, ArrowLeft, Trash2, MapPin, Eye } from 'lucide-react';

export default function FavoritesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<AdvertiserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFavorites() {
      if (profile) {
        const data = await favoritesService.getUserFavorites(profile.id);
        setFavorites(data);
      }
      setIsLoading(false);
    }
    if (!authLoading) {
      loadFavorites();
    }
  }, [profile, authLoading]);

  const handleRemove = async (advertiserId: string) => {
    if (!profile) return;
    const res = await favoritesService.removeFavorite(profile.id, advertiserId);
    if (res.success) {
      setFavorites((prev) => prev.filter((item) => item.id !== advertiserId));
      showToast({
        type: 'info',
        title: 'Favorito Removido',
        message: 'O anúncio foi removido da sua lista.',
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="150px" />
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <Heart size={28} color="var(--accent-ruby)" />
        <h1 style={{ fontSize: '2.2rem' }}>Meus Favoritos</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Anúncios e perfis de profissionais que você salvou para consulta rápida
      </p>

      {favorites.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Heart size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Nenhum favorito salvo ainda</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Ao explorar os anúncios da plataforma, clique no ícone de coração para salvar perfis e encontrá-los facilmente aqui.
          </p>
          <Link href="/">
            <Button variant="primary" size="md">
              Explorar Anúncios
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {favorites.map((adv) => (
            <Card key={adv.id} variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{adv.stage_name}</h3>
                  {adv.neighborhood && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <MapPin size={14} />
                      <span>{adv.neighborhood}</span>
                    </div>
                  )}
                </div>
                <Badge variant={adv.profile_status === 'approved' ? 'success' : 'neutral'}>
                  {adv.profile_status}
                </Badge>
              </div>

              {adv.headline && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                  {adv.headline}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <Button variant="secondary" size="sm" fullWidth leftIcon={<Eye size={14} />}>
                  Ver Perfil
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(adv.id)}
                  aria-label="Remover favorito"
                  style={{ color: 'var(--accent-ruby)' }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
