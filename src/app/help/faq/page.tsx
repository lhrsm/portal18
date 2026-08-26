'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { helpService } from '@/services/help/helpService';
import { HelpArticle } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, HelpCircle, MessageSquare } from 'lucide-react';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<HelpArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const data = await helpService.getFaqArticles();
        setFaqs(data);
      } catch (err) {
        console.error('Error loading FAQs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFaqs();
  }, []);

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/help" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Central de Ajuda
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Perguntas Frequentes (FAQ)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Respostas diretas para as dúvidas mais comuns sobre navegação, segurança e anúncios.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3.5rem' }}>
        {faqs.map((faq) => (
          <Link key={faq.id} href={`/help/artigo/${faq.slug}`} style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="md" style={{ transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    {faq.title}
                  </h3>
                  {faq.summary && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {faq.summary}
                    </p>
                  )}
                </div>
                <ArrowRight size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '4px' }} />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Support CTA */}
      <Card variant="elevated" padding="lg">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Sua pergunta não está na lista?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Abra um chamado privado com nosso time de atendimento.</p>
          </div>
          <Link href="/support/novo">
            <Button variant="primary" leftIcon={<MessageSquare size={16} />}>
              Falar com Suporte
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
