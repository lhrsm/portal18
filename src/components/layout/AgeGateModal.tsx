'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

export function AgeGateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('portal_18_verified');
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('portal_18_verified', 'true');
    setIsOpen(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com.br';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="modal-card age-gate-container" style={{ maxWidth: '500px' }}>
        <div className="age-gate-badge">18+</div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Conteúdo Adulto Restrito
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Este portal contém material destinado <strong>exclusivamente a pessoas maiores de 18 anos</strong>.
          Ao entrar, você confirma sob as penas da lei que tem plena capacidade civil e idade legal para visualizar anúncios de anunciantes independentes.
        </p>

        <div className="age-gate-actions">
          <Button variant="secondary" onClick={handleDecline} fullWidth size="lg">
            Sou menor / Sair
          </Button>
          <Button variant="ruby" onClick={handleAccept} fullWidth size="lg">
            Tenho 18+ / Entrar
          </Button>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Ao prosseguir você concorda com nossos Termos de Uso e Política de Privacidade.
        </div>
      </div>
    </div>
  );
}
