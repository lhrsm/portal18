'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { locationService } from '@/services/locationService';
import { AdvertiserProfile, BrazilState, BrazilCity } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { MapPin, ShieldCheck, Check, RefreshCw, AlertCircle, Lock } from 'lucide-react';

export default function AdvertiserLocationPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [loading, setLoading] = useState(true);

  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const [adv, statesData] = await Promise.all([
          advertisersService.getOwnAdvertiserProfile(profile.id),
          locationService.getStates(),
        ]);

        setStates(statesData);

        if (adv) {
          setAdvertiser(adv);
          setStateId(adv.state_id || '');
          setCityId(adv.city_id || '');
          setNeighborhood(adv.neighborhood || '');

          if (adv.state_id) {
            const citiesData = await locationService.getCitiesByState(adv.state_id);
            setCities(citiesData);
          }
        }
      }
      setLoading(false);
      initialLoadDoneRef.current = true;
    }

    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  const handleStateChange = async (selectedStateId: string) => {
    setStateId(selectedStateId);
    setCityId('');
    setSaveStatus('saving');

    if (selectedStateId) {
      const citiesData = await locationService.getCitiesByState(selectedStateId);
      setCities(citiesData);
    } else {
      setCities([]);
    }

    if (advertiser) {
      const res = await advertisersService.updateAdvertiserProfile(advertiser.id, {
        state_id: selectedStateId || null,
        city_id: null,
      });
      if (res.success) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    }
  };

  const handleCityChange = async (selectedCityId: string) => {
    setCityId(selectedCityId);
    if (advertiser) {
      setSaveStatus('saving');
      const res = await advertisersService.updateAdvertiserProfile(advertiser.id, {
        city_id: selectedCityId || null,
      });
      if (res.success) {
        setSaveStatus('saved');
        showToast({ type: 'success', title: 'Localização Atualizada' });
      } else {
        setSaveStatus('error');
      }
    }
  };

  const handleNeighborhoodChange = (val: string) => {
    setNeighborhood(val);
    setSaveStatus('idle');

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (advertiser) {
        setSaveStatus('saving');
        const res = await advertisersService.updateAdvertiserProfile(advertiser.id, {
          neighborhood: val || null,
        });
        if (res.success) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      }
    }, 700);
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Localização de Atendimento</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Região onde você realiza atendimentos e é indexado(a) nas buscas
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

      {/* Form Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <MapPin size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Região de Atendimento</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <FormField label="Estado (UF)" required>
            <Select value={stateId} onChange={(e) => handleStateChange(e.target.value)} placeholderOption="Selecione o Estado">
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Cidade" required>
            <Select
              value={cityId}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholderOption={stateId ? 'Selecione a Cidade' : 'Escolha o estado primeiro'}
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

        <FormField label="Bairro ou Zona (Opcional)" hint="Ex: Copacabana, Jardins, Savassi, Batel — Ajuda clientes locais a encontrar seu anúncio.">
          <Input
            type="text"
            placeholder="Informe seu bairro principal de atendimento"
            value={neighborhood}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
          />
        </FormField>
      </Card>

      {/* Privacy Notice Card */}
      <Card variant="glass" padding="md" style={{ border: '1px solid rgba(229, 185, 92, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Lock size={18} color="var(--accent-gold)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Privacidade Garantida
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Nunca exigimos ou exibimos seu endereço residencial completo ou geolocalização em tempo real.
            </div>
          </div>
        </div>
      </Card>
    </AdvertiserLayout>
  );
}
