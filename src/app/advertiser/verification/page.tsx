'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { verificationService } from '@/services/verificationService';
import { VerificationRequest } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Lock, 
  ArrowLeft 
} from 'lucide-react';

export default function AdvertiserVerificationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [status, setStatus] = useState<string>('not_started');
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadDetails = async () => {
    setLoading(false);
    const data = await verificationService.getOwnVerificationDetails();
    setStatus(data.verificationStatus);
    setRequest(data.request);
  };

  useEffect(() => {
    loadDetails();
  }, []);

  // Section 21 & 23: Start Verification with Idempotency Protection
  const handleStartVerification = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await verificationService.startVerificationSession('identity_and_age');

      if (!res.success) {
        showToast({
          type: 'error',
          title: 'Não foi possível iniciar',
          message: res.error || 'Tente novamente em instantes.',
        });
        setIsProcessing(false);
        return;
      }

      if (res.redirectUrl) {
        router.push(res.redirectUrl);
      } else {
        await loadDetails();
      }
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Erro de Conexão', message: 'Falha ao comunicar com o servidor de verificação.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '800px' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="350px" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem', maxWidth: '800px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/advertiser" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Painel do Anunciante
        </Link>
        <Badge variant={status === 'verified' ? 'success' : status === 'pending' || status === 'processing' ? 'warning' : 'neutral'}>
          Status: {status.toUpperCase()}
        </Badge>
      </div>

      {/* STATE 1: NÃO INICIADA (Section 14) */}
      {(status === 'not_started' || !status) && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <ShieldCheck size={54} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Verifique sua Identidade
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            A verificação ajuda a aumentar a confiança dos clientes e confirma de forma segura que seu perfil pertence a uma pessoa adulta (18+).
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartVerification}
              isLoading={isProcessing}
              leftIcon={<FileCheck2 size={18} />}
            >
              Iniciar Verificação
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Lock size={14} /> Processo 100% criptografado e em conformidade com a LGPD
          </div>
        </Card>
      )}

      {/* STATE 2: PENDING / INICIADA (Section 15) */}
      {status === 'pending' && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Clock size={54} color="var(--accent-gold)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Verificação Iniciada
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            O seu processo de verificação foi aberto, mas ainda precisa ser concluído para validar sua maioridade e documentação.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartVerification}
            isLoading={isProcessing}
            rightIcon={<ArrowRight size={16} />}
          >
            Continuar Verificação
          </Button>
        </Card>
      )}

      {/* STATE 3: PROCESSING (Section 16 & 71) */}
      {status === 'processing' && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <RefreshCw size={54} color="var(--color-info)" className="spin" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Estamos Processando sua Verificação
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            A análise biométrica e documental ainda está em andamento. Você pode sair desta página a qualquer momento e acompanhar pelo painel.
          </p>

          <Link href="/advertiser">
            <Button variant="secondary" size="md">
              Voltar ao Painel
            </Button>
          </Link>
        </Card>
      )}

      {/* STATE 4: VERIFIED (Section 17 & 35) */}
      {status === 'verified' && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px solid var(--color-success)' }}>
          <CheckCircle2 size={56} color="var(--color-success)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--color-success)' }}>
            Identidade Verificada 🛡️
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
            Seu perfil foi confirmado com sucesso e possui o selo oficial de verificação 18+ em todas as buscas públicas do portal.
          </p>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', maxWidth: '420px', margin: '0 auto 2rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {request?.reviewed_at && (
              <div>
                <strong>Concluída em:</strong> {new Date(request.reviewed_at).toLocaleDateString('pt-BR')}
              </div>
            )}
            {request?.expires_at && (
              <div>
                <strong>Válida até:</strong> {new Date(request.expires_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>

          <Link href="/advertiser">
            <Button variant="secondary" size="md">
              Acessar Meu Painel
            </Button>
          </Link>
        </Card>
      )}

      {/* STATE 5: REJECTED (Section 18) */}
      {status === 'rejected' && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px solid var(--accent-ruby)' }}>
          <ShieldAlert size={56} color="var(--accent-ruby)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--accent-ruby)' }}>
            Não foi possível concluir sua verificação
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Os dados ou imagem fornecidos não puderam ser validados pelo provedor. Verifique se a foto do documento está nítida e tente novamente.
          </p>

          <Button
            variant="ruby"
            size="lg"
            onClick={handleStartVerification}
            isLoading={isProcessing}
            leftIcon={<RefreshCw size={16} />}
          >
            Tentar Novamente
          </Button>
        </Card>
      )}

      {/* STATE 6: REQUIRES REVIEW (Section 19) */}
      {status === 'requires_review' && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px solid var(--color-warning)' }}>
          <AlertTriangle size={56} color="var(--color-warning)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Sua verificação precisa de uma análise adicional
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Nossa equipe de segurança e conformidade está revisando os detalhes da sua validação. Você será notificado assim que o processo for concluído.
          </p>

          <Link href="/advertiser">
            <Button variant="secondary" size="md">
              Voltar ao Painel
            </Button>
          </Link>
        </Card>
      )}

      {/* STATE 7: EXPIRED (Section 20 & 40) */}
      {status === 'expired' && (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Clock size={56} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Sua Verificação Expirou
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Para manter o selo de perfil verificado e a conformidade anual do seu anúncio, realize uma nova validação rápida de identidade.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleStartVerification}
            isLoading={isProcessing}
            leftIcon={<RefreshCw size={16} />}
          >
            Verificar Novamente
          </Button>
        </Card>
      )}
    </div>
  );
}
