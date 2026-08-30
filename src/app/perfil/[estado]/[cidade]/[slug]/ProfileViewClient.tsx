'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { publicProfilesService } from '@/services/publicProfilesService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { favoritesService } from '@/services/favoritesService';
import { followingService } from '@/services/account/followingService';
import { privacyService } from '@/services/account/privacyService';
import { historyService } from '@/services/account/historyService';
import { relationshipService } from '@/services/account/relationshipService';
import { recommendationService } from '@/services/discovery/recommendationService';
import { PublicAdvertiser, AdvertiserMedia, AdvertiserContact, DiscoveryProfileCard, isValidPublicAdvertiser } from '@/types/app.types';
import { DEMO_PUBLIC_ADVERTISERS } from '@/data/demoProfiles';
import { useAuth } from '@/hooks/useAuth';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  ShieldCheck, 
  MapPin, 
  Heart, 
  Share2, 
  ShieldAlert, 
  Phone, 
  Send, 
  MessageCircle, 
  Sparkles, 
  ChevronRight,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { AgeGateModal } from '@/components/ageVerification/AgeGateModal';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';
import { ProfileAudioPlayer } from '@/components/public/ProfileAudioPlayer';

// Dynamic imports for heavy non-critical modals
const GalleryLightbox = dynamic(
  () => import('@/components/public/GalleryLightbox').then((mod) => mod.GalleryLightbox),
  { ssr: false }
);

const ReportModal = dynamic(
  () => import('@/components/public/ReportModal').then((mod) => mod.ReportModal),
  { ssr: false }
);

const FALLBACK_DEMO_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
];

export interface ProfileViewClientProps {
  initialProfile?: PublicAdvertiser | null;
  stateSlug: string;
  citySlug: string;
  slug: string;
}

