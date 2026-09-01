'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/favoritesService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Heart,
  ArrowLeft,
  Trash2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

interface FavoriteCardItem {
  advertiser_id: string;
  slug: string;
  stage_name: string;
  headline: string | null;
  city_name: string;
  city_slug: string;
  state_code: string;
  state_slug: string;
  verification_status: string;
  profile_status: string;
  primary_photo_url: string | null;
  favorited_at: string;
}

export default function FavoritesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteCardItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = async () => {
    if (profile) {
      const data = await favoritesService.getUserFavorites(profile.id);
      setFavorites(data as FavoriteCardItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadFavorites();
    }
  }, [profile, authLoading]);

  const handleRemoveSingle = async (advertiserId: string) => {
    if (!profile) return;
    // Optimistic UI update (Section 8)
    const prev = [...favorites];
    setFavorites(favorites.filter((f) => f.advertiser_id !== advertiserId));

    const res = await favoritesService.removeFavorite(profile.id, advertiserId);
    if (res.success) {
      showToast({ type: 'info', title: 'Removido', message: 'Anúncio removido dos seus favoritos.' });
    } else {
      setFavorites(prev); // Rollback
      showToast({ type: 'error', title: 'Erro ao remover', message: res.error });
    }
  };

  const handleBulkRemove = async () => {
    if (!profile || selectedIds.length === 0) return;
    const prev = [...favorites];
    setFavorites(favorites.filter((f) => !selectedIds.includes(f.advertiser_id)));
    const idsToRemove = [...selectedIds];
    setSelectedIds([]);
    setIsBulkMode(false);

    const res = await favoritesService.removeFavoritesBulk(profile.id, idsToRemove);
    if (res.success) {
      showToast({ type: 'info', title: 'Favoritos Removidos', message: `${idsToRemove.length} anúncios removidos.` });
    } else {
      setFavorites(prev); // Rollback
      showToast({ type: 'error', title: 'Erro ao remover', message: res.error });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === favorites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(favorites.map((f) => f.advertiser_id));
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

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Heart size={28} color="var(--accent-ruby)" />
            <h1 style={{ fontSize: '2.2rem' }}>Meus Favoritos</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Seus anúncios e perfis salvos para consulta rápida ({favorites.length})
          </p>
        </div>

        {favorites.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {isBulkMode ? (
              <>
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedIds.length === favorites.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                <Button
                  variant="ruby"
                  size="sm"
                  disabled={selectedIds.length === 0}
                  onClick={handleBulkRemove}
                  leftIcon={<Trash2 size={14} />}
                >
                  Excluir Selecionados ({selectedIds.length})
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setIsBulkMode(false); setSelectedIds([]); }}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setIsBulkMode(true)}>
                Gerenciar em Lote
              </Button>
            )}
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Heart size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Você ainda não salvou nenhum perfil</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Ao explorar anúncios, clique no ícone de coração para salvar perfis e encontrá-los facilmente aqui.
          </p>
          <Link href="/explorar">
            <Button variant="primary" size="md">
              Explorar Perfis
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {favorites.map((adv) => {
            const isAvailable = adv.profile_status === 'active';
            const isSelected = selectedIds.includes(adv.advertiser_id);

            return (
              <Card
                key={adv.advertiser_id}
                variant="glass"
                padding="none"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                  border: isSelected ? '1px solid var(--accent-gold)' : undefined,
                }}
              >
                {/* Bulk Select Checkbox */}
                {isBulkMode && (
                  <div
                    onClick={() => toggleSelect(adv.advertiser_id)}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? <CheckSquare size={20} color="var(--accent-gold)" /> : <Square size={20} color="#fff" />}
                  </div>
                )}

                {/* Photo or Placeholder */}
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

                {/* Card Content */}
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{adv.stage_name}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    <MapPin size={13} color="var(--accent-gold)" />
                    <span>{adv.city_name}, {adv.state_code}</span>
                  </div>

                  {/* Unavailable Profile Warning (Section 6) */}
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

                  {/* Bottom Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {isAvailable && (
                      <Link
                        href={`/perfil/${adv.state_slug || 'sp'}/${adv.city_slug || 'sao-paulo'}/${adv.slug}`}
                        style={{ flex: 1 }}
                      >
                        <Button variant="secondary" size="sm" fullWidth rightIcon={<ExternalLink size={13} />}>
                          Ver Perfil
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSingle(adv.advertiser_id)}
                      aria-label="Remover favorito"
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
