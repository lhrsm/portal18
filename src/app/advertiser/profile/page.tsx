'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { locationService } from '@/services/locationService';
import { AdvertiserProfile, Category } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { AdvertiserProfileUpdateSchema } from '@/lib/validation/advertiserSubmission';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { User, Sparkles, FileText, Tag, Check, RefreshCw, AlertCircle, Save } from 'lucide-react';

export default function AdvertiserProfileEditPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [stageName, setStageName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('feminino');
  const [presentation, setPresentation] = useState('');

  // Autosave Status: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const [adv, cats, catIds] = await Promise.all([
          advertisersService.getOwnAdvertiserProfile(profile.id),
          locationService.getCategories(),
          profile ? advertisersService.getAdvertiserCategoryIds((await advertisersService.getOwnAdvertiserProfile(profile.id))?.id || '') : [],
        ]);

        setCategories(cats);
        if (adv) {
          setAdvertiser(adv);
          setStageName(adv.stage_name !== 'Novo Anunciante' ? adv.stage_name : '');
          setSlug(adv.slug);
          setHeadline(adv.headline || '');
          setBio(adv.bio || '');
          setGender(adv.gender || 'feminino');
          setPresentation(adv.presentation || '');
          setSelectedCatIds(catIds);
        }
      }
      setLoading(false);
      initialLoadDoneRef.current = true;
    }

    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  // Autosave function (Requirements 52 & 53)
  const triggerAutosave = useCallback(async () => {
    if (!advertiser || !initialLoadDoneRef.current) return;

    setSaveStatus('saving');
    setErrorMsg(null);

    const validation = AdvertiserProfileUpdateSchema.safeParse({
      stageName: stageName || 'Novo Anunciante',
      headline: headline || null,
      bio: bio || null,
      gender,
      presentation: presentation || null,
    });

    if (!validation.success) {
      setSaveStatus('error');
      setErrorMsg(validation.error.errors[0]?.message || 'Dados inválidos.');
      return;
    }

    try {
      const res = await advertisersService.updateAdvertiserProfile(advertiser.id, {
        stage_name: stageName || 'Novo Anunciante',
        headline: headline || null,
        bio: bio || null,
        gender,
        presentation: presentation || null,
      });

      if (!res.success) {
        setSaveStatus('error');
        setErrorMsg(res.error || 'Não foi possível salvar alterações.');
        return;
      }

      setAdvertiser(res.data || advertiser);
      setSaveStatus('saved');

      // Revert status to idle after 2.5s
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 2500);
    } catch (err) {
      console.error('Autosave error:', err);
      setSaveStatus('error');
      setErrorMsg('Erro inesperado no salvamento.');
    }
  }, [advertiser, stageName, headline, bio, gender, presentation]);

  // Schedule autosave debounce on field modifications
  const handleFieldChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setSaveStatus('idle');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerAutosave();
    }, 700);
  };

  const handleCategoryToggle = async (catId: string) => {
    if (!advertiser) return;

    let newSelected: string[];
    if (selectedCatIds.includes(catId)) {
      newSelected = selectedCatIds.filter((id) => id !== catId);
    } else {
      if (selectedCatIds.length >= 5) {
        showToast({
          type: 'warning',
          title: 'Limite Atingido',
          message: 'Você pode selecionar no máximo 5 categorias.',
        });
        return;
      }
      newSelected = [...selectedCatIds, catId];
    }

    setSelectedCatIds(newSelected);
    setSaveStatus('saving');
    const res = await advertisersService.updateAdvertiserCategories(advertiser.id, newSelected);
    if (res.success) {
      setSaveStatus('saved');
      showToast({ type: 'success', title: 'Categorias Atualizadas' });
    } else {
      setSaveStatus('error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="400px" />
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header with Autosave Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Meu Perfil</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Informações públicas exibidas nos resultados de busca e página do seu anúncio
          </p>
        </div>

        {/* Autosave Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={14} className="spin" /> Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Check size={14} /> Salvo
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={14} /> Erro ao salvar
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <Alert type="error" title="Atenção" style={{ marginBottom: '1.5rem' }}>
          {errorMsg}
        </Alert>
      )}

      {/* Section 1: Informações Públicas (Requirements 9, 10, 11) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <User size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Informações Públicas</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <FormField label="Nome Artístico / Profissional" required hint="Nome visível no título e cards públicos.">
            <Input
              type="text"
              placeholder="Ex: Gabriela Miller"
              value={stageName}
              onChange={(e) => handleFieldChange(setStageName, e.target.value)}
              required
            />
          </FormField>

          <FormField
            label="Slogan / Chamada Principal"
            hint={`${headline.length}/120 caracteres — Uma frase curta de impacto.`}
          >
            <Input
              type="text"
              placeholder="Ex: Atendimento sofisticado com total discrição e carinho"
              value={headline}
              maxLength={120}
              onChange={(e) => handleFieldChange(setHeadline, e.target.value)}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <FormField label="Identidade / Gênero">
              <Select value={gender} onChange={(e) => handleFieldChange(setGender, e.target.value)}>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="trans_travesti">Trans / Travesti</option>
                <option value="casal_dupla">Casal / Dupla</option>
              </Select>
            </FormField>

            <FormField label="Idade Comprovada" hint="Data de nascimento protegida; apenas idade calculada é pública.">
              <Input type="text" value={`${advertiser?.birth_date} (18+ Confirmado)`} disabled />
            </FormField>
          </div>
        </div>
      </Card>

      {/* Section 2: Sobre & Biografia (Requirement 12) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <FileText size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sobre / Apresentação</h3>
        </div>

        <FormField
          label="Biografia Completa (máx. 2000 caracteres)"
          hint={`${bio.length}/2000 caracteres — Descreva seus diferenciais, idiomas, horários e estilo de atendimento.`}
        >
          <textarea
            className="input"
            rows={8}
            placeholder="Fale um pouco sobre você, sua personalidade e como são seus atendimentos..."
            value={bio}
            maxLength={2000}
            onChange={(e) => handleFieldChange(setBio, e.target.value)}
          />
        </FormField>
      </Card>

      {/* Section 3: Categorias de Anúncio (Requirements 15 & 16) */}
      <Card variant="glass" padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Categorias do Perfil</h3>
          </div>
          <Badge variant="neutral">{selectedCatIds.length}/5 selecionadas</Badge>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Selecione até 5 categorias que melhor descrevem seus serviços para ser encontrado(a) nos filtros.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {categories.map((cat) => {
            const isSelected = selectedCatIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => handleCategoryToggle(cat.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-tertiary)',
                  border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {cat.name}
                </span>
                {isSelected && <Check size={16} color="var(--accent-gold)" />}
              </div>
            );
          })}
        </div>
      </Card>
    </AdvertiserLayout>
  );
}
