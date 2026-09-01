'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { advancedSearchService } from '@/services/search/advancedSearchService';
import { savedSearchService } from '@/services/search/savedSearchService';
import { locationService } from '@/services/locationService';
import { useAuth } from '@/hooks/useAuth';
import { Category, BrazilState, BrazilCity, DiscoveryProfileCard } from '@/types/app.types';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { AdvancedSearchBar } from '@/components/search/AdvancedSearchBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
  Search,
  Filter,
  Navigation,
  RotateCcw,
  SlidersHorizontal,
  Bookmark,
  X,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State for search results
  const [profiles, setProfiles] = useState<DiscoveryProfileCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [saveSearchModalOpen, setSaveSearchModalOpen] = useState(false);
  const [saveSearchTitle, setSaveSearchTitle] = useState('');
  const [saveFrequency, setSaveFrequency] = useState<'none' | 'instant' | 'daily' | 'weekly'>('none');
  const [isSavingSearch, setIsSavingSearch] = useState(false);

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
  const mediaVerifiedParam = searchParams.get('midia_verificada') === 'true';
  const videoParam = searchParams.get('video') === 'true';
  const audioParam = searchParams.get('audio') === 'true';
  const reviewsParam = searchParams.get('avaliacoes') === 'true';
  const recentParam = searchParams.get('recente') === 'true';
  const activityParam = (searchParams.get('atividade') as any) || undefined;
  const sortParam = (searchParams.get('ordem') as any) || 'relevance';

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
      const res = await advancedSearchService.search({
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
        mediaVerified: mediaVerifiedParam || undefined,
        withVideo: videoParam || undefined,
        withAudio: audioParam || undefined,
        withReviews: reviewsParam || undefined,
        recentlyUpdated: recentParam || undefined,
        activityFilter: activityParam,
        sortBy: sortParam,
        viewerId: user?.id,
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
  }, [queryParam, stateParam, cityParam, originCityIdParam, radiusParam, categoryParam, genderParam, targetAudienceParam, serviceModalityParam, verifiedParam, mediaVerifiedParam, videoParam, audioParam, reviewsParam, recentParam, activityParam, sortParam, user, page]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Handle Dynamic URL Query Updates
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'todos') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Reset city if state changes
    if (key === 'estado') {
      params.delete('cidade');
    }

    router.push(`/explorar?${params.toString()}`);
  };

  // Browser Opt-in Geolocation
  const handleRequestNearMe = () => {
    if (!navigator.geolocation) {
      showToast({ type: 'warning', title: 'Geolocalização indisponível', message: 'Seu navegador não suporta geolocalização.' });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async () => {
        setIsLocating(false);
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
    router.push('/explorar');
    setMobileFiltersOpen(false);
  };

  const handleSaveSearch = async () => {
    if (!user) {
      showToast({ type: 'info', title: 'Login necessário', message: 'Faça login para salvar suas buscas personalizadas.' });
      return;
    }
    if (!saveSearchTitle.trim()) {
      showToast({ type: 'warning', title: 'Nome obrigatório', message: 'Dê um nome para sua busca salva.' });
      return;
    }

    setIsSavingSearch(true);
    const result = await savedSearchService.createSavedSearch(
      saveSearchTitle,
      {
        query: queryParam,
        stateCode: stateParam,
        citySlug: cityParam,
        categorySlug: categoryParam,
        gender: genderParam,
        targetAudience: targetAudienceParam,
        serviceModality: serviceModalityParam,
        verifiedOnly: verifiedParam,
      },
      saveFrequency
    );

    setIsSavingSearch(false);
    if (result.success) {
      showToast({ type: 'success', title: 'Busca Salva', message: 'Sua busca foi salva com sucesso nas suas preferências.' });
      setSaveSearchModalOpen(false);
      setSaveSearchTitle('');
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Falha ao salvar busca.' });
    }
  };

  // Active filter chips builder
  const activeChips: { key: string; label: string }[] = [];
  if (queryParam) activeChips.push({ key: 'q', label: `Busca: "${queryParam}"` });
  if (stateParam) activeChips.push({ key: 'estado', label: `UF: ${stateParam.toUpperCase()}` });
  if (cityParam) activeChips.push({ key: 'cidade', label: `Cidade: ${cityParam}` });
  if (categoryParam) activeChips.push({ key: 'categoria', label: `Categoria: ${categoryParam}` });
  if (genderParam && genderParam !== 'todos') activeChips.push({ key: 'genero', label: `Identidade: ${genderParam}` });
  if (targetAudienceParam && targetAudienceParam !== 'todos') activeChips.push({ key: 'atende', label: `Público: ${targetAudienceParam}` });
  if (serviceModalityParam) activeChips.push({ key: 'modalidade', label: `Modalidade: ${serviceModalityParam}` });
  if (verifiedParam) activeChips.push({ key: 'verificado', label: 'Autêntico' });
  if (mediaVerifiedParam) activeChips.push({ key: 'midia_verificada', label: 'Mídias Verificadas' });
  if (videoParam) activeChips.push({ key: 'video', label: 'Com Vídeo' });
  if (audioParam) activeChips.push({ key: 'audio', label: 'Com Áudio' });
  if (reviewsParam) activeChips.push({ key: 'avaliacoes', label: 'Com Avaliações' });
  if (recentParam) activeChips.push({ key: 'recente', label: 'Atualizados' });

  const activeFiltersCount = activeChips.length;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 3.5rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <Badge variant="gold">DESCOBERTA 18+</Badge>
            <Badge variant="neutral">{totalCount} {totalCount === 1 ? 'perfil encontrado' : 'perfis encontrados'}</Badge>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.3rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Explorar Anúncios
          </h1>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRequestNearMe}
            isLoading={isLocating}
            leftIcon={<Navigation size={14} color="var(--accent-gold)" />}
            style={{ minHeight: '38px' }}
          >
            Perto de mim
          </Button>

          {activeFiltersCount > 0 && user && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSaveSearchModalOpen(true)}
              leftIcon={<Bookmark size={14} />}
              style={{ minHeight: '38px' }}
            >
              Salvar Busca
            </Button>
          )}

          <Button
            variant={activeFiltersCount > 0 ? 'ruby' : 'secondary'}
            size="sm"
            className="mobile-filter-btn"
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal size={14} />}
            style={{ minHeight: '38px' }}
          >
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </div>
      </div>

      {/* Advanced Accessible Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <AdvancedSearchBar
          initialQuery={queryParam}
          placeholder="Buscar por nome artístico, cidade ou categoria..."
          onSearch={(q) => updateFilter('q', q || null)}
        />
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.2rem' }}>
            Filtros Ativos:
          </span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateFilter(chip.key, null)}
              aria-label={`Remover filtro ${chip.label}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {chip.label}
              <X size={12} color="var(--text-muted)" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-ruby)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '0.4rem',
            }}
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Screen reader live region for search results announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {!isLoading && `${totalCount} ${totalCount === 1 ? 'perfil encontrado' : 'perfis encontrados'}`}
      </div>

      {/* Main Grid with Sidebar Filters */}
      <div className="explore-layout">
        {/* Desktop Sidebar Filters */}
        <aside className="explore-sidebar">
          <Card variant="glass" padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '1rem' }}>
                <Filter size={18} color="var(--accent-gold)" /> Filtros Avançados
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Order / Sort */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Ordenar por</label>
                <select
                  className="input"
                  value={sortParam}
                  onChange={(e) => updateFilter('ordem', e.target.value)}
                >
                  <option value="relevance">Mais Relevantes</option>
                  <option value="recent">Mais Recentes</option>
                  <option value="active">Ativos Recentemente</option>
                </select>
              </div>

              {/* State */}
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

              {/* City */}
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

              {/* Identity */}
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

              {/* Category */}
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

              {/* Target Audience */}
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

              {/* Modality */}
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

              {/* Trust Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
                <label className="checkbox-field" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={verifiedParam}
                    onChange={(e) => updateFilter('verificado', e.target.checked ? 'true' : null)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Perfil Autenticado (Vídeo)</span>
                </label>

                <label className="checkbox-field" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={mediaVerifiedParam}
                    onChange={(e) => updateFilter('midia_verificada', e.target.checked ? 'true' : null)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Mídias Verificadas (&gt;= 3 fotos)</span>
                </label>

                <label className="checkbox-field" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={videoParam}
                    onChange={(e) => updateFilter('video', e.target.checked ? 'true' : null)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Apenas com Vídeo</span>
                </label>

                <label className="checkbox-field" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={recentParam}
                    onChange={(e) => updateFilter('recente', e.target.checked ? 'true' : null)}
                  />
                  <span style={{ fontSize: '0.85rem' }}>Atualizado Recentemente</span>
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
                <Skeleton key={n} height="320px" borderRadius="var(--radius-md)" />
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.25rem' }}>
              <Search size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>Nenhum perfil encontrado</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.25rem auto', fontSize: '0.85rem' }}>
                Tente ajustar os filtros de categoria ou localização para encontrar profissionais disponíveis.
              </p>
              <Button variant="ruby" size="md" onClick={clearAllFilters}>
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
                      profile_status: 'approved',
                      visibility: 'public',
                      category_names: [],
                      distance_label: adv.distance_label,
                      activity_label: adv.activity_label,
                      is_sponsored: adv.is_sponsored,
                    } as any}
                  />
                ))}
              </div>

              {/* Load More Pagination */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <Button variant="secondary" size="md" onClick={() => loadProfiles(true)} style={{ minHeight: '44px', minWidth: '180px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0', maxHeight: '72dvh', overflowY: 'auto' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Estado (UF)</label>
            <select
              className="input"
              value={stateParam}
              onChange={(e) => updateFilter('estado', e.target.value || null)}
              style={{ height: '44px' }}
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
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Cidade</label>
              <select
                className="input"
                value={cityParam}
                onChange={(e) => updateFilter('cidade', e.target.value || null)}
                style={{ height: '44px' }}
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
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Quem você procura?</label>
            <select
              className="input"
              value={genderParam || 'todos'}
              onChange={(e) => updateFilter('genero', e.target.value === 'todos' ? null : e.target.value)}
              style={{ height: '44px' }}
            >
              <option value="todos">Todos os Perfis</option>
              <option value="mulheres">Mulheres</option>
              <option value="homens">Homens</option>
              <option value="travestis_trans">Travestis & Trans</option>
              <option value="nao_binario_outros">Não binário / Outros</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Categoria</label>
            <select
              className="input"
              value={categoryParam}
              onChange={(e) => updateFilter('categoria', e.target.value || null)}
              style={{ height: '44px' }}
            >
              <option value="">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sticky Actions Bar */}
          <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-secondary)', paddingTop: '0.75rem', paddingBottom: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
            <Button variant="secondary" fullWidth onClick={clearAllFilters} style={{ minHeight: '44px' }}>
              Limpar
            </Button>
            <Button variant="ruby" fullWidth onClick={() => setMobileFiltersOpen(false)} style={{ minHeight: '44px', fontWeight: 700 }}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Save Search Modal */}
      <Modal isOpen={saveSearchModalOpen} onClose={() => setSaveSearchModalOpen(false)} title="Salvar Busca Personalizada">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Salve os filtros atuais para acessar rapidamente ou receber alertas discretos de novos perfis correspondentes.
          </p>
          <div>
            <label className="form-label">Nome da Busca</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Massagistas em Salvador, BA"
              value={saveSearchTitle}
              onChange={(e) => setSaveSearchTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Frequência de Notificação</label>
            <select
              className="input"
              value={saveFrequency}
              onChange={(e) => setSaveFrequency(e.target.value as any)}
            >
              <option value="none">Apenas salvar (Sem notificações)</option>
              <option value="daily">Resumo Diário</option>
              <option value="weekly">Resumo Semanal</option>
              <option value="instant">Imediata (Novos anúncios)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setSaveSearchModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveSearch} isLoading={isSavingSearch}>
              Salvar Busca
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <Skeleton height="2.5rem" width="220px" style={{ marginBottom: '1.25rem' }} />
        <div className="advertiser-grid">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height="320px" />
          ))}
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