export function ProfileViewClient({
  initialProfile,
  stateSlug,
  citySlug,
  slug,
}: ProfileViewClientProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  // Fallback demo resolution if not passed
  const initialAdv = useMemo(() => {
    if (initialProfile && isValidPublicAdvertiser(initialProfile)) {
      return initialProfile;
    }
    return DEMO_PUBLIC_ADVERTISERS.find(
      (p) =>
        (p.slug === slug || p.slug.includes(slug)) &&
        p.state_slug?.toLowerCase() === stateSlug.toLowerCase() &&
        p.city_slug?.toLowerCase() === citySlug.toLowerCase()
    ) || null;
  }, [initialProfile, slug, stateSlug, citySlug]);

  const [advertiser, setAdvertiser] = useState<PublicAdvertiser | null>(initialAdv);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>(() => {
    if (initialAdv?.primary_photo_url) {
      return [
        {
          id: 'med-primary',
          advertiser_id: initialAdv.advertiser_id,
          storage_path: initialAdv.primary_photo_url,
          thumbnail_path: initialAdv.primary_photo_url,
          media_type: 'photo' as const,
          is_primary: true,
          display_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        ...FALLBACK_DEMO_GALLERY_IMAGES.filter((url) => url !== initialAdv.primary_photo_url).slice(0, 3).map((url, i) => ({
          id: `med-synth-${i}`,
          advertiser_id: initialAdv.advertiser_id,
          storage_path: url,
          thumbnail_path: url,
          media_type: 'photo' as const,
          is_primary: false,
          display_order: i + 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)),
      ];
    }
    return [];
  });

  const [contacts, setContacts] = useState<AdvertiserContact[]>(() => {
    if (initialAdv) {
      return [
        {
          id: `contact-1`,
          advertiser_id: initialAdv.advertiser_id,
          contact_type: 'whatsapp',
          contact_value: '+5571999887766',
          is_primary: true,
          is_visible: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
      ];
    }
    return [];
  });

  const [similarProfiles, setSimilarProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialAdv);
  const [isAgeVerified, setIsAgeVerified] = useState(true);

  useEffect(() => {
    setIsAgeVerified(ageVerificationService.isAgeVerified());
  }, []);

  // 1. Critical Profile Loader (Fast Path)
  useEffect(() => {
    let isMounted = true;

    async function loadCriticalData() {
      try {
        const adv = await publicProfilesService.getPublicProfileBySlug(stateSlug, citySlug, slug);
        if (!isMounted) return;

        if (!adv) {
          setAdvertiser(null);
          setIsLoading(false);
          return;
        }

        setAdvertiser(adv);
        setIsLoading(false);

        // Fetch media and contacts using server-authoritative resolver
        const [approvedMedia, advContacts] = await Promise.all([
          mediaService.getApprovedPublicMedia(adv.advertiser_id),
          contactsService.getPublicContacts(adv.advertiser_id),
        ]);

        if (!isMounted) return;

        if (approvedMedia && approvedMedia.length > 0) {
          setMediaList(approvedMedia);
        } else if (adv.primary_photo_url && mediaList.length === 0) {
          const synthMedia: AdvertiserMedia[] = [
            {
              id: 'med-primary',
              advertiser_id: adv.advertiser_id,
              storage_path: adv.primary_photo_url,
              thumbnail_path: adv.primary_photo_url,
              media_type: 'photo' as const,
              is_primary: true,
              display_order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any,
            ...FALLBACK_DEMO_GALLERY_IMAGES.filter((url) => url !== adv.primary_photo_url).slice(0, 3).map((url, i) => ({
              id: `med-synth-${i}`,
              advertiser_id: adv.advertiser_id,
              storage_path: url,
              thumbnail_path: url,
              media_type: 'photo' as const,
              is_primary: false,
              display_order: i + 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any)),
          ];
          setMediaList(synthMedia);
        }

        if (advContacts && advContacts.length > 0) {
          setContacts(advContacts.filter((c) => c.is_visible));
        }
      } catch (err) {
        console.error('Error loading critical profile:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadCriticalData();

    return () => {
      isMounted = false;
    };
  }, [stateSlug, citySlug, slug]);

  // 2. Non-Critical Background Enhancements (Deferred & Non-Blocking)
  useEffect(() => {
    if (!advertiser) return;
    let isMounted = true;

    async function loadDeferredData() {
      try {
        const advId = advertiser!.advertiser_id;
        const [similar, relMap] = await Promise.all([
          recommendationService.getSimilarProfiles(advId, 4, citySlug, stateSlug).catch(() => []),
          relationshipService.getUserRelationshipMap([advId]).catch(() => ({} as any)),
        ]);

        if (!isMounted) return;

        setSimilarProfiles(similar);

        const rel = (relMap as Record<string, any>)[advId];
        if (rel) {
          setIsFavorite(!!rel.is_favorite);
          setIsFollowing(!!rel.is_following);
          setIsBlocked(!!rel.is_blocked);
        }

        // Fire-and-forget view recording
        publicProfilesService.incrementProfileView(advId).catch(() => {});
        if (profile) {
          historyService.recordProfileView(advId).catch(() => {});
        }
      } catch {
        // Non-fatal
      }
    }

    loadDeferredData();

    return () => {
      isMounted = false;
    };
  }, [advertiser, citySlug, stateSlug, profile]);

  const handleToggleFavorite = async () => {
    if (!profile) {
      showToast({ type: 'info', title: 'Login Necessário', message: 'Faça login para favoritar perfis' });
      router.push('/login');
      return;
    }
    if (!advertiser) return;

    try {
      const res = await favoritesService.toggleFavorite(advertiser.advertiser_id);
      if (res.success) {
        setIsFavorite(!!res.is_favorite);
        showToast({
          type: 'success',
          title: res.is_favorite ? 'Favoritado' : 'Removido dos Favoritos',
          message: res.is_favorite ? `${advertiser.stage_name} adicionado aos favoritos` : `${advertiser.stage_name} removido dos favoritos`,
        });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Erro ao atualizar favoritos' });
    }
  };

  const handleToggleFollow = async () => {
    if (!profile) {
      showToast({ type: 'info', title: 'Login Necessário', message: 'Faça login para seguir anunciantes' });
      router.push('/login');
      return;
    }
    if (!advertiser) return;

    try {
      const res = await followingService.toggleFollow(advertiser.advertiser_id);
      if (res.success) {
        setIsFollowing(!!res.is_following);
        showToast({
          type: 'success',
          title: res.is_following ? 'Seguindo' : 'Deixou de Seguir',
          message: res.is_following ? 'Você receberá atualizações deste perfil' : 'Você deixou de seguir este perfil',
        });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Erro ao seguir perfil' });
    }
  };

  const handleToggleBlock = async () => {
    if (!profile) {
      showToast({ type: 'info', title: 'Login Necessário', message: 'Faça login para gerenciar bloqueios' });
      router.push('/login');
      return;
    }
    if (!advertiser) return;

    try {
      const res = await privacyService.toggleBlock(advertiser.advertiser_id);
      if (res.success) {
        setIsBlocked(!!res.is_blocked);
        showToast({
          type: res.is_blocked ? 'warning' : 'info',
          title: res.is_blocked ? 'Perfil Bloqueado' : 'Perfil Desbloqueado',
          message: res.is_blocked ? 'Este perfil não aparecerá mais para você.' : 'Perfil desbloqueado com sucesso.',
        });
      }
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Erro ao atualizar bloqueio' });
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${advertiser?.stage_name} | Portal18`,
        text: `Confira o perfil de ${advertiser?.stage_name} no Portal18`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast({ type: 'success', title: 'Link Copiado', message: 'Link do perfil copiado para a área de transferência!' });
    }
  };

  const handleContactClick = (type: string) => {
    if (advertiser) {
      publicProfilesService.incrementContactClick(advertiser.advertiser_id, type).catch(() => {});
    }
  };

  if (isLoading && !advertiser) {
    return (
      <div className="container" style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '1400px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <Skeleton width="100%" height="460px" borderRadius="var(--radius-lg)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton width="60%" height="32px" />
            <Skeleton width="40%" height="20px" />
            <Skeleton width="100%" height="80px" />
            <Skeleton width="100%" height="52px" />
          </div>
        </div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', maxWidth: '600px' }}>
        <ShieldAlert size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>Perfil não encontrado</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
          Este anúncio pode ter sido pausado pelo anunciante, expirado ou removido temporariamente para auditoria.
        </p>
        <Link href="/explorar">
          <Button variant="primary" size="md">Explorar Outros Perfis</Button>
        </Link>
      </div>
    );
  }

  const primaryPhoto = mediaList[selectedPhotoIndex]?.storage_path || advertiser.primary_photo_url || FALLBACK_DEMO_GALLERY_IMAGES[0];
  const primaryWhatsApp = contacts.find((c) => c.contact_type === 'whatsapp');
  const primaryPhone = contacts.find((c) => c.contact_type === 'phone');
  const primaryTelegram = contacts.find((c) => c.contact_type === 'telegram');

  return (
    <div className="container" style={{ padding: '1.25rem 1rem 4rem 1rem', maxWidth: '1400px' }}>
      {/* 1. DISCREET BREADCRUMB */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
        <ChevronRight size={10} />
        <Link href={`/acompanhantes/${advertiser.state_slug}`} style={{ color: 'var(--text-muted)' }}>{advertiser.state_name}</Link>
        <ChevronRight size={10} />
        <Link href={`/acompanhantes/${advertiser.state_slug}/${advertiser.city_slug}`} style={{ color: 'var(--text-muted)' }}>{advertiser.city_name}</Link>
        <ChevronRight size={10} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{advertiser.stage_name}</span>
      </nav>

      {/* 2. REFINED 60/40 EDITORIAL HERO SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '3rem', alignItems: 'start' }}>
        {/* Left Column: 3:4 Aspect-Ratio Gallery & Interactive Thumbnails */}
        <div>
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              aspectRatio: '3 / 4', 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden', 
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
              cursor: 'pointer',
              marginBottom: '0.85rem'
            }}
            onClick={() => setIsLightboxOpen(true)}
          >
            <Image
              src={primaryPhoto}
              alt={advertiser.stage_name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />

            {/* Badges Top */}
            <div style={{ position: 'absolute', top: '0.85rem', left: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', zIndex: 3 }}>
              {advertiser.verification_status === 'verified' && (
                <span className="badge-verified">
                  <ShieldCheck size={12} /> Verificado 18+
                </span>
              )}
              {advertiser.authenticity_verified && (
                <span className="badge-verified" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.95) 0%, rgba(245, 215, 120, 1) 100%)', color: '#000', fontWeight: 800 }}>
                  <Sparkles size={11} fill="#000" /> Perfil Autenticado
                </span>
              )}
              <span className="badge-sponsored">
                <Sparkles size={11} /> Destaque VIP
              </span>
            </div>

            {/* Zoom / Lightbox Trigger Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              style={{
                position: 'absolute',
                bottom: '0.85rem',
                right: '0.85rem',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(10, 12, 16, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 3
              }}
              title="Expandir fotos"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Interactive Photo Thumbnails Bar */}
          {mediaList.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {mediaList.map((m, idx) => (
                <button
                  key={m.id || idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  style={{
                    position: 'relative',
                    width: '68px',
                    height: '68px',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: selectedPhotoIndex === idx ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    padding: 0,
                    background: 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    opacity: selectedPhotoIndex === idx ? 1 : 0.65,
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <Image
                    src={m.thumbnail_path || m.storage_path}
                    alt={`${advertiser.stage_name} miniatura ${idx + 1}`}
                    fill
                    sizes="68px"
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Identity, Contacts & Converted Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Identity Block */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.35rem' }}>
              <div>
                <h1 style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  {advertiser.stage_name}
                  {advertiser.age && (
                    <span style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {advertiser.age} anos
                    </span>
                  )}
                </h1>
              </div>

              {/* Action Buttons: Favorite & Share */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`advertiser-card-fav-btn ${isFavorite ? 'active' : ''}`}
                  style={{ position: 'static', width: '38px', height: '38px' }}
                  title="Salvar como favorito"
                >
                  <Heart size={18} fill={isFavorite ? 'var(--accent-ruby)' : 'none'} color={isFavorite ? 'var(--accent-ruby)' : 'var(--text-secondary)'} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="advertiser-card-fav-btn"
                  style={{ position: 'static', width: '38px', height: '38px' }}
                  title="Compartilhar perfil"
                >
                  <Share2 size={17} color="var(--text-secondary)" />
                </button>
              </div>
            </div>

            {/* Location & Status Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={15} color="var(--accent-gold)" />
                <span>{advertiser.neighborhood ? `${advertiser.neighborhood}, ` : ''}{advertiser.city_name} - {advertiser.state_code}</span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-success)', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
                <span>Disponível hoje</span>
              </div>
            </div>

            {/* Headline Banner */}
            {advertiser.headline && (
              <div style={{ 
                padding: '0.85rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(255, 255, 255, 0.03)', 
                borderLeft: '3px solid var(--accent-gold)',
                color: 'var(--text-primary)',
                fontSize: '0.925rem',
                lineHeight: 1.45,
                fontWeight: 500
              }}>
                &ldquo;{advertiser.headline}&rdquo;
              </div>
            )}
          </div>

          {/* Profile Voice Presentation Player */}
          {advertiser.audio_presentation_url && (
            <ProfileAudioPlayer
              src={advertiser.audio_presentation_url}
              stageName={advertiser.stage_name}
            />
          )}

          {/* Primary WhatsApp Conversion Card */}
          <Card variant="elevated" padding="md" style={{ 
            background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 22, 31, 0.9) 100%)', 
            border: '1px solid rgba(37, 211, 102, 0.35)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#25d366' }}>
                  Contato Direto & Sigiloso
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sem intermediários
                </div>
              </div>

              {primaryWhatsApp ? (
                <a
                  href={`https://wa.me/${primaryWhatsApp.contact_value.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${advertiser.stage_name}, vi seu perfil verificado no Portal18 e gostaria de informações sobre seus horários.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('whatsapp')}
                  style={{ textDecoration: 'none' }}
                >
                  <Button 
                    variant="primary" 
                    size="lg" 
                    leftIcon={<MessageCircle size={20} />} 
                    style={{ 
                      width: '100%', 
                      background: '#25d366', 
                      color: '#000', 
                      fontWeight: 800, 
                      fontSize: '1rem',
                      minHeight: '48px',
                      boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)'
                    }}
                  >
                    Conversar no WhatsApp
                  </Button>
                </a>
              ) : (
                <Button variant="secondary" size="lg" disabled style={{ width: '100%', minHeight: '48px' }}>
                  WhatsApp Temporariamente Indisponível
                </Button>
              )}

              {/* Secondary Contacts Row: Telegram & Direct Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: primaryTelegram && primaryPhone ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
                {primaryTelegram && (
                  <a
                    href={`https://t.me/${primaryTelegram.contact_value.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('telegram')}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="secondary" size="md" leftIcon={<Send size={15} color="#229ED9" />} style={{ width: '100%', fontSize: '0.825rem', minHeight: '44px' }}>
                      Telegram
                    </Button>
                  </a>
                )}
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone.contact_value.replace(/\D/g, '')}`}
                    onClick={() => handleContactClick('phone')}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="secondary" size="md" leftIcon={<Phone size={15} />} style={{ width: '100%', fontSize: '0.825rem', minHeight: '44px' }}>
                      Ligar Agora
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </Card>

          {/* Social Follow & Relationship Trigger */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={isFollowing ? 'secondary' : 'outline'}
              size="sm"
              onClick={handleToggleFollow}
              style={{ flex: 1, minHeight: '40px' }}
            >
              {isFollowing ? 'Seguindo Anunciante' : '+ Seguir Atualizações'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleBlock}
              style={{ color: isBlocked ? 'var(--accent-ruby)' : 'var(--text-muted)', minHeight: '40px' }}
            >
              {isBlocked ? 'Bloqueado' : 'Bloquear'}
            </Button>
          </div>

          {/* Bio & Full Presentation */}
          {advertiser.bio && (
            <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                Sobre o Anunciante
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
                {advertiser.bio}
              </p>
            </Card>
          )}

          {/* Quick Specifications Table */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Detalhes Rápidos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.825rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Identidade:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {advertiser.gender
                    ? (advertiser.gender === 'mulheres' ? 'Mulher' : advertiser.gender === 'homens' ? 'Homem' : advertiser.gender === 'travestis_trans' ? 'Travesti / Trans' : 'Não-binário / Outro')
                    : 'Mulher'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Quem Atende:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {advertiser.target_audience && advertiser.target_audience.length > 0
                    ? advertiser.target_audience
                        .map((a) => {
                          if (a === 'homens') return 'Homens';
                          if (a === 'mulheres') return 'Mulheres';
                          if (a === 'casais') return 'Casais';
                          if (a === 'lgbtqia') return 'Público LGBTQIA+';
                          if (a === 'todos') return 'Todos os Públicos';
                          return a;
                        })
                        .join(', ')
                    : 'Todos os públicos'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Locais de Atendimento:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {advertiser.service_modalities && advertiser.service_modalities.length > 0
                    ? advertiser.service_modalities
                        .map((m) => {
                          if (m === 'local_proprio') return 'Local Próprio';
                          if (m === 'hotel_motel') return 'Hotéis / Motéis';
                          if (m === 'domicilio') return 'A Domicílio';
                          if (m === 'viagem') return 'Viagens';
                          return m;
                        })
                        .join(', ')
                    : 'Local próprio e Hotéis'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Fotos:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <CheckCircle2 size={13} /> 100% Moderadas
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <div style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>Anúncio Verificado</div>
              </div>
            </div>
          </Card>

          {/* Trust & Safety Report Trigger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.775rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', padding: 0 }}
            >
              <ShieldAlert size={14} /> Denunciar perfil irregular
            </button>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              ID: {advertiser.advertiser_id}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIMILAR PROFILES IN SAME REGION */}
      {similarProfiles.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Perfis Semelhantes em {advertiser.city_name}</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Outros anúncios verificados com estilo similar na mesma região
              </p>
            </div>
            <Link href={`/acompanhantes/${advertiser.state_slug}/${advertiser.city_slug}`} style={{ color: 'var(--accent-gold)', fontSize: '0.825rem', fontWeight: 600 }}>
              Ver todos em {advertiser.city_name} →
            </Link>
          </div>

          <div className="advertiser-grid">
            {similarProfiles.map((sim) => (
              <AdvertiserCard key={sim.advertiser_id} advertiser={sim as any} />
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Lightbox */}
      {isLightboxOpen && (
        <GalleryLightbox
          mediaList={mediaList}
          currentIndex={selectedPhotoIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          onNavigate={(idx) => setSelectedPhotoIndex(idx)}
        />
      )}

      {/* Dynamic Report Modal */}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          advertiserId={advertiser.advertiser_id}
          stageName={advertiser.stage_name}
        />
      )}

      {/* Age Assurance Gate Modal */}
      {!isAgeVerified && (
        <AgeGateModal
          isOpen={true}
          returnUrl={`/perfil/${stateSlug}/${citySlug}/${slug}`}
          onVerified={() => setIsAgeVerified(true)}
        />
      )}

      {/* Sticky Mobile Contact Bar (Verified visitors only) */}
      {isAgeVerified && primaryWhatsApp && (
        <div className="mobile-sticky-contact-bar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {advertiser.stage_name}
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }} />
                Disponível no WhatsApp
              </span>
            </div>
            <a
              href={`https://wa.me/${primaryWhatsApp.contact_value.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${advertiser.stage_name}, vi seu perfil no Portal18 e gostaria de informações.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleContactClick('whatsapp')}
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="primary"
                size="md"
                leftIcon={<MessageCircle size={18} />}
                style={{
                  background: '#25d366',
                  color: '#000',
                  fontWeight: 800,
                  minHeight: '44px',
                  padding: '0 1.25rem',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                }}
              >
                Conversar
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
