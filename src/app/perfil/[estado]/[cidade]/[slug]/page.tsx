'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { publicProfilesService } from '@/services/publicProfilesService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { favoritesService } from '@/services/favoritesService';
import { followingService } from '@/services/account/followingService';
import { privacyService } from '@/services/account/privacyService';
import { userListsService } from '@/services/account/userListsService';
import { historyService } from '@/services/account/historyService';
import { relationshipService } from '@/services/account/relationshipService';
import { recommendationService } from '@/services/discovery/recommendationService';
import { PublicAdvertiser, AdvertiserMedia, AdvertiserContact, DiscoveryProfileCard } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { GalleryLightbox } from '@/components/public/GalleryLightbox';
import { ReportModal } from '@/components/public/ReportModal';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Heart, 
  Share2, 
  ShieldAlert, 
  Phone, 
  Send, 
  Globe, 
  MessageCircle, 
  Sparkles, 
  Camera, 
  Users, 
  ListPlus, 
  UserX, 
  Unlock, 
  ChevronRight,
  Maximize2,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  Tag
} from 'lucide-react';

const FALLBACK_DEMO_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
];

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const stateSlug = (params.estado as string) || '';
  const citySlug = (params.cidade as string) || '';
  const slug = (params.slug as string) || '';

  const [advertiser, setAdvertiser] = useState<PublicAdvertiser | null>(null);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);
  const [similarProfiles, setSimilarProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const adv = await publicProfilesService.getPublicProfileBySlug(stateSlug, citySlug, slug);
        if (!adv) {
          setAdvertiser(null);
          setIsLoading(false);
          return;
        }

        setAdvertiser(adv);

        // Fetch media, contacts, similar profiles, and user relationships in parallel
        const [approvedMedia, advContacts, similar, relMap] = await Promise.all([
          mediaService.getApprovedPublicMedia(adv.advertiser_id),
          contactsService.getContactsByAdvertiser(adv.advertiser_id),
          recommendationService.getSimilarProfiles(adv.advertiser_id, 4, citySlug, stateSlug),
          relationshipService.getUserRelationshipMap([adv.advertiser_id]),
        ]);

        // If no dynamic media in database, build gallery with primary photo + complementary angles
        if (approvedMedia && approvedMedia.length > 0) {
          setMediaList(approvedMedia);
        } else if (adv.primary_photo_url) {
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
        } else {
          setMediaList([]);
        }

        setContacts(advContacts.filter((c) => c.is_visible));
        setSimilarProfiles(similar);

        if (relMap[adv.advertiser_id]) {
          setIsFavorite(relMap[adv.advertiser_id].is_favorite);
          setIsFollowing(relMap[adv.advertiser_id].is_following);
          setIsBlocked(relMap[adv.advertiser_id].is_blocked);
        }

        // View recording
        publicProfilesService.incrementProfileView(adv.advertiser_id);
        if (profile) {
          historyService.recordProfileView(adv.advertiser_id);
        }
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (stateSlug && citySlug && slug) {
      loadProfile();
    }
  }, [stateSlug, citySlug, slug, profile]);

  const handleContactClick = (contact: AdvertiserContact) => {
    if (!advertiser) return;
    publicProfilesService.incrementContactClick(advertiser.advertiser_id, contact.contact_type);

    if (contact.contact_type === 'whatsapp') {
      const cleanPhone = contact.contact_value.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=Olá,%20vi%20seu%20anúncio%20no%20Portal18`, '_blank');
    } else if (contact.contact_type === 'telegram') {
      const cleanUser = contact.contact_value.replace('@', '');
      window.open(`https://t.me/${cleanUser}`, '_blank');
    } else if (contact.contact_type === 'phone') {
      window.location.href = `tel:${contact.contact_value}`;
    } else if (contact.contact_type === 'website') {
      const url = contact.contact_value.startsWith('http') ? contact.contact_value : `https://${contact.contact_value}`;
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    if (!advertiser) return;
    const shareData = {
      title: `${advertiser.stage_name} | Portal 18+`,
      text: `Conheça o perfil de ${advertiser.stage_name} em ${advertiser.city_name}, ${advertiser.state_code}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Fallback
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast({
        type: 'info',
        title: 'Link Copiado',
        message: 'O link do perfil foi copiado para sua área de transferência.',
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !profile) {
      showToast({
        type: 'warning',
        title: 'Login Necessário',
        message: 'Entre em sua conta para salvar este perfil nos favoritos.',
      });
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!advertiser) return;
    const newState = !isFavorite;
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
      setIsFavorite(!newState);
      showToast({ type: 'error', title: 'Erro ao favoritar', message: 'Tente novamente.' });
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profile) {
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!advertiser) return;
    const newState = !isFollowing;
    setIsFollowing(newState);

    const res = await followingService.toggleFollow(advertiser.advertiser_id);
    if (res.success) {
      showToast({
        type: 'success',
        title: newState ? 'Seguindo' : 'Deixou de Seguir',
        message: newState ? `Você receberá atualizações de ${advertiser.stage_name}.` : 'Notificações canceladas.',
      });
    } else {
      setIsFollowing(!newState);
    }
  };

  const handleToggleBlock = async () => {
    if (!user || !profile || !advertiser) return;
    const res = await privacyService.toggleBlock(advertiser.advertiser_id);
    if (res.success) {
      setIsBlocked(Boolean(res.is_blocked));
      showToast({
        type: 'info',
        title: res.is_blocked ? 'Perfil Bloqueado' : 'Perfil Desbloqueado',
        message: res.is_blocked ? 'Este perfil foi ocultado.' : 'Perfil desbloqueado com sucesso.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="1.5rem" width="260px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem' }}>
          <Skeleton height="540px" borderRadius="var(--radius-lg)" />
          <Skeleton height="400px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <Card variant="glass" padding="lg" style={{ maxWidth: '540px', margin: '0 auto', padding: '4rem 2rem' }}>
          <Sparkles size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1rem auto' }} />
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Perfil não encontrado ou indisponível</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            O anúncio que você procura não está publicado ou foi pausado pelo anunciante.
          </p>
          <Link href="/explorar">
            <Button variant="primary">Explorar Outros Perfis</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <Card variant="glass" padding="lg" style={{ maxWidth: '540px', margin: '0 auto', padding: '4rem 2rem' }}>
          <UserX size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1rem auto' }} />
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>Você bloqueou este perfil</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Este anunciante está em sua lista de bloqueios e não aparece em suas buscas e recomendações.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button variant="secondary" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button variant="primary" onClick={handleToggleBlock} leftIcon={<Unlock size={16} />}>
              Desbloquear e Visualizar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const primaryPhoto = mediaList[selectedPhotoIndex]?.storage_path || advertiser.primary_photo_url;
  const totalPhotosCount = mediaList.length > 0 ? mediaList.length : (primaryPhoto ? 1 : 0);

  return (
    <div className="container" style={{ padding: '1.75rem 1rem 5rem 1rem' }}>
      {/* 1. COMPACT BREADCRUMB */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início</Link>
        <ChevronRight size={12} />
        <Link href={`/acompanhantes/${advertiser.state_slug}`} style={{ color: 'var(--text-secondary)' }}>{advertiser.state_name || advertiser.state_code}</Link>
        <ChevronRight size={12} />
        <Link href={`/acompanhantes/${advertiser.state_slug}/${advertiser.city_slug}`} style={{ color: 'var(--text-secondary)' }}>{advertiser.city_name}</Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{advertiser.stage_name}</span>
      </nav>

      {/* 2. MAIN HERO SECTION (60% Gallery / 40% Summary) */}
      <div className="profile-hero-layout">
        {/* Left Column: Gallery */}
        <div className="profile-hero-gallery">
          <div
            className="profile-main-image-wrapper"
            onClick={() => mediaList.length > 0 && setIsLightboxOpen(true)}
          >
            {primaryPhoto ? (
              <img
                src={primaryPhoto}
                alt={`${advertiser.stage_name} em ${advertiser.city_name}`}
                className="profile-main-image"
                loading="eager"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.5rem' }}>
                <Camera size={44} color="var(--accent-gold)" />
                <span>Foto do perfil</span>
              </div>
            )}

            {/* Badges on Top */}
            <div style={{ position: 'absolute', top: '0.85rem', left: '0.85rem', display: 'flex', gap: '0.4rem', zIndex: 2 }}>
              {advertiser.verification_status === 'verified' && (
                <div className="badge-verified">
                  <ShieldCheck size={13} /> Verificada 18+
                </div>
              )}
              {(advertiser as any).is_sponsored && (
                <div className="badge-sponsored">
                  <Sparkles size={13} /> Destaque
                </div>
              )}
            </div>

            {/* Photo Counter */}
            {totalPhotosCount > 1 && (
              <div className="profile-gallery-counter">
                <Maximize2 size={13} />
                <span>{selectedPhotoIndex + 1} de {totalPhotosCount}</span>
              </div>
            )}
          </div>

          {/* Interactive Thumbnails Strip */}
          {mediaList.length > 1 && (
            <div className="profile-thumbnails-strip">
              {mediaList.map((m, idx) => (
                <button
                  type="button"
                  key={m.id}
                  className={`profile-thumbnail-btn ${idx === selectedPhotoIndex ? 'active' : ''}`}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  aria-label={`Ver foto ${idx + 1}`}
                >
                  <img src={m.thumbnail_path || m.storage_path} alt="Miniatura" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Identity & Direct Conversion Sticky Card */}
        <div className="profile-hero-summary">
          <div>
            {/* Name, Age and Quick Actions */}
            <div className="profile-identity-header">
              <div>
                <h1 className="profile-name-title">
                  {advertiser.stage_name}{advertiser.age ? `, ${advertiser.age}` : ''}
                </h1>
                {advertiser.headline && (
                  <p style={{ fontSize: '1rem', color: 'var(--accent-gold)', fontStyle: 'italic', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    "{advertiser.headline}"
                  </p>
                )}
              </div>

              {/* Quick Actions (Favorite & Share) */}
              <div className="profile-quick-actions">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`profile-quick-action-btn ${isFavorite ? 'active-favorite' : ''}`}
                  aria-label="Favoritar anunciante"
                >
                  <Heart size={18} fill={isFavorite ? 'var(--accent-ruby)' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="profile-quick-action-btn"
                  aria-label="Compartilhar perfil"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Location & Status Meta Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={16} color="var(--accent-gold)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {advertiser.city_name}, {advertiser.state_code}
                  {advertiser.neighborhood ? ` • ${advertiser.neighborhood}` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 500 }}>
                <Clock size={14} />
                <span>Ativa recentemente</span>
              </div>
            </div>

            {/* Follow Button */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Button
                variant={isFollowing ? 'secondary' : 'ghost'}
                size="sm"
                onClick={handleToggleFollow}
                leftIcon={<Users size={14} />}
              >
                {isFollowing ? 'Seguindo' : 'Seguir anunciante'}
              </Button>
            </div>
          </div>

          {/* PRIMARY CONVERSION CARD (WhatsApp & Telegram) */}
          <div className="profile-contact-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Falar com {advertiser.stage_name}
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Contato direto e discreto. Converse diretamente via aplicativo:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {contacts.length === 0 ? (
                <>
                  <Button
                    variant="ruby"
                    fullWidth
                    size="lg"
                    onClick={() => {
                      publicProfilesService.incrementContactClick(advertiser.advertiser_id, 'whatsapp');
                      window.open('https://wa.me/5571999990000?text=Olá,%20vi%20seu%20anúncio%20no%20Portal18', '_blank');
                    }}
                    leftIcon={<MessageCircle size={18} />}
                    style={{ fontWeight: 700, boxShadow: 'var(--shadow-glow-ruby)' }}
                  >
                    Conversar no WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    size="md"
                    onClick={() => {
                      publicProfilesService.incrementContactClick(advertiser.advertiser_id, 'telegram');
                      window.open('https://t.me/portal18_demo', '_blank');
                    }}
                    leftIcon={<Send size={16} />}
                  >
                    Chamar no Telegram
                  </Button>
                </>
              ) : (
                contacts.map((c) => (
                  <Button
                    key={c.id}
                    variant={c.contact_type === 'whatsapp' ? 'ruby' : 'secondary'}
                    fullWidth
                    size={c.contact_type === 'whatsapp' ? 'lg' : 'md'}
                    onClick={() => handleContactClick(c)}
                    leftIcon={
                      c.contact_type === 'whatsapp' ? <MessageCircle size={18} /> :
                      c.contact_type === 'telegram' ? <Send size={16} /> :
                      c.contact_type === 'phone' ? <Phone size={16} /> : <Globe size={16} />
                    }
                    style={c.contact_type === 'whatsapp' ? { fontWeight: 700, boxShadow: 'var(--shadow-glow-ruby)' } : undefined}
                  >
                    {c.contact_type === 'whatsapp' ? 'Conversar no WhatsApp' :
                     c.contact_type === 'telegram' ? 'Chamar no Telegram' :
                     c.contact_type === 'phone' ? `Ligar: ${c.contact_value}` : c.contact_value}
                  </Button>
                ))
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
              <Lock size={13} style={{ flexShrink: 0 }} />
              <span>Contato direto com o anunciante. A plataforma não intermedeia pagamentos ou encontros.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DETAILS & ABOUT SECTIONS */}
      <div className="profile-details-layout">
        {/* Left Column: Bio, Services & Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Section: Sobre mim */}
          <Card variant="glass" padding="lg">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} color="var(--accent-gold)" /> Sobre mim
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {advertiser.bio || 'Profissional independente dedicada a proporcionar momentos únicos, agradáveis e com total discrição na região de atendimento.'}
            </div>
          </Card>

          {/* Section: Atendimento & Locais */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={16} color="var(--accent-gold)" /> Atendimento & Estilo
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Badge variant="gold">Atendimento com Hora Marcada</Badge>
              <Badge variant="neutral">Hotéis e Flats</Badge>
              <Badge variant="neutral">Atendimento Privativo</Badge>
              {(advertiser as any).category_names && (advertiser as any).category_names.map((catName: string, idx: number) => (
                <Badge key={idx} variant="ruby">{catName}</Badge>
              ))}
            </div>
          </Card>

          {/* Section: Segurança & Confiança */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--color-success)" /> Segurança e Confiança
            </h3>
            <div className="profile-trust-mini-grid">
              <div className="profile-trust-mini-item">
                <ShieldCheck size={20} color="var(--accent-gold)" />
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>18+ Verificada</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Maioridade confirmada</span>
              </div>
              <div className="profile-trust-mini-item">
                <CheckCircle2 size={20} color="var(--color-success)" />
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Fotos Moderadas</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Conteúdo revisado</span>
              </div>
              <div className="profile-trust-mini-item">
                <Lock size={20} color="var(--color-info)" />
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Privacidade</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Navegação segura</span>
              </div>
              <div className="profile-trust-mini-item">
                <ShieldAlert size={20} color="var(--accent-ruby)" />
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Denúncias 24/7</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Canal de suporte</span>
              </div>
            </div>
          </Card>

          {/* Discreet Actions (Block & Report) */}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={handleToggleBlock}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <UserX size={14} /> Bloquear perfil
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-ruby)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ShieldAlert size={14} /> Denunciar este anúncio
            </button>
          </div>
        </div>

        {/* Right Column: Quick Profile Facts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
              Informações do Perfil
            </h3>
            <div className="profile-facts-grid">
              {advertiser.age && (
                <div className="profile-fact-item">
                  <span className="profile-fact-label">Idade</span>
                  <span className="profile-fact-value">{advertiser.age} anos (18+)</span>
                </div>
              )}
              {advertiser.city_name && (
                <div className="profile-fact-item">
                  <span className="profile-fact-label">Cidade</span>
                  <span className="profile-fact-value">{advertiser.city_name}, {advertiser.state_code}</span>
                </div>
              )}
              {advertiser.neighborhood && (
                <div className="profile-fact-item">
                  <span className="profile-fact-label">Bairro</span>
                  <span className="profile-fact-value">{advertiser.neighborhood}</span>
                </div>
              )}
              <div className="profile-fact-item">
                <span className="profile-fact-label">Status</span>
                <span className="profile-fact-value" style={{ color: 'var(--color-success)' }}>Verificado</span>
              </div>
            </div>
          </Card>

          {/* Localização & Região */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--accent-gold)" /> Local de Atendimento
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Atendimento em <strong>{advertiser.neighborhood ? `${advertiser.neighborhood}, ` : ''}{advertiser.city_name} - {advertiser.state_code}</strong> e regiões adjacentes com deslocamento a combinar.
            </p>
            <Link href={`/acompanhantes/${advertiser.state_slug}/${advertiser.city_slug}`}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                Ver mais em {advertiser.city_name}
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* 4. SIMILAR PROFILES SECTION */}
      {similarProfiles.length > 0 && (
        <section style={{ marginTop: '4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Recomendações
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                Perfis semelhantes em {advertiser.city_name}
              </h2>
            </div>
            <Link href={`/acompanhantes/${advertiser.state_slug}/${advertiser.city_slug}`}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                Ver todos
              </Button>
            </Link>
          </div>

          <div className="advertiser-grid">
            {similarProfiles.map((adv) => (
              <AdvertiserCard
                key={adv.advertiser_id}
                advertiser={{
                  advertiser_id: adv.advertiser_id,
                  slug: adv.slug,
                  stage_name: adv.stage_name,
                  age: adv.age,
                  city_name: adv.city_name,
                  city_slug: adv.city_slug,
                  state_code: adv.state_code,
                  state_slug: advertiser.state_slug,
                  headline: adv.headline,
                  primary_media_url: adv.thumbnail_url,
                  verification_status: adv.verification_status as any,
                  profile_status: 'active',
                  visibility: 'public',
                  category_names: [],
                  distance_label: adv.distance_label,
                  activity_label: adv.activity_label,
                  is_sponsored: adv.is_sponsored,
                } as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {mediaList.length > 0 && (
        <GalleryLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaList={mediaList}
          currentIndex={selectedPhotoIndex}
          onNavigate={(idx) => setSelectedPhotoIndex(idx)}
        />
      )}

      {/* Report Modal */}
      {advertiser && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          advertiserId={advertiser.advertiser_id}
          stageName={advertiser.stage_name}
        />
      )}
    </div>
  );
}
