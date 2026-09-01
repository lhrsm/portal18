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
  ArrowRight,
  UserCheck
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
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
    >
      <Card
        variant="premium"
        padding="md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-assurance-title"
        aria-describedby="age-assurance-desc"
        style={{
          maxWidth: '480px',
          width: 'min(calc(100% - 32px), 480px)',
          maxHeight: '88dvh',
          overflowY: 'auto',
          textAlign: 'center',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Badge variant="ruby"><ShieldAlert size={12} /> 18+</Badge>
            <Badge variant="gold"><Lock size={12} /> ECA DIGITAL</Badge>
          </div>
          <h2
            id="age-assurance-title"
            style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Verificação de Maioridade
          </h2>
          <p
            id="age-assurance-desc"
            style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.45, margin: 0 }}
          >
            Conteúdo restrito a maiores de idade. Confirme sua maioridade para desbloquear mídias e contatos.
          </p>
        </div>

        {/* Privacy Note Box */}
        <div
          style={{
            padding: '0.75rem 0.85rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <ShieldCheck size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Zero Biometria Armazenada:</strong> O Portal18 <u>não armazena</u> documentos ou fotos de visitantes.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={loadingAction === 'new'}
            onClick={() => handleStartVerification(false)}
            rightIcon={<ArrowRight size={16} />}
            style={{ minHeight: '44px', fontWeight: 700 }}
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
            style={{ minHeight: '44px' }}
          >
            Já Sou Verificado (Reutilizar)
          </Button>
        </div>

        {/* Footer Link to Trust Center */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Link href="/trust/age-verification" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
            Saiba como protegemos seus dados
          </Link>
        </div>
      </Card>
    </div>
  );
}
