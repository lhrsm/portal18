'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { preferencesService } from '@/services/account/preferencesService';
import { locationService } from '@/services/locationService';
import { UserPreferences, Category, BrazilState, BrazilCity } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Sliders, 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Check 
} from 'lucide-react';

export default function PreferencesPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    preferred_city_id: null,
    age_min: 18,
    age_max: 70,
    verified_only: false,
    recently_active_only: false,
    personalization_enabled: true,
    history_enabled: true,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [states, setStates] = useState<BrazilState[]>([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    try {
      const [userPrefs, userCats, allCats, allStates] = await Promise.all([
        preferencesService.getUserPreferences(profile.id),
        preferencesService.getPreferredCategories(profile.id),
        locationService.getCategories(),
        locationService.getStates(),
      ]);

      if (userPrefs) {
        setPrefs(userPrefs);
      }
      setSelectedCatIds(userCats);
      setCategories(allCats);
      setStates(allStates);
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  // Load cities when state changes
  useEffect(() => {
    async function loadCities() {
      if (selectedStateId) {
        const cityList = await locationService.getCitiesByState(selectedStateId);
        setCities(cityList);
      } else {
        setCities([]);
      }
    }
    loadCities();
  }, [selectedStateId]);

  const toggleCategory = (catId: string) => {
    setSelectedCatIds((prev) => prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    const [prefsRes, catsRes] = await Promise.all([
      preferencesService.updatePreferences(profile.id, prefs),
      preferencesService.setPreferredCategories(profile.id, selectedCatIds),
    ]);

    if (prefsRes.success && catsRes.success) {
      showToast({ type: 'success', title: 'Preferências Salvas', message: 'Suas opções de busca e personalização foram atualizadas.' });
    } else {
      showToast({ type: 'error', title: 'Erro ao salvar', message: prefsRes.error || catsRes.error });
    }
    setSaving(false);
  };

  const handleResetPersonalization = async () => {
    if (!confirm('Deseja redefinir suas recomendações? Seus sinais derivados serão apagados e as sugestões voltarão ao padrão contextual da sua região.')) {
      return;
    }

    setResetting(true);
    const res = await preferencesService.resetPersonalization();
    if (res.success) {
      setSelectedCatIds([]);
      setPrefs({
        ...prefs,
        preferred_city_id: null,
        age_min: 18,
        age_max: 70,
        verified_only: false,
        recently_active_only: false,
        personalization_enabled: true,
      });
      showToast({ type: 'success', title: 'Recomendações Redefinidas', message: 'Sinais de personalização reiniciados com sucesso.' });
    } else {
      showToast({ type: 'error', title: 'Erro ao redefinir', message: res.error });
    }
    setResetting(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="350px" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Minha Conta
        </Link>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Sliders size={28} color="var(--color-info)" />
            <h1 style={{ fontSize: '2.2rem' }}>Preferências de Busca & Descoberta</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Personalize a experiência inicial da sua home, cidade preferida e categorias de interesse
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetPersonalization}
          isLoading={resetting}
          leftIcon={<RotateCcw size={14} />}
          style={{ color: 'var(--text-muted)' }}
        >
          Redefinir Recomendações
        </Button>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Card 1: Cidade Preferida */}
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <MapPin size={20} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cidade Principal</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Sua cidade padrão ao abrir a aba &quot;Explorar&quot; e seções de descoberta regional.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Estado (UF)</label>
              <select
                className="form-select"
                value={selectedStateId}
                onChange={(e) => setSelectedStateId(e.target.value)}
              >
                <option value="">Selecione um estado...</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Cidade</label>
              <select
                className="form-select"
                disabled={!selectedStateId || cities.length === 0}
                value={prefs.preferred_city_id || ''}
                onChange={(e) => setPrefs({ ...prefs, preferred_city_id: e.target.value || null })}
              >
                <option value="">Nenhuma (Mostrar destaques nacionais)</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Card 2: Filtros Padrão & Personalização */}
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={20} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Personalização de Conteúdo</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Personalization Toggle (Section 43 & 44) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Ativar Seção &quot;Para Você&quot;</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Utiliza seus favoritos e categorias para sugerir perfis semelhantes</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.personalization_enabled}
                  onChange={(e) => setPrefs({ ...prefs, personalization_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
              </div>

              {/* Verified Only Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Apenas Perfis Verificados 18+</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ocultar anúncios sem identidade verificada por padrão</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.verified_only}
                  onChange={(e) => setPrefs({ ...prefs, verified_only: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
              </div>

              {/* Recently Active Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Apenas Perfis Ativos Recentemente</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priorizar anúncios com atividade confirmada na última semana</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.recently_active_only}
                  onChange={(e) => setPrefs({ ...prefs, recently_active_only: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Card 3: Categorias de Interesse */}
        <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Categorias & Especialidades de Interesse
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Selecione as especialidades que você prefere ver com maior frequência nas recomendações da home.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.map((cat) => {
              const isSelected = selectedCatIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(218, 165, 32, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected && <Check size={14} />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button type="submit" variant="primary" size="lg" isLoading={saving}>
            Salvar Preferências
          </Button>
        </div>
      </form>
    </div>
  );
}
