'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { reputationService } from '@/services/reputation/reputationService';
import { AdvertiserProfileHealth } from '@/services/reputation/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Camera,
  MessageCircle,
  Sparkles,
  Info
} from 'lucide-react';

export default function AdvertiserHealthPage() {
  const { profile } = useAuth();
  const [health, setHealth] = useState<AdvertiserProfileHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    if (!profile) return;
    setLoading(true);
    const data = await reputationService.getProfileHealth(profile.id);
    setHealth(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHealth();
  }, [profile]);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/advertiser" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar para o Painel
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
              Saúde do Perfil & Qualidade do Anúncio
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Recomendações objetivas para aumentar a confiança e visibilidade do seu perfil
            </p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadHealth} isLoading={loading}>
            Reavaliar
          </Button>
        </div>
      </div>

      {/* Notice Banner */}
      <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem', background: 'rgba(229, 185, 92, 0.04)', border: '1px solid rgba(229, 185, 92, 0.2)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Info size={20} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
              Transparência & Integridade
            </strong>
            Os selos de confiança no Portal18 são concedidos estritamente por comprovação real de autenticidade e qualidade de mídia. Assinaturas de planos comerciais e visibilidade patrocinada não compram reputação.
          </div>
        </div>
      </Card>

      {/* Health Dimensions */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="100%" height="80px" />
          <Skeleton width="100%" height="80px" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {health?.dimensions.map((dim) => (
            <Card key={dim.key} variant="glass" padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {dim.status === 'good' ? (
                    <CheckCircle2 size={20} color="var(--color-success)" />
                  ) : dim.status === 'attention' ? (
                    <AlertTriangle size={20} color="var(--color-warning)" />
                  ) : (
                    <AlertCircle size={20} color="var(--accent-ruby)" />
                  )}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{dim.label}</h3>
                </div>
                <Badge variant={dim.status === 'good' ? 'success' : dim.status === 'attention' ? 'gold' : 'ruby'}>
                  {dim.status_label}
                </Badge>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
                {dim.guidance}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {dim.key === 'authenticity' && dim.status !== 'good' && (
                  <Link href="/advertiser/verification" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="primary" leftIcon={<ShieldCheck size={14} />}>
                      Gravar Vídeo de Autenticidade
                    </Button>
                  </Link>
                )}
                {dim.key === 'media' && (
                  <Link href="/advertiser/gallery" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="secondary" leftIcon={<Camera size={14} />}>
                      Gerenciar Galeria de Fotos
                    </Button>
                  </Link>
                )}
                {dim.key === 'completeness' && (
                  <Link href="/advertiser/profile" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="secondary" leftIcon={<Sparkles size={14} />}>
                      Editar Biografia & Dados
                    </Button>
                  </Link>
                )}
                {dim.key === 'freshness' && (
                  <Link href="/advertiser/profile" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={14} />}>
                      Revisar Dados do Anúncio
                    </Button>
                  </Link>
                )}
                {dim.key === 'contact' && (
                  <Link href="/advertiser/contacts" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="secondary" leftIcon={<MessageCircle size={14} />}>
                      Configurar Contatos
                    </Button>
                  </Link>
                )}
                {dim.key === 'reviews' && (
                  <Link href="/advertiser/notifications" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="secondary" leftIcon={<MessageCircle size={14} />}>
                      Ver Avaliações
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

