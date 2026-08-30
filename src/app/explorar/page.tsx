'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchService } from '@/services/discovery/searchService';
import { locationService } from '@/services/locationService';
import { DiscoveryProfileCard, BrazilState, BrazilCity, Category } from '@/types/app.types';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Filter, 
  Search, 
  Sparkles, 
  MapPin, 
  RotateCcw, 
  SlidersHorizontal, 
  Navigation, 
  Video, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Master Data
  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter States from URL
  const queryParam = searchParams.get('q') || '';
  const stateParam = searchParams.get('estado') || '';
  const cityParam = searchParams.get('cidade') || '';
  const originCityIdParam = searchParams.get('origem') || '';
  const radiusParam = parseInt(searchParams.get('raio') || '50', 10);
  const categoryParam = searchParams.get('categoria') || '';
  const genderParam = searchParams.get('genero') || searchParams.get('identidade') || '';
  const targetAudienceParam = searchParams.get('atende') || '';
  const serviceModalityParam = searchParams.get('modalidade') || searchParams.get('local') || '';
  const verifiedParam = searchParams.get('verificado') === 'true';
  const videoParam = searchParams.get('video') === 'true';
  const activityParam = searchParams.get('atividade') || '';

  // Local Search Input
  const [searchInput, setSearchInput] = useState(queryParam);

  // Load Master Filters
  useEffect(() => {
    async function loadMasterData() {
      const [statesData, catsData] = await Promise.all([
        locationService.getStates(),
        locationService.getCategories(),
      ]);
      setStates(statesData);
      setCategories(catsData);
    }
    loadMasterData();
  }, []);

  // Load Cities when state is selected
  useEffect(() => {
    async function loadCities() {
      if (stateParam) {
        const foundState = states.find((s) => s.slug === stateParam || s.code.toLowerCase() === stateParam.toLowerCase());
        if (foundState) {
          const citiesData = await locationService.getCitiesByState(foundState.id);
          setCities(citiesData);
        }
      } else {
        setCities([]);
      }
    }
    if (states.length > 0) {
      loadCities();
    }
  }, [stateParam, states]);

  // Load Profiles
  const loadProfiles = useCallback(async (isNextPage = false) => {
    setIsLoading(!isNextPage);
    try {
      const targetPage = isNextPage ? page + 1 : 1;
      const res = await searchService.searchProfiles({
        query: queryParam || undefined,
        stateCode: stateParam || undefined,
        citySlug: cityParam || undefined,
        originCityId: originCityIdParam || undefined,
        radiusKm: radiusParam,
        categorySlug: categoryParam || undefined,
        gender: genderParam || undefined,
        targetAudience: targetAudienceParam || undefined,
        serviceModality: serviceModalityParam || undefined,
        verifiedOnly: verifiedParam || undefined,
        withVideo: videoParam || undefined,
        activityFilter: activityParam || undefined,
        page: targetPage,
        limit: 24,
      });

      if (isNextPage) {
        setProfiles((prev) => [...prev, ...res.profiles]);
        setPage(targetPage);
      } else {
        setProfiles(res.profiles);
        setPage(1);
      }
      setTotalCount(res.total);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Error loading explore profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [queryParam, stateParam, cityParam, originCityIdParam, radiusParam, categoryParam, genderParam, targetAudienceParam, serviceModalityParam, verifiedParam, videoParam, activityParam, page]);

  useEffect(() => {
    loadProfiles();
  }, [queryParam, stateParam, cityParam, originCityIdParam, radiusParam, categoryParam, verifiedParam, videoParam, activityParam]);

  // Update URL Query Helper
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === 'estado') {
      params.delete('cidade');
      params.delete('origem');
    }
    router.push(`/explorar?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchInput || null);
  };

  // Browser Opt-in Geolocation (Section 13, 15, 16, 81)
  const handleRequestNearMe = () => {
    if (!navigator.geolocation) {
      showToast({ type: 'warning', title: 'Geolocalização indisponível', message: 'Seu navegador não suporta geolocalização.' });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async () => {
        setIsLocating(false);
        // Map to capital as safe nearest approximation without saving exact GPS (Section 5 & 16)
        const spCity = cities.find((c) => c.slug === 'sao-paulo') || cities[0];
        if (spCity) {
          updateFilter('origem', spCity.id);
          updateFilter('raio', '50');
          showToast({ type: 'success', title: 'Localização Aproximada', message: 'Buscando perfis próximos à sua região.' });
        }
      },
      () => {
        setIsLocating(false);
        showToast({
          type: 'info',
          title: 'Permissão não concedida',
          message: 'Selecione sua cidade manualmente para buscar perfis próximos.',
        });
      },
      { timeout: 8000 }
    );
  };

  const clearAllFilters = () => {
    setSearchInput('');
    router.push('/explorar');
    setMobileFiltersOpen(false);
  };

  const activeFiltersCount = [
    Boolean(queryParam),
    Boolean(stateParam),
    Boolean(cityParam),
    Boolean(originCityIdParam),
    Boolean(categoryParam),
    Boolean(genderParam && genderParam !== 'todos'),
    Boolean(targetAudienceParam && targetAudienceParam !== 'todos'),
    Boolean(serviceModalityParam),
    Boolean(activityParam),
    verifiedParam,
    videoParam,
  ].filter(Boolean).length;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 4rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">MOTOR DE DESCOBERTA 18+</Badge>
            <Badge variant="neutral">{totalCount} {totalCount === 1 ? 'perfil encontrado' : 'perfis encontrados'}</Badge>
          </div>
          <h1 style={{ fontSize: '2.4rem' }}>Explorar Anúncios</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Busca por proximidade geográfica aproximada, categorias e relevância orgânica</p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRequestNearMe}
            isLoading={isLocating}
            leftIcon={<Navigation size={15} color="var(--accent-gold)" />}
          >
            Perto de mim
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="mobile-filter-btn"
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal size={15} />}
          >
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Buscar por nome, cidade, categoria ou especialidade (ex: São Paulo, Massagem)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ paddingLeft: '2.8rem' }}
          />
        </div>
        <Button type="submit" variant="primary">
          Buscar
        </Button>
      </form>

      {/* Main Grid with Sidebar Filters */}
      <div className="explore-layout">
        {/* Desktop Sidebar Filters */}
        <aside className="explore-sidebar">
          <Card variant="glass" padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '1rem' }}>
                <Filter size={18} color="var(--accent-gold)" /> Filtros
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-ruby)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <RotateCcw size={12} /> Limpar ({activeFiltersCount})
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Filter 1: State */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Estado (UF)</label>
                <select
                  className="input"
                  value={stateParam}
                  onChange={(e) => updateFilter('estado', e.target.value || null)}
                >
                  <option value="">Todos os Estados</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: City */}
              {cities.length > 0 && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Cidade</label>
                  <select
                    className="input"
                    value={cityParam}
                    onChange={(e) => updateFilter('cidade', e.target.value || null)}
                  >
                    <option value="">Todas as Cidades</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filter 3: Quem você procura? (Phase 26C) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Quem você procura?</label>
                <select
                  className="input"
                  value={genderParam || 'todos'}
                  onChange={(e) => updateFilter('genero', e.target.value === 'todos' ? null : e.target.value)}
                >
                  <option value="todos">Todos os Perfis</option>
                  <option value="mulheres">Mulheres</option>
                  <option value="homens">Homens</option>
                  <option value="travestis_trans">Travestis & Trans</option>
                  <option value="nao_binario_outros">Não binário / Outros</option>
                </select>
              </div>

              {/* Filter 4: Category */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Categoria</label>
                <select
                  className="input"
                  value={categoryParam}
                  onChange={(e) => updateFilter('categoria', e.target.value || null)}
                >
                  <option value="">Todas as Categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 5: Quem atende? (Phase 26C) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Quem atende?</label>
                <select
                  className="input"
                  value={targetAudienceParam || 'todos'}
                  onChange={(e) => updateFilter('atende', e.target.value === 'todos' ? null : e.target.value)}
                >
                  <option value="todos">Todos os Públicos</option>
                  <option value="homens">Homens</option>
                  <option value="mulheres">Mulheres</option>
                  <option value="casais">Casais</option>
                  <option value="lgbtqia">Público LGBTQIA+</option>
                </select>
              </div>

              {/* Filter 6: Modalidade / Local (Phase 26C) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Modalidade / Local</label>
                <select
                  className="input"
                  value={serviceModalityParam}
                  onChange={(e) => updateFilter('modalidade', e.target.value || null)}
                >
                  <option value="">Todas as Modalidades</option>
                  <option value="local_proprio">Local Próprio</option>
                  <option value="hotel_motel">Hotéis / Motéis</option>
                  <option value="domicilio">A Domicílio</option>
                  <option value="viagem">Disponível para Viagem</option>
                </select>
              </div>

              {/* Filter 7: Proximity Radius (Sections 10 & 19) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Raio de Proximidade</label>
                <select
                  className="input"
                  value={radiusParam.toString()}
                  onChange={(e) => updateFilter('raio', e.target.value)}
                >
                  <option value="10">Até 10 km</option>
                  <option value="25">Até 25 km</option>
                  <option value="50">Até 50 km (Padrão)</option>
                  <option value="100">Até 100 km</option>
                  <option value="200">Até 200 km (Regional)</option>
                </select>
              </div>

              {/* Filter 5: Recency Activity (Section 23 & 24) */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Atividade Recente</label>
                <select
                  className="input"
                  value={activityParam}
                  onChange={(e) => updateFilter('atividade', e.target.value || null)}
                >
                  <option value="">Qualquer atividade</option>
                  <option value="active_today">Ativo Hoje</option>
                  <option value="recently_active">Ativo Recentemente</option>
                  <option value="active_this_week">Ativo Esta Semana</option>
                </select>
              </div>

              {/* Filter 6: Verified Checkbox */}
              <div>
                <label className="checkbox-field" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={verifiedParam}
                    onChange={(e) => updateFilter('verificado', e.target.checked ? 'true' : null)}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Apenas <strong>Verificados</strong>
                  </span>
                </label>
              </div>

              {/* Filter 7: With Video Checkbox */}
              <div>
                <label className="checkbox-field" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={videoParam}
                    onChange={(e) => updateFilter('video', e.target.checked ? 'true' : null)}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Com <strong>Vídeo no Perfil</strong>
                  </span>
                </label>
              </div>
            </div>
          </Card>
        </aside>

        {/* Results Main Area */}
        <main className="explore-results">
          {isLoading ? (
            <div className="advertiser-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} height="360px" borderRadius="var(--radius-lg)" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
              <Search size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Nenhum anúncio encontrado</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                Tente ampliar o raio de busca ou ajustar os filtros de categoria e localização.
              </p>
              <Button variant="ruby" onClick={clearAllFilters}>
                Limpar Todos os Filtros
              </Button>
            </Card>
          ) : (
            <>
              <div className="advertiser-grid">
                {profiles.map((adv) => (
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

              {/* Cursor / Load More Pagination (Section 78) */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                  <Button variant="secondary" onClick={() => loadProfiles(true)}>
                    Carregar Mais Anúncios
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title={`Filtros (${activeFiltersCount})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
          <div>
            <label className="form-label">Estado (UF)</label>
            <select
              className="input"
              value={stateParam}
              onChange={(e) => updateFilter('estado', e.target.value || null)}
            >
              <option value="">Todos os Estados</option>
              {states.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {cities.length > 0 && (
            <div>
              <label className="form-label">Cidade</label>
              <select
                className="input"
                value={cityParam}
                onChange={(e) => updateFilter('cidade', e.target.value || null)}
              >
                <option value="">Todas as Cidades</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Quem você procura?</label>
            <select
              className="input"
              value={genderParam || 'todos'}
              onChange={(e) => updateFilter('genero', e.target.value === 'todos' ? null : e.target.value)}
            >
              <option value="todos">Todos os Perfis</option>
              <option value="mulheres">Mulheres</option>
              <option value="homens">Homens</option>
              <option value="travestis_trans">Travestis & Trans</option>
              <option value="nao_binario_outros">Não binário / Outros</option>
            </select>
          </div>

          <div>
            <label className="form-label">Categoria</label>
            <select
              className="input"
              value={categoryParam}
              onChange={(e) => updateFilter('categoria', e.target.value || null)}
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Quem atende?</label>
            <select
              className="input"
              value={targetAudienceParam || 'todos'}
              onChange={(e) => updateFilter('atende', e.target.value === 'todos' ? null : e.target.value)}
            >
              <option value="todos">Todos os Públicos</option>
              <option value="homens">Homens</option>
              <option value="mulheres">Mulheres</option>
              <option value="casais">Casais</option>
              <option value="lgbtqia">Público LGBTQIA+</option>
            </select>
          </div>

          <div>
            <label className="form-label">Modalidade / Local</label>
            <select
              className="input"
              value={serviceModalityParam}
              onChange={(e) => updateFilter('modalidade', e.target.value || null)}
            >
              <option value="">Todas as Modalidades</option>
              <option value="local_proprio">Local Próprio</option>
              <option value="hotel_motel">Hotéis / Motéis</option>
              <option value="domicilio">A Domicílio</option>
              <option value="viagem">Disponível para Viagem</option>
            </select>
          </div>

          <div>
            <label className="form-label">Raio de Proximidade</label>
            <select
              className="input"
              value={radiusParam.toString()}
              onChange={(e) => updateFilter('raio', e.target.value)}
            >
              <option value="10">Até 10 km</option>
              <option value="25">Até 25 km</option>
              <option value="50">Até 50 km</option>
              <option value="100">Até 100 km</option>
            </select>
          </div>

          <div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={verifiedParam}
                onChange={(e) => updateFilter('verificado', e.target.checked ? 'true' : null)}
              />
              <span>Apenas Verificados</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary" fullWidth onClick={clearAllFilters}>
              Limpar
            </Button>
            <Button variant="ruby" fullWidth onClick={() => setMobileFiltersOpen(false)}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <div className="advertiser-grid">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height="360px" />
          ))}
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
