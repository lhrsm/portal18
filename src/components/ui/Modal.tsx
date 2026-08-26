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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx('modal-card', className)}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: title ? '1.25rem' : '0' }}>
          {title && <h3 style={{ fontSize: '1.3rem' }}>{title}</h3>}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="toast-close-btn"
              style={{ marginLeft: 'auto', fontSize: '1.5rem' }}
              aria-label="Fechar modal"
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
