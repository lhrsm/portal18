'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ShieldCheck, UserCheck, AlertCircle, Clock, Sparkles } from 'lucide-react';

export default function AdvertiserVerificationPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        setAdvertiser(adv);
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success"><ShieldCheck size={12} /> Identidade Verificada</Badge>;
      case 'pending':
      case 'processing':
        return <Badge variant="warning"><Clock size={12} /> Em Análise</Badge>;
      case 'rejected':
      case 'requires_review':
        return <Badge variant="ruby"><AlertCircle size={12} /> Revisão Necessária</Badge>;
      default:
        return <Badge variant="neutral">Não Iniciada</Badge>;
    }
  };

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Verificação de Identidade 18+</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Autenticação documental para obtenção do selo de perfil verificado e maior destaque nas buscas
        </p>
      </div>

      {/* Current Status Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={24} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Status Atual da Verificação</h3>
          </div>
          {getVerificationStatusBadge(advertiser?.verification_status)}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          O selo <strong>Verificado</strong> garante maior credibilidade, confiança dos visitantes e prioridade no posicionamento orgânico de sua cidade.
        </p>

        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            🔒 Como funcionará a validação?
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            A verificação é realizada via provedor de biometria facial e checagem de documento oficial com foto (RG ou CNH). Nenhum documento pessoal será tornado público.
          </div>
        </div>

        <Button variant="secondary" disabled>
          Módulo de Verificação Automatizada (Em Breve)
        </Button>
      </Card>
    </AdvertiserLayout>
  );
}
