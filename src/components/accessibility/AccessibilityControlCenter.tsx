'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAccessibility, FontScale } from './AccessibilityProvider';
import { 
  Accessibility, 
  X, 
  RotateCcw, 
  Contrast, 
  Type, 
  Sparkles, 
  SlidersHorizontal, 
  Link as LinkIcon,
  ExternalLink,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AccessibilityControlCenter() {
  const {
    preferences,
    setFontScale,
    toggleHighContrast,
    toggleHighlightLinks,
    toggleLegibleFont,
    toggleReducedMotion,
    toggleIncreaseSpacing,
    resetPreferences,
    isPanelOpen,
    setIsPanelOpen,
  } = useAccessibility();

  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus management & Escape key
  useEffect(() => {
    if (isPanelOpen) {
      // Focus first interactive control in panel
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        } else if (panelRef.current) {
          panelRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsPanelOpen(false);
          triggerButtonRef.current?.focus();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      // When closing, return focus to trigger button if open state changed
    }
  }, [isPanelOpen, setIsPanelOpen]);

  const handleClose = () => {
    setIsPanelOpen(false);
    triggerButtonRef.current?.focus();
  };

  const fontOptions: { scale: FontScale; label: string; sub: string }[] = [
    { scale: 'sm', label: 'A−', sub: '90%' },
    { scale: 'md', label: 'Padrão', sub: '100%' },
    { scale: 'lg', label: 'A+', sub: '115%' },
    { scale: 'xl', label: 'A++', sub: '130%' },
  ];

  return (
    <>
      {/* Global Floating Accessibility Button (Z-Index 85: below modals/age gate, above content/CTA) */}
      <button
        ref={triggerButtonRef}
        type="button"
        className="a11y-floating-trigger"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        aria-label="Abrir opções de acessibilidade"
        aria-expanded={isPanelOpen}
        aria-controls="a11y-options-panel"
        title="Opções de Acessibilidade"
      >
        <Accessibility size={24} color="#000" />
      </button>

      {/* Accessibility Control Panel (Modal / Dialog) */}
      {isPanelOpen && (
        <div 
          className="a11y-modal-backdrop"
          onClick={handleClose}
          aria-hidden="true"
        >
          <div
            id="a11y-options-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-panel-title"
            className="a11y-control-panel"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="a11y-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Accessibility size={20} color="var(--accent-gold)" />
                <h2 id="a11y-panel-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Opções de Acessibilidade
                </h2>
              </div>
              <button
                ref={firstFocusableRef}
                type="button"
                className="toast-close-btn"
                onClick={handleClose}
                aria-label="Fechar opções de acessibilidade"
                style={{ fontSize: '1.4rem' }}
              >
                ×
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="a11y-panel-body">
              {/* Section 1: Tamanho do Texto */}
              <div className="a11y-section">
                <label className="a11y-section-title">
                  <Type size={16} color="var(--accent-gold)" />
                  <span>Tamanho do Texto</span>
                </label>
                <div className="a11y-font-grid">
                  {fontOptions.map((opt) => {
                    const isSelected = preferences.fontScale === opt.scale;
                    return (
                      <button
                        key={opt.scale}
                        type="button"
                        className={`a11y-option-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setFontScale(opt.scale)}
                        aria-pressed={isSelected}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.label}</span>
                        <span style={{ fontSize: '0.7rem', color: isSelected ? '#000' : 'var(--text-muted)' }}>{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Contraste Visual */}
              <div className="a11y-section">
                <label className="a11y-section-title">
                  <Contrast size={16} color="var(--accent-gold)" />
                  <span>Contraste Visual</span>
                </label>
                <button
                  type="button"
                  className={`a11y-toggle-row ${preferences.highContrast ? 'active' : ''}`}
                  onClick={toggleHighContrast}
                  role="switch"
                  aria-checked={preferences.highContrast}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Contraste Elevado</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reforça bordas, botões e texto para máxima visibilidade</div>
                  </div>
                  <div className={`a11y-switch-indicator ${preferences.highContrast ? 'on' : ''}`}>
                    {preferences.highContrast && <Check size={14} color="#000" />}
                  </div>
                </button>
              </div>

              {/* Section 3: Leitura e Links */}
              <div className="a11y-section">
                <label className="a11y-section-title">
                  <LinkIcon size={16} color="var(--accent-gold)" />
                  <span>Leitura e Navegação</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`a11y-toggle-row ${preferences.highlightLinks ? 'active' : ''}`}
                    onClick={toggleHighlightLinks}
                    role="switch"
                    aria-checked={preferences.highlightLinks}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Destacar Links</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aplica sublinhado de alto contraste em links textuais</div>
                    </div>
                    <div className={`a11y-switch-indicator ${preferences.highlightLinks ? 'on' : ''}`}>
                      {preferences.highlightLinks && <Check size={14} color="#000" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`a11y-toggle-row ${preferences.legibleFont ? 'active' : ''}`}
                    onClick={toggleLegibleFont}
                    role="switch"
                    aria-checked={preferences.legibleFont}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Fonte Mais Legível</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Utiliza tipografia otimizada para legibilidade contínua</div>
                    </div>
                    <div className={`a11y-switch-indicator ${preferences.legibleFont ? 'on' : ''}`}>
                      {preferences.legibleFont && <Check size={14} color="#000" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 4: Movimento e Espaçamento */}
              <div className="a11y-section">
                <label className="a11y-section-title">
                  <SlidersHorizontal size={16} color="var(--accent-gold)" />
                  <span>Movimento e Espaçamento</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={`a11y-toggle-row ${preferences.reducedMotion ? 'active' : ''}`}
                    onClick={toggleReducedMotion}
                    role="switch"
                    aria-checked={preferences.reducedMotion}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Reduzir Animações</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desativa transições, loops e movimentos decorativos</div>
                    </div>
                    <div className={`a11y-switch-indicator ${preferences.reducedMotion ? 'on' : ''}`}>
                      {preferences.reducedMotion && <Check size={14} color="#000" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`a11y-toggle-row ${preferences.increaseSpacing ? 'active' : ''}`}
                    onClick={toggleIncreaseSpacing}
                    role="switch"
                    aria-checked={preferences.increaseSpacing}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Aumentar Espaçamento</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Amplia o entrelinhamento e o espaçamento textual</div>
                    </div>
                    <div className={`a11y-switch-indicator ${preferences.increaseSpacing ? 'on' : ''}`}>
                      {preferences.increaseSpacing && <Check size={14} color="#000" />}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="a11y-panel-footer">
              <Button
                variant="outline"
                size="sm"
                onClick={resetPreferences}
                leftIcon={<RotateCcw size={14} />}
                style={{ width: '100%', minHeight: '40px', fontSize: '0.85rem' }}
              >
                Restaurar Padrão
              </Button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <Link
                  href="/accessibility"
                  onClick={handleClose}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--accent-gold)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <span>Declaração de Acessibilidade</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
