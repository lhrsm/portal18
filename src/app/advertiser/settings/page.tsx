'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile, Visibility } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { Settings, Eye, EyeOff, PauseCircle, ShieldAlert, Check } from 'lucide-react';

export default function AdvertiserSettingsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        if (adv) {
          setAdvertiser(adv);
          const validVis: Visibility = (adv.visibility === 'private' || adv.visibility === 'hidden') ? adv.visibility : 'public';
          setVisibility(validVis);
        }
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  const handleToggleVisibility = async (newVis: Visibility) => {
    if (!advertiser || isUpdating) return;
    setIsUpdating(true);

    try {
      const res = await advertisersService.updateVisibility(advertiser.id, newVis);
      if (res.success) {
        setVisibility(newVis);
        setAdvertiser({ ...advertiser, visibility: newVis });
        showToast({
          type: 'success',
          title: 'Visibilidade Atualizada',
          message: newVis === 'public' ? 'Seu anúncio está visível publicamente.' : 'Seu anúncio foi ocultado das buscas públicas.',
        });
      } else {
        showToast({ type: 'error', title: 'Erro ao alterar visibilidade' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Configurações do Anúncio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Gerencie a visibilidade do seu perfil e preferências de exibição
        </p>
      </div>

      {/* Visibility Control Card (Requirement 76) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Eye size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Visibilidade Pública do Anúncio</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Controle se o seu perfil aparece nos resultados de busca do portal. Ocultar o perfil não apaga suas fotos ou dados cadastrados.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            onClick={() => handleToggleVisibility('public')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: visibility === 'public' ? 'rgba(229, 185, 92, 0.12)' : 'var(--bg-tertiary)',
              border: `1px solid ${visibility === 'public' ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Eye size={20} color={visibility === 'public' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Público (Ativo nas Buscas)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Seu perfil aparece nas buscas de sua cidade e estado quando aprovado.</div>
              </div>
            </div>
            {visibility === 'public' && <Check size={18} color="var(--accent-gold)" />}
          </div>

          <div
            onClick={() => handleToggleVisibility('private')}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: visibility === 'private' ? 'rgba(163, 0, 33, 0.15)' : 'var(--bg-tertiary)',
              border: `1px solid ${visibility === 'private' ? 'var(--accent-ruby)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <EyeOff size={20} color={visibility === 'private' ? 'var(--accent-ruby)' : 'var(--text-muted)'} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Privado / Oculto Temporariamente</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhum visitante poderá encontrar ou acessar seu perfil.</div>
              </div>
            </div>
            {visibility === 'private' && <Check size={18} color="var(--accent-ruby)" />}
          </div>
        </div>
      </Card>

      {/* Temporary Pause / Account Actions (Requirement 77) */}
      <Card variant="glass" padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <PauseCircle size={20} color="var(--accent-ruby)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pausa de Atendimento</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Se for viajar ou desejar pausar temporariamente seus atendimentos, você pode alternar a visibilidade para privado acima a qualquer momento sem perder suas fotos aprovadas.
        </p>
      </Card>
    </AdvertiserLayout>
  );
}
