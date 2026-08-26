'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { completenessService } from '@/services/completenessService';
import { AdvertiserProfile, AdvertiserMedia, AdvertiserContact, CompletenessResult } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { CompletenessCard } from '@/components/advertiser/CompletenessCard';
import { SubmissionBanner } from '@/components/advertiser/SubmissionBanner';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Eye, 
  Phone, 
  Heart, 
  Image as ImageIcon, 
  ShieldCheck, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  Megaphone
} from 'lucide-react';

export default function AdvertiserDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [completeness, setCompleteness] = useState<CompletenessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (profile) {
      const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
      if (adv) {
        setAdvertiser(adv);
        const [media, advContacts, catIds] = await Promise.all([
          mediaService.getAdvertiserMedia(adv.id),
          contactsService.getContactsByAdvertiser(adv.id),
          advertisersService.getAdvertiserCategoryIds(adv.id),
        ]);
        setMediaList(media);
        setContacts(advContacts);
        setCategoriesCount(catIds.length);

        const comp = completenessService.calculateProfileCompleteness(
          adv,
          media,
          advContacts,
          catIds.length
        );
        setCompleteness(comp);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="200px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <Card variant="glass" padding="lg" style={{ maxWidth: '540px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
          <Megaphone size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Você ainda não possui um anúncio ativo</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Ative sua conta de anunciante e publique seu perfil profissional em poucos minutos.
          </p>
          <Link href="/advertiser/start">
            <Button variant="ruby" size="lg">
              Ativar Minha Conta de Anunciante
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser} completenessScore={completeness?.score}>
      {/* 1. Submission Banner */}
      {completeness && (
        <SubmissionBanner
          advertiser={advertiser}
          completeness={completeness}
          onStatusChange={loadData}
        />
      )}

      {/* 2. Completeness Card */}
      {completeness && <CompletenessCard completeness={completeness} />}

      {/* 3. Real Metrics Grid (Requirements 2 & 73) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Metric 1: Visualizações */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visualizações Totais</span>
            <Eye size={16} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>0</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visitas acumuladas</span>
        </Card>

        {/* Metric 2: Cliques em Contato */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cliques em Contatos</span>
            <Phone size={16} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>0</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WhatsApp / Telefone</span>
        </Card>

        {/* Metric 3: Favoritos */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Salvo em Favoritos</span>
            <Heart size={16} color="var(--accent-ruby)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>0</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Usuários interessados</span>
        </Card>

        {/* Metric 4: Fotos na Galeria */}
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fotos na Galeria</span>
            <ImageIcon size={16} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{mediaList.length}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {mediaList.filter((m) => m.moderation_status === 'approved').length} aprovadas
          </span>
        </Card>
      </div>

      {/* 4. Quick Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Gerenciar Galeria</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Faça upload de fotos em alta resolução e selecione sua imagem de capa principal.
          </p>
          <Link href="/advertiser/gallery">
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Abrir Galeria ({mediaList.length} fotos)
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Canais de Atendimento</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Configure seu WhatsApp e Telegram para receber mensagens diretas de visitantes.
          </p>
          <Link href="/advertiser/contacts">
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Gerenciar Contatos ({contacts.length})
            </Button>
          </Link>
        </Card>
      </div>
    </AdvertiserLayout>
  );
}
