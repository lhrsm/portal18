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
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Heart, 
  History, 
  Star, 
  Eye, 
  TrendingUp, 
  X,
  Compass,
  Users,
  Building,
  UserCheck
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
      // Identity filter (Phase 26C)
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

  // Featured Profiles (High score or verified)
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

  // Filter Handlers
  const handleCityToggle = (citySlug: string) => {
    setActiveCityFilter((prev) => (prev === citySlug ? null : citySlug));
  };

  const handleCategoryToggle = (slug: string) => {
    setActiveCategoryFilter((prev) => (prev === slug ? null : slug));
  };

  const handleIdentitySelect = (identity: string) => {
    setActiveIdentityFilter(identity);
  };

  const handleVerifiedToggle = () => {
    setActiveVerifiedFilter((prev) => !prev);
  };

  const handleResetFilters = () => {
    setActiveCityFilter(null);
    setActiveCategoryFilter(null);
    setActiveIdentityFilter('todos');
    setActiveVerifiedFilter(false);
  };

  const isAnyFilterActive = activeCityFilter !== null || activeCategoryFilter !== null || activeIdentityFilter !== 'todos' || activeVerifiedFilter;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '4rem' }}>
      {/* 1. HERO ORIENTADO À DESCOBERTA (Section 8) */}
      <section style={{ 
        paddingTop: '2.5rem', 
        paddingBottom: '2rem',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(229, 185, 92, 0.08) 0%, transparent 70%)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '980px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Badge variant="gold">PORTAL NACIONAL 18+</Badge>
            <Badge variant="ruby">MAIORIDADE VERIFICADA</Badge>
          </div>

          <h1 style={{ fontSize: 'clamp(1.85rem, 3.5vw, 2.75rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.5rem' }}>
            {currentActiveCityInfo ? (
              <>
                Perfis em <span style={{ color: 'var(--accent-gold)' }}>{currentActiveCityInfo.cityName}, {currentActiveCityInfo.stateCode}</span>
              </>
            ) : activeCategoryInfo ? (
              <>
                Perfis de <span style={{ color: 'var(--accent-gold)' }}>{activeCategoryInfo.name}</span>
              </>
            ) : (
              <>
                Encontre perfis na <span style={{ color: 'var(--accent-gold)' }}>sua região</span>
              </>
            )}
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.45, maxWidth: '680px', margin: '0 auto 1.5rem auto' }}>
            {currentActiveCityInfo ? (
              `${filteredProfiles.length} anúncios ativos em ${currentActiveCityInfo.cityName} • Contato direto e maioridade verificada 18+.`
            ) : (
              'A plataforma nacional mais discreta de anúncios para acompanhantes e profissionais independentes em todo o Brasil.'
            )}
          </p>

          {/* Unified Search Bar */}
          <Card variant="glass" padding="sm" style={{ maxWidth: '900px', margin: '0 auto 1.5rem auto', boxShadow: 'var(--shadow-md)' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
              {/* 1. Location Autocomplete */}
              <div style={{ flex: '1 1 240px' }}>
                <CityAutocomplete onSelectCity={setSelectedSearchCity} placeholder="Digite cidade ou estado..." />
              </div>

              {/* 2. Quem você procura? (Identity Taxonomy) */}
              <div style={{ flex: '1 1 180px' }}>
                <select
                  className="input"
                  value={selectedSearchIdentity}
                  onChange={(e) => setSelectedSearchIdentity(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', height: '44px' }}
                  aria-label="Quem você procura?"
                >
                  <option value="todos">Quem você procura? (Todos)</option>
                  <option value="mulheres">Mulheres</option>
                  <option value="homens">Homens</option>
                  <option value="travestis_trans">Travestis & Trans</option>
                  <option value="nao_binario_outros">Não binário / Outros</option>
                </select>
              </div>

              {/* 3. Category */}
              <div style={{ flex: '1 1 180px' }}>
                <select
                  className="input"
                  value={selectedSearchCategory}
                  onChange={(e) => setSelectedSearchCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', height: '44px' }}
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
              <Button type="submit" variant="ruby" size="md" leftIcon={<Search size={16} />} style={{ flexShrink: 0, height: '44px' }}>
                Buscar
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* 2. EXPLORAR POR PERFIL COM CONTAGEM REAL (Section 9) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--accent-gold)" /> Explore por perfil
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Segmentação voluntária para encontrar o perfil ideal com contagem em tempo real.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
          {[
            { id: 'todos', label: 'Todos os Perfis', count: identityCounts.total, tag: 'Nacional' },
            { id: 'mulheres', label: 'Mulheres', count: identityCounts.mulheres, tag: 'Perfis Verificados' },
            { id: 'homens', label: 'Homens', count: identityCounts.homens, tag: 'Acompanhantes' },
            { id: 'travestis_trans', label: 'Travestis & Trans', count: identityCounts.travestis_trans, tag: 'VIP & Modelos' },
            { id: 'nao_binario_outros', label: 'Não binário / Outros', count: identityCounts.nao_binario_outros, tag: 'Diversidade' },
          ].map((item) => {
            const isSelected = activeIdentityFilter === item.id;
            return (
              <Card
                key={item.id}
                variant={isSelected ? 'bordered' : 'glass'}
                padding="md"
                onClick={() => handleIdentitySelect(item.id)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(229, 185, 92, 0.08)' : 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.tag}
                  </span>
                  {isSelected && <CheckCircle2 size={14} color="var(--accent-gold)" />}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.count}</strong> {item.count === 1 ? 'perfil ativo' : 'perfis ativos'}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. EXPLORAR POR REGIÃO E NAVEGAÇÃO NACIONAL (Sections 10 & 11) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={20} color="var(--accent-gold)" /> Navegação Nacional — Explore por Região
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Selecione sua macrorregião para descobrir perfis e anúncios nos principais estados brasileiros.
            </p>
          </div>
        </div>

        {/* Region Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }} role="tablist">
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
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--accent-gold)' : 'var(--bg-tertiary)',
                  color: isSelected ? '#000' : 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{reg}</span>
                <span style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.6 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Region States Grid */}
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          {(() => {
            const currentGroup = regionalStats.find((r) => r.region === selectedRegionTab);
            const statesList = currentGroup?.states || [];
            return (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem' }}>
                  {statesList.map((st) => (
                    <Link
                      key={st.code}
                      href={`/acompanhantes/${st.slug}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0.9rem',
                        background: st.profileCount > 0 ? 'rgba(229, 185, 92, 0.05)' : 'var(--bg-secondary)',
                        border: `1px solid ${st.profileCount > 0 ? 'rgba(229, 185, 92, 0.25)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} color={st.profileCount > 0 ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {st.name} ({st.code})
                        </span>
                      </div>
                      <Badge variant={st.profileCount > 0 ? 'gold' : 'neutral'}>
                        {st.profileCount}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </Card>
      </section>

      {/* 4. PERFIS EM DESTAQUE (Section 22) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={20} color="var(--accent-gold)" /> Perfis em Destaque
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Anúncios verificados de alta relevância com fotos e informações completas.
            </p>
          </div>
          <Link href="/explorar?sort=active">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
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
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum perfil em destaque encontrado para os filtros selecionados.</p>
          </Card>
        )}
      </section>

      {/* 5. NOVOS PERFIS (Section 21) */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="var(--accent-ruby)" /> Novos Perfis Publicados
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Anúncios recém-aprovados pela equipe de moderação e conformidade.
            </p>
          </div>
          <Link href="/explorar?sort=recent">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
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
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum perfil recente disponível no momento.</p>
          </Card>
        )}
      </section>

      {/* 6. CIDADES POPULARES (Section 20) */}
      <section className="container">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} color="var(--accent-gold)" /> Cidades com Maior Atividade
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Acesse rapidamente os centros urbanos com maior densidade de profissionais cadastrados.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {activeCities.slice(0, 8).map((city) => (
            <Link
              key={city.citySlug}
              href={`/acompanhantes/${city.stateSlug}/${city.citySlug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {city.cityName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {city.stateCode} • Brasil
                </div>
              </div>
              <Badge variant="gold">{city.profileCount} anúncios</Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. CATEGORIAS EM DESTAQUE (Section 3) */}
      <section className="container">
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={20} color="var(--color-info)" /> Categorias de Atendimento
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Especialidades e modalidades de serviço independentes da identidade de perfil.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          {categoriesList.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              style={{
                padding: '1rem 1.15rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {cat.description || 'Profissionais qualificados para atendimento personalizado.'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. CENTRAL DE SEGURANÇA E CONFORMIDADE (Section 18) */}
      <section className="container">
        <Card variant="glass" padding="lg" style={{ border: '1px solid var(--border-subtle)', background: 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2rem auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={24} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Segurança e Confiança no Portal18</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Plataforma projetada para garantir total privacidade aos visitantes e segurança de trabalho aos anunciantes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Para Visitantes */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} /> Para Visitantes
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Zero Rastro de Biometria:</strong> Nunca armazenamos documentos ou fotos de visitantes.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Proteção Anti-Golpe:</strong> Perfis moderados com fotos verificadas e canais auditados.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Contato Seguro:</strong> Redirecionamento direto e voluntário para canais oficiais.</span>
                </li>
              </ul>
              <div style={{ marginTop: '1rem' }}>
                <Link href="/trust">
                  <Button variant="outline" size="sm" fullWidth>
                    Ver Trust Center 18+
                  </Button>
                </Link>
              </div>
            </div>

            {/* Para Anunciantes */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-ruby)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={16} /> Para Anunciantes
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Sigilo e Proteção de Dados:</strong> Nome civil e dados de identificação 100% confidenciais.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Controle de Mídias:</strong> Bloqueio contra vazamentos e proteção por marca d’água digital.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Suporte Prioritário:</strong> Canal de atendimento direto com equipe de conformidade.</span>
                </li>
              </ul>
              <div style={{ marginTop: '1rem' }}>
                <Link href="/help">
                  <Button variant="outline" size="sm" fullWidth>
                    Central de Ajuda
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 9. CTA CONTEXTUAL PARA ANUNCIANTES (Section 19) */}
      <section className="container">
        <Card
          variant="glass"
          padding="lg"
          style={{
            background: 'linear-gradient(135deg, rgba(229, 185, 92, 0.12) 0%, rgba(255, 45, 85, 0.08) 100%)',
            border: '1px solid rgba(229, 185, 92, 0.35)',
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ maxWidth: '620px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>
              {currentActiveCityInfo ? (
                <>Anuncie seu perfil profissional em <span style={{ color: 'var(--accent-gold)' }}>{currentActiveCityInfo.cityName}</span></>
              ) : (
                <>Anuncie no <span style={{ color: 'var(--accent-gold)' }}>Portal18</span> e alcance novos clientes</>
              )}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Publique seu anúncio com total privacidade, receba contatos diretos no WhatsApp e tenha a garantia do selo oficial de verificação 18+.
            </p>
            <div style={{ display: 'inline-flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href={getAdvertiserCtaUrl()}>
                <Button variant="ruby" size="lg" leftIcon={<Megaphone size={16} />} style={{ fontWeight: 700 }}>
                  Criar Anúncio Profissional
                </Button>
              </Link>
              <Link href="/trust">
                <Button variant="secondary" size="lg">
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
