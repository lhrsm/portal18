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
import { MapPin, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/seo/seoEngine';

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
    return { title: 'Estado não encontrado | Portal18', robots: { index: false } };
  }

  const title = `Acompanhantes e Perfis em ${state.name} (${state.code}) | Portal18`;
  const description = `Encontre anúncios verificados de acompanhantes e profissionais independentes no estado de ${state.name}. Fotos moderadas, maioridade 18+ e contato direto.`;
  const canonicalUrl = `/acompanhantes/${state.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'Portal18',
      locale: 'pt_BR',
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

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: state.name, url: `/acompanhantes/${state.slug}` },
  ]);

  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
        <ChevronRight size={10} />
        <Link href="/explorar" style={{ color: 'var(--text-muted)' }}>Explorar</Link>
        <ChevronRight size={10} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{state.name}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <Badge variant="gold">{state.name.toUpperCase()} ({state.code})</Badge>
          <Badge variant="neutral">{profiles.length} {profiles.length === 1 ? 'anúncio ativo' : 'anúncios ativos'}</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Acompanhantes e Perfis em {state.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Explore anúncios de acompanhantes e profissionais independentes nas principais cidades de {state.name}.
        </p>
      </div>

      {/* Cities Quick Bar */}
      {citiesData.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={15} color="var(--accent-gold)" /> Cidades em {state.name}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {citiesData.map((city) => (
              <Link
                key={city.id}
                href={`/acompanhantes/${state.slug}/${city.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 0.85rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  minHeight: '38px',
                }}
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profiles Grid */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
          Anúncios em Destaque em {state.name}
        </h2>

        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Sparkles size={36} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Nenhum anúncio publicado nesta região no momento</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Seja o primeiro anunciante a publicar seu perfil profissional em {state.name}.
            </p>
            <Link href="/anunciar">
              <Button variant="ruby" size="md">Criar Anúncio em {state.name}</Button>
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
