'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { publicProfilesService } from '@/services/publicProfilesService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { favoritesService } from '@/services/favoritesService';
import { PublicAdvertiser, AdvertiserMedia, AdvertiserContact } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { GalleryLightbox } from '@/components/public/GalleryLightbox';
import { ReportModal } from '@/components/public/ReportModal';
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
  ChevronRight,
  User
} from 'lucide-react';

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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
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

        // Fetch approved public media and visible contacts in parallel
        const [approvedMedia, advContacts] = await Promise.all([
          mediaService.getApprovedPublicMedia(adv.advertiser_id),
          contactsService.getContactsByAdvertiser(adv.advertiser_id),
        ]);

        setMediaList(approvedMedia);
        // Only visible contacts for public consumption (Section 49 & 50)
        setContacts(advContacts.filter((c) => c.is_visible));

        // Non-blocking profile view increment (Section 56 & 57)
        publicProfilesService.incrementProfileView(adv.advertiser_id);
      } catch (err) {
        console.error('Error loading public profile:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (stateSlug && citySlug && slug) {
      loadProfile();
    }
  }, [stateSlug, citySlug, slug]);

  const handleContactClick = (contact: AdvertiserContact) => {
    if (!advertiser) return;
    // Non-blocking contact click tracking
    publicProfilesService.incrementContactClick(advertiser.advertiser_id, contact.contact_type);

    if (contact.contact_type === 'whatsapp') {
      const cleanPhone = contact.contact_value.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
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
        // Fallback to clipboard
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
        message: 'Entre em sua conta para salvar este perfil.',
      });
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!advertiser) return;
    const newState = !isFavorite;
    setIsFavorite(newState);

    try {
      if (newState) {
        await favoritesService.addFavorite(profile.id, advertiser.advertiser_id);
        showToast({ type: 'success', title: 'Adicionado aos Favoritos', message: `${advertiser.stage_name} foi salvo.` });
      } else {
        await favoritesService.removeFavorite(profile.id, advertiser.advertiser_id);
        showToast({ type: 'info', title: 'Removido dos Favoritos', message: 'Anúncio removido da sua lista.' });
      }
    } catch {
      setIsFavorite(!newState);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="2.5rem" width="320px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <Skeleton height="440px" />
          <Skeleton height="440px" />
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

  const primaryPhoto = mediaList[selectedPhotoIndex]?.storage_path || advertiser.primary_photo_url;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início</Link>
        <span>/</span>
        <Link href={`/acompanhantes/${advertiser.state_slug}`} style={{ color: 'var(--text-secondary)' }}>{advertiser.state_name}</Link>
        <span>/</span>
        <Link href={`/acompanhantes/${advertiser.state_slug}/${advertiser.city_slug}`} style={{ color: 'var(--text-secondary)' }}>{advertiser.city_name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--accent-gold)' }}>{advertiser.stage_name}</span>
      </div>

      {/* Main Profile Layout Grid */}
      <div className="profile-layout-grid">
        {/* Left Column: Gallery */}
        <div className="profile-gallery-column">
          {/* Main Large Photo */}
          <div
            className="profile-main-photo-container"
            onClick={() => mediaList.length > 0 && setIsLightboxOpen(true)}
            style={{ cursor: mediaList.length > 0 ? 'pointer' : 'default' }}
          >
            {primaryPhoto ? (
              <img
                src={primaryPhoto}
                alt={advertiser.stage_name}
                className="profile-main-photo"
              />
            ) : (
              <div className="profile-photo-placeholder">
                <Camera size={48} color="var(--accent-gold)" />
                <span>Foto em moderação</span>
              </div>
            )}

            {advertiser.verification_status === 'verified' && (
              <div className="badge-verified profile-verified-badge">
                <ShieldCheck size={14} /> Verificado 18+
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {mediaList.length > 1 && (
            <div className="profile-thumbnails-row">
              {mediaList.map((m, idx) => (
                <div
                  key={m.id}
                  className={`profile-thumbnail-item ${idx === selectedPhotoIndex ? 'active' : ''}`}
                  onClick={() => setSelectedPhotoIndex(idx)}
                >
                  <img src={m.thumbnail_path || m.storage_path} alt="Miniatura" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Profile Info & Direct Contacts */}
        <div className="profile-info-column">
          {/* Top Title & Header */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
              <div>
                <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  {advertiser.stage_name}
                </h1>
                {advertiser.headline && (
                  <p style={{ fontSize: '1.05rem', color: 'var(--accent-gold)', fontStyle: 'italic' }}>
                    {advertiser.headline}
                  </p>
                )}
              </div>

              {/* Action Buttons: Share & Favorite */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Compartilhar">
                  <Share2 size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  aria-label="Favoritar"
                  style={{ color: isFavorite ? 'var(--accent-ruby)' : 'var(--text-primary)' }}
                >
                  <Heart size={18} fill={isFavorite ? 'var(--accent-ruby)' : 'none'} />
                </Button>
              </div>
            </div>

            {/* Location & Activity */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="var(--accent-gold)" />
                <span>
                  Atende em <strong>{advertiser.city_name}, {advertiser.state_code}</strong>
                  {advertiser.neighborhood ? ` (${advertiser.neighborhood})` : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} color="var(--color-success)" />
                <span>Ativo recentemente</span>
              </div>
            </div>
          </div>

          {/* Direct Contacts Section (Requirement 49 & 51) */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--accent-gold)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Canais de Contato Direto
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Entre em contato diretamente com o(a) anunciante. Não intermediamos pagamentos ou agendamentos.
            </p>

            {contacts.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nenhum canal de contato público disponível no momento.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {contacts.map((c) => (
                  <Button
                    key={c.id}
                    variant={c.contact_type === 'whatsapp' ? 'ruby' : 'secondary'}
                    fullWidth
                    size="lg"
                    onClick={() => handleContactClick(c)}
                    leftIcon={
                      c.contact_type === 'whatsapp' ? <MessageCircle size={18} /> :
                      c.contact_type === 'telegram' ? <Send size={18} /> :
                      c.contact_type === 'phone' ? <Phone size={18} /> : <Globe size={18} />
                    }
                  >
                    {c.contact_type === 'whatsapp' && `Conversar no WhatsApp (${c.contact_value})`}
                    {c.contact_type === 'telegram' && `Telegram (${c.contact_value})`}
                    {c.contact_type === 'phone' && `Ligar (${c.contact_value})`}
                    {c.contact_type === 'website' && `Visitar Website`}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          {/* Section: Informações Básicas */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Informações</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Idade:</span>{' '}
                <strong>{advertiser.age} anos (18+)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Gênero:</span>{' '}
                <strong style={{ textTransform: 'capitalize' }}>{advertiser.gender || 'Feminino'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Cidade:</span>{' '}
                <strong>{advertiser.city_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Estado:</span>{' '}
                <strong>{advertiser.state_name} ({advertiser.state_code})</strong>
              </div>
            </div>
          </Card>

          {/* Section: Sobre (Bio Sanitizada) */}
          {advertiser.bio && (
            <Card variant="glass" padding="md">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Sobre</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                {advertiser.bio}
              </p>
            </Card>
          )}

          {/* Report Button */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReportOpen(true)}
              style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
              leftIcon={<ShieldAlert size={14} color="var(--accent-ruby)" />}
            >
              Denunciar este perfil
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Component */}
      <GalleryLightbox
        mediaList={mediaList}
        currentIndex={selectedPhotoIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={setSelectedPhotoIndex}
      />

      {/* Report Modal Component */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        advertiserId={advertiser.advertiser_id}
        stageName={advertiser.stage_name}
      />
    </div>
  );
}
