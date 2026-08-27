'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';
import { favoritesService } from '@/services/favoritesService';
import { historyService } from '@/services/account/historyService';
import { preferencesService } from '@/services/account/preferencesService';
import { recommendationService } from '@/services/discovery/recommendationService';
import { PublicAdvertiser, Category, DiscoveryProfileCard } from '@/types/app.types';
import { DEMO_PUBLIC_ADVERTISERS, DEMO_CATEGORIES, DEMO_CITIES } from '@/data/demoProfiles';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { CityAutocomplete } from '@/components/public/CityAutocomplete';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  TrendingUp,
  X
} from 'lucide-react';

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

  // Search input state
  const [selectedSearchCity, setSelectedSearchCity] = useState<{ cityName: string; citySlug: string; stateCode: string; stateSlug: string } | null>(null);
  const [selectedSearchCategory, setSelectedSearchCategory] = useState<string>('');

  // 1. Instant In-Page Discovery Filter State (Phase 24G)
  const [activeCityFilter, setActiveCityFilter] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeVerifiedFilter, setActiveVerifiedFilter] = useState<boolean>(false);

  // Master profiles pool for instant client filtering
  const [allProfilesPool, setAllProfilesPool] = useState<PublicAdvertiser[]>(DEMO_PUBLIC_ADVERTISERS);
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEMO_CATEGORIES);
  const [activeCities, setActiveCities] = useState(INITIAL_CITIES);

  // Authenticated Feeds
  const [forYouProfiles, setForYouProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [userRecentViews, setUserRecentViews] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);

  // 2. Load Public Home Data on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const [cats, cities, allAdv] = await Promise.all([
          locationService.getCategories(),
          publicProfilesService.getCitiesWithActiveProfiles(),
          publicProfilesService.getPublicAdvertisers({ limit: 100 }),
        ]);

        if (isMounted) {
          if (allAdv?.data && allAdv.data.length > 0) {
            setAllProfilesPool(allAdv.data);
          }
          if (cats && cats.length > 0) {
            setCategoriesList(cats);
          }
          if (cities && cities.length > 0) {
            setActiveCities(cities);
          }
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

  // 3. Load Authenticated User Feeds Separately
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

  // 4. Instant In-Memory Filter Evaluation (< 1ms)
  const filteredProfiles = useMemo(() => {
    const targetCat = activeCategoryFilter
      ? categoriesList.find((c) => c.slug === activeCategoryFilter)
      : null;
    const targetCatId = targetCat?.id || activeCategoryFilter;

    return allProfilesPool.filter((adv) => {
      if (activeCityFilter && adv.city_slug !== activeCityFilter) {
        return false;
      }
      if (targetCatId) {
        const matchCategory = adv.category_ids?.some(
          (catId) => catId === targetCatId || catId === activeCategoryFilter
        );
        if (!matchCategory) return false;
      }
      if (activeVerifiedFilter) {
        if (adv.verification_status !== 'verified' && adv.verification_status !== 'approved') return false;
      }
      return true;
    });
  }, [allProfilesPool, activeCityFilter, activeCategoryFilter, activeVerifiedFilter, categoriesList]);

  // Derived sections
  const displayedFeatured = useMemo(() => filteredProfiles.slice(0, 10), [filteredProfiles]);
  const displayedRecent = useMemo(() => [...filteredProfiles].reverse().slice(0, 10), [filteredProfiles]);
  const displayedRecommended = useMemo(() => filteredProfiles.slice(0, 10), [filteredProfiles]);

  // Category counts based on active city
  const categoriesWithCounts = useMemo(() => {
    return categoriesList.map((cat) => {
      const count = allProfilesPool.filter((adv) => {
        if (activeCityFilter && adv.city_slug !== activeCityFilter) return false;
        return adv.category_ids?.includes(cat.id);
      }).length;
      return {
        ...cat,
        profileCount: count,
      };
    });
  }, [categoriesList, allProfilesPool, activeCityFilter]);

  // Filter Actions
  const handleCityToggle = (slug: string) => {
    setActiveCityFilter((prev) => (prev === slug ? null : slug));
  };

  const handleCategoryToggle = (slug: string) => {
    setActiveCategoryFilter((prev) => (prev === slug ? null : slug));
  };

  const handleVerifiedToggle = () => {
    setActiveVerifiedFilter((prev) => !prev);
  };

  const handleResetFilters = () => {
    setActiveCityFilter(null);
    setActiveCategoryFilter(null);
    setActiveVerifiedFilter(false);
  };

  const isAnyFilterActive = activeCityFilter !== null || activeCategoryFilter !== null || activeVerifiedFilter;

  // Active City Info
  const currentActiveCityInfo = useMemo(() => {
    if (!activeCityFilter) return null;
    return activeCities.find((c) => c.citySlug === activeCityFilter) || null;
  }, [activeCityFilter, activeCities]);

  const activeCategoryInfo = useMemo(() => {
    if (!activeCategoryFilter) return null;
    return categoriesList.find((c) => c.slug === activeCategoryFilter) || null;
  }, [activeCategoryFilter, categoriesList]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSearchCity) {
      setActiveCityFilter(selectedSearchCity.citySlug);
    }
    if (selectedSearchCategory) {
      setActiveCategoryFilter(selectedSearchCategory);
    }
    if (!selectedSearchCity && !selectedSearchCategory) {
      router.push('/explorar');
    }
  };

  const getAdvertiserCtaUrl = () => {
    if (!user) return '/register';
    if (!isAdvertiser) return '/advertiser/start';
    return '/advertiser';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '4rem' }}>
      {/* 1. COMPACT HERO SECTION (Instant Filter Powered) */}
      <section style={{ 
        paddingTop: '2.5rem', 
        paddingBottom: '1.5rem',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(229, 185, 92, 0.08) 0%, transparent 70%)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '980px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Badge variant="gold">PORTAL NACIONAL 18+</Badge>
            <Badge variant="ruby">ACESSO DISCRETO</Badge>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.4rem' }}>
            {currentActiveCityInfo ? (
              <>
                Acompanhantes em <span style={{ color: 'var(--accent-gold)' }}>{currentActiveCityInfo.cityName}, {currentActiveCityInfo.stateCode}</span>
              </>
            ) : activeCategoryInfo ? (
              <>
                Encontre <span style={{ color: 'var(--accent-gold)' }}>{activeCategoryInfo.name}</span>
              </>
            ) : (
              <>
                Encontre acompanhantes na <span style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sua região</span>
              </>
            )}
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.45 }}>
            {currentActiveCityInfo ? (
              `${filteredProfiles.length} anúncios disponíveis em ${currentActiveCityInfo.cityName} • Contato direto via WhatsApp e maioridade estrita.`
            ) : (
              'A plataforma mais segura e discreta de anúncios para acompanhantes e profissionais independentes.'
            )}
          </p>

          {/* Compact Hero Search Bar */}
          <Card variant="glass" padding="sm" style={{ maxWidth: '840px', margin: '0 auto 1.25rem auto', boxShadow: '0 16px 36px rgba(0,0,0,0.6)' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 260px' }}>
                <CityAutocomplete onSelectCity={setSelectedSearchCity} placeholder="Digite sua cidade ou estado..." />
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <select
                  className="input"
                  value={selectedSearchCategory}
                  onChange={(e) => setSelectedSearchCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', height: '42px' }}
                >
                  <option value="">Todas as Categorias</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" variant="ruby" size="md" leftIcon={<Search size={16} />} style={{ flexShrink: 0, height: '42px' }}>
                Filtrar
              </Button>
            </form>
          </Card>

          {/* 2. INSTANT QUICK FILTERS (Phase 24G — In-Page Zero-Route Switching & Desktop Wrap) */}
          <div className="filter-chips-outer">
            <div className="filter-chips-scroller" role="toolbar" aria-label="Filtros rápidos de descoberta">
              {/* Reset/Todos Button */}
              <button
                type="button"
                onClick={handleResetFilters}
                className={`filter-chip-button ${!isAnyFilterActive ? 'active' : ''}`}
                aria-pressed={!isAnyFilterActive}
              >
                <span>Todos ({allProfilesPool.length})</span>
              </button>

              {/* Salvador */}
              <button
                type="button"
                onClick={() => handleCityToggle('salvador')}
                className={`filter-chip-button ${activeCityFilter === 'salvador' ? 'active' : ''}`}
                aria-pressed={activeCityFilter === 'salvador'}
              >
                <MapPin size={13} color="var(--accent-gold)" />
                <span>Salvador / BA ({allProfilesPool.filter(p => p.city_slug === 'salvador').length})</span>
              </button>

              {/* São Paulo */}
              <button
                type="button"
                onClick={() => handleCityToggle('sao-paulo')}
                className={`filter-chip-button ${activeCityFilter === 'sao-paulo' ? 'active' : ''}`}
                aria-pressed={activeCityFilter === 'sao-paulo'}
              >
                <MapPin size={13} color="var(--accent-gold)" />
                <span>São Paulo / SP ({allProfilesPool.filter(p => p.city_slug === 'sao-paulo').length})</span>
              </button>

              {/* Rio de Janeiro */}
              <button
                type="button"
                onClick={() => handleCityToggle('rio-de-janeiro')}
                className={`filter-chip-button ${activeCityFilter === 'rio-de-janeiro' ? 'active' : ''}`}
                aria-pressed={activeCityFilter === 'rio-de-janeiro'}
              >
                <MapPin size={13} color="var(--accent-gold)" />
                <span>Rio de Janeiro / RJ ({allProfilesPool.filter(p => p.city_slug === 'rio-de-janeiro').length})</span>
              </button>

              {/* Verificados */}
              <button
                type="button"
                onClick={handleVerifiedToggle}
                className={`filter-chip-button ${activeVerifiedFilter ? 'active' : ''}`}
                aria-pressed={activeVerifiedFilter}
              >
                <ShieldCheck size={13} color="var(--color-success)" />
                <span>Verificados 18+</span>
              </button>

              {/* Massagistas */}
              <button
                type="button"
                onClick={() => handleCategoryToggle('massagistas')}
                className={`filter-chip-button ${activeCategoryFilter === 'massagistas' ? 'active' : ''}`}
                aria-pressed={activeCategoryFilter === 'massagistas'}
              >
                <Tag size={13} color="var(--accent-gold)" />
                <span>Massagistas</span>
              </button>

              {/* Executivas VIP */}
              <button
                type="button"
                onClick={() => handleCategoryToggle('executivas-vip')}
                className={`filter-chip-button ${activeCategoryFilter === 'executivas-vip' ? 'active' : ''}`}
                aria-pressed={activeCategoryFilter === 'executivas-vip'}
              >
                <Star size={13} color="var(--accent-gold)" />
                <span>Executivas VIP</span>
              </button>

              {/* Clear Filters Button (When Active) */}
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="filter-chip-button"
                  style={{ borderColor: 'var(--accent-ruby)', color: 'var(--accent-ruby)' }}
                  title="Limpar todos os filtros"
                >
                  <X size={13} />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Context Bar */}
          {isAnyFilterActive && (
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Filtro ativo:</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                {currentActiveCityInfo ? `${currentActiveCityInfo.cityName}, ${currentActiveCityInfo.stateCode}` : ''}
                {currentActiveCityInfo && activeCategoryInfo ? ' • ' : ''}
                {activeCategoryInfo ? activeCategoryInfo.name : ''}
                {activeVerifiedFilter ? ' • Verificados 18+' : ''}
              </span>
              <span>({filteredProfiles.length} {filteredProfiles.length === 1 ? 'anúncio' : 'anúncios'})</span>
              {currentActiveCityInfo && (
                <Link
                  href={`/acompanhantes/${currentActiveCityInfo.stateSlug}/${currentActiveCityInfo.citySlug}`}
                  style={{ color: 'var(--accent-gold)', marginLeft: '0.35rem', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Ver página regional completa →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. AUTHENTICATED: FOR YOU / RECENT / FAVORITES */}
      {profile && forYouProfiles.length > 0 && (
        <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Recomendados para Você</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Com base nas suas preferências e buscas recentes
              </p>
            </div>
            <Link href="/explorar?tab=foryou" style={{ color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 600 }}>
              Ver todos →
            </Link>
          </div>

          <div className="advertiser-carousel">
            {forYouProfiles.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv as any} />
            ))}
          </div>
        </section>
      )}

      {/* 3. PERFIS EM DESTAQUE (Updated instantly on filter toggle) */}
      <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.15rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Flame size={18} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {currentActiveCityInfo ? `Destaques em ${currentActiveCityInfo.cityName}` : 'Perfis em Destaque'}
              </h2>
              <Badge variant="neutral" style={{ marginLeft: '0.25rem' }}>
                {displayedFeatured.length}
              </Badge>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              {currentActiveCityInfo 
                ? `Anúncios com maior visibilidade e reputação em ${currentActiveCityInfo.cityName}`
                : 'Anúncios com maior visibilidade e pontuação de reputação na plataforma'}
            </p>
          </div>
          {currentActiveCityInfo ? (
            <Link href={`/acompanhantes/${currentActiveCityInfo.stateSlug}/${currentActiveCityInfo.citySlug}`} style={{ color: 'var(--accent-gold)', fontSize: '0.825rem', fontWeight: 600 }}>
              Ver todos em {currentActiveCityInfo.cityName} →
            </Link>
          ) : (
            <Link href="/explorar?sort=score" style={{ color: 'var(--accent-gold)', fontSize: '0.825rem', fontWeight: 600 }}>
              Ver todos →
            </Link>
          )}
        </div>

        {displayedFeatured.length === 0 ? (
          <Card variant="glass" padding="md" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Nenhum perfil encontrado com os filtros selecionados.
            </p>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Limpar filtros
            </Button>
          </Card>
        ) : (
          <div className="advertiser-grid">
            {displayedFeatured.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 4. NOVOS ANÚNCIOS (Instant in-memory updates) */}
      <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.15rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={18} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                {currentActiveCityInfo ? `Novos Anúncios em ${currentActiveCityInfo.cityName}` : 'Novos Anúncios'}
              </h2>
              <Badge variant="neutral" style={{ marginLeft: '0.25rem' }}>
                {displayedRecent.length}
              </Badge>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Perfis recém-publicados e verificados com fotos moderadas
            </p>
          </div>
          {currentActiveCityInfo ? (
            <Link href={`/acompanhantes/${currentActiveCityInfo.stateSlug}/${currentActiveCityInfo.citySlug}`} style={{ color: 'var(--accent-gold)', fontSize: '0.825rem', fontWeight: 600 }}>
              Ver todos em {currentActiveCityInfo.cityName} →
            </Link>
          ) : (
            <Link href="/explorar?sort=recent" style={{ color: 'var(--accent-gold)', fontSize: '0.825rem', fontWeight: 600 }}>
              Ver novidades →
            </Link>
          )}
        </div>

        {displayedRecent.length === 0 ? (
          <Card variant="glass" padding="md" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              Nenhum novo anúncio encontrado com os filtros selecionados.
            </p>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Limpar filtros
            </Button>
          </Card>
        ) : (
          <div className="advertiser-grid">
            {displayedRecent.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        )}
      </section>

      {/* 5. CATEGORIAS DE ATENDIMENTO (Counts reflect active city) */}
      <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <Tag size={18} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            {currentActiveCityInfo ? `Categorias em ${currentActiveCityInfo.cityName}` : 'Categorias em Destaque'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {categoriesWithCounts.map((cat) => {
            const isCatActive = activeCategoryFilter === cat.slug;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.slug)}
                className={`discovery-pill-card ${isCatActive ? 'active' : ''}`}
                style={{
                  border: isCatActive ? '1px solid var(--accent-gold)' : undefined,
                  background: isCatActive ? 'rgba(229, 185, 92, 0.15)' : undefined,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: isCatActive ? 'var(--accent-gold)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {cat.profileCount} {cat.profileCount === 1 ? 'anúncio' : 'anúncios'}
                  </div>
                </div>
                <ArrowRight size={14} color={isCatActive ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. CIDADES POPULARES (With in-page quick select and regional landing links) */}
      <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <MapPin size={18} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Cidades Populares</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
          {activeCities.map((city) => {
            const isCityActive = activeCityFilter === city.citySlug;
            return (
              <button
                type="button"
                key={city.citySlug}
                onClick={() => handleCityToggle(city.citySlug)}
                className={`discovery-pill-card ${isCityActive ? 'active' : ''}`}
                style={{
                  border: isCityActive ? '1px solid var(--accent-gold)' : undefined,
                  background: isCityActive ? 'rgba(229, 185, 92, 0.15)' : undefined,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: isCityActive ? 'var(--accent-gold)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {city.cityName} / {city.stateCode}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {allProfilesPool.filter((p) => p.city_slug === city.citySlug).length} anúncios ativos
                  </div>
                </div>
                <ArrowRight size={14} color={isCityActive ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. TRUST & SAFETY BANNER */}
      <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <Card variant="glass" padding="md" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <ShieldCheck size={32} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Maioridade Estrita 18+</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Todos os anunciantes passam por validação documental de idade antes de qualquer publicação.
              </p>
            </div>
          </Card>

          <Card variant="glass" padding="md" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Lock size={32} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Privacidade & Sigilo</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Acesso anônimo para visitantes. Seus dados e histórico de navegação não são compartilhados.
              </p>
            </div>
          </Card>

          <Card variant="glass" padding="md" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={32} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Moderação Contínua</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Auditoria rigorosa de fotos e denúncias ativas 24/7 contra perfis falsos ou fraudulentos.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 8. ADVERTISER CONVERSION CTA */}
      <section className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        <Card variant="elevated" padding="lg" style={{ 
          background: 'linear-gradient(135deg, rgba(229, 185, 92, 0.15) 0%, rgba(18, 22, 31, 0.95) 100%)', 
          border: '1px solid rgba(229, 185, 92, 0.35)',
          padding: '2.5rem 2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
            Você é acompanhante profissional?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Crie seu anúncio no Portal18, alcance milhares de clientes qualificados na sua região e tenha controle total sobre seus contatos e valores.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href={getAdvertiserCtaUrl()}>
              <Button variant="primary" size="lg" leftIcon={<Megaphone size={18} />}>
                Anunciar Meu Perfil
              </Button>
            </Link>
            <Link href="/plans">
              <Button variant="secondary" size="lg">
                Conhecer Planos VIP
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
