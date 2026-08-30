'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { commercialCatalogService } from '@/services/commercialCatalogService';
import { CatalogPlan, BillingPeriod } from '@/types/app.types';
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
  Clock,
  Sparkles
} from 'lucide-react';

export default function PublicPlansPage() {
  const router = useRouter();
  const { isAdvertiser, user } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [selectedPeriodSlug, setSelectedPeriodSlug] = useState<string>('30_days');
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const catalog = await commercialCatalogService.getCatalog();
      if (catalog && catalog.success) {
        setPlans(catalog.plans);
        setPeriods(catalog.periods);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectPlan = async (plan: CatalogPlan) => {
    if (!user) {
      router.push(`/login?redirect=/advertiser/subscription/plans`);
      return;
    }

    if (!isAdvertiser) {
      router.push('/advertiser/start');
      return;
    }

    showToast({
      type: 'info',
      title: 'Planos em Homologação',
      message: `O plano ${plan.name} (${selectedPeriodSlug}) estará disponível para contratação em breve. Durante este período, o modo gratuito e o trial continuam 100% funcionais!`,
    });
  };

  const formatPrice = (cents?: number) => {
    if (cents === undefined || cents === null) return 'Preço a definir';
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const faqs = [
    {
      q: 'Como funciona o período gratuito de experimentação (Trial)?',
      a: 'Ao ter seu perfil aprovado pela equipe de moderação, você recebe automaticamente 7 dias de experiência Premium sem necessidade de cadastrar cartão de crédito.',
    },
    {
      q: 'O que acontece após o término do período de experimentação?',
      a: 'Seu perfil passa automaticamente para o Modo Gratuito/Limitado. Suas fotos, dados cadastrais e o selo de autenticidade continuam 100% preservados e visíveis.',
    },
    {
      q: 'O selo de autenticidade é pago?',
      a: 'Não. A autenticidade é 100% gratuita para qualquer anunciante elegível, independentemente do plano contratado.',
    },
    {
      q: 'Posso alterar meu plano ou período quando quiser?',
      a: 'Sim. Você pode escolher períodos de 7, 30 ou 90 dias e fazer upgrade ou agendar downgrade a qualquer momento no seu painel.',
    },
    {
      q: 'Como funcionam os destaques e impulsionamentos adicionais?',
      a: 'Você pode contratar produtos de destaque avulsos (como Topo da Cidade ou Destaque na Home) diretamente no Marketplace de Visibilidade.',
    },
    {
      q: 'Meus dados ou documentos são compartilhados publicamente?',
      a: 'Nunca! O Portal18 segue rigorosamente as diretrizes da LGPD e as normas do ECA Digital. Todos os dados de verificação são criptografados e confidenciais.',
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1rem 6rem 1rem', maxWidth: '1140px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <Badge variant="gold" style={{ marginBottom: '0.75rem' }}>CATÁLOGO OFICIAL DE PLANOS</Badge>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Escolha o Plano Ideal para a Sua Presença
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '680px', margin: '0 auto' }}>
          Maior visibilidade nas buscas, galeria completa e inteligência de desempenho para profissionais independentes.
        </p>

        {/* 7-Day Trial Callout Banner */}
        <div style={{
          maxWidth: '720px',
          margin: '2rem auto 0 auto',
          padding: '1rem 1.5rem',
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          textAlign: 'left'
        }}>
          <ShieldCheck size={28} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--accent-gold)', fontSize: '0.95rem' }}>Experimentação Premium de 7 Dias:</strong>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Todo novo anúncio aprovado ganha 7 dias com todos os benefícios Premium liberados, sem necessidade de cartão de crédito.
            </p>
          </div>
        </div>

        {/* Billing Period Selector */}
        <div style={{ display: 'inline-flex', gap: '0.5rem', marginTop: '2.5rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
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

      {/* Plans Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <Skeleton height="400px" />
          <Skeleton height="400px" />
          <Skeleton height="400px" />
          <Skeleton height="400px" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {plans.map((plan) => {
            const pricing = plan.pricing[selectedPeriodSlug];
            const isFeatured = plan.slug === 'premium';

            return (
              <Card
                key={plan.id}
                variant="glass"
                padding="lg"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: isFeatured ? '2px solid var(--accent-gold)' : undefined,
                  position: 'relative',
                }}
              >
                {isFeatured && (
                  <Badge variant="gold" style={{ position: 'absolute', top: '-12px', right: '1rem' }}>
                    EXPERIÊNCIA DO TRIAL
                  </Badge>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{plan.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: '40px', margin: 0 }}>
                    {plan.description}
                  </p>
                </div>

                <div style={{ margin: '1rem 0 1.5rem 0' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                    {pricing ? formatPrice(pricing.price_cents) : 'Preço a definir'}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    por {pricing?.duration_days || 30} dias
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} color="var(--color-success)" />
                    <span>Até <strong>{plan.media_limit} fotos</strong> na galeria</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {plan.video_limit > 0 ? (
                      <Check size={16} color="var(--color-success)" />
                    ) : (
                      <X size={16} color="var(--text-muted)" />
                    )}
                    <span>{plan.video_limit > 0 ? `Até ${plan.video_limit} vídeos comerciais` : 'Sem vídeos na galeria'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} color="var(--color-success)" />
                    <span>Selo de Autenticidade (Grátis)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} color="var(--color-success)" />
                    <span>Analytics {plan.analytics_level === 'premium' ? 'Completo' : plan.analytics_level === 'advanced' ? 'Avançado' : 'Básico'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {plan.boost_allowance > 0 ? (
                      <Check size={16} color="var(--color-success)" />
                    ) : (
                      <X size={16} color="var(--text-muted)" />
                    )}
                    <span>{plan.boost_allowance > 0 ? `${plan.boost_allowance} destaque(s) incluído(s)` : 'Sem destaques incluídos'}</span>
                  </div>
                </div>

                <Button
                  variant={isFeatured ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => handleSelectPlan(plan)}
                  fullWidth
                >
                  {isAdvertiser ? 'Escolher Plano' : 'Começar a Anunciar'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Table */}
      <div style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>
          Comparativo Completo de Recursos
        </h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Transparência total em todos os limites e funcionalidades
        </p>

        <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Recurso</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Essencial</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Destaque</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-gold)' }}>Premium (Trial)</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>VIP</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Limite de Fotos</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>10 fotos</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>15 fotos</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-gold)' }}>20 fotos</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>30 fotos</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Vídeos Comerciais</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}><X size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} /></td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}><X size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} /></td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-gold)' }}>1 vídeo</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>3 vídeos</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Áudio de Apresentação</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}><X size={16} color="var(--text-muted)" style={{ margin: '0 auto' }} /></td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}><Check size={16} color="var(--color-success)" style={{ margin: '0 auto' }} /></td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--accent-gold)' }}><Check size={16} color="var(--accent-gold)" style={{ margin: '0 auto' }} /></td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}><Check size={16} color="var(--color-success)" style={{ margin: '0 auto' }} /></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Selo Perfil Autêntico</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--color-success)' }}>Grátis</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--color-success)' }}>Grátis</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--color-success)' }}>Grátis</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--color-success)' }}>Grátis</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Analytics & Funil</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Básico (7d)</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Avançado (30d)</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-gold)' }}>Avançado (90d)</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Completo VIP</td>
              </tr>
              <tr>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Destaques Incluídos</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>—</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>1/ciclo</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-gold)' }}>2/ciclo</td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>4/ciclo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div style={{ maxWidth: '800px', margin: '0 auto 4rem auto' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '1.5rem' }}>
          Dúvidas Frequentes sobre Planos
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

      {/* Bottom CTA */}
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-accent)' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Pronto para Divulgar com Segurança e Alcance?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
          Crie seu anúncio agora, experimente 7 dias de benefícios Premium após a moderação e receba contatos diretos.
        </p>
        <Link href="/advertiser/start">
          <Button variant="primary" size="lg">
            Criar Meu Anúncio Agora
          </Button>
        </Link>
      </div>
    </div>
  );
}
