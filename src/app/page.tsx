'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';
import { PublicAdvertiser, Category } from '@/types/app.types';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { CityAutocomplete } from '@/components/public/CityAutocomplete';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  Megaphone, 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Eye, 
  Heart 
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isAdvertiser } = useAuth();

  const [selectedCity, setSelectedCity] = useState<{ cityName: string; citySlug: string; stateCode: string; stateSlug: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<(Category & { profileCount: number })[]>([]);
  const [recommendedProfiles, setRecommendedProfiles] = useState<PublicAdvertiser[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<PublicAdvertiser[]>([]);
  const [activeCities, setActiveCities] = useState<{ cityName: string; citySlug: string; stateCode: string; stateSlug: string; profileCount: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [recs, recents, cats, cities] = await Promise.all([
          publicProfilesService.getRecommendedAdvertisers(8),
          publicProfilesService.getRecentAdvertisers(8),
          publicProfilesService.getCategoriesWithCount(),
          publicProfilesService.getCitiesWithActiveProfiles(),
        ]);
        setRecommendedProfiles(recs);
        setRecentProfiles(recents);
        setCategories(cats);
        setActiveCities(cities);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity) {
      params.set('estado', selectedCity.stateSlug);
      params.set('cidade', selectedCity.citySlug);
    }
    if (selectedCategory) {
      params.set('categoria', selectedCategory);
    }
    router.push(`/explorar?${params.toString()}`);
  };

  const getAdvertiserCtaUrl = () => {
    if (!user) return '/register';
    if (!isAdvertiser) return '/advertiser/start';
    return '/advertiser';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '4rem' }}>
      {/* 1. HERO SECTION (Requirements 9, 10, 11, 12) */}
      <section className="hero-section">
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
            <Badge variant="gold">PORTAL NACIONAL 18+</Badge>
            <Badge variant="ruby">100% INDEPENDENTE</Badge>
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Encontre perfis na <span style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sua região</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Descoberta segura de acompanhantes e profissionais independentes em todo o Brasil.
          </p>

          {/* Hero Search Bar */}
          <Card variant="glass" padding="md" style={{ maxWidth: '780px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <form onSubmit={handleSearchSubmit} className="hero-search-form">
              <div style={{ flex: '1 1 280px' }}>
                <CityAutocomplete onSelectCity={setSelectedCity} placeholder="Digite sua cidade ou estado..." />
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <select
                  className="input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Todas as Categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="ruby" size="lg" leftIcon={<Search size={18} />}>
                Explorar
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* 2. RECOMMENDED PROFILES (Requirement 13) */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              <Sparkles size={16} /> Perfis em Destaque
            </div>
            <h2 style={{ fontSize: '1.85rem' }}>Perfis Recomendados</h2>
          </div>
          <Link href="/explorar?sort=recommended">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver todos
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="advertiser-grid">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} height="360px" borderRadius="var(--radius-lg)" />
            ))}
          </div>
        ) : recommendedProfiles.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <Sparkles size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Novos perfis em processo de moderação</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Seja um dos primeiros anunciantes independentes da sua cidade.
            </p>
            <Link href={getAdvertiserCtaUrl()}>
              <Button variant="primary">Criar Meu Perfil de Anunciante</Button>
            </Link>
          </Card>
        ) : (
          <div className="advertiser-grid">
            {recommendedProfiles.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 3. RECENT PROFILES (Requirement 14) */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.85rem' }}>Novos Perfis</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Profissionais recém-aprovados na plataforma</p>
          </div>
          <Link href="/explorar?sort=recent">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver todos
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="advertiser-grid">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} height="360px" borderRadius="var(--radius-lg)" />
            ))}
          </div>
        ) : (
          <div className="advertiser-grid">
            {recentProfiles.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 4. EXPLORE BY CITY (Requirement 15) */}
      {activeCities.length > 0 && (
        <section className="container">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Explore por Cidade</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cidades com profissionais disponíveis</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {activeCities.map((city, i) => (
              <Link
                key={i}
                href={`/acompanhantes/${city.stateSlug}/${city.citySlug}`}
                style={{ textDecoration: 'none' }}
              >
                <Card
                  variant="glass"
                  padding="md"
                  className="city-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all var(--transition-fast)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {city.cityName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                      {city.stateCode}
                    </div>
                  </div>
                  <Badge variant="neutral">{city.profileCount} {city.profileCount === 1 ? 'perfil' : 'perfis'}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. EXPLORE BY CATEGORY (Requirement 16) */}
      <section className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>Explore por Categoria</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Encontre o estilo de atendimento ideal</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categoria/${cat.slug}`} style={{ textDecoration: 'none' }}>
              <Card variant="glass" padding="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <Tag size={20} color="var(--accent-gold)" />
                    {cat.profileCount > 0 && <Badge variant="neutral">{cat.profileCount} perfis</Badge>}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{cat.name}</h3>
                  {cat.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {cat.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--accent-gold)', marginTop: '1rem' }}>
                  Ver categoria <ArrowRight size={12} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. SAFETY & PRIVACY SECTION (Requirement 17) */}
      <section className="container">
        <Card variant="glass" padding="lg" style={{ border: '1px solid rgba(229, 185, 92, 0.2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Badge variant="ruby">SEGURANÇA & CONFORMIDADE</Badge>
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Segurança e Privacidade em Primeiro Lugar</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Operamos com tolerância zero contra exploração e em estrita conformidade com as leis vigentes de proteção e maioridade civil no Brasil.
              </p>
              <Link href="/account/privacy">
                <Button variant="secondary" leftIcon={<ShieldCheck size={16} />}>
                  Conheça nossa Central de Segurança
                </Button>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <CheckCircle2 size={20} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Maioridade Estrita 18+</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Restrição no banco de dados e termos de responsabilidade civil para 100% dos perfis.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <ShieldAlert size={20} color="var(--accent-ruby)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Canal Ativo de Denúncias</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prioridade crítica imediata para qualquer suspeita de irregularidade ou menores.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Lock size={20} color="var(--color-info)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Privacidade & Sem Intermediação</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nenhum valor é cobrado de encontros e dados pessoais nunca são expostos.</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 7. ADVERTISER CTA BANNER (Requirement 18) */}
      <section className="container">
        <Card variant="elevated" padding="lg" style={{ background: 'linear-gradient(135deg, rgba(163, 0, 33, 0.25) 0%, rgba(20, 20, 25, 0.95) 100%)', border: '1px solid var(--accent-ruby)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Badge variant="ruby">SEJA UM(A) ANUNCIANTE</Badge>
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Quer anunciar seu perfil profissional?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Ganhe visibilidade na sua cidade, gerencie sua galeria com proteção e receba contatos diretos sem intermediários.
              </p>
            </div>

            <Link href={getAdvertiserCtaUrl()}>
              <Button variant="ruby" size="lg" leftIcon={<Megaphone size={18} />}>
                Criar meu perfil
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
