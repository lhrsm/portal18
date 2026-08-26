'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { X, AlertTriangle } from 'lucide-react';

export interface ActionConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'ruby' | 'primary' | 'secondary';
  requireReason?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function ActionConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar Ação',
  variant = 'ruby',
  requireReason = true,
  onClose,
  onConfirm,
}: ActionConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('Informe a justificativa da ação.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      console.error(err);
      setError('Erro ao processar ação.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color={variant === 'ruby' ? 'var(--accent-ruby)' : 'var(--accent-gold)'} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {description}
          </p>

          {requireReason && (
            <FormField label="Justificativa / Motivo Administrativo" required>
              <textarea
                className="input"
                rows={3}
                placeholder="Descreva o motivo desta ação para auditoria e notificação..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </FormField>
          )}

          {error && (
            <div style={{ color: 'var(--accent-ruby)', fontSize: '0.8rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button
              variant={variant}
              size="md"
              onClick={handleConfirm}
              isLoading={isProcessing}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
