'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

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
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="modal-card age-gate-container" style={{ maxWidth: '520px' }}>
        <div className="age-gate-badge">18+</div>
        <h2 style={{ fontSize: '1.65rem', marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
          Conteúdo exclusivo para maiores de 18 anos
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          O portal contém conteúdo destinado exclusivamente a adultos. O usuário deverá confirmar que possui 18 anos ou mais e que concorda em respeitar os Termos de Uso e a Política de Privacidade.
        </p>

        <div className="age-gate-actions">
          <Button variant="secondary" onClick={handleDecline} fullWidth size="lg">
            Sair
          </Button>
          <Button variant="ruby" onClick={handleAccept} fullWidth size="lg">
            Tenho 18 anos ou mais
          </Button>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Acesso estritamente restrito a maiores de 18 anos. Tolerância zero contra exploração ou violação de termos.
        </div>
      </div>
    </div>
  );
}
