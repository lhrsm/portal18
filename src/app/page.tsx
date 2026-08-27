'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { publicProfilesService } from '@/services/publicProfilesService';
import { favoritesService } from '@/services/favoritesService';
import { historyService } from '@/services/account/historyService';
import { followingService } from '@/services/account/followingService';
import { preferencesService } from '@/services/account/preferencesService';
import { recommendationService } from '@/services/discovery/recommendationService';
import { PublicAdvertiser, Category, DiscoveryProfileCard } from '@/types/app.types';
import { DEMO_PUBLIC_ADVERTISERS, DEMO_CATEGORIES, DEMO_CITIES } from '@/data/demoProfiles';
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
  Heart, 
  History, 
  Flame,
  Star,
  Eye,
  TrendingUp
} from 'lucide-react';

const INITIAL_CATEGORIES = DEMO_CATEGORIES.map((c) => ({ ...c, profileCount: 10 }));
const INITIAL_FEATURED = DEMO_PUBLIC_ADVERTISERS.slice(0, 10);
const INITIAL_RECOMMENDED = DEMO_PUBLIC_ADVERTISERS.slice(0, 10);
const INITIAL_RECENT = DEMO_PUBLIC_ADVERTISERS.slice(10, 20);
const INITIAL_CITIES = [
  { cityName: 'Salvador', citySlug: 'salvador', stateCode: 'BA', stateSlug: 'bahia', profileCount: 24 },
  { cityName: 'São Paulo', citySlug: 'sao-paulo', stateCode: 'SP', stateSlug: 'sao-paulo', profileCount: 10 },
  { cityName: 'Rio de Janeiro', citySlug: 'rio-de-janeiro', stateCode: 'RJ', stateSlug: 'rio-de-janeiro', profileCount: 8 },
  { cityName: 'Belo Horizonte', citySlug: 'belo-horizonte', stateCode: 'MG', stateSlug: 'minas-gerais', profileCount: 5 },
  { cityName: 'Brasília', citySlug: 'brasilia', stateCode: 'DF', stateSlug: 'distrito-federal', profileCount: 4 },
  { cityName: 'Recife', citySlug: 'recife', stateCode: 'PE', stateSlug: 'pernambuco', profileCount: 3 },
  { cityName: 'Fortaleza', citySlug: 'fortaleza', stateCode: 'CE', stateSlug: 'ceara', profileCount: 3 },
  { cityName: 'Curitiba', citySlug: 'curitiba', stateCode: 'PR', stateSlug: 'parana', profileCount: 3 },
];

