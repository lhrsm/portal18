'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { commercialService, PlanComparisonRow } from '@/services/commercialService';
import { SubscriptionPlan } from '@/types/app.types';
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
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Star,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function PublicPlansPage() {
  const router = useRouter();
  const { isAdvertiser, user } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [comparison, setComparison] = useState<PlanComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const plansData = await commercialService.getPlans();
      const compData = commercialService.getPlanComparisonMatrix();
      setPlans(plansData);
      setComparison(compData);
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
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
      title: 'Planos em Fase de Homologação',
      message: `O plano ${plan.name} estará disponível para contratação em breve. No momento, todos os recursos básicos e de verificação estão 100% liberados para uso gratuito!`,
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const faqs = [
    {
      q: 'Como funciona a publicação de um anúncio no Portal18?',
      a: 'Você cria seu perfil em etapas simples, informa seus dados artísticos, define suas fotos e contatos e submete para moderação. Nossa equipe revisa a conformidade e seu anúncio é publicado imediatamente após aprovação.',
    },
    {
      q: 'Quanto tempo leva para meu perfil ser aprovado?',
      a: 'Nossa equipe de moderação opera com SLA prioritário. A grande maioria dos anúncios é analisada e liberada em poucas horas.',
    },
    {
      q: 'Posso alterar fotos, descrição e contatos a qualquer momento?',
      a: 'Sim! Você tem total autonomia no seu Painel do Anunciante para editar dados, adicionar novas fotos ou pausar seu anúncio quando quiser.',
    },
    {
      q: 'Como funcionam os destaques e impulsionamentos?',
      a: 'Os destaques posicionam seu anúncio nas primeiras posições da página inicial, buscas da cidade e categorias específicas pelo período contratado.',
    },
    {
      q: 'Posso cancelar minha assinatura quando quiser?',
      a: 'Sim, sem qualquer fidelidade ou multa. Ao cancelar, seu plano permanece ativo com todos os benefícios até o encerramento do período já faturado.',
    },
    {
      q: 'Meus documentos ou dados pessoais ficam públicos?',
      a: 'Nunca! O Portal18 segue rigorosamente as diretrizes da LGPD. Fotos de documento e processos de verificação são 100% sigilosos e de acesso exclusivo da equipe de segurança.',
    },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1rem 6rem 1rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3.5rem auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold"><Sparkles size={13} /> CATÁLOGO COMERCIAL PORTAL18</Badge>
        </div>
        <h1 style={{ fontSize: '2.6rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Escolha o Plano Ideal para o seu Perfil
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Aumente sua visibilidade, desbloqueie recursos exclusivos e conquiste as melhores posições de descoberta na sua cidade.
        </p>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <Skeleton height="460px" />
          <Skeleton height="460px" />
          <Skeleton height="460px" />
          <Skeleton height="460px" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'stretch', marginBottom: '4rem' }}>
          {plans.map((plan) => {
            const isVip = plan.slug === 'vip';
            const isPremium = plan.slug === 'premium';
            const features = Array.isArray(plan.features) ? plan.features : [];

            return (
              <Card
                key={plan.id}
                variant={isVip || isPremium ? 'premium' : 'glass'}
                padding="lg"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: isVip ? '2px solid var(--accent-gold)' : undefined,
                  transform: isVip ? 'scale(1.02)' : 'none',
                }}
              >
                {isVip && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)' }}>
                    <Badge variant="ruby"><Crown size={12} /> MAIS POPULAR VIP</Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem' }}>{plan.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', minHeight: '40px', lineHeight: 1.5 }}>
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                      {formatPrice(plan.price_amount)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/mês</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cobrança mensal sem fidelidade</span>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', flex: 1 }}>
                  {features.map((feat: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Check size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  variant={isVip ? 'primary' : isPremium ? 'ruby' : 'secondary'}
                  size="md"
                  fullWidth
                  onClick={() => handleSelectPlan(plan)}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Disponível em Breve
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Comparison Table Section */}
      <div style={{ marginBottom: '4.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Comparativo Detalhado de Recursos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Compare todos os recursos e limites de cada plano lado a lado
          </p>
        </div>

        <Card variant="glass" padding="md" style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Recurso</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Essencial</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Destaque</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-gold)' }}>Premium</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-gold)' }}>VIP</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, idx) => {
                const renderCell = (val: string | boolean) => {
                  if (typeof val === 'boolean') {
                    return val ? (
                      <Check size={18} color="var(--color-success)" style={{ margin: '0 auto' }} />
                    ) : (
                      <X size={18} color="var(--text-muted)" style={{ margin: '0 auto' }} />
                    );
                  }
                  return <span>{val}</span>;
                };

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{renderCell(row.essencial)}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{renderCell(row.destaque)}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600 }}>{renderCell(row.premium)}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-gold)' }}>{renderCell(row.vip)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Commercial FAQ */}
      <div style={{ maxWidth: '800px', margin: '0 auto 4rem auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Perguntas Frequentes sobre Planos
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Tire suas dúvidas sobre contratação, segurança e publicação
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <Card
                key={idx}
                variant="glass"
                padding="md"
                style={{ cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{faq.q}</h4>
                  {isOpen ? <ChevronUp size={18} color="var(--accent-gold)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>
                {isOpen && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.75rem', marginBottom: 0 }}>
                    {faq.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <Card variant="premium" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Pronta para divulgar seu trabalho com elegância?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
          Crie seu perfil profissional no Portal18 e tenha controle total sobre suas fotos, contatos e visibilidade.
        </p>
        <Link href="/advertiser/start">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
            Começar a Anunciar Gratuitamente
          </Button>
        </Link>
      </Card>
    </div>
  );
}
