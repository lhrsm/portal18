'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { consumerSubscriptionService } from '@/services/consumerSubscriptionService';
import { ConsumerPlan, BillingPeriod } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Check,
  X,
  Crown,
  Zap,
  ShieldCheck,
  ArrowRight,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Video,
  MessageSquare,
  Bell,
  Heart,
  History
} from 'lucide-react';

export default function ConsumerPremiumPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<ConsumerPlan[]>([]);
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [selectedPeriodSlug, setSelectedPeriodSlug] = useState<string>('30_days');
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const catalog = await consumerSubscriptionService.getCatalog();
      if (catalog && catalog.success) {
        setPlans(catalog.plans);
        setPeriods(catalog.periods);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectPlan = (plan: ConsumerPlan) => {
    if (!user) {
      router.push('/login?redirect=/premium');
      return;
    }

    showToast({
      type: 'info',
      title: 'Assinaturas em Homologação',
      message: `O Portal18 Premium (${selectedPeriodSlug}) estará disponível para contratação em breve. No momento, o acesso básico e todos os recursos de contato continuam 100% gratuitos!`,
    });
  };

  const formatPrice = (cents?: number) => {
    if (cents === undefined || cents === null || cents === 0) return 'Gratuito';
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const faqs = [
    {
      q: 'O que é o Portal18 Premium para clientes/visitantes?',
      a: 'É uma assinatura opcional para membros autenticados que desejam acessar vídeos comerciais exclusivos, ler avaliações completas e receber alertas personalizados.',
    },
    {
      q: 'Preciso ser assinante Premium para entrar em contato com anunciantes?',
      a: 'Não! O contato direto com anunciantes elegíveis continua 100% gratuito e aberto para todos os visitantes que cumprirem a verificação de idade.',
    },
    {
      q: 'O Portal18 Premium dispensa a verificação de idade (18+)?',
      a: 'De forma alguma. A proteção de menores e as diretrizes do ECA Digital são absolutas: qualquer visualização de conteúdo restrito exige validação de idade, independentemente de assinatura.',
    },
    {
      q: 'O que acontece com meus favoritos e listas se a assinatura expirar?',
      a: 'Seus dados pessoais, perfis favoritos e listas permanecem 100% preservados na sua conta. Apenas os recursos exclusivos de mídia e leitura de avaliações retornam ao modo básico.',
    },
    {
      q: 'Como são moderadas as avaliações no Portal18?',
      a: 'Todas as avaliações passam por moderação prévia da nossa equipe de Trust & Safety para impedir termos ofensivos, doxxing ou violações às regras da comunidade.',
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1rem 6rem 1rem', maxWidth: '1080px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold"><Crown size={12} /> EXPERIÊNCIA DO MEMBRO</Badge>
          <Badge variant="neutral">Portal18 Premium</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Descubra Mais com o Portal18 Premium
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto' }}>
          Vídeos exclusivos, avaliações moderadas completas e recursos avançados para organizar suas preferências.
        </p>

        {/* Period Selector */}
        <div style={{ display: 'inline-flex', gap: '0.5rem', marginTop: '2rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {periods.map((p) => (
            <Button
              key={p.id}
              variant={selectedPeriodSlug === p.slug ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setSelectedPeriodSlug(p.slug)}
              style={{ fontWeight: selectedPeriodSlug === p.slug ? 700 : 500 }}
            >
              {p.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Plans Comparison Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <Skeleton height="380px" />
          <Skeleton height="380px" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {plans.map((plan) => {
            const isPremium = plan.slug === 'premium';
            const pricing = plan.pricing[selectedPeriodSlug];

            return (
              <Card
                key={plan.id}
                variant="glass"
                padding="lg"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: isPremium ? '2px solid var(--accent-gold)' : undefined,
                  position: 'relative',
                }}
              >
                {isPremium && (
                  <Badge variant="gold" style={{ position: 'absolute', top: '-12px', right: '1rem' }}>
                    EXPERIÊNCIA COMPLETA
                  </Badge>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{plan.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', minHeight: '40px', margin: 0 }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ margin: '1rem 0 1.5rem 0' }}>
                  <div style={{ fontSize: '2.25rem', fontWeight: 900, color: isPremium ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                    {isPremium ? (pricing ? formatPrice(pricing.price_cents) : 'Preço a definir') : 'Grátis'}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {isPremium ? `por ${pricing?.duration_days || 30} dias` : 'Para sempre'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} color="var(--color-success)" />
                    <span>Navegação e busca por perfis 18+</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} color="var(--color-success)" />
                    <span>Contato direto e canais oficiais</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPremium ? (
                      <Check size={16} color="var(--color-success)" />
                    ) : (
                      <X size={16} color="var(--text-muted)" />
                    )}
                    <span><strong>Vídeos Exclusivos</strong> de anunciantes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPremium ? (
                      <Check size={16} color="var(--color-success)" />
                    ) : (
                      <X size={16} color="var(--text-muted)" />
                    )}
                    <span><strong>Avaliações completas</strong> moderadas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPremium ? (
                      <Check size={16} color="var(--color-success)" />
                    ) : (
                      <X size={16} color="var(--text-muted)" />
                    )}
                    <span><strong>Alertas inteligentes</strong> de novos perfis</span>
                  </div>
                </div>

                <Button
                  variant={isPremium ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => handleSelectPlan(plan)}
                  fullWidth
                >
                  {isPremium ? 'Assinar Portal18 Premium' : 'Conta Gratuita'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feature Highlights */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem' }}>
          Recursos Exclusivos da Assinatura
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <Card variant="glass" padding="md">
            <Video size={24} color="var(--accent-gold)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Vídeos Exclusivos</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Acesso a vídeos comerciais dedicados publicados pelos perfis participantes.
            </p>
          </Card>

          <Card variant="glass" padding="md">
            <MessageSquare size={24} color="var(--color-info)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Avaliações Moderadas</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Leitura de comentários completos e pontuações dimensionais com verificação de autenticidade.
            </p>
          </Card>

          <Card variant="glass" padding="md">
            <Bell size={24} color="var(--color-success)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Alertas Inteligentes</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Notificações no painel sobre novos anúncios na sua cidade e categorias prediletas.
            </p>
          </Card>

          <Card variant="glass" padding="md">
            <Heart size={24} color="var(--color-ruby)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Coleções & Listas</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Organização personalizada de perfis com filtros avançados e anotações privadas.
            </p>
          </Card>
        </div>
      </div>

      {/* Safety Notice */}
      <Card variant="glass" padding="md" style={{ background: 'rgba(212, 175, 55, 0.06)', border: '1px solid var(--border-accent)', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <ShieldCheck size={30} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--accent-gold)', fontSize: '0.95rem' }}>Segurança & Proteção à Criança e ao Adolescente:</strong>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              O Portal18 opera sob regime estrito do ECA Digital. Assinaturas Premium não dispensam a confirmação de maioridade (18+), e nenhum dado financeiro ou de identificação civil é exposto publicamente.
            </p>
          </div>
        </div>
      </Card>

      {/* FAQ */}
      <div style={{ maxWidth: '800px', margin: '0 auto 4rem auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem' }}>
          Dúvidas Frequentes sobre o Portal18 Premium
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <Card
                key={idx}
                variant="glass"
                padding="md"
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
                {isOpen && (
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {faq.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
