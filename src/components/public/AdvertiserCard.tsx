'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicAdvertiser } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/favoritesService';
import { followingService } from '@/services/account/followingService';
import { privacyService } from '@/services/account/privacyService';
import { userListsService } from '@/services/account/userListsService';
import { historyService } from '@/services/account/historyService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ReportModal } from '@/components/public/ReportModal';
import { useToast } from '@/hooks/useToast';
import { 
  Heart, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Eye, 
  MoreVertical, 
  Users, 
  ListPlus, 
  UserX, 
  ShieldAlert, 
  EyeOff, 
  Check, 
  X 
} from 'lucide-react';

export interface AdvertiserCardProps {
  advertiser: PublicAdvertiser;
  initialFavorite?: boolean;
  initialFollowing?: boolean;
}

export function AdvertiserCard({ 
  advertiser, 
  initialFavorite = false,
  initialFollowing = false 
}: AdvertiserCardProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const stateSlug = advertiser.state_slug || 'br';
  const citySlug = advertiser.city_slug || 'geral';
  const profileUrl = `/perfil/${stateSlug}/${citySlug}/${advertiser.slug}`;

  const handleCardClick = () => {
    // Non-blocking history record (Section 16 & 99)
    if (profile) {
      historyService.recordProfileView(advertiser.advertiser_id);
    }
  };

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

    const previousState = isFavorite;
    const newState = !previousState;
    setIsFavorite(newState);

    try {
      const res = await favoritesService.toggleFavorite(advertiser.advertiser_id);
      if (!res.success) throw new Error(res.error);
      showToast({
        type: newState ? 'success' : 'info',
        title: newState ? 'Adicionado aos Favoritos' : 'Removido dos Favoritos',
        message: `${advertiser.stage_name} foi ${newState ? 'salvo' : 'removido'}.`,
      });
    } catch {
      setIsFavorite(previousState);
      showToast({ type: 'error', title: 'Erro ao favoritar', message: 'Tente novamente.' });
    }
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!user || !profile) {
      router.push(`/login?redirect_to=${encodeURIComponent(profileUrl)}`);
      return;
    }

    const previousState = isFollowing;
    const newState = !previousState;
    setIsFollowing(newState);

    const res = await followingService.toggleFollow(advertiser.advertiser_id);
    if (res.success) {
      showToast({
        type: 'success',
        title: newState ? 'Seguindo' : 'Deixou de Seguir',
        message: newState ? `Você receberá novidades de ${advertiser.stage_name}.` : 'Notificações canceladas.',
      });
    } else {
      setIsFollowing(previousState);
      showToast({ type: 'error', title: 'Erro', message: res.error });
    }
  };

  const handleOpenListModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!user || !profile) {
      router.push(`/login?redirect_to=${encodeURIComponent(profileUrl)}`);
      return;
    }

    setIsListModalOpen(true);
    setLoadingLists(true);
    const lists = await userListsService.getUserLists(profile.id);
    setUserLists(lists);
    setLoadingLists(false);
  };

  const handleAddToList = async (listId: string, listName: string) => {
    const res = await userListsService.addToList(listId, advertiser.advertiser_id);
    if (res.success) {
      showToast({ type: 'success', title: 'Salvo na Lista', message: `Adicionado a "${listName}".` });
      setIsListModalOpen(false);
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Não foi possível adicionar.' });
    }
  };

  const handleBlockClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!user || !profile) {
      router.push(`/login?redirect_to=${encodeURIComponent(profileUrl)}`);
      return;
    }

    if (!confirm(`Deseja bloquear o perfil de "${advertiser.stage_name}"? Ele não aparecerá mais em suas buscas e recomendações.`)) {
      return;
    }

    const res = await privacyService.toggleBlock(advertiser.advertiser_id);
    if (res.success) {
      showToast({ type: 'info', title: 'Perfil Bloqueado', message: 'O anúncio foi ocultado das suas recomendações.' });
    }
  };

  const handleNotInterestedClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!user || !profile) return;
    await privacyService.hideRecommendation(profile.id, advertiser.advertiser_id, 'user_feedback');
    showToast({ type: 'info', title: 'Feedback Registrado', message: 'Mostraremos menos perfis como este.' });
  };

  return (
    <>
      <div className="advertiser-card-container" onClick={handleCardClick}>
        <Link href={profileUrl} className="advertiser-card-link">
          <div className="advertiser-card-media-wrapper">
            {(() => {
              const rawPhotoUrl = advertiser.primary_photo_url || (advertiser as any).primary_media_url || (advertiser as any).thumbnail_url;
              const photoUrl = rawPhotoUrl?.includes('images.unsplash.com')
                ? rawPhotoUrl.replace(/w=\d+/, 'w=360').replace(/q=\d+/, 'q=75')
                : rawPhotoUrl;

              return photoUrl ? (
                <img
                  src={photoUrl}
                  alt={advertiser.stage_name}
                  className="advertiser-card-image"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="advertiser-card-placeholder">
                  <Sparkles size={36} color="var(--accent-gold)" />
                  <span>Foto do perfil</span>
                </div>
              );
            })()}

            {/* Badges Overlay */}
            <div className="advertiser-card-badges-top">
              {(advertiser as any).is_sponsored && (
                <span className="badge-verified" style={{ background: 'var(--gradient-gold)', color: '#000', fontWeight: 800 }}>
                  Patrocinado
                </span>
              )}
              {advertiser.verification_status === 'verified' && (
                <span className="badge-verified">
                  <ShieldCheck size={13} /> Verificado
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

            {/* Context Menu Button (Section 82 & 83) */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              style={{
                position: 'absolute',
                top: '0.6rem',
                left: '0.6rem',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 5,
              }}
              aria-label="Mais opções"
            >
              <MoreVertical size={16} />
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                style={{
                  position: 'absolute',
                  top: '2.5rem',
                  left: '0.6rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  zIndex: 20,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth: '170px',
                }}
              >
                <button
                  type="button"
                  onClick={handleFollowClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <Users size={14} color="var(--accent-gold)" />
                  <span>{isFollowing ? 'Deixar de seguir' : 'Seguir anunciante'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenListModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <ListPlus size={14} color="var(--accent-gold)" />
                  <span>Salvar em lista...</span>
                </button>

                <button
                  type="button"
                  onClick={handleNotInterestedClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <EyeOff size={14} />
                  <span>Não tenho interesse</span>
                </button>

                <button
                  type="button"
                  onClick={handleBlockClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <UserX size={14} color="var(--accent-ruby)" />
                  <span>Bloquear perfil</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); setIsReportModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--accent-ruby)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}
                >
                  <ShieldAlert size={14} />
                  <span>Denunciar</span>
                </button>
              </div>
            )}
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
                {(advertiser as any).distance_label ? ` • ${(advertiser as any).distance_label}` : (advertiser.neighborhood ? ` • ${advertiser.neighborhood}` : '')}
              </span>
            </div>

            {advertiser.headline && (
              <p className="advertiser-card-headline">{advertiser.headline}</p>
            )}

            <div className="advertiser-card-footer">
              <div className="advertiser-card-activity">
                <Clock size={12} />
                <span>{(advertiser as any).activity_label || 'Ativo recentemente'}</span>
              </div>
              <span className="advertiser-card-cta">
                Ver perfil <Eye size={13} />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Save to List Modal (Section 33) */}
      {isListModalOpen && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsListModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: '380px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Salvar em Lista</h4>
              <button type="button" onClick={() => setIsListModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Escolha uma coleção particular para salvar {advertiser.stage_name}:
            </p>

            {loadingLists ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carregando suas listas...</p>
            ) : userLists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Você ainda não criou nenhuma lista.</p>
                <Link href="/account/lists">
                  <Button variant="primary" size="sm">Criar Minha Primeira Lista</Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', marginBottom: '1rem' }}>
                {userLists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleAddToList(l.id, l.name)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>{l.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.items_count || 0} itens</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        advertiserId={advertiser.advertiser_id}
        stageName={advertiser.stage_name}
      />
    </>
  );
}
