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
import { MapPin, Sparkles, Tag } from 'lucide-react';

interface CityPageProps {
  params: {
    estado: string;
    cidade: string;
  };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === params.estado.toLowerCase() || s.code.toLowerCase() === params.estado.toLowerCase());

  if (!state) {
    return { title: 'Localização não encontrada | Portal 18+' };
  }

  const formattedCity = params.cidade.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    title: `Acompanhantes em ${formattedCity}, ${state.code} | Portal 18+`,
    description: `Descubra acompanhantes e profissionais independentes em ${formattedCity}, ${state.name}. Fotos moderadas, maioridade estrita e contatos diretos.`,
    alternates: {
      canonical: `/acompanhantes/${state.slug}/${params.cidade.toLowerCase()}`,
    },
  };
}

export default async function CityDirectoryPage({ params }: CityPageProps) {
  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === params.estado.toLowerCase() || s.code.toLowerCase() === params.estado.toLowerCase());

  if (!state) {
    notFound();
  }

  const [profilesRes, categories] = await Promise.all([
    publicProfilesService.getPublicAdvertisers({
      state: state.slug,
      city: params.cidade,
      limit: 30,
    }),
    locationService.getCategories(),
  ]);

  const profiles = profilesRes.data;
  const cityName = profiles[0]?.city_name || params.cidade.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início</Link>
        <span>/</span>
        <Link href={`/acompanhantes/${state.slug}`} style={{ color: 'var(--text-secondary)' }}>{state.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--accent-gold)' }}>{cityName}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">{cityName.toUpperCase()}, {state.code}</Badge>
          <Badge variant="neutral">{profiles.length} {profiles.length === 1 ? 'perfil' : 'perfis'}</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>Acompanhantes em {cityName}, {state.code}</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '640px' }}>
          Encontre anúncios e contatos diretos de profissionais independentes que atendem na cidade de {cityName}.
        </p>
      </div>

      {/* Category Shortcuts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/explorar?estado=${state.slug}&cidade=${params.cidade}&categoria=${cat.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                padding: '0.4rem 0.8rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {cat.name}
            </div>
          </Link>
        ))}
      </div>

      {/* Profiles Grid */}
      <div>
        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nenhum perfil ativo em {cityName} no momento</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Seja o(a) primeiro(a) anunciante a divulgar nesta cidade.
            </p>
            <Link href="/advertiser/start">
              <Button variant="ruby">Anunciar em {cityName}</Button>
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
