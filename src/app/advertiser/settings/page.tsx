'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile, Visibility } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Settings,
  Eye,
  EyeOff,
  PauseCircle,
  ShieldCheck,
  Check,
  Shield,
  Key,
  Bell,
  User,
  ArrowRight
} from 'lucide-react';

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
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '840px' }}>
        <Skeleton height="3.5rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Configurações do Anúncio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
          Gerencie a visibilidade do seu perfil, pausa de atendimento e preferências gerais
        </p>
      </div>

      {/* Visibility Control Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.75rem', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Eye size={20} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Visibilidade Pública do Anúncio</h3>
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
              background: visibility === 'public' ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-tertiary)',
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

      {/* Account, Privacy & Security Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={18} color="var(--color-success)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Privacidade & Bloqueios</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Gerencie perfis bloqueados e exportação de dados LGPD.
          </p>
          <Link href="/account/privacy" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Opções de Privacidade
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Key size={18} color="var(--color-info)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Segurança & Senha</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Altere sua senha de acesso e monitore sessões ativas.
          </p>
          <Link href="/account/security" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Gerenciar Segurança
            </Button>
          </Link>
        </Card>

        <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Bell size={18} color="var(--color-warning)" />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Notificações</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            Configure alertas sobre mensagens, moderações e novidades.
          </p>
          <Link href="/account/notifications" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" fullWidth rightIcon={<ArrowRight size={14} />}>
              Central de Notificações
            </Button>
          </Link>
        </Card>
      </div>
    </AdvertiserLayout>
  );
}
