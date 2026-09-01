'use client';

import React from 'react';
import { usePWAInstall } from '@/components/pwa/PWAInstallProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

export function PWAInstallPrompt() {
  const { 
    showPrompt, 
    showIOSInstructions, 
    promptToInstall, 
    dismissPrompt, 
    closeIOSInstructions,
    isIOS 
  } = usePWAInstall();

  return (
    <>
      {/* 1. Non-Intrusive Bottom Banner / Floating Card */}
      {showPrompt && (
        <aside
          role="region"
          aria-label="Convite para instalar aplicativo Portal18"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 85,
            width: 'calc(100% - 32px)',
            maxWidth: '480px',
          }}
        >
          <Card
            variant="glass"
            padding="md"
            style={{
              border: '1px solid var(--accent-gold)',
              boxShadow: 'var(--shadow-lg)',
              background: 'var(--bg-glass-card)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, var(--accent-ruby), var(--accent-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Smartphone size={20} color="#ffffff" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                    Instale o Portal18
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Aplicativo Web Rápido & Sigiloso
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={dismissPrompt}
                aria-label="Fechar convite de instalação"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  minWidth: '36px',
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
              Acesse o Portal18 diretamente da sua tela inicial e tenha uma experiência mais rápida no seu dispositivo.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissPrompt}
                style={{ fontSize: '0.8rem' }}
              >
                Agora não
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={promptToInstall}
                leftIcon={<Download size={14} />}
                style={{ fontSize: '0.8rem', fontWeight: 700 }}
              >
                {isIOS ? 'Como Instalar' : 'Instalar Aplicativo'}
              </Button>
            </div>
          </Card>
        </aside>
      )}

      {/* 2. iOS Step-by-Step Instructions Modal */}
      {showIOSInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <Card variant="glass" padding="lg" style={{ maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 id="ios-install-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Instalar no iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={closeIOSInstructions}
                aria-label="Fechar instruções de instalação iOS"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Siga os passos abaixo no navegador Safari para adicionar o Portal18 à sua tela de início:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <Share2 size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                <span>1. Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <PlusSquare size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                <span>2. Role a lista e selecione <strong>Adicionar à Tela de Início</strong>.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                <Smartphone size={20} color="var(--color-success)" style={{ flexShrink: 0 }} />
                <span>3. Toque em <strong>Adicionar</strong> no canto superior direito para confirmar.</span>
              </div>
            </div>

            <Button variant="primary" fullWidth size="md" onClick={closeIOSInstructions}>
              Entendi
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
