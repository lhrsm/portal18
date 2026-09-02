'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicAdvertiser } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { favoritesService } from '@/services/favoritesService';
import { followingService } from '@/services/account/followingService';
import { privacyService } from '@/services/account/privacyService';
import { userListsService } from '@/services/account/userListsService';
import { historyService } from '@/services/account/historyService';
import { discoveryRankingService } from '@/services/discovery/discoveryRankingService';
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

  const cardRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined') return;

    let timer: NodeJS.Timeout | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            timer = setTimeout(() => {
              discoveryRankingService.recordDiscoveryEvent({
                eventType: advertiser.is_sponsored ? 'sponsored_impression' : 'organic_impression',
                advertiserId: advertiser.advertiser_id,
                citySlug: advertiser.city_slug,
              });
            }, 1000);
          } else if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [advertiser.advertiser_id, advertiser.is_sponsored, advertiser.city_slug]);

  const handleCardClick = () => {
    // Non-blocking history record
    if (profile) {
      historyService.recordProfileView(advertiser.advertiser_id);
    }
    discoveryRankingService.recordDiscoveryEvent({
      eventType: advertiser.is_sponsored ? 'sponsored_click' : 'organic_click',
      advertiserId: advertiser.advertiser_id,
      citySlug: advertiser.city_slug,
    });
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
      showToast({
        type: 'warning',
        title: 'Acesso Necessário',
        message: 'Entre em sua conta para seguir anunciantes.',
      });
      router.push(`/login?redirect_to=${encodeURIComponent(profileUrl)}`);
      return;
    }

    const previousState = isFollowing;
    const newState = !previousState;
    setIsFollowing(newState);

    try {
      const res = await followingService.toggleFollow(advertiser.advertiser_id);
      if (!res.success) throw new Error(res.error);
      showToast({
        type: newState ? 'success' : 'info',
        title: newState ? 'Seguindo Anunciante' : 'Deixou de Seguir',
        message: newState ? `Você receberá atualizações de ${advertiser.stage_name}.` : `Você não segue mais ${advertiser.stage_name}.`,
      });
    } catch {
      setIsFollowing(previousState);
      showToast({ type: 'error', title: 'Erro ao seguir', message: 'Tente novamente.' });
    }
  };

  const handleOpenListModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!user || !profile) {
      showToast({ type: 'warning', title: 'Acesso Necessário', message: 'Entre em sua conta para criar e salvar em listas.' });
      router.push(`/login?redirect_to=${encodeURIComponent(profileUrl)}`);
      return;
    }

    setIsListModalOpen(true);
    setLoadingLists(true);
    try {
      const lists = await userListsService.getUserLists(profile.id);
      setUserLists(lists);
    } catch {
      showToast({ type: 'error', title: 'Erro ao carregar listas', message: 'Tente novamente.' });
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    try {
      const res = await userListsService.addToList(listId, advertiser.advertiser_id);
      if (!res.success) throw new Error(res.error);
      showToast({ type: 'success', title: 'Adicionado à Lista', message: `${advertiser.stage_name} adicionado com sucesso!` });
      setIsListModalOpen(false);
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível adicionar à lista.' });
    }
  };

  const handleBlockClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!user || !profile) {
      showToast({ type: 'warning', title: 'Acesso Necessário', message: 'Entre em sua conta para bloquear perfis.' });
      return;
    }

    try {
      const res = await privacyService.toggleBlock(advertiser.advertiser_id);
      if (!res.success) throw new Error(res.error);
      showToast({
        type: 'warning',
        title: 'Perfil Bloqueado',
        message: `${advertiser.stage_name} não aparecerá mais para você.`,
      });
    } catch {
      showToast({ type: 'error', title: 'Erro ao bloquear', message: 'Tente novamente.' });
    }
  };

  const handleNotInterestedClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (!profile) return;
    await privacyService.hideRecommendation(profile.id, advertiser.advertiser_id, 'user_feedback');
    showToast({ type: 'info', title: 'Feedback Registrado', message: 'Mostraremos menos perfis como este.' });
  };

  return (
    <>
      <div ref={cardRef} className="advertiser-card-container" onClick={handleCardClick}>
        <Link href={profileUrl} prefetch={true} className="advertiser-card-link">
          <div className="advertiser-card-media-wrapper">
            {(() => {
              const rawPhotoUrl = advertiser.primary_photo_url || (advertiser as any).primary_media_url || (advertiser as any).thumbnail_url;
              const photoUrl = rawPhotoUrl?.includes('images.unsplash.com')
                ? rawPhotoUrl.replace(/w=\d+/, 'w=360').replace(/q=\d+/, 'q=75')
                : rawPhotoUrl;

              return photoUrl ? (
                <img
                  src={photoUrl}
                  alt={advertiser.stage_name ? `Foto de perfil de ${advertiser.stage_name}` : 'Foto de perfil do anunciante'}
                  className="advertiser-card-image"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
                />
              ) : (
                <div className="advertiser-card-placeholder">
                  <Sparkles size={32} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>Foto do perfil</span>
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
                  <ShieldCheck size={11} aria-hidden="true" /> Verificado
                </span>
              )}
              {advertiser.authenticity_verified && (
                <span className="badge-verified" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', border: '1px solid var(--border-accent)', fontWeight: 700 }}>
                  <ShieldCheck size={11} aria-hidden="true" /> Autêntico
                </span>
              )}
            </div>

            {/* Favorite Floating Button (Touch target >= 44px) */}
            <button
              type="button"
              className={`advertiser-card-fav-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? `Remover ${advertiser.stage_name} dos favoritos` : `Salvar ${advertiser.stage_name} nos favoritos`}
              style={{ minWidth: '44px', minHeight: '44px', width: '44px', height: '44px', padding: '8px' }}
            >
              <Heart size={20} fill={isFavorite ? 'var(--accent-ruby)' : 'none'} color={isFavorite ? 'var(--accent-ruby)' : '#fff'} />
            </button>

            {/* Context Menu Button (Touch target >= 44px) */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              style={{
                position: 'absolute',
                top: '0.45rem',
                left: '0.45rem',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                border: 'none',
                borderRadius: '50%',
                minWidth: '44px',
                minHeight: '44px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 5,
              }}
              aria-label={`Mais opções para ${advertiser.stage_name}`}
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={18} />
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                style={{
                  position: 'absolute',
                  top: '2.8rem',
                  left: '0.45rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  zIndex: 20,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  minWidth: '180px',
                }}
              >
                <button
                  type="button"
                  onClick={handleFollowClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', minHeight: '44px' }}
                >
                  <Users size={14} color="var(--accent-gold)" />
                  <span>{isFollowing ? 'Deixar de seguir' : 'Seguir anunciante'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenListModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', minHeight: '44px' }}
                >
                  <ListPlus size={14} color="var(--accent-gold)" />
                  <span>Salvar em lista...</span>
                </button>

                <button
                  type="button"
                  onClick={handleNotInterestedClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', minHeight: '44px' }}
                >
                  <EyeOff size={14} />
                  <span>Não tenho interesse</span>
                </button>

                <button
                  type="button"
                  onClick={handleBlockClick}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', minHeight: '44px' }}
                >
                  <UserX size={14} color="var(--accent-ruby)" />
                  <span>Bloquear perfil</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); setIsReportModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'none', border: 'none', color: 'var(--accent-ruby)', fontSize: '0.825rem', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: '4px', minHeight: '44px' }}
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
              <MapPin size={12} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <span>
                {advertiser.city_name ? `${advertiser.city_name}, ${advertiser.state_code}` : 'Brasil'}
                {(advertiser as any).distance_label ? ` · ${(advertiser as any).distance_label}` : (advertiser.neighborhood ? ` · ${advertiser.neighborhood}` : '')}
              </span>
            </div>

            {advertiser.headline && (
              <p className="advertiser-card-headline">{advertiser.headline}</p>
            )}

            <div className="advertiser-card-footer">
              <div className="advertiser-card-activity">
                <Clock size={11} style={{ flexShrink: 0 }} />
                <span>{(advertiser as any).activity_label || 'Ativo hoje'}</span>
              </div>
              <span className="advertiser-card-cta">
                Ver perfil <Eye size={12} />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* User Lists Modal */}
      {isListModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
          onClick={() => setIsListModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              maxWidth: '380px',
              width: '100%',
              boxShadow: 'var(--shadow-elevation-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ListPlus size={18} color="var(--accent-gold)" /> Salvar em Lista
              </h3>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingLists ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Carregando listas...</p>
            ) : userLists.length === 0 ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Você ainda não possui listas personalizadas.
                </p>
                <Link href="/account/lists">
                  <Button variant="ruby" size="sm" fullWidth>
                    Criar Minha Primeira Lista
                  </Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                {userLists.map((list) => (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleAddToList(list.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      minHeight: '44px',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{list.title}</span>
                    <Check size={14} color="var(--accent-gold)" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          advertiserId={advertiser.advertiser_id}
          stageName={advertiser.stage_name}
        />
      )}
    </>
  );
}
