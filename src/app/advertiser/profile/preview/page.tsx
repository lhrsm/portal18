'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { AdvertiserProfile, AdvertiserMedia, AdvertiserContact } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Eye, 
  ArrowLeft, 
  Camera, 
  Phone, 
  Send, 
  MessageCircle, 
  Globe 
} from 'lucide-react';

export default function AdvertiserProfilePreviewPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        if (adv) {
          setAdvertiser(adv);
          const [media, advContacts] = await Promise.all([
            mediaService.getAdvertiserMedia(adv.id),
            contactsService.getContactsByAdvertiser(adv.id),
          ]);
          setMediaList(media);
          setContacts(advContacts);
        }
      }
      setIsLoading(false);
    }
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="400px" />
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Perfil de anunciante não encontrado.</h2>
        <Link href="/advertiser/start">
          <Button variant="primary" style={{ marginTop: '1rem' }}>Criar Perfil</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem' }}>
      {/* Top Preview Banner */}
      <div style={{ background: 'rgba(229, 185, 92, 0.15)', border: '1px solid var(--accent-gold)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={18} color="var(--accent-gold)" />
          <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
            Modo de Pré-visualização do Anunciante (Não público / Não indexável)
          </span>
        </div>
        <Link href="/advertiser/onboarding">
          <Button variant="secondary" size="sm">Editar no Onboarding</Button>
        </Link>
      </div>

      <div className="profile-layout-grid">
        {/* Gallery Preview */}
        <div className="profile-gallery-column">
          <div className="profile-main-photo-container">
            {mediaList[0] ? (
              <img src={mediaList[0].storage_path} alt={advertiser.stage_name} className="profile-main-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                <Camera size={48} color="var(--accent-gold)" />
                <span>Nenhuma foto enviada</span>
              </div>
            )}
            <div className="badge-verified profile-verified-badge">
              Status: {advertiser.profile_status}
            </div>
          </div>
        </div>

        {/* Info Preview */}
        <div className="profile-info-column">
          <div>
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Badge variant="gold">PREVIEW</Badge>
              <Badge variant={advertiser.profile_status === 'approved' ? 'success' : 'warning'}>
                {advertiser.profile_status}
              </Badge>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {advertiser.stage_name}
            </h1>
            {advertiser.headline && (
              <p style={{ fontSize: '1.05rem', color: 'var(--accent-gold)', fontStyle: 'italic', marginBottom: '1rem' }}>
                {advertiser.headline}
              </p>
            )}
          </div>

          {/* Contacts Preview */}
          <Card variant="glass" padding="md">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Canais de Contato Cadastrados</h3>
            {contacts.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum contato cadastrado ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {contacts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.9rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <span><strong>{c.contact_type.toUpperCase()}:</strong> {c.contact_value}</span>
                    <Badge variant={c.is_visible ? 'success' : 'neutral'}>
                      {c.is_visible ? 'Visível' : 'Oculto'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Bio Preview */}
          {advertiser.bio && (
            <Card variant="glass" padding="md">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Sobre</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                {advertiser.bio}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
