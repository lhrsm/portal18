'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { publicProfilesService, RegionalStatsGroup, IdentityCounts } from '@/services/publicProfilesService';
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
  Lock,
  ArrowRight,
  CheckCircle2,
  Star,
  Compass,
  Users,
  Building,
  UserCheck,
  ChevronDown,
  ChevronUp
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
  const [selectedSearchIdentity, setSelectedSearchIdentity] = useState<string>('todos');

  // In-Page Discovery Filter State
  const [activeCityFilter, setActiveCityFilter] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeIdentityFilter, setActiveIdentityFilter] = useState<string>('todos');
  const [activeVerifiedFilter, setActiveVerifiedFilter] = useState<boolean>(false);

  // Master profiles pool for instant client filtering & aggregations
  const [allProfilesPool, setAllProfilesPool] = useState<PublicAdvertiser[]>(DEMO_PUBLIC_ADVERTISERS);
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEMO_CATEGORIES);
  const [activeCities, setActiveCities] = useState(INITIAL_CITIES);
  const [identityCounts, setIdentityCounts] = useState<IdentityCounts>({
    total: DEMO_PUBLIC_ADVERTISERS.length,
    mulheres: 0,
    homens: 0,
    travestis_trans: 0,
    nao_binario_outros: 0,
  });
  const [regionalStats, setRegionalStats] = useState<RegionalStatsGroup[]>([]);
  const [selectedRegionTab, setSelectedRegionTab] = useState<string>('Nordeste');
  const [mobileExpandedRegion, setMobileExpandedRegion] = useState<string | null>('Nordeste');

  // Authenticated Feeds
  const [forYouProfiles, setForYouProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [userRecentViews, setUserRecentViews] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<any[]>([]);

  // 1. Load Public Home Data on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const [cats, cities, allAdv, idCounts, regStats] = await Promise.all([
          locationService.getCategories(),
          publicProfilesService.getCitiesWithActiveProfiles(),
          publicProfilesService.getPublicAdvertisers({ limit: 100 }),
          publicProfilesService.getDiscoveryIdentityCounts(),
          publicProfilesService.getRegionalDiscoveryStats(),
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
          if (idCounts) {
            setIdentityCounts(idCounts);
          }
          if (regStats && regStats.length > 0) {
            setRegionalStats(regStats);
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

  // 3. Filtered In-Page Profiles
  const filteredProfiles = useMemo(() => {
    return allProfilesPool.filter((p) => {
      // City filter
      if (activeCityFilter && p.city_slug !== activeCityFilter) {
        return false;
      }
      // Category filter
      if (activeCategoryFilter) {
        const targetCat = categoriesList.find((c) => c.slug === activeCategoryFilter);
        if (!targetCat || !p.category_ids || !p.category_ids.includes(targetCat.id)) {
          return false;
        }
      }
      // Identity filter
      if (activeIdentityFilter !== 'todos') {
        const g = (p.gender || 'mulheres').toLowerCase();
        if (activeIdentityFilter === 'mulheres' && g !== 'mulheres' && g !== 'feminino') return false;
        if (activeIdentityFilter === 'homens' && g !== 'homens' && g !== 'masculino') return false;
        if (activeIdentityFilter === 'travestis_trans' && g !== 'travestis_trans' && g !== 'trans_travesti') return false;
        if (activeIdentityFilter === 'nao_binario_outros' && g !== 'nao_binario_outros' && g !== 'casal_dupla') return false;
      }
      // Verified filter
      if (activeVerifiedFilter && p.verification_status !== 'verified') {
        return false;
      }
      return true;
    });
  }, [allProfilesPool, activeCityFilter, activeCategoryFilter, activeIdentityFilter, activeVerifiedFilter, categoriesList]);

  // Featured Profiles
  const featuredProfiles = useMemo(() => {
    return [...filteredProfiles]
      .sort((a, b) => {
        if (a.verification_status === 'verified' && b.verification_status !== 'verified') return -1;
        if (a.verification_status !== 'verified' && b.verification_status === 'verified') return 1;
        return (b.approved_media_count || 0) - (a.approved_media_count || 0);
      })
      .slice(0, 8);
  }, [filteredProfiles]);

  // Newest Profiles
  const newestProfiles = useMemo(() => {
    return [...filteredProfiles]
      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
      .slice(0, 8);
  }, [filteredProfiles]);

  const handleIdentitySelect = (identity: string) => {
    setActiveIdentityFilter(identity);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedSearchCity) {
      params.set('cidade', selectedSearchCity.citySlug);
      params.set('estado', selectedSearchCity.stateSlug);
    }
    if (selectedSearchIdentity && selectedSearchIdentity !== 'todos') {
      params.set('genero', selectedSearchIdentity);
    }
    if (selectedSearchCategory) {
      params.set('categoria', selectedSearchCategory);
    }

    if (params.toString()) {
      router.push(`/explorar?${params.toString()}`);
    } else {
      router.push('/explorar');
    }
  };

  const getAdvertiserCtaUrl = () => {
    if (!user) return '/register';
    if (!isAdvertiser) return '/advertiser/start';
    return '/advertiser';
  };

  return (
    <div className="home-container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '3.5rem' }}>
      {/* 1. HERO ORIENTADO À DESCOBERTA (Sections 5, 6, 7 & 8) */}
      <section style={{
        paddingTop: '1.5rem',
        paddingBottom: '1.25rem',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(229, 185, 92, 0.08) 0%, transparent 70%)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto', padding: '0 1rem' }}>
          {/* Discreet Hero Badge */}
          <div style={{ marginBottom: '0.6rem' }}>
            <Badge variant="gold" style={{ fontSize: '0.725rem', padding: '0.2rem 0.55rem' }}>
              <ShieldCheck size={12} /> PORTAL NACIONAL 18+ • MAIORIDADE VERIFICADA
            </Badge>
          </div>

          <h1 style={{ fontSize: 'clamp(1.65rem, 4.5vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.45rem', letterSpacing: '-0.02em' }}>
            Encontre perfis na <span style={{ color: 'var(--accent-gold)' }}>sua região</span>
          </h1>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45, maxWidth: '620px', margin: '0 auto 1.25rem auto' }}>
            A plataforma nacional de anúncios para acompanhantes e profissionais independentes com maioridade verificada 18+.
          </p>

          {/* Unified Search Form (Full-width & compact on mobile, row on desktop) */}
          <Card variant="glass" padding="sm" style={{ maxWidth: '840px', margin: '0 auto', boxShadow: 'var(--shadow-md)' }}>
            <form onSubmit={handleSearchSubmit} className="hero-search-form">
              {/* 1. Location Autocomplete */}
              <div className="hero-search-field field-location">
                <CityAutocomplete onSelectCity={setSelectedSearchCity} placeholder="Digite cidade ou estado..." />
              </div>

              {/* 2. Quem você procura? */}
              <div className="hero-search-field field-identity">
                <select
                  className="input"
                  value={selectedSearchIdentity}
                  onChange={(e) => setSelectedSearchIdentity(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', height: '46px' }}
                  aria-label="Quem você procura?"
                >
                  <option value="todos">Quem procura? (Todos)</option>
                  <option value="mulheres">Mulheres</option>
                  <option value="homens">Homens</option>
                  <option value="travestis_trans">Travestis & Trans</option>
                  <option value="nao_binario_outros">Não binário / Outros</option>
                </select>
              </div>

              {/* 3. Category */}
              <div className="hero-search-field field-category">
                <select
                  className="input"
                  value={selectedSearchCategory}
                  onChange={(e) => setSelectedSearchCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', height: '46px' }}
                  aria-label="Categoria"
                >
                  <option value="">Todas as Categorias</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Action Button */}
              <Button type="submit" variant="ruby" size="md" leftIcon={<Search size={16} />} className="hero-search-btn" style={{ height: '46px', fontWeight: 700 }}>
                Buscar
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* 2. EXPLORAR POR PERFIL COM CONTAGEM REAL (Sections 9 & 10) */}
      <section className="container">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Users size={18} color="var(--accent-gold)" /> Explore por perfil
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
            Selecione uma categoria para filtrar anúncios com contagem em tempo real.
          </p>
        </div>

        {/* 2-Column Mobile Grid, Multi-column Desktop */}
        <div className="taxonomy-profile-grid">
          {[
            { id: 'todos', label: 'Todos os Perfis', count: identityCounts.total },
            { id: 'mulheres', label: 'Mulheres', count: identityCounts.mulheres },
            { id: 'homens', label: 'Homens', count: identityCounts.homens },
            { id: 'travestis_trans', label: 'Travestis & Trans', count: identityCounts.travestis_trans },
            { id: 'nao_binario_outros', label: 'Não binário / Outros', count: identityCounts.nao_binario_outros },
          ].map((item) => {
            const isSelected = activeIdentityFilter === item.id;
            return (
              <Card
                key={item.id}
                variant={isSelected ? 'bordered' : 'glass'}
                padding="sm"
                onClick={() => handleIdentitySelect(item.id)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(229, 185, 92, 0.1)' : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  padding: '0.75rem 0.85rem',
                  minHeight: '68px',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                  {isSelected && <CheckCircle2 size={13} color="var(--accent-gold)" />}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.count}</strong> {item.count === 1 ? 'perfil' : 'perfis'}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. EXPLORAR POR REGIÃO E NAVEGAÇÃO NACIONAL (Sections 11 & 12) */}
      <section className="container">
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Compass size={18} color="var(--accent-gold)" /> Navegação Nacional — Por Região
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
            Selecione sua macrorregião para descobrir perfis nos estados brasileiros.
          </p>
        </div>

        {/* Desktop View: Tabs + Grid */}
        <div className="desktop-region-view">
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.4rem', marginBottom: '0.85rem' }} role="tablist">
            {['Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste', 'Norte'].map((reg) => {
              const isSelected = selectedRegionTab === reg;
              const regGroup = regionalStats.find((r) => r.region === reg);
              const count = regGroup ? regGroup.totalProfiles : 0;
              return (
                <button
                  key={reg}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedRegionTab(reg)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-gold)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#000' : 'var(--text-primary)',
                    fontWeight: isSelected ? 700 : 500,
                    border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{reg}</span>
                  <span style={{ fontSize: '0.725rem', opacity: isSelected ? 0.9 : 0.6 }}>({count})</span>
                </button>
              );
            })}
          </div>

          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            {(() => {
              const currentGroup = regionalStats.find((r) => r.region === selectedRegionTab);
              const statesList = currentGroup?.states || [];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                  {statesList.map((st) => (
                    <Link
                      key={st.code}
                      href={`/acompanhantes/${st.slug}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: st.profileCount > 0 ? 'rgba(229, 185, 92, 0.05)' : 'var(--bg-secondary)',
                        border: `1px solid ${st.profileCount > 0 ? 'rgba(229, 185, 92, 0.25)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <MapPin size={13} color={st.profileCount > 0 ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {st.name} ({st.code})
                        </span>
                      </div>
                      <Badge variant={st.profileCount > 0 ? 'gold' : 'neutral'} style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                        {st.profileCount}
                      </Badge>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </Card>
        </div>

        {/* Mobile View: Vertical Accordion */}
        <div className="mobile-region-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste', 'Norte'].map((reg) => {
            const isExpanded = mobileExpandedRegion === reg;
            const regGroup = regionalStats.find((r) => r.region === reg);
            const count = regGroup ? regGroup.totalProfiles : 0;
            const statesList = regGroup?.states || [];

            return (
              <div
                key={reg}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setMobileExpandedRegion(isExpanded ? null : reg)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: isExpanded ? 'rgba(229, 185, 92, 0.08)' : 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    minHeight: '44px',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{reg}</span>
                    <Badge variant={count > 0 ? 'gold' : 'neutral'} style={{ fontSize: '0.7rem' }}>
                      {count} {count === 1 ? 'perfil' : 'perfis'}
                    </Badge>
                  </div>
                  {isExpanded ? <ChevronUp size={16} color="var(--accent-gold)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0.5rem 0.75rem 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {statesList.map((st) => (
                      <Link
                        key={st.code}
                        href={`/acompanhantes/${st.slug}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.75rem',
                          background: st.profileCount > 0 ? 'rgba(229, 185, 92, 0.04)' : 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${st.profileCount > 0 ? 'rgba(229, 185, 92, 0.2)' : 'var(--border-subtle)'}`,
                          textDecoration: 'none',
                          minHeight: '40px',
                        }}
                      >
                        <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {st.name} ({st.code})
                        </span>
                        <span style={{ fontSize: '0.775rem', color: st.profileCount > 0 ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {st.profileCount} {st.profileCount === 1 ? 'perfil' : 'perfis'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PERFIS EM DESTAQUE (Sections 13, 14 & 52) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Star size={18} color="var(--accent-gold)" /> Perfis em Destaque
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Anúncios verificados de alta relevância com fotos completas.
            </p>
          </div>
          <Link href="/explorar?sort=active">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>
              Ver todos
            </Button>
          </Link>
        </div>

        {featuredProfiles.length > 0 ? (
          <div className="advertiser-grid">
            {featuredProfiles.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        ) : (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhum perfil encontrado para os filtros selecionados.</p>
          </Card>
        )}
      </section>

      {/* 5. NOVOS PERFIS (Sections 13, 14 & 52) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles size={18} color="var(--accent-ruby)" /> Novos Perfis Publicados
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              Anúncios recém-aprovados pela equipe de moderação.
            </p>
          </div>
          <Link href="/explorar?sort=recent">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}>
              Ver novidades
            </Button>
          </Link>
        </div>

        {newestProfiles.length > 0 ? (
          <div className="advertiser-grid">
            {newestProfiles.map((adv) => (
              <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
            ))}
          </div>
        ) : (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhum perfil recente no momento.</p>
          </Card>
        )}
      </section>

      {/* 6. CIDADES POPULARES */}
      <section className="container">
        <div style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Building size={18} color="var(--accent-gold)" /> Cidades com Maior Atividade
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
            Acesse centros urbanos com maior número de profissionais cadastrados.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
          {activeCities.slice(0, 8).map((city) => (
            <Link
              key={city.citySlug}
              href={`/acompanhantes/${city.stateSlug}/${city.citySlug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0.85rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                minHeight: '44px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  {city.cityName}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {city.stateCode} • Brasil
                </div>
              </div>
              <Badge variant="gold" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                {city.profileCount}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. CATEGORIAS DE ATENDIMENTO */}
      <section className="container">
        <div style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Tag size={18} color="var(--accent-gold)" /> Categorias de Atendimento
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
            Especialidades e modalidades de serviço para todos os públicos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
          {categoriesList.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              style={{
                padding: '0.85rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                minHeight: '44px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {cat.description || 'Profissionais qualificados para atendimento personalizado.'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. CENTRAL DE SEGURANÇA E CONFORMIDADE */}
      <section className="container">
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)', background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={20} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Segurança e Confiança no Portal18</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 }}>
              Privacidade total para visitantes e ambiente seguro para anunciantes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {/* Para Visitantes */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={15} /> Para Visitantes
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: 0, listStyle: 'none' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Zero Biometria:</strong> Nunca armazenamos selfies ou documentos.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Anti-Golpe:</strong> Perfis moderados com canais auditados.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Contato Seguro:</strong> Redirecionamento direto ao WhatsApp.</span>
                </li>
              </ul>
              <div style={{ marginTop: '0.85rem' }}>
                <Link href="/trust">
                  <Button variant="outline" size="sm" fullWidth style={{ minHeight: '38px', fontSize: '0.8rem' }}>
                    Ver Trust Center 18+
                  </Button>
                </Link>
              </div>
            </div>

            {/* Para Anunciantes */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-ruby)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={15} /> Para Anunciantes
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: 0, listStyle: 'none' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Sigilo Absoluto:</strong> Nome civil 100% confidencial.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Controle de Mídias:</strong> Proteção de fotos e vídeos.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                  <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Suporte Prioritário:</strong> Atendimento direto com moderação.</span>
                </li>
              </ul>
              <div style={{ marginTop: '0.85rem' }}>
                <Link href="/help">
                  <Button variant="outline" size="sm" fullWidth style={{ minHeight: '38px', fontSize: '0.8rem' }}>
                    Central de Ajuda
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 9. CTA CONTEXTUAL PARA ANUNCIANTES */}
      <section className="container">
        <Card
          variant="glass"
          padding="lg"
          style={{
            background: 'linear-gradient(135deg, rgba(229, 185, 92, 0.1) 0%, rgba(255, 45, 85, 0.07) 100%)',
            border: '1px solid rgba(229, 185, 92, 0.3)',
            textAlign: 'center',
            padding: '2.5rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ maxWidth: '580px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.85rem)', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.2 }}>
              Anuncie no <span style={{ color: 'var(--accent-gold)' }}>Portal18</span> e alcance novos clientes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.45 }}>
              Publique com total privacidade, receba contatos diretos no WhatsApp e tenha a garantia do selo oficial 18+.
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href={getAdvertiserCtaUrl()} style={{ textDecoration: 'none', flex: '1 1 200px' }}>
                <Button variant="ruby" size="lg" leftIcon={<Megaphone size={16} />} style={{ fontWeight: 700, width: '100%', minHeight: '44px' }}>
                  Criar Anúncio Profissional
                </Button>
              </Link>
              <Link href="/trust" style={{ textDecoration: 'none', flex: '1 1 140px' }}>
                <Button variant="secondary" size="lg" style={{ width: '100%', minHeight: '44px' }}>
                  Como Funciona
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
