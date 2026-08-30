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
import { Tag, Sparkles, ChevronRight } from 'lucide-react';
import { generateBreadcrumbSchema } from '@/lib/seo/seoEngine';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }> | {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const categorySlug = resolvedParams?.slug ? String(resolvedParams.slug).toLowerCase() : '';

  const categories = await locationService.getCategories();
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) {
    return { title: 'Categoria não encontrada | Portal18', robots: { index: false } };
  }

  const title = `${category.name} | Portal18`;
  const description = category.description || `Encontre anúncios verificados de profissionais independentes na categoria ${category.name}. Maioridade 18+, fotos moderadas e contato direto no Portal18.`;
  const canonicalUrl = `/categoria/${category.slug}`;

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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const categorySlug = resolvedParams?.slug ? String(resolvedParams.slug).toLowerCase() : '';

  const categories = await locationService.getCategories();
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) {
    notFound();
  }

  const profilesRes = await publicProfilesService.getPublicAdvertisers({
    category: category.slug,
    limit: 30,
  });

  const profiles = profilesRes?.data || [];

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: 'Categorias', url: '/explorar?categoria=acompanhantes' },
    { name: category.name, url: `/categoria/${category.slug}` },
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
        <Link href="/explorar" style={{ color: 'var(--text-muted)' }}>Categorias</Link>
        <ChevronRight size={10} />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{category.name}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
          <Badge variant="gold"><Tag size={12} /> CATEGORIA 18+</Badge>
          <Badge variant="neutral">{profiles.length} {profiles.length === 1 ? 'perfil ativo' : 'perfis ativos'}</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          {category.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {category.description || 'Profissionais qualificados disponíveis para atendimento personalizado.'}
        </p>
      </div>

      {/* Profiles Grid */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
          Anúncios em {category.name}
        </h2>

        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Sparkles size={36} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Nenhum anúncio encontrado nesta categoria</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Seja o primeiro anunciante a publicar seu perfil na categoria {category.name}.
            </p>
            <Link href="/anunciar">
              <Button variant="ruby" size="md">Criar Anúncio Agora</Button>
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
