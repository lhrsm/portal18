'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';
import { PublicAdvertiser, BrazilState, BrazilCity, Category } from '@/types/app.types';
import { AdvertiserCard } from '@/components/public/AdvertiserCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Filter, 
  Search, 
  Sparkles, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  RotateCcw, 
  SlidersHorizontal, 
  ArrowUpDown 
} from 'lucide-react';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<PublicAdvertiser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Master Data
  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter States from URL
  const stateParam = searchParams.get('estado') || '';
  const cityParam = searchParams.get('cidade') || '';
  const categoryParam = searchParams.get('categoria') || '';
  const ageRangeParam = searchParams.get('idade') || '';
  const verifiedParam = searchParams.get('verificado') === 'true';
  const sortParam = (searchParams.get('sort') as 'recommended' | 'recent' | 'active') || 'recommended';

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
  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await publicProfilesService.getPublicAdvertisers({
        state: stateParam || undefined,
        city: cityParam || undefined,
        category: categoryParam || undefined,
        ageRange: ageRangeParam || undefined,
        verified: verifiedParam || undefined,
        sort: sortParam,
        limit: 30,
      });
      setProfiles(res.data);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Error loading explore profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [stateParam, cityParam, categoryParam, ageRangeParam, verifiedParam, sortParam]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Update URL Query Helper
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === 'estado') {
      params.delete('cidade'); // reset city on state change
    }
    router.push(`/explorar?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/explorar');
    setMobileFiltersOpen(false);
  };

  // Calculate active filter count
  const activeFiltersCount = [
    Boolean(stateParam),
    Boolean(cityParam),
    Boolean(categoryParam),
    Boolean(ageRangeParam),
    verifiedParam,
  ].filter(Boolean).length;

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 4rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">DESCOBERTA DE ANÚNCIOS</Badge>
            <Badge variant="neutral">{totalCount} {totalCount === 1 ? 'perfil encontrado' : 'perfis encontrados'}</Badge>
          </div>
          <h1 style={{ fontSize: '2.4rem' }}>Explorar Perfis</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Filtre por localização, categoria, faixa etária e verificação</p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            className="mobile-filter-btn"
            onClick={() => setMobileFiltersOpen(true)}
            leftIcon={<SlidersHorizontal size={16} />}
          >
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={16} color="var(--text-muted)" />
            <select
              className="input"
              value={sortParam}
              onChange={(e) => updateFilter('sort', e.target.value)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <option value="recommended">Recomendados</option>
              <option value="recent">Mais recentes</option>
              <option value="active">Recentemente ativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar Filters (Desktop) */}
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

              {/* Filter 3: Category */}
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

              {/* Filter 4: Age Range */}
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Faixa Etária (18+)</label>
                <select
                  className="input"
                  value={ageRangeParam}
                  onChange={(e) => updateFilter('idade', e.target.value || null)}
                >
                  <option value="">Todas as idades</option>
                  <option value="18-24">18 a 24 anos</option>
                  <option value="25-34">25 a 34 anos</option>
                  <option value="35-44">35 a 44 anos</option>
                  <option value="45+">45 anos ou mais</option>
                </select>
              </div>

              {/* Filter 5: Verified Checkbox */}
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
              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Nenhum perfil encontrado com esses filtros</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                Tente ajustar os critérios de localização ou categoria para ver mais resultados.
              </p>
              <Button variant="ruby" onClick={clearAllFilters}>
                Limpar Todos os Filtros
              </Button>
            </Card>
          ) : (
            <div className="advertiser-grid">
              {profiles.map((adv) => (
                <AdvertiserCard key={adv.advertiser_id} advertiser={adv} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Sheet (Requirement 32) */}
      <Sheet isOpen={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title={`Filtros de Busca ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
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
            <label className="form-label">Faixa Etária</label>
            <select
              className="input"
              value={ageRangeParam}
              onChange={(e) => updateFilter('idade', e.target.value || null)}
            >
              <option value="">Todas as idades</option>
              <option value="18-24">18 a 24 anos</option>
              <option value="25-34">25 a 34 anos</option>
              <option value="35-44">35 a 44 anos</option>
              <option value="45+">45 anos ou mais</option>
            </select>
          </div>

          <div>
            <label className="checkbox-field" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={verifiedParam}
                onChange={(e) => updateFilter('verificado', e.target.checked ? 'true' : null)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Apenas <strong>Verificados</strong>
              </span>
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
