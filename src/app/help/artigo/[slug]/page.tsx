'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { helpService } from '@/services/help/helpService';
import { HelpArticle } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Check,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = (params.slug as string) || '';
  const { showToast } = useToast();

  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const art = await helpService.getArticleBySlug(slug);
        setArticle(art);
      } catch (err) {
        console.error('Error loading article:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const handleFeedback = async (helpful: boolean) => {
    if (!article || feedbackSent) return;
    setFeedbackSent(true);
    await helpService.submitFeedback(article.id, helpful);
    showToast({
      type: 'info',
      title: 'Obrigado pelo feedback',
      message: 'Sua avaliação nos ajuda a melhorar a central de ajuda.',
    });
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '820px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando artigo...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', maxWidth: '600px' }}>
        <Card variant="glass" padding="lg">
          <BookOpen size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Artigo não encontrado</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            O artigo que você procura não está publicado ou foi atualizado.
          </p>
          <Link href="/help">
            <Button variant="primary">Voltar para Central de Ajuda</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '820px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <Link href="/help" style={{ color: 'var(--text-secondary)' }}>Central de Ajuda</Link>
        <span>/</span>
        {article.category_slug && (
          <>
            <Link href={`/help/categoria/${article.category_slug}`} style={{ color: 'var(--text-secondary)' }}>
              {article.category_name}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--accent-gold)' }}>Artigo</span>
      </div>

      {/* Article Content */}
      <article style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem' }}>
          {article.title}
        </h1>

        {article.summary && (
          <p style={{ fontSize: '1.1rem', color: 'var(--accent-gold)', lineHeight: 1.6, marginBottom: '2rem' }}>
            {article.summary}
          </p>
        )}

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem', color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.8 }}>
          <p style={{ whiteSpace: 'pre-line' }}>{article.content}</p>
        </div>
      </article>

      {/* Article Feedback Section (Section 48 & 49) */}
      <Card variant="glass" padding="md" style={{ marginBottom: '3rem', textAlign: 'center', padding: '2rem 1rem' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Isso resolveu sua dúvida?</h4>

        {feedbackSent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-success)', fontSize: '0.95rem' }}>
            <Check size={18} /> Obrigado pelo seu feedback!
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button variant="secondary" size="sm" onClick={() => handleFeedback(true)} leftIcon={<ThumbsUp size={14} />}>
              Sim, ajudou
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleFeedback(false)} leftIcon={<ThumbsDown size={14} />}>
              Não resolveu
            </Button>
          </div>
        )}
      </Card>

      {/* Need more help CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Ainda precisa de esclarecimentos?</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abra um chamado direto com nossa equipe especializada.</p>
        </div>
        <Link href="/support/novo">
          <Button variant="primary" size="sm" leftIcon={<MessageSquare size={14} />}>
            Abrir Chamado
          </Button>
        </Link>
      </div>
    </div>
  );
}
