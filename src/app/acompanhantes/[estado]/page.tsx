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
  params: {
    estado: string;
  };
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === params.estado.toLowerCase() || s.code.toLowerCase() === params.estado.toLowerCase());

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
  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === params.estado.toLowerCase() || s.code.toLowerCase() === params.estado.toLowerCase());

  if (!state) {
    notFound();
  }

  const [profilesRes, citiesData] = await Promise.all([
    publicProfilesService.getPublicAdvertisers({ state: state.slug, limit: 30 }),
    locationService.getCitiesByState(state.id),
  ]);

  const profiles = profilesRes.data;

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
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">ESTADO DE {state.code}</Badge>
          <Badge variant="neutral">{profiles.length} {profiles.length === 1 ? 'perfil ativo' : 'perfis ativos'}</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>Acompanhantes em {state.name}</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '640px' }}>
          Explore anúncios de profissionais independentes com fotos verificadas e atendimento no estado de {state.name}.
        </p>
      </div>

      {/* Cities in this state */}
      {citiesData.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>Cidades em {state.name}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {citiesData.slice(0, 15).map((city) => (
              <Link
                key={city.id}
                href={`/acompanhantes/${state.slug}/${city.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '0.5rem 0.9rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <MapPin size={12} color="var(--accent-gold)" />
                  <span>{city.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profiles Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Todos os Perfis em {state.name}</h2>

        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nenhum perfil ativo neste estado no momento</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Seja o primeiro(a) anunciante a se cadastrar em {state.name}.
            </p>
            <Link href="/advertiser/start">
              <Button variant="ruby">Quero Anunciar em {state.name}</Button>
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
