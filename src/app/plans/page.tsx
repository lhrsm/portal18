'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { billingService } from '@/services/billingService';
import { SubscriptionPlan } from '@/types/app.types';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Check, 
  Crown, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Star,
  Info 
} from 'lucide-react';

export default function PublicPlansPage() {
  const router = useRouter();
  const { isAdvertiser, user } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('monthly');
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await billingService.getSubscriptionPlans();
      setPlans(data);
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

    setProcessingPlanId(plan.id);
    try {
      const res = await billingService.createCheckout('subscription', plan.id);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        showToast({
          type: 'error',
          title: 'Não foi possível iniciar checkout',
          message: res.error || 'Tente novamente mais tarde.',
        });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Erro de Pagamento', message: 'Falha ao processar checkout.' });
    } finally {
      setProcessingPlanId(null);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 6rem 1rem' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold"><Sparkles size={13} /> PLANOS & MONETIZAÇÃO</Badge>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Escolha o Plano Ideal para o seu Perfil
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Aumente sua visibilidade, desbloqueie recursos exclusivos e conquiste as melhores posições de descoberta na sua cidade.
        </p>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <Skeleton height="450px" />
          <Skeleton height="450px" />
          <Skeleton height="450px" />
          <Skeleton height="450px" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cobrança mensal recorrente</span>
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
                  isLoading={processingPlanId === plan.id}
                  rightIcon={<ArrowRight size={16} />}
                >
                  Contratar {plan.name}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trust & Transparency Note */}
      <div style={{ marginTop: '4rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Info size={24} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Transparência Comercial:</strong> A contratação de planos destina-se exclusivamente à divulgação e monetização de serviços publicitários na plataforma. A plataforma não intermedia nem cobra comissões sobre atendimentos presenciais.
        </div>
      </div>
    </div>
  );
}
