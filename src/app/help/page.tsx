'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { helpService } from '@/services/help/helpService';
import { HelpCategory, HelpArticle } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  ShieldCheck, 
  Lock, 
  Compass, 
  User, 
  Megaphone, 
  Camera, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight 
} from 'lucide-react';

export default function HelpCenterPage() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [faqArticles, setFaqArticles] = useState<HelpArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, faqs] = await Promise.all([
          helpService.getCategories(),
          helpService.getFaqArticles(),
        ]);
        setCategories(cats);
        setFaqArticles(faqs);
      } catch (err) {
        console.error('Error loading help data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await helpService.searchArticles(searchQuery);
    setSearchResults(results);
  };

  const getIconForCategory = (iconName?: string | null) => {
    switch (iconName) {
      case 'Compass': return <Compass size={24} color="var(--accent-gold)" />;
      case 'User': return <User size={24} color="var(--accent-gold)" />;
      case 'ShieldCheck': return <ShieldCheck size={24} color="var(--accent-gold)" />;
      case 'Lock': return <Lock size={24} color="var(--accent-gold)" />;
      case 'Megaphone': return <Megaphone size={24} color="var(--accent-gold)" />;
      case 'Camera': return <Camera size={24} color="var(--accent-gold)" />;
      case 'Sparkles': return <Sparkles size={24} color="var(--accent-gold)" />;
      case 'ShieldAlert': return <ShieldAlert size={24} color="var(--accent-gold)" />;
      default: return <BookOpen size={24} color="var(--accent-gold)" />;
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '1080px' }}>
      {/* Header & Hero Search */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold">CENTRAL DE AJUDA</Badge>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Como podemos ajudar você?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto 2rem auto' }}>
          Encontre respostas para dúvidas frequentes, tutoriais e orientações de segurança.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o que você procura (ex: verificação, fotos, dados)..."
              style={{ width: '100%', paddingLeft: '2.75rem' }}
            />
          </div>
          <Button type="submit" variant="primary">
            Buscar
          </Button>
        </form>
      </div>

      {/* Search Results Display */}
      {isSearching && (
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem' }}>
              Resultados para &quot;{searchQuery}&quot; ({searchResults.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setIsSearching(false); setSearchQuery(''); }}>
              Limpar busca
            </Button>
          </div>

          {searchResults.length === 0 ? (
            <Card variant="glass" padding="md" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <HelpCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Nenhum artigo encontrado para sua pesquisa.
              </p>
              <Link href="/support/novo">
                <Button variant="secondary" size="sm" leftIcon={<MessageSquare size={14} />}>
                  Abrir Chamado de Suporte
                </Button>
              </Link>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.map((art) => (
                <Link key={art.id} href={`/help/artigo/${art.slug}`} style={{ textDecoration: 'none' }}>
                  <Card variant="glass" padding="md" style={{ transition: 'border-color 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                          {art.category_name}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                          {art.title}
                        </h4>
                        {art.summary && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                            {art.summary}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={16} color="var(--accent-gold)" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Grid */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Tópicos por Categoria</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/help/categoria/${cat.slug}`} style={{ textDecoration: 'none' }}>
              <Card variant="glass" padding="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    {getIconForCategory(cat.icon)}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {cat.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--accent-gold)', marginTop: '1.25rem' }}>
                  Ver artigos <ArrowRight size={12} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.6rem' }}>Perguntas Frequentes</h2>
          <Link href="/help/faq">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver todas as FAQs
            </Button>
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqArticles.map((faq) => (
            <Link key={faq.id} href={`/help/artigo/${faq.slug}`} style={{ textDecoration: 'none' }}>
              <Card variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {faq.title}
                    </h4>
                    {faq.summary && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {faq.summary}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={16} color="var(--accent-gold)" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Support CTA Footer Card */}
      <Card variant="elevated" padding="lg" style={{ background: 'linear-gradient(135deg, rgba(218, 165, 32, 0.1) 0%, rgba(20, 20, 25, 0.95) 100%)', border: '1px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>Não encontrou o que precisava?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Nossa equipe de suporte está à disposição para esclarecer qualquer dúvida de forma discreta e segura.
            </p>
          </div>
          <Link href="/support/novo">
            <Button variant="primary" size="lg" leftIcon={<MessageSquare size={16} />}>
              Abrir Chamado de Suporte
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