export default function HomePage() {
  const router = useRouter();
  const { user, profile, isAdvertiser } = useAuth();

  const [selectedCity, setSelectedCity] = useState<{ cityName: string; citySlug: string; stateCode: string; stateSlug: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Instant initial data to completely eliminate empty sections and skeleton delays
  const [categories, setCategories] = useState<(Category & { profileCount: number })[]>(INITIAL_CATEGORIES);
  const [recommendedProfiles, setRecommendedProfiles] = useState<PublicAdvertiser[]>(INITIAL_RECOMMENDED);
  const [recentProfiles, setRecentProfiles] = useState<PublicAdvertiser[]>(INITIAL_RECENT);
  const [featuredProfiles, setFeaturedProfiles] = useState<PublicAdvertiser[]>(INITIAL_FEATURED);
  const [activeCities, setActiveCities] = useState(INITIAL_CITIES);

  // Authenticated Feeds
  const [forYouProfiles, setForYouProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [userRecentViews, setUserRecentViews] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Load Public Home Data on Mount (Instant & Non-blocking)
  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const [recs, recents, cats, cities, allAdv] = await Promise.all([
          publicProfilesService.getRecommendedAdvertisers(10),
          publicProfilesService.getRecentAdvertisers(10),
          publicProfilesService.getCategoriesWithCount(),
          publicProfilesService.getCitiesWithActiveProfiles(),
          publicProfilesService.getPublicAdvertisers({ limit: 10, sort: 'active' }),
        ]);

        if (isMounted) {
          setRecommendedProfiles(recs);
          setRecentProfiles(recents);
          setFeaturedProfiles(allAdv.data);
          setCategories(cats);
          setActiveCities(cities);
        }
      } catch (err) {
        console.error('Error loading public home data:', err);
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Authenticated User Feeds Separately
  useEffect(() => {
    let isMounted = true;

    async function loadUserFeeds() {
      if (!profile) {
        setForYouProfiles([]);
        setUserFavorites([]);
        setUserRecentViews([]);
        return;
      }

      try {
        const [userFavs, userHist, userPrefs] = await Promise.all([
          favoritesService.getUserFavorites(profile.id),
          historyService.getUserHistory(profile.id),
          preferencesService.getUserPreferences(profile.id),
        ]);

        if (isMounted) {
          setUserFavorites(userFavs.slice(0, 5));
          setUserRecentViews(userHist.slice(0, 5));

          if (!userPrefs || userPrefs.personalization_enabled) {
            const forYou = await recommendationService.getRecommendedHome(10);
            if (isMounted) {
              setForYouProfiles(forYou);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user feeds:', err);
      }
    }

    loadUserFeeds();

    return () => {
      isMounted = false;
    };
  }, [profile]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '4rem' }}>
      {/* 1. COMPACT HERO SECTION (Above-the-fold optimization) */}
      <section style={{ 
        paddingTop: '2.5rem', 
        paddingBottom: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(229, 185, 92, 0.08) 0%, transparent 70%)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
            <Badge variant="gold">PORTAL NACIONAL 18+</Badge>
            <Badge variant="ruby">ACESSO DISCRETO</Badge>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.85rem, 4.5vw, 3rem)', 
            fontWeight: 800, 
            lineHeight: 1.15, 
            marginBottom: '0.75rem', 
            letterSpacing: '-0.02em' 
          }}>
            Encontre acompanhantes na <span style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sua região</span>
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            A plataforma mais segura e discreta de anúncios para acompanhantes e profissionais independentes.
          </p>

          {/* Compact Hero Search Bar */}
          <Card variant="glass" padding="sm" style={{ maxWidth: '840px', margin: '0 auto 1.5rem auto', boxShadow: '0 16px 36px rgba(0,0,0,0.6)' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 260px' }}>
                <CityAutocomplete onSelectCity={setSelectedCity} placeholder="Digite sua cidade ou estado..." />
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <select
                  className="input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', height: '42px' }}
                >
                  <option value="">Todas as Categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="ruby" size="md" leftIcon={<Search size={16} />} style={{ flexShrink: 0, height: '42px' }}>
                Explorar
              </Button>
            </form>
          </Card>

          {/* Quick Filter Chips (Phase 24F — 3-Tier Non-Clipping Layout with Prefetch & Spacer) */}
          <div className="filter-chips-outer">
            <div className="filter-chips-scroller">
              <Link 
                href="/acompanhantes/bahia/salvador" 
                prefetch={true}
                className="filter-chip-item active"
                title="Acompanhantes em Salvador, BA"
              >
                <MapPin size={13} color="var(--accent-gold)" /> 
                <span>Salvador / BA ({activeCities.find(c => c.citySlug === 'salvador')?.profileCount || 24})</span>
              </Link>
              <Link 
                href="/acompanhantes/sao-paulo/sao-paulo" 
                prefetch={true}
                className="filter-chip-item"
                title="Acompanhantes em São Paulo, SP"
              >
                <MapPin size={13} color="var(--text-muted)" /> 
                <span>São Paulo / SP ({activeCities.find(c => c.citySlug === 'sao-paulo')?.profileCount || 10})</span>
              </Link>
              <Link 
                href="/acompanhantes/rio-de-janeiro/rio-de-janeiro" 
                prefetch={true}
                className="filter-chip-item"
                title="Acompanhantes no Rio de Janeiro, RJ"
              >
                <MapPin size={13} color="var(--text-muted)" /> 
                <span>Rio de Janeiro / RJ ({activeCities.find(c => c.citySlug === 'rio-de-janeiro')?.profileCount || 8})</span>
              </Link>
              <Link 
                href="/explorar?verificado=true" 
                prefetch={true}
                className="filter-chip-item"
                title="Filtrar por perfis verificados"
              >
                <ShieldCheck size={13} color="var(--color-success)" /> 
                <span>Verificados 18+</span>
              </Link>
              <Link 
                href="/categoria/massagistas" 
                prefetch={true}
                className="filter-chip-item"
                title="Ver categoria Massagistas"
              >
                <Tag size={13} color="var(--accent-gold)" /> 
                <span>Massagistas</span>
              </Link>
              <Link 
                href="/categoria/executivas-vip" 
                prefetch={true}
                className="filter-chip-item"
                title="Ver categoria Executivas VIP"
              >
                <Star size={13} color="var(--accent-gold)" /> 
                <span>Executivas VIP</span>
              </Link>
              {/* Explicit End Spacer for zero right-edge clipping */}
              <div className="filter-chips-spacer" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. AUTHENTICATED: "PARA VOCÊ" */}
      {profile && forYouProfiles.length > 0 && (
        <section className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                <Sparkles size={14} /> Recomendações Personalizadas
              </div>
              <h2 style={{ fontSize: '1.65rem' }}>Para Você</h2>
            </div>
            <Link href="/account/preferences">
              <Button variant="ghost" size="sm">
                Ajustar Preferências
              </Button>
            </Link>
          </div>

          <div className="advertiser-grid">
            {forYouProfiles.slice(0, 5).map((adv) => (
              <AdvertiserCard
                key={adv.advertiser_id}
                advertiser={{
                  advertiser_id: adv.advertiser_id,
                  slug: adv.slug,
                  stage_name: adv.stage_name,
                  age: adv.age,
                  city_name: adv.city_name,
                  state_code: adv.state_code,
                  headline: adv.headline,
                  primary_media_url: adv.thumbnail_url,
                  verification_status: adv.verification_status as any,
                  profile_status: 'active',
                  visibility: 'public',
                  category_names: [],
                  distance_label: adv.distance_label,
                  activity_label: adv.activity_label,
                  is_sponsored: adv.is_sponsored,
                } as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. PERFIS EM DESTAQUE (Featured Carousel / Grid) */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              <Flame size={15} color="var(--accent-ruby)" /> Vitrine Principal
            </div>
            <h2 style={{ fontSize: '1.65rem' }}>Perfis em Destaque</h2>
          </div>
          <Link href="/explorar?sort=active">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver todos ({featuredProfiles.length})
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="advertiser-grid">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} height="320px" borderRadius="var(--radius-lg)" />
            ))}
          </div>
        ) : (
          <div className="advertiser-grid">
            {featuredProfiles.slice(0, 5).map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 4. NOVOS PERFIS (Latest Additions) */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              <Sparkles size={14} /> Recém Aprovados
            </div>
            <h2 style={{ fontSize: '1.65rem' }}>Novos Anúncios</h2>
          </div>
          <Link href="/explorar?sort=recent">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver novidades
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="advertiser-grid">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} height="320px" borderRadius="var(--radius-lg)" />
            ))}
          </div>
        ) : (
          <div className="advertiser-grid">
            {recentProfiles.slice(0, 5).map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 5. CIDADES POPULARES (8 Principal Cities) */}
      {activeCities.length > 0 && (
        <section className="container">
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              <MapPin size={14} /> Cobertura Nacional
            </div>
            <h2 style={{ fontSize: '1.65rem' }}>Cidades Populares</h2>
          </div>

          <div className="discovery-card-grid">
            {activeCities.map((city, i) => (
              <Link
                key={i}
                href={`/acompanhantes/${city.stateSlug}/${city.citySlug}`}
                className="discovery-pill-card"
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                  {city.cityName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '0.4rem' }}>
                  {city.stateCode}
                </div>
                <Badge variant={city.citySlug === 'salvador' ? 'ruby' : 'neutral'}>
                  {city.profileCount} {city.profileCount === 1 ? 'perfil' : 'perfis'}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. CATEGORIAS VISUAIS */}
      <section className="container">
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            <Tag size={14} /> Estilos de Atendimento
          </div>
          <h2 style={{ fontSize: '1.65rem' }}>Categorias em Destaque</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/categoria/${cat.slug}`} style={{ textDecoration: 'none' }}>
              <Card variant="glass" padding="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all var(--transition-normal)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <Tag size={18} color="var(--accent-gold)" />
                    {cat.profileCount > 0 && <Badge variant="neutral">{cat.profileCount} perfis</Badge>}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>{cat.name}</h3>
                  {cat.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {cat.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-gold)', marginTop: '0.85rem', fontWeight: 600 }}>
                  Explorar <ArrowRight size={11} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. PERFIS RECOMENDADOS (Secondary Discovery Batch) */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              <TrendingUp size={14} /> Seleção Especial
            </div>
            <h2 style={{ fontSize: '1.65rem' }}>Mais Recomendados</h2>
          </div>
          <Link href="/explorar?sort=recommended">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
              Ver todos
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="advertiser-grid">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} height="320px" borderRadius="var(--radius-lg)" />
            ))}
          </div>
        ) : (
          <div className="advertiser-grid">
            {recommendedProfiles.slice(0, 5).map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 8. ADVERTISER CTA ("Quer aparecer aqui?") */}
      <section className="container">
        <Card variant="elevated" padding="lg" style={{ 
          background: 'linear-gradient(135deg, rgba(163, 0, 33, 0.22) 0%, rgba(18, 22, 31, 0.98) 100%)', 
          border: '1px solid rgba(255, 45, 85, 0.4)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-glow-ruby)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Badge variant="ruby">ESPAÇO DO ANUNCIANTE</Badge>
                <Badge variant="gold">CONVERSÃO DIRETA</Badge>
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>
                Quer aparecer aqui e receber contatos diretos?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                Divulgue seu perfil de forma independente com total segurança, controle de fotos, métricas de visualizações e sem intermediários.
              </p>
              <Link href={getAdvertiserCtaUrl()}>
                <Button variant="ruby" size="lg" leftIcon={<Megaphone size={18} />} style={{ fontWeight: 700, boxShadow: 'var(--shadow-glow-ruby)' }}>
                  Criar meu perfil agora
                </Button>
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229, 185, 92, 0.2)' }}>
                <div style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Alta Visibilidade</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Destaque local na sua cidade e bairro de atendimento.</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 45, 85, 0.2)' }}>
                <div style={{ color: 'var(--accent-ruby)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Controle Total</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Gerencie suas fotos, horários e canais de contato.</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Segurança & LGPD</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Proteção de dados com criptografia e privacidade.</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>Métricas Reais</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Acompanhe visualizações e cliques no WhatsApp.</div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 9. TRUST & SAFETY COMPACT CARDS */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <Link href="/trust/minors" style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="md" style={{ textAlign: 'center', height: '100%', transition: 'all var(--transition-normal)' }}>
              <ShieldCheck size={30} color="var(--accent-gold)" style={{ margin: '0 auto 0.65rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Maioridade Estrita 18+</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Verificação obrigatória e tolerância zero contra menores.</div>
            </Card>
          </Link>

          <Link href="/trust/moderation" style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="md" style={{ textAlign: 'center', height: '100%', transition: 'all var(--transition-normal)' }}>
              <CheckCircle2 size={30} color="var(--color-success)" style={{ margin: '0 auto 0.65rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Moderação Contínua</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Revisão rigorosa de fotos e conteúdo antes da publicação.</div>
            </Card>
          </Link>

          <Link href="/trust/privacy" style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="md" style={{ textAlign: 'center', height: '100%', transition: 'all var(--transition-normal)' }}>
              <Lock size={30} color="var(--color-info)" style={{ margin: '0 auto 0.65rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Privacidade & Sigilo</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Navegação segura com criptografia TLS 1.3 ponta a ponta.</div>
            </Card>
          </Link>

          <Link href="/account/privacy" style={{ textDecoration: 'none' }}>
            <Card variant="glass" padding="md" style={{ textAlign: 'center', height: '100%', transition: 'all var(--transition-normal)' }}>
              <ShieldAlert size={30} color="var(--accent-ruby)" style={{ margin: '0 auto 0.65rem auto' }} />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Canal de Denúncias</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Atendimento prioritário para qualquer suspeita de abuso.</div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
