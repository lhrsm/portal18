import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface StatePageProps {
  params: Promise<{
    estado: string;
  }> | {
    estado: string;
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const estadoParam = resolvedParams?.estado ? String(resolvedParams.estado).toLowerCase() : '';

  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === estadoParam || s.code.toLowerCase() === estadoParam);

  if (!state) {
    return { title: 'Estado não encontrado | Portal 18+' };
  }

  return {
    title: `Acompanhantes e Perfis em ${state.name} (${state.code}) | Portal 18+`,
    description: `Encontre acompanhantes e profissionais independentes em ${state.name}. Fotos aprovadas, maioridade comprovada e contato direto.`,
    alternates: {
      canonical: `/acompanhantes/${state.slug}`,
    },
  };
}

export default async function StateDirectoryPage({ params }: StatePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const estadoParam = resolvedParams?.estado ? String(resolvedParams.estado).toLowerCase() : '';

  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === estadoParam || s.code.toLowerCase() === estadoParam);

  if (!state) {
    notFound();
  }

  const [profilesRes, citiesData] = await Promise.all([
    publicProfilesService.getPublicAdvertisers({ state: state.slug, limit: 30 }),
    locationService.getCitiesByState(state.id),
  ]);

  const profiles = profilesRes?.data || [];

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início</Link>
        <span>/</span>
        <Link href="/explorar" style={{ color: 'var(--text-secondary)' }}>Acompanhantes</Link>
        <span>/</span>
        <span style={{ color: 'var(--accent-gold)' }}>{state.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">{state.name.toUpperCase()} ({state.code})</Badge>
          <Badge variant="neutral">{profiles.length} anunciantes</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Acompanhantes em {state.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '720px', lineHeight: 1.6 }}>
          Explore anunciantes e acompanhantes independentes no estado de {state.name}. Escolha sua cidade para refinar a busca com total sigilo.
        </p>
      </div>

      {/* Cities Selector */}
      {citiesData.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={18} color="var(--accent-gold)" /> Cidades em {state.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {citiesData.map((city) => (
              <Link
                key={city.id}
                href={`/acompanhantes/${state.slug}/${city.slug}`}
                className="discovery-pill-card"
                style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}
              >
                <span>{city.name}</span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profiles Grid */}
      <div style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          Anúncios recentes em {state.name}
        </h2>
        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nenhum anúncio cadastrado neste estado</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Seja o primeiro a anunciar seus serviços profissionais em {state.name}.
            </p>
            <Link href="/advertiser/start">
              <Button variant="primary">Criar Meu Anúncio</Button>
            </Link>
          </Card>
        ) : (
          <div className="advertiser-grid">
            {profiles.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
