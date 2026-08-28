'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  UserCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';

export interface AgeGateModalProps {
  isOpen?: boolean;
  returnUrl?: string;
  onVerified?: () => void;
  onClose?: () => void;
}

export function AgeGateModal({ 
  isOpen = true, 
  returnUrl = '/',
  onVerified,
  onClose 
}: AgeGateModalProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<'new' | 'returning' | null>(null);

  if (!isOpen) return null;

  const handleStartVerification = async (isReturning: boolean) => {
    setLoadingAction(isReturning ? 'returning' : 'new');
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
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
    >
      <Card
        variant="premium"
        padding="lg"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Badge variant="ruby"><ShieldAlert size={12} /> ACESSO RESTRITO 18+</Badge>
            <Badge variant="gold"><Lock size={12} /> ECA DIGITAL</Badge>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Verificação de Maioridade
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Este portal contém conteúdo publicitário destinado exclusivamente a maiores de 18 anos.
          </p>
        </div>

        {/* Privacy Note Box */}
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            marginBottom: '1.75rem',
          }}
        >
          <ShieldCheck size={20} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Privacidade Garantida:</strong> O Portal18 <u>não armazena</u> sua foto, selfie, documento ou biometria. Recebemos apenas a confirmação técnica de maioridade (18+) de um provedor seguro.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loadingAction === 'new'}
            onClick={() => handleStartVerification(false)}
            rightIcon={<ArrowRight size={18} />}
          >
            Verificar Minha Idade (18+)
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            isLoading={loadingAction === 'returning'}
            onClick={() => handleStartVerification(true)}
            leftIcon={<UserCheck size={16} />}
          >
            Já Sou Verificado (Reutilizar Credencial)
          </Button>
        </div>

        {/* Footer Link to Trust Center */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Ao continuar, você concorda com nossas políticas de proteção a menores.{' '}
          <Link href="/trust/age-verification" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
            Saiba como funciona a verificação de idade.
          </Link>
        </div>
      </Card>
    </div>
  );
}
