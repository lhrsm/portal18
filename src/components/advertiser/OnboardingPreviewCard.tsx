'use client';

import React from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Send, 
  Globe, 
  Camera, 
  Edit3, 
  Eye, 
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdvertiserProfile, AdvertiserMedia, AdvertiserContact, Category } from '@/types/app.types';

export interface OnboardingPreviewCardProps {
  advertiser: Partial<AdvertiserProfile>;
  mediaList: AdvertiserMedia[];
  contacts: AdvertiserContact[];
  categories: Category[];
  selectedCategoryIds: string[];
  stateName?: string;
  cityName?: string;
  onEditSection?: (step: number) => void;
}

export function OnboardingPreviewCard({
  advertiser,
  mediaList,
  contacts,
  categories,
  selectedCategoryIds,
  stateName,
  cityName,
  onEditSection,
}: OnboardingPreviewCardProps) {
  // Calculate display age safely from birth_date
  const age = React.useMemo(() => {
    if (!advertiser.birth_date) return null;
    const birth = new Date(advertiser.birth_date);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let calculated = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      calculated--;
    }
    return calculated >= 18 ? calculated : null;
  }, [advertiser.birth_date]);

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id));
  const mainPhoto = mediaList.find((m) => m.position === 0) || mediaList[0];
  const galleryPhotos = mediaList.filter((m) => m.id !== mainPhoto?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Preview Watermark Notice Banner */}
      <div
        style={{
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Eye size={18} color="var(--accent-gold)" />
          <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
            Prévia Oficial do Anúncio — Como os visitantes verão seu perfil
          </span>
        </div>
        <Badge variant="gold">MODO DE TESTE / RASCUNHO</Badge>
      </div>

      {/* 2. Main Profile Card Layout */}
      <Card
        variant="glass"
        padding="lg"
        style={{
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* LEFT COLUMN: Gallery & Main Photo */}
          <div>
            {/* Main Cover Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '360px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {mainPhoto ? (
                <img
                  src={mainPhoto.full_path || mainPhoto.storage_path || mainPhoto.card_path || ''}
                  alt={advertiser.stage_name || 'Foto Principal'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  <Camera size={44} color="var(--accent-gold)" style={{ margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Nenhuma foto principal enviada</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Foto de capa aparecerá aqui</span>
                </div>
              )}

              {/* Status Badges Overlay */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Badge variant="ruby">18+ CONFIRMADO</Badge>
                {advertiser.verification_status === 'verified' ? (
                  <Badge variant="success">
                    <ShieldCheck size={12} /> VERIFICADA
                  </Badge>
                ) : (
                  <Badge variant="gold">
                    <Sparkles size={12} /> EM CRIAÇÃO
                  </Badge>
                )}
              </div>

              {/* Edit Shortcut */}
              {onEditSection && (
                <button
                  type="button"
                  onClick={() => onEditSection(7)}
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.75)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Edit3 size={12} /> Alterar Fotos
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {galleryPhotos.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                }}
              >
                {galleryPhotos.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      height: '70px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-tertiary)',
                    }}
                  >
                    <img
                      src={p.thumbnail_path || p.storage_path || ''}
                      alt="Thumbnail da galeria"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Profile Information & Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header: Stage Name, Age, Location */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    {advertiser.stage_name || 'Nome Artístico'}
                    {age && <span style={{ fontSize: '1.3rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{age} anos</span>}
                  </h1>
                </div>

                {onEditSection && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSection(1)}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}
                  >
                    <Edit3 size={12} /> Editar
                  </Button>
                )}
              </div>

              {/* Location Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <MapPin size={16} color="var(--accent-gold)" />
                <span>
                  {advertiser.neighborhood ? `${advertiser.neighborhood}, ` : ''}
                  {cityName || 'Cidade'}, {stateName || 'Estado'}
                </span>
              </div>

              {/* Headline */}
              {advertiser.headline && (
                <p
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'var(--accent-gold)',
                    marginTop: '0.6rem',
                    lineHeight: 1.4,
                  }}
                >
                  &ldquo;{advertiser.headline}&rdquo;
                </p>
              )}
            </div>

            {/* Categories Chips */}
            {selectedCategories.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  Categorias de Atendimento
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedCategories.map((c) => (
                    <Badge key={c.id} variant="neutral" style={{ padding: '0.35rem 0.65rem' }}>
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Public Contacts Section */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} color="var(--color-success)" />
                  <span>Canais de Atendimento Direto</span>
                </div>
                {onEditSection && (
                  <button
                    type="button"
                    onClick={() => onEditSection(6)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Gerenciar
                  </button>
                )}
              </div>

              {contacts.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-ruby)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={14} /> Nenhum canal de atendimento cadastrado ainda.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-tertiary)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.contact_type === 'whatsapp' ? (
                          <MessageCircle size={16} color="var(--color-success)" />
                        ) : c.contact_type === 'telegram' ? (
                          <Send size={16} color="var(--color-info)" />
                        ) : (
                          <Phone size={16} color="var(--accent-gold)" />
                        )}
                        <strong style={{ textTransform: 'capitalize' }}>{c.contact_type}:</strong>
                        <span style={{ fontFamily: 'monospace' }}>{c.contact_value}</span>
                      </div>
                      {c.is_primary && <Badge variant="gold">Principal</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bio Presentation */}
            {advertiser.bio && (
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  Apresentação & Sobre
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    paddingRight: '0.5rem',
                  }}
                >
                  {advertiser.bio}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
