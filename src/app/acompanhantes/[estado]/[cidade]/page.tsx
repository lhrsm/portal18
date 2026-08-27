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
  Megaphone, 
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Star
} from 'lucide-react';

interface CityPageProps {
  params: Promise<{
    estado: string;
    cidade: string;
  }> | {
    estado: string;
    cidade: string;
  };
  searchParams?: Promise<{
    bairro?: string;
    categoria?: string;
    ordenar?: string;
  }> | {
    bairro?: string;
    categoria?: string;
    ordenar?: string;
  };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const estadoParam = resolvedParams?.estado ? String(resolvedParams.estado).toLowerCase() : '';
  const cidadeParam = resolvedParams?.cidade ? String(resolvedParams.cidade).toLowerCase() : '';

  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === estadoParam || s.code.toLowerCase() === estadoParam);

  if (!state) {
    return { title: 'Localização não encontrada | Portal 18+' };
  }

  const formattedCity = cidadeParam.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    title: `Acompanhantes em ${formattedCity}, ${state.code} | Portal 18+`,
    description: `Descubra acompanhantes e profissionais independentes em ${formattedCity}, ${state.name}. Fotos moderadas, maioridade estrita e contatos diretos.`,
    alternates: {
      canonical: `/acompanhantes/${state.slug}/${cidadeParam}`,
    },
  };
}

