'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';
import { Card } from '@/components/ui/Card';
import { RefreshCw } from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusMsg, setStatusMsg] = useState('Validando sinal de maioridade...');

  useEffect(() => {
    async function process() {
      const code = searchParams.get('code') || undefined;
      const state = searchParams.get('state') || undefined;
      const token = searchParams.get('token') || undefined;
      const returnUrl = searchParams.get('returnUrl') || '/';

      try {
        const { result, redirectUrl } = await ageVerificationService.processCallback({
          code,
          state,
          token,
          returnUrl,
        });

        if (result.verified && result.ageBand === '18_plus') {
          setStatusMsg('Maioridade 18+ confirmada com sucesso! Redirecionando...');
          setTimeout(() => {
            router.replace(redirectUrl);
          }, 600);
        } else {
          router.replace(redirectUrl);
        }
      } catch (err) {
        console.error(err);
        router.replace(`/age-verification?status=failed&returnUrl=${encodeURIComponent(returnUrl)}`);
      }
    }

    process();
  }, [searchParams, router]);

  return (
    <Card variant="premium" padding="lg" style={{ padding: '3rem 1.5rem' }}>
      <RefreshCw size={40} color="var(--accent-gold)" className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Processando Verificação
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {statusMsg}
      </p>
    </Card>
  );
}

export default function AgeVerificationCallbackPage() {
  return (
    <div className="container" style={{ padding: '6rem 1rem', maxWidth: '480px', textAlign: 'center' }}>
      <Suspense fallback={
        <Card variant="premium" padding="lg" style={{ padding: '3rem 1.5rem' }}>
          <RefreshCw size={40} color="var(--accent-gold)" className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Processando...
          </h3>
        </Card>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
