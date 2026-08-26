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
import { Tag, Sparkles } from 'lucide-react';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categories = await locationService.getCategories();
  const category = categories.find((c) => c.slug === params.slug.toLowerCase());

  if (!category) {
    return { title: 'Categoria não encontrada | Portal 18+' };
  }

  return {
    title: `${category.name} — Perfis e Anúncios 18+ | Portal Nacional`,
    description: category.description || `Encontre profissionais independentes na categoria ${category.name}. Perfis verificados, maioridade comprovada e contato direto.`,
    alternates: {
      canonical: `/categoria/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categories = await locationService.getCategories();
  const category = categories.find((c) => c.slug === params.slug.toLowerCase());

  if (!category) {
    notFound();
  }

  const profilesRes = await publicProfilesService.getPublicAdvertisers({
    category: category.slug,
    limit: 30,
  });

  const profiles = profilesRes.data;

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início</Link>
        <span>/</span>
        <Link href="/explorar" style={{ color: 'var(--text-secondary)' }}>Categorias</Link>
        <span>/</span>
        <span style={{ color: 'var(--accent-gold)' }}>{category.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">CATEGORIA</Badge>
          <Badge variant="neutral">{profiles.length} {profiles.length === 1 ? 'perfil' : 'perfis'}</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>{category.name}</h1>
        {category.description && (
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px' }}>
            {category.description}
          </p>
        )}
      </div>

      {/* Profiles Grid */}
      <div>
        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nenhum perfil ativo nesta categoria no momento</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Seja o(a) primeiro(a) anunciante a divulgar nesta categoria.
            </p>
            <Link href="/advertiser/start">
              <Button variant="ruby">Anunciar nesta Categoria</Button>
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
