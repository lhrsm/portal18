'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export function AgeGateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check age acknowledgment local confirmation
    const confirmed = localStorage.getItem('adult_content_confirmed');
    if (!confirmed) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('adult_content_confirmed', 'true');
    setIsOpen(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com.br';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div 
        className="modal-card age-gate-container" 
        style={{ 
          maxWidth: '480px', 
          width: 'min(calc(100% - 32px), 480px)',
          maxHeight: '88dvh',
          overflowY: 'auto',
          padding: '1.5rem 1.25rem' 
        }}
      >
        <div className="age-gate-badge">18+</div>
        <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.65rem)', marginBottom: '0.65rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
          Conteúdo exclusivo para maiores de 18 anos
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
          O portal contém anúncios destinados exclusivamente a adultos. Ao entrar, você declara ter 18 anos ou mais e aceitar os Termos de Uso e Política de Privacidade.
        </p>

        <div className="age-gate-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button variant="ruby" onClick={handleAccept} fullWidth size="lg" style={{ minHeight: '44px', fontWeight: 700 }}>
            Tenho 18 anos ou mais
          </Button>
          <Button variant="secondary" onClick={handleDecline} fullWidth size="md" style={{ minHeight: '44px' }}>
            Sair
          </Button>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Link href="/trust/age-verification" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
            Saiba como protegemos seus dados
          </Link>
        </div>
      </div>
    </div>
  );
}
