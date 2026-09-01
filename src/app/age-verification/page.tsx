'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

function AgeVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get('status') || 'unverified';
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verified = ageVerificationService.isAgeVerified();
    setIsVerified(verified);
  }, []);

  const handleStart = async (isReturning: boolean) => {
    setLoading(true);
    try {
      const res = await ageVerificationService.startVerification({
        returnUrl,
        isReturningVisitor: isReturning,
      });

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleClear = () => {
    ageVerificationService.clearDeviceVerification();
    setIsVerified(false);
    router.push('/age-verification');
  };

  return (
    <>
      {/* 1. Verified State */}
      {(isVerified || statusParam === 'verified') ? (
        <Card variant="premium" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Maioridade 18+ Confirmada
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Sua verificação está ativa neste dispositivo. O acesso completo aos perfis, galerias e canais de contato está liberado.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href={returnUrl}>
              <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight size={18} />}>
                Continuar Navegando
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={handleClear} style={{ color: 'var(--text-muted)' }}>
              Esquecer verificação neste dispositivo
            </Button>
          </div>
        </Card>
      ) : statusParam === 'underage' ? (
        /* 2. Underage Block State */
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px solid var(--accent-ruby)' }}>
          <ShieldAlert size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--accent-ruby)' }}>
            Acesso Não Permitido
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Este conteúdo é restrito exclusivamente a maiores de 18 anos em conformidade com as diretrizes do ECA Digital e termos de uso.
          </p>
          <Link href="/">
            <Button variant="secondary" size="md">Voltar para a Página Inicial</Button>
          </Link>
        </Card>
      ) : statusParam === 'unavailable' ? (
        /* 3. Provider Pending / Unavailable */
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px solid var(--accent-gold)' }}>
          <Lock size={48} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Módulo em Homologação Técnica
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            A integração de verificação de maioridade externa está em processo de homologação. O conteúdo sensível permanece protegido em Modo Seguro.
          </p>
          <Link href="/">
            <Button variant="secondary" size="md">Navegar em Modo Seguro</Button>
          </Link>
        </Card>
      ) : (
        /* 4. Default Verification Hub */
        <Card variant="premium" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Badge variant="ruby"><ShieldAlert size={12} /> RESTRIÇÃO 18+</Badge>
            <Badge variant="gold"><Lock size={12} /> PRIVACIDADE TOTAL</Badge>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.75rem' }}>
            Verificação de Idade
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Para acessar perfis, fotos e contatos, confirme sua maioridade através de nosso provedor seguro e credenciado.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              onClick={() => handleStart(false)}
              rightIcon={<ArrowRight size={18} />}
            >
              Verificar Minha Idade (18+)
            </Button>

            <Button
              variant="secondary"
              size="md"
              fullWidth
              isLoading={loading}
              onClick={() => handleStart(true)}
              leftIcon={<UserCheck size={16} />}
            >
              Já Sou Verificado (Reutilizar)
            </Button>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.5 }}>
            <strong>Compromisso de Privacidade:</strong> O Portal18 não armazena fotos de documentos, selfies ou biometria. Recebemos apenas a confirmação técnica de que você possui 18 anos ou mais.
          </div>
        </Card>
      )}
    </>
  );
}

export default function AgeVerificationPage() {
  return (
    <div className="container" style={{ padding: '4rem 1rem 6rem 1rem', maxWidth: '580px' }}>
      <Suspense fallback={<Skeleton height="400px" />}>
        <AgeVerificationContent />
      </Suspense>
    </div>
  );
}
