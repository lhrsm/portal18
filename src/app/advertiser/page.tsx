'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Megaphone, ShieldCheck, Image as ImageIcon, Sparkles, AlertTriangle, UserCheck } from 'lucide-react';

export default function AdvertiserDashboardPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdvertiser() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        setAdvertiser(adv);
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadAdvertiser();
    }
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="180px" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">ÁREA DO ANUNCIANTE</Badge>
            {advertiser && (
              <Badge variant={advertiser.profile_status === 'approved' ? 'success' : 'warning'}>
                {advertiser.profile_status}
              </Badge>
            )}
          </div>
          <h1 style={{ fontSize: '2.2rem' }}>
            {advertiser ? advertiser.stage_name : 'Painel do Anunciante'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Gerencie seu perfil de anúncios, mídias e status de verificação
          </p>
        </div>

        <Link href="/advertiser/profile">
          <Button variant="primary" leftIcon={<Sparkles size={16} />}>
            {advertiser ? 'Editar Anúncio' : 'Criar Perfil de Anunciante'}
          </Button>
        </Link>
      </div>

      {!advertiser ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Megaphone size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Você ainda não possui um perfil de anunciante</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Crie seu perfil profissional com fotos, descrição dos seus serviços, localização e horários de atendimento para começar a receber contatos.
          </p>
          <Link href="/advertiser/profile">
            <Button variant="primary" size="lg">
              Começar Agora
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Card Status */}
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldCheck size={20} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.2rem' }}>Status do Anúncio</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Moderação do Perfil:</span>
                <Badge variant={advertiser.profile_status === 'approved' ? 'success' : 'warning'}>
                  {advertiser.profile_status}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Verificação KYC:</span>
                <Badge variant={advertiser.verification_status === 'verified' ? 'success' : 'neutral'}>
                  {advertiser.verification_status}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Visibilidade Pública:</span>
                <Badge variant={advertiser.visibility === 'public' ? 'gold' : 'neutral'}>
                  {advertiser.visibility}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Card Media Preview */}
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ImageIcon size={20} color="var(--accent-ruby)" />
              <h3 style={{ fontSize: '1.2rem' }}>Galeria & Mídias</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Todas as mídias passam por moderação prévia antes de serem exibidas publicamente.
            </p>
            <Link href="/advertiser/profile">
              <Button variant="secondary" fullWidth size="sm">
                Gerenciar Mídias
              </Button>
            </Link>
          </Card>

          {/* Card 18+ Verification */}
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <UserCheck size={20} color="var(--color-success)" />
              <h3 style={{ fontSize: '1.2rem' }}>Maioridade & Segurança</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Data de Nascimento: <strong>{new Date(advertiser.birth_date).toLocaleDateString('pt-BR')}</strong> (18+ Confirmado no Banco)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <AlertTriangle size={14} color="var(--color-warning)" />
              <span>Documentos privados armazenados com segurança isolada</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
