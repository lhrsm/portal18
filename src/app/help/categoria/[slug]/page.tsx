'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { helpService } from '@/services/help/helpService';
import { HelpArticle, HelpCategory } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, BookOpen, ArrowRight } from 'lucide-react';

export default function HelpCategoryPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';

  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryArticles() {
      try {
        const [cats, arts] = await Promise.all([
          helpService.getCategories(),
          helpService.getArticlesByCategory(slug),
        ]);
        const currentCat = cats.find((c) => c.slug === slug) || null;
        setCategory(currentCat);
        setArticles(arts);
      } catch (err) {
        console.error('Error loading category articles:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) {
      loadCategoryArticles();
    }
  }, [slug]);

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/help" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Central de Ajuda
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {category ? category.name : 'Artigos da Categoria'}
        </h1>
        {category?.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
            {category.description}
          </p>
        )}
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Nenhum artigo publicado nesta categoria</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Nossos guias estão sendo constantemente atualizados pela equipe.
          </p>
          <Link href="/help">
            <Button variant="secondary">Explorar Outras Categorias</Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {articles.map((art) => (
            <Link key={art.id} href={`/help/artigo/${art.slug}`} style={{ textDecoration: 'none' }}>
              <Card variant="glass" padding="md" style={{ transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                      {art.title}
                    </h3>
                    {art.summary && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {art.summary}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={18} color="var(--accent-gold)" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
