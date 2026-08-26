'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PublicAdvertiser } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/favoritesService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Heart, MapPin, ShieldCheck, Sparkles, Clock, Eye } from 'lucide-react';

export interface AdvertiserCardProps {
  advertiser: PublicAdvertiser;
  initialFavorite?: boolean;
}

export function AdvertiserCard({ advertiser, initialFavorite = false }: AdvertiserCardProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const stateSlug = advertiser.state_slug || 'br';
  const citySlug = advertiser.city_slug || 'geral';
  const profileUrl = `/perfil/${stateSlug}/${citySlug}/${advertiser.slug}`;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !profile) {
      showToast({
        type: 'warning',
        title: 'Acesso Necessário',
        message: 'Entre em sua conta para salvar perfis nos favoritos.',
      });
      router.push(`/login?redirect_to=${encodeURIComponent(profileUrl)}`);
      return;
    }

    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);

    // Optimistic toggle
    const previousState = isFavorite;
    const newState = !previousState;
    setIsFavorite(newState);

    try {
      if (newState) {
        const res = await favoritesService.addFavorite(profile.id, advertiser.advertiser_id);
        if (!res.success) throw new Error(res.error);
        showToast({ type: 'success', title: 'Adicionado aos Favoritos', message: `${advertiser.stage_name} foi salvo.` });
      } else {
        const res = await favoritesService.removeFavorite(profile.id, advertiser.advertiser_id);
        if (!res.success) throw new Error(res.error);
        showToast({ type: 'info', title: 'Removido dos Favoritos', message: 'Anúncio removido da sua lista.' });
      }
    } catch {
      // Revert optimistic state on failure (Section 26)
      setIsFavorite(previousState);
      showToast({
        type: 'error',
        title: 'Erro ao favoritar',
        message: 'Não foi possível atualizar seus favoritos. Tente novamente.',
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="advertiser-card-container">
      <Link href={profileUrl} className="advertiser-card-link">
        <div className="advertiser-card-media-wrapper">
          {advertiser.primary_photo_url ? (
            <img
              src={advertiser.primary_photo_url}
              alt={advertiser.stage_name}
              className="advertiser-card-image"
              loading="lazy"
            />
          ) : (
            <div className="advertiser-card-placeholder">
              <Sparkles size={36} color="var(--accent-gold)" />
              <span>Foto em moderação</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="advertiser-card-badges-top">
            {advertiser.verification_status === 'verified' && (
              <span className="badge-verified">
                <ShieldCheck size={13} /> Verificado
              </span>
            )}
            {advertiser.approved_media_count > 1 && (
              <span className="badge-photos-count">
                📷 {advertiser.approved_media_count} fotos
              </span>
            )}
          </div>

          {/* Favorite Floating Button */}
          <button
            type="button"
            className={`advertiser-card-fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart size={18} fill={isFavorite ? 'var(--accent-ruby)' : 'none'} color={isFavorite ? 'var(--accent-ruby)' : '#fff'} />
          </button>
        </div>

        {/* Content Body */}
        <div className="advertiser-card-body">
          <div className="advertiser-card-header">
            <h3 className="advertiser-card-title">{advertiser.stage_name}</h3>
            {advertiser.age && (
              <span className="advertiser-card-age">{advertiser.age} anos</span>
            )}
          </div>

          <div className="advertiser-card-location">
            <MapPin size={14} color="var(--accent-gold)" />
            <span>
              {advertiser.city_name ? `${advertiser.city_name}, ${advertiser.state_code}` : 'Brasil'}
              {advertiser.neighborhood ? ` • ${advertiser.neighborhood}` : ''}
            </span>
          </div>

          {advertiser.headline && (
            <p className="advertiser-card-headline">{advertiser.headline}</p>
          )}

          <div className="advertiser-card-footer">
            <div className="advertiser-card-activity">
              <Clock size={12} />
              <span>Ativo recentemente</span>
            </div>
            <span className="advertiser-card-cta">
              Ver perfil <Eye size={13} />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
