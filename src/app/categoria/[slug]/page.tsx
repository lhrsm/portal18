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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="ruby"><Tag size={12} /> CATEGORIA</Badge>
          <Badge variant="neutral">{profiles.length} profissionais</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          {category.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '720px', lineHeight: 1.6 }}>
          {category.description || `Encontre os melhores anúncios de ${category.name} com total privacidade, maioridade verificada e contato direto via WhatsApp.`}
        </p>
      </div>

      {/* Profiles Grid */}
      <div style={{ marginBottom: '3.5rem' }}>
        {profiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Nenhum anúncio nesta categoria ainda</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Seja a primeira profissional a anunciar na categoria {category.name}.
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
