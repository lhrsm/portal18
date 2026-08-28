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
import { 
  Megaphone, 
  ShieldCheck, 
  Search, 
  MessageCircle, 
  Sliders, 
  Lock, 
  BarChart3, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Camera,
  Layers
} from 'lucide-react';

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
    {
      icon: <Search size={24} color="var(--accent-gold)" />,
      title: 'Máxima Visibilidade',
      desc: 'Seu perfil indexado nos filtros avançados por estado, cidade e categorias para clientes qualificados.',
    },
    {
      icon: <MessageCircle size={24} color="var(--color-success)" />,
      title: 'Contato Direto',
      desc: 'Clientes entram em contato diretamente no seu WhatsApp ou Telegram, sem taxas por mensagem.',
    },
    {
      icon: <Sliders size={24} color="var(--color-info)" />,
      title: 'Controle Total',
      desc: 'Atualize fotos, horários de atendimento, locais e informações em tempo real pelo seu painel.',
    },
    {
      icon: <Lock size={24} color="var(--accent-gold)" />,
      title: 'Privacidade & Sigilo',
      desc: 'Metadados EXIF e dados de GPS são removidos automaticamente. Endereço residencial nunca é divulgado.',
    },
    {
      icon: <BarChart3 size={24} color="var(--color-warning)" />,
      title: 'Métricas Reais',
      desc: 'Acompanhe visualizações de perfil, cliques em contatos e desempenho com total transparência.',
    },
    {
      icon: <ShieldCheck size={24} color="var(--accent-ruby)" />,
      title: 'Selo de Verificação 18+',
      desc: 'Comprove sua identidade de forma 100% segura para conquistar confiança e destaque nas buscas.',
    },
  ];

  const stepsPreview = [
    { step: 1, title: 'Conta & Nome Artístico' },
    { step: 2, title: 'Maioridade 18+' },
    { step: 3, title: 'Localização' },
    { step: 4, title: 'Categorias' },
    { step: 5, title: 'Bio & Slogan' },
    { step: 6, title: 'Canais de Contato' },
    { step: 7, title: 'Fotos & Capa' },
    { step: 8, title: 'Revisão & Envio' },
  ];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    if (!user) {
      router.push('/register?type=advertiser');
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
        title: 'Conta Profissional Ativada!',
        message: 'Bem-vindo(a) ao onboarding. Vamos configurar seu anúncio.',
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
    <div className="container" style={{ padding: '3.5rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      {/* 1. Header Hero */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Badge variant="gold">ÁREA DO ANUNCIANTE</Badge>
          <Badge variant="ruby">18+ OBRIGATÓRIO</Badge>
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Crie seu Perfil Profissional
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
          Configure seu anúncio, escolha seus canais de atendimento e publique fotos em alta resolução na plataforma mais sofisticada do Brasil.
        </p>
      </div>

      {/* 2. Benefits Grid (6 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}
      >
        {benefits.map((b, i) => (
          <Card key={i} variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <div style={{ marginBottom: '0.85rem' }}>{b.icon}</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{b.title}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>{b.desc}</p>
          </Card>
        ))}
      </div>

      {/* 3. Steps Overview */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2.5rem', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Layers size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Como funciona o Onboarding (8 Etapas Rápidas)</h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {stepsPreview.map((s) => (
            <div
              key={s.step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.65rem 0.85rem',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {s.step}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Terms & Direct Conversion Card */}
      <Card variant="glass" padding="lg" style={{ border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Termos de Adesão e Responsabilidade
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Para manter a integridade jurídica e a segurança de todos os anunciantes e visitantes do portal, confirme as declarações abaixo:
        </p>

        {error && (
          <Alert type="error" title="Atenção" style={{ marginBottom: '1.25rem' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleStart}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={term1}
                onChange={(e) => setTerm1(e.target.checked)}
                disabled={isLoading}
                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>
                <strong>Declaro que sou maior de 18 anos</strong> e possuo plena capacidade civil perante a lei brasileira.
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={term2}
                onChange={(e) => setTerm2(e.target.checked)}
                disabled={isLoading}
                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>
                <strong>Declaro que as informações e mídias publicadas por mim são de minha autoria</strong> ou possuo autorização expressa para uso comercial/divulgação.
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={term3}
                onChange={(e) => setTerm3(e.target.checked)}
                disabled={isLoading}
                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-gold)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>
                <strong>Concordo com os Termos para Anunciantes</strong> e com as Diretrizes de Moderação e Ética do Portal 18+.
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
            {isAdvertiser ? 'Acessar Meu Onboarding' : 'Começar / Ativar Perfil Profissional'}
          </Button>

          {!user && (
            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ainda não possui conta? Você será direcionado para o cadastro rápido ao clicar acima.
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
