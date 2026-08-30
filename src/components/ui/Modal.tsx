'use client';

import React, { useEffect, ReactNode } from 'react';
import clsx from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '520px',
  closeOnBackdrop = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-dialog-title' : undefined}
    >
      <div
        className={clsx('modal-card', className)}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: title ? '1.25rem' : '0' }}>
          {title && <h3 id="modal-dialog-title" style={{ fontSize: '1.3rem', margin: 0 }}>{title}</h3>}
          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="toast-close-btn"
              style={{ marginLeft: 'auto', fontSize: '1.5rem' }}
              aria-label="Fechar janela"
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