export default async function CityDirectoryPage({ params, searchParams }: CityPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const estadoParam = resolvedParams?.estado ? String(resolvedParams.estado).toLowerCase() : '';
  const cidadeParam = resolvedParams?.cidade ? String(resolvedParams.cidade).toLowerCase() : '';
  const bairroParam = resolvedSearchParams?.bairro ? String(resolvedSearchParams.bairro) : undefined;
  const categoriaParam = resolvedSearchParams?.categoria ? String(resolvedSearchParams.categoria) : undefined;
  const ordenarParam = resolvedSearchParams?.ordenar ? String(resolvedSearchParams.ordenar) : 'active';

  const states = await locationService.getStates();
  const state = states.find((s) => s.slug === estadoParam || s.code.toLowerCase() === estadoParam);

  if (!state) {
    notFound();
  }

  const cities = await locationService.getCitiesByState(state.id);
  const currentCity = cities.find((c) => c.slug === cidadeParam || c.name.toLowerCase() === cidadeParam);

  const [profilesRes, categories, nearbyCities] = await Promise.all([
    publicProfilesService.getPublicAdvertisers({
      state: state.slug,
      city: cidadeParam,
      category: categoriaParam,
      sort: ordenarParam as any,
      limit: 36,
    }),
    locationService.getCategories(),
    currentCity ? searchService.getNearbyCities(currentCity.id, 60).catch(() => []) : Promise.resolve([]),
  ]);

  let profiles = profilesRes?.data || [];

  // Filter by neighborhood if parameter present
  if (bairroParam) {
    const b = bairroParam.toLowerCase();
    profiles = profiles.filter((p) => p.neighborhood && p.neighborhood.toLowerCase() === b);
  }

  const cityName = currentCity?.name || cidadeParam.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const otherNearby = (nearbyCities || []).filter((nc) => nc.city_slug !== cidadeParam && nc.active_advertisers_count > 0);

  // Extract distinct neighborhoods from current city profiles
  const allCityProfiles = profilesRes?.data || [];
  const distinctNeighborhoods = Array.from(
    new Set(allCityProfiles.map((p) => p.neighborhood).filter(Boolean) as string[])
  ).sort();

  // Highlight featured top profiles for local spotlight if >= 6 profiles
  const spotlightProfiles = profiles.length >= 6 ? profiles.slice(0, 4) : [];

  return (
    <div className="container" style={{ padding: '1.25rem 1rem 4rem 1rem', maxWidth: '1400px' }}>
      {/* 1. DISCREET BREADCRUMB (12px) */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
        <ChevronRight size={10} />
        <Link href={`/acompanhantes/${state.slug}`} style={{ color: 'var(--text-muted)' }}>{state.name}</Link>
        <ChevronRight size={10} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{cityName}</span>
        {bairroParam && (
          <>
            <ChevronRight size={10} />
            <span style={{ color: 'var(--text-secondary)' }}>{bairroParam}</span>
          </>
        )}
      </nav>

      {/* 2. COMPACT CITY HEADER (28–32px H1) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
            {cityName.toUpperCase()} / {state.code}
          </span>
          <span style={{ color: 'var(--border-medium)', fontSize: '0.75rem' }}>•</span>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {profiles.length} {profiles.length === 1 ? 'anúncio ativo' : 'anúncios ativos'}
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.6rem, 2.4vw, 2rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Acompanhantes em {cityName}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '650px', lineHeight: 1.45, margin: 0 }}>
          Anúncios verificados de acompanhantes e massagistas independentes em {cityName}. Contato direto via WhatsApp e privacidade absoluta.
        </p>
      </div>

      {/* 3. UNIFIED COMPACT FILTERS TOOLBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {/* Category & Style Quick Bar */}
        <div className="filter-chips-outer" style={{ margin: 0, justifyContent: 'flex-start' }}>
          <div className="filter-chips-scroller" style={{ margin: 0, padding: '0.15rem 0', gap: '0.4rem' }}>
            <Link
              href={`/acompanhantes/${state.slug}/${cidadeParam}${bairroParam ? `?bairro=${encodeURIComponent(bairroParam)}` : ''}`}
              className={`filter-chip-item ${!categoriaParam ? 'active' : ''}`}
              style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.75rem' }}
            >
              Todos os estilos
            </Link>
            {categories.map((cat) => {
              const isActive = categoriaParam === cat.slug;
              const q = new URLSearchParams();
              if (bairroParam) q.set('bairro', bairroParam);
              q.set('categoria', cat.slug);

              return (
                <Link
                  key={cat.id}
                  href={`/acompanhantes/${state.slug}/${cidadeParam}?${q.toString()}`}
                  className={`filter-chip-item ${isActive ? 'active' : ''}`}
                  style={{ height: '32px', fontSize: '0.75rem', padding: '0 0.75rem' }}
                >
                  {cat.name}
                </Link>
              );
            })}
            <div className="filter-chips-spacer" aria-hidden="true" style={{ flex: '0 0 24px', width: '24px', height: '1px' }} />
          </div>
        </div>

        {/* Neighborhood Quick Bar (if available) */}
        {distinctNeighborhoods.length > 0 && (
          <div className="filter-chips-outer" style={{ margin: 0, justifyContent: 'flex-start' }}>
            <div className="filter-chips-scroller" style={{ margin: 0, padding: '0.15rem 0', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap', marginRight: '0.2rem' }}>
                <MapPin size={11} color="var(--accent-gold)" /> Bairro:
              </span>
              <Link
                href={`/acompanhantes/${state.slug}/${cidadeParam}${categoriaParam ? `?categoria=${categoriaParam}` : ''}`}
                className={`filter-chip-item ${!bairroParam ? 'active' : ''}`}
                style={{ height: '30px', fontSize: '0.725rem', padding: '0 0.65rem' }}
              >
                Todos ({allCityProfiles.length})
              </Link>
              {distinctNeighborhoods.map((bairro) => {
                const count = allCityProfiles.filter((p) => p.neighborhood === bairro).length;
                const isActive = bairroParam?.toLowerCase() === bairro.toLowerCase();
                const q = new URLSearchParams();
                q.set('bairro', bairro);
                if (categoriaParam) q.set('categoria', categoriaParam);

                return (
                  <Link
                    key={bairro}
                    href={`/acompanhantes/${state.slug}/${cidadeParam}?${q.toString()}`}
                    className={`filter-chip-item ${isActive ? 'active' : ''}`}
                    style={{ height: '30px', fontSize: '0.725rem', padding: '0 0.65rem' }}
                  >
                    {bairro} ({count})
                  </Link>
                );
              })}
              <div className="filter-chips-spacer" aria-hidden="true" style={{ flex: '0 0 24px', width: '24px', height: '1px' }} />
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN PROFILES GRID (5 columns on widescreen, 2 on mobile) */}
      <div style={{ marginBottom: '3rem' }}>
        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={36} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Nenhum anúncio encontrado com os filtros selecionados</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Experimente remover os filtros de bairro ou categoria para ver todos os perfis em {cityName}.
            </p>
            <Link href={`/acompanhantes/${state.slug}/${cidadeParam}`}>
              <Button variant="secondary" size="sm">Ver todos em {cityName}</Button>
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

      {/* 5. SECONDARY DISCOVERY: POPULAR NEIGHBORHOODS DIRECTORY */}
      {distinctNeighborhoods.length > 3 && (
        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <MapPin size={15} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Bairros Populares em {cityName}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.65rem' }}>
            {distinctNeighborhoods.map((bairro) => {
              const count = allCityProfiles.filter((p) => p.neighborhood === bairro).length;
              return (
                <Link
                  key={bairro}
                  href={`/acompanhantes/${state.slug}/${cidadeParam}?bairro=${encodeURIComponent(bairro)}`}
                  className="discovery-pill-card"
                  style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                    {bairro}
                  </span>
                  <Badge variant="neutral">
                    {count} {count === 1 ? 'perfil' : 'perfis'}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. COMPACT ADVERTISER PROMO BANNER */}
      <section style={{ marginBottom: '2.5rem' }}>
        <Card variant="elevated" padding="md" style={{ 
          background: 'linear-gradient(135deg, rgba(229, 185, 92, 0.12) 0%, rgba(18, 22, 31, 0.95) 100%)', 
          border: '1px solid rgba(229, 185, 92, 0.35)',
          padding: '1.25rem 1.5rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                Atende em {cityName}? Anuncie seu perfil profissional
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Destaque-se no topo das buscas da sua região e receba contatos diretos no seu WhatsApp.
              </div>
            </div>
            <Link href="/advertiser/start">
              <Button variant="primary" size="sm" leftIcon={<Megaphone size={14} />}>
                Anunciar em {cityName}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* 7. NEARBY CITIES COMPACT SECTION */}
      {otherNearby.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <Navigation size={15} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Também perto de {cityName}</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.65rem' }}>
            {otherNearby.map((nc) => (
              <Link
                key={nc.city_id}
                href={`/acompanhantes/${state.slug}/${nc.city_slug}`}
                className="discovery-pill-card"
                style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                  {nc.city_name}
                </div>
                <Badge variant="neutral">
                  {nc.active_advertisers_count}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
