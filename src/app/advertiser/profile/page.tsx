'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { locationService } from '@/services/locationService';
import { AdvertiserProfileSchema } from '@/lib/validation/advertiser';
import { BrazilState, BrazilCity, AdvertiserProfile } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { Sparkles, Save, User, Calendar, MapPin } from 'lucide-react';

export default function AdvertiserProfileEditorPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [existingAdvertiser, setExistingAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [stageName, setStageName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('feminino');
  const [presentation, setPresentation] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const [statesData, advData] = await Promise.all([
          locationService.getStates(),
          advertisersService.getOwnAdvertiserProfile(profile.id),
        ]);

        setStates(statesData);

        if (advData) {
          setExistingAdvertiser(advData);
          setStageName(advData.stage_name || '');
          setSlug(advData.slug || '');
          setHeadline(advData.headline || '');
          setBio(advData.bio || '');
          setBirthDate(advData.birth_date || '');
          setGender(advData.gender || 'feminino');
          setPresentation(advData.presentation || '');
          setStateId(advData.state_id || '');
          setCityId(advData.city_id || '');
          setNeighborhood(advData.neighborhood || '');

          if (advData.state_id) {
            const citiesData = await locationService.getCitiesByState(advData.state_id);
            setCities(citiesData);
          }
        }
      }
      setPageLoading(false);
    }
    loadData();
  }, [profile]);

  const handleStateChange = async (selectedStateId: string) => {
    setStateId(selectedStateId);
    setCityId('');
    if (selectedStateId) {
      const citiesData = await locationService.getCitiesByState(selectedStateId);
      setCities(citiesData);
    } else {
      setCities([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setErrors({});

    const result = AdvertiserProfileSchema.safeParse({
      stageName,
      slug,
      headline: headline || undefined,
      bio: bio || undefined,
      birthDate,
      gender,
      presentation: presentation || undefined,
      stateId: stateId || undefined,
      cityId: cityId || undefined,
      neighborhood: neighborhood || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!profile) return;

    setIsLoading(true);
    try {
      if (existingAdvertiser) {
        // Update
        const res = await advertisersService.updateAdvertiserProfile(existingAdvertiser.id, {
          stage_name: stageName,
          slug,
          headline: headline || null,
          bio: bio || null,
          birth_date: birthDate,
          gender,
          presentation: presentation || null,
          state_id: stateId || null,
          city_id: cityId || null,
          neighborhood: neighborhood || null,
        });

        if (!res.success) {
          setFeedback({ type: 'error', message: res.error || 'Erro ao atualizar perfil do anúncio.' });
          return;
        }

        showToast({
          type: 'success',
          title: 'Perfil Atualizado',
          message: 'As alterações do seu anúncio foram salvas.',
        });
        setFeedback({ type: 'success', message: 'Anúncio atualizado com sucesso!' });
      } else {
        // Create
        const res = await advertisersService.createAdvertiserProfile({
          profile_id: profile.id,
          stage_name: stageName,
          slug,
          headline: headline || undefined,
          bio: bio || undefined,
          birth_date: birthDate,
          gender,
          presentation: presentation || undefined,
          state_id: stateId || undefined,
          city_id: cityId || undefined,
          neighborhood: neighborhood || undefined,
        });

        if (!res.success) {
          setFeedback({ type: 'error', message: res.error || 'Erro ao criar perfil de anunciante.' });
          return;
        }

        showToast({
          type: 'success',
          title: 'Perfil de Anunciante Criado!',
          message: 'Seu perfil foi registrado e passará por moderação.',
        });

        setTimeout(() => {
          router.push('/advertiser');
        }, 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro inesperado ao salvar anúncio.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="container" style={{ padding: '3rem 1rem' }}>Carregando dados do anunciante...</div>;
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {existingAdvertiser ? 'Editar Perfil de Anúncio' : 'Cadastrar Novo Anunciante'}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Preencha com atenção os dados do seu anúncio. A data de nascimento deve comprovar 18+ anos.
      </p>

      <Card variant="glass" padding="lg">
        {feedback && (
          <Alert type={feedback.type} title={feedback.type === 'success' ? 'Sucesso' : 'Atenção'}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="Nome Artístico / Atendimento" required error={errors.stageName}>
            <Input
              type="text"
              placeholder="Ex: Gabriela Miller"
              value={stageName}
              onChange={(e) => {
                setStageName(e.target.value);
                if (!existingAdvertiser && !slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }
              }}
              error={!!errors.stageName}
              leftIcon={<User size={18} />}
              required
            />
          </FormField>

          <FormField
            label="Slug da Página (URL pública)"
            required
            error={errors.slug}
            hint="Identificador do seu anúncio na URL (ex: portal.com/gabriela-miller)."
          >
            <Input
              type="text"
              placeholder="ex: gabriela-miller"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              error={!!errors.slug}
              required
            />
          </FormField>

          <FormField
            label="Data de Nascimento (18+ Obrigatório)"
            required
            error={errors.birthDate}
            hint="Restrição em banco de dados: apenas maiores de 18 anos são aceitos."
          >
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              error={!!errors.birthDate}
              leftIcon={<Calendar size={18} />}
              required
            />
          </FormField>

          <FormField label="Chamada / Slogan Principal" error={errors.headline} hint="Frase de destaque no topo do anúncio.">
            <Input
              type="text"
              placeholder="Ex: Atendimento exclusivo e refinado em Moema"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={120}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Estado (UF)" error={errors.stateId}>
              <Select
                value={stateId}
                onChange={(e) => handleStateChange(e.target.value)}
                placeholderOption="Selecione o Estado"
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Cidade" error={errors.cityId}>
              <Select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                placeholderOption={stateId ? 'Selecione a Cidade' : 'Selecione o Estado primeiro'}
                disabled={!stateId}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Bairro de Atendimento" error={errors.neighborhood}>
            <Input
              type="text"
              placeholder="Ex: Copacabana, Jardins, Savassi"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              leftIcon={<MapPin size={18} />}
            />
          </FormField>

          <FormField label="Biografia / Apresentação Detalhada" error={errors.bio}>
            <textarea
              className="input"
              rows={5}
              placeholder="Descreva seus serviços, diferenciais, idiomas e formas de atendimento..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </FormField>

          <Button type="submit" variant="ruby" fullWidth size="lg" isLoading={isLoading} leftIcon={<Save size={18} />}>
            {existingAdvertiser ? 'Salvar Alterações' : 'Criar Perfil de Anunciante'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
