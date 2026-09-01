'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { billingService } from '@/services/billingService';
import { PromotionProduct, AdvertiserCampaign } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Zap,
  Megaphone,
  Clock,
  TrendingUp,
  ArrowLeft,
  Eye,
  MousePointerClick,
  Info
} from 'lucide-react';

export default function AdvertiserPromotePage() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<PromotionProduct[]>([]);
  const [campaigns, setCampaigns] = useState<(AdvertiserCampaign & { promotion_products?: PromotionProduct })[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [prodRes, campRes] = await Promise.all([
      billingService.getPromotionProducts(),
      billingService.getOwnCampaigns(),
    ]);

    setProducts(prodRes);
    setCampaigns(campRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductInterest = (product: PromotionProduct) => {
    showToast({
      type: 'info',
      title: 'Destaques em Breve!',
      message: `O módulo de impulsionamento (${product.name}) está em homologação e será ativado em breve para todos os anunciantes.`,
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '900px' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="350px" />
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/advertiser" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Painel do Anunciante
        </Link>
        <Badge variant="gold"><Megaphone size={12} /> RECURSO EM HOMOLOGAÇÃO</Badge>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Impulsionamento & Destaques
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Coloque seu perfil nas primeiras posições de busca e multiplique os contatos de clientes
        </p>
      </div>

      {/* Production Notice Card */}
      <Card variant="glass" padding="md" style={{ background: 'rgba(212, 175, 55, 0.06)', border: '1px solid rgba(212, 175, 55, 0.25)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Info size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--accent-gold)' }}>Módulo Comercial em Preparação:</strong> Os pacotes de destaque abaixo estarão disponíveis para contratação direta em breve. Perfis verificados já contam com prioridade orgânica nas buscas.
          </div>
        </div>
      </Card>

      {/* Active Campaigns Banner if any */}
      {activeCampaigns.length > 0 && (
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--color-success)', backgroundColor: 'rgba(46, 204, 113, 0.08)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={22} color="var(--color-success)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)' }}>
              Campanhas em Andamento ({activeCampaigns.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {activeCampaigns.map((camp) => (
              <div key={camp.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                <div>
                  <strong>{camp.promotion_products?.name || 'Destaque'}</strong> • Expira em: {camp.ends_at ? new Date(camp.ends_at).toLocaleString('pt-BR') : 'Em breve'}
                </div>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Eye size={14} /> {camp.impressions} impressões</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MousePointerClick size={14} /> {camp.clicks} cliques</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Products Catalog */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        Produtos de Destaque Disponíveis
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {products.map((prod) => (
          <Card key={prod.id} variant="glass" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <Badge variant={prod.placement === 'homepage_featured' ? 'gold' : 'ruby'}>
                  {prod.placement === 'homepage_featured' ? 'Home Destaque' : prod.placement === 'city_top' ? 'Topo Cidade' : 'Categoria'}
                </Badge>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
                  {prod.duration_hours}h duração
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>{prod.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: '40px' }}>
                {prod.description}
              </p>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  {formatPrice(prod.price_amount)}
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleProductInterest(prod)}
                leftIcon={<Zap size={14} />}
              >
                Disponível em Breve
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
