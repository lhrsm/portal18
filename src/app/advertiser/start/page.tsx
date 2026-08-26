'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { Megaphone, ShieldCheck, Sparkles, Image, BarChart3, Search, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdvertiserStartPage() {
  const router = useRouter();
  const { user, isAdvertiser, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [term1, setTerm1] = useState(false);
  const [term2, setTerm2] = useState(false);
  const [term3, setTerm3] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSubmittingRef = useRef(false);

  const benefits = [
    { icon: <Search size={22} color="var(--accent-gold)" />, title: 'Presença nas Buscas', desc: 'Seu perfil indexado por estado, cidade e categorias para clientes de todo o Brasil.' },
    { icon: <Image size={22} color="var(--color-info)" />, title: 'Galeria Exclusiva', desc: 'Publique fotos e vídeos com proteção de privacidade e moderação prévia.' },
    { icon: <BarChart3 size={22} color="var(--color-success)" />, title: 'Métricas de Alcance', desc: 'Acompanhe visualizações de perfil, cliques em contatos e desempenho.' },
    { icon: <ShieldCheck size={22} color="var(--accent-ruby)" />, title: 'Selo de Verificação', desc: 'Comprove sua identidade para ganhar destaque e confiança dos visitantes.' },
  ];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    if (!user) {
      router.push('/login?redirect_to=/advertiser/start');
      return;
    }

    if (!term1 || !term2 || !term3) {
      setError('Você deve marcar todos os consentimentos obrigatórios antes de prosseguir.');
      return;
    }

    setError(null);
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const res = await advertisersService.becomeAdvertiser(true, true);
      if (!res.success) {
        setError(res.error || 'Não foi possível converter a conta. Tente novamente.');
        return;
      }

      await refreshProfile();
      showToast({
        type: 'success',
        title: 'Conta de Anunciante Criada!',
        message: 'Bem-vindo(a) ao painel. Vamos configurar seu anúncio.',
      });

      router.push('/advertiser/onboarding');
    } catch (err) {
      setError('Erro inesperado na criação do perfil de anunciante.');
      console.error(err);
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '820px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="ruby">ÁREA DO ANUNCIANTE</Badge>
          <Badge variant="gold">CONVERSÃO DE CONTA</Badge>
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Crie seu Perfil Profissional</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>
          Divulgue seus serviços com máxima privacidade, segurança e visibilidade para milhares de clientes potenciais.
        </p>
      </div>

      {/* Benefits Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {benefits.map((b, i) => (
          <Card key={i} variant="glass" padding="md">
            <div style={{ marginBottom: '0.75rem' }}>{b.icon}</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{b.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{b.desc}</p>
          </Card>
        ))}
      </div>

      {/* Terms & CTA Card */}
      <Card variant="glass" padding="lg">
        <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Termos de Adesão e Responsabilidade</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Para manter a integridade jurídica e a segurança do portal, confirme as declarações abaixo:
        </p>

        {error && (
          <Alert type="error" title="Atenção">
            {error}
          </Alert>
        )}

        <form onSubmit={handleStart}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={term1}
                onChange={(e) => setTerm1(e.target.checked)}
                disabled={isLoading}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <strong>Declaro que sou maior de 18 anos</strong> e possuo plena capacidade civil perante a lei brasileira.
              </span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={term2}
                onChange={(e) => setTerm2(e.target.checked)}
                disabled={isLoading}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <strong>Declaro que as informações e mídias publicadas por mim são minhas</strong> ou que possuo autorização legal expressa para utilizá-las.
              </span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={term3}
                onChange={(e) => setTerm3(e.target.checked)}
                disabled={isLoading}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                <strong>Concordo com os Termos para Anunciantes</strong> e com as Diretrizes de Moderação do Portal.
              </span>
            </label>
          </div>

          <Button
            type="submit"
            variant="ruby"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            rightIcon={<ArrowRight size={18} />}
          >
            {isAdvertiser ? 'Acessar Onboarding' : 'Começar / Ativar Conta de Anunciante'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
