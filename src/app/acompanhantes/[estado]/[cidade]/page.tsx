import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';
import { searchService } from '@/services/discovery/searchService';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  MapPin, 
  Sparkles, 
  Navigation, 
  Tag, 
  ShieldCheck, 
  Megaphone, 
  ChevronRight,
  Flame
} from 'lucide-react';

interface CityPageProps {
  params: {
    estado: string;
    cidade: string;
  };
  searchParams?: {
    bairro?: string;
    categoria?: string;
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

export default async function CityDirectoryPage({ params, searchParams }: CityPageProps) {
  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === params.estado.toLowerCase() || s.code.toLowerCase() === params.estado.toLowerCase());

  if (!state) {
    notFound();
  }

  const cities = await locationService.getCitiesByState(state.id);
  const currentCity = cities.find((c) => c.slug === params.cidade.toLowerCase());

  const [profilesRes, categories, nearbyCities] = await Promise.all([
    publicProfilesService.getPublicAdvertisers({
      state: state.slug,
      city: params.cidade,
      category: searchParams?.categoria,
      limit: 36,
    }),
    locationService.getCategories(),
    currentCity ? searchService.getNearbyCities(currentCity.id, 60) : Promise.resolve([]),
  ]);

  let profiles = profilesRes.data;

  // Filter by neighborhood if parameter present
  if (searchParams?.bairro) {
    const b = searchParams.bairro.toLowerCase();
    profiles = profiles.filter((p) => p.neighborhood && p.neighborhood.toLowerCase() === b);
  }

  const cityName = currentCity?.name || params.cidade.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const otherNearby = nearbyCities.filter((nc) => nc.city_slug !== params.cidade.toLowerCase() && nc.active_advertisers_count > 0);

  // Extract distinct neighborhoods from current city profiles
  const allCityProfiles = profilesRes.data;
  const distinctNeighborhoods = Array.from(
    new Set(allCityProfiles.map((p) => p.neighborhood).filter(Boolean) as string[])
  ).sort();

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem' }}>
      {/* 1. COMPACT BREADCRUMB */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início</Link>
        <ChevronRight size={12} />
        <Link href={`/acompanhantes/${state.slug}`} style={{ color: 'var(--text-secondary)' }}>{state.name}</Link>
        <ChevronRight size={12} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{cityName}</span>
        {searchParams?.bairro && (
          <>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-primary)' }}>{searchParams.bairro}</span>
          </>
        )}
      </nav>

      {/* 2. HEADER */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">{cityName.toUpperCase()} / {state.code}</Badge>
          <Badge variant="neutral">{profiles.length} {profiles.length === 1 ? 'perfil ativo' : 'perfis ativos'}</Badge>
        </div>

        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
          Acompanhantes em {cityName}, {state.code}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '720px', lineHeight: 1.5 }}>
          Anúncios verificados de acompanhantes e massagistas independentes em {cityName}. Contato direto via WhatsApp e privacidade absoluta.
        </p>
      </div>

      {/* 3. NEIGHBORHOOD CHIPS (Bairros de Salvador e cidades principais) */}
      {distinctNeighborhoods.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <MapPin size={13} color="var(--accent-gold)" /> Bairros Populares em {cityName}:
          </div>
          <div className="filter-chips-wrapper">
            <div className="filter-chips-container">
              <Link
                href={`/acompanhantes/${state.slug}/${params.cidade}`}
                className={`filter-chip-item ${!searchParams?.bairro ? 'active' : ''}`}
              >
                Todos os bairros ({allCityProfiles.length})
              </Link>
              {distinctNeighborhoods.map((bairro) => {
                const count = allCityProfiles.filter((p) => p.neighborhood === bairro).length;
                const isActive = searchParams?.bairro?.toLowerCase() === bairro.toLowerCase();
                return (
                  <Link
                    key={bairro}
                    href={`/acompanhantes/${state.slug}/${params.cidade}?bairro=${encodeURIComponent(bairro)}`}
                    className={`filter-chip-item ${isActive ? 'active' : ''}`}
                  >
                    {bairro} ({count})
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. CATEGORY SHORTCUTS */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="filter-chips-wrapper">
          <div className="filter-chips-container">
            <Link
              href={`/acompanhantes/${state.slug}/${params.cidade}`}
              className={`filter-chip-item ${!searchParams?.categoria ? 'active' : ''}`}
            >
              <Tag size={12} /> Todas as categorias
            </Link>
            {categories.map((cat) => {
              const isActive = searchParams?.categoria === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/acompanhantes/${state.slug}/${params.cidade}?categoria=${cat.slug}`}
                  className={`filter-chip-item ${isActive ? 'active' : ''}`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. PROFILES GRID */}
      <div style={{ marginBottom: '3.5rem' }}>
        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nenhum perfil encontrado com os filtros selecionados</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Experimente remover os filtros de bairro ou categoria para ver todos os perfis em {cityName}.
            </p>
            <Link href={`/acompanhantes/${state.slug}/${params.cidade}`}>
              <Button variant="secondary">Ver todos em {cityName}</Button>
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

      {/* 6. ADVERTISER PROMO BANNER FOR LOCAL MARKET */}
      <section style={{ marginBottom: '3.5rem' }}>
        <Card variant="elevated" padding="md" style={{ 
          background: 'linear-gradient(135deg, rgba(229, 185, 92, 0.15) 0%, rgba(18, 22, 31, 0.95) 100%)', 
          border: '1px solid var(--accent-gold)' 
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                Atende em {cityName}? Anuncie seu perfil profissional
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Apareça no topo das buscas da sua cidade e receba contatos diretos no seu WhatsApp.
              </div>
            </div>
            <Link href="/advertiser/start">
              <Button variant="primary" size="md" leftIcon={<Megaphone size={16} />}>
                Anunciar em {cityName}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* 7. NEARBY CITIES (Também perto de você) */}
      {otherNearby.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Navigation size={18} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Também perto de você</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {otherNearby.map((nc) => (
              <Link
                key={nc.city_id}
                href={`/acompanhantes/${state.slug}/${nc.city_slug}`}
                className="discovery-pill-card"
                style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '0.75rem 1rem' }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {nc.city_name}
                </div>
                <Badge variant="neutral">
                  {nc.active_advertisers_count} perfis
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
