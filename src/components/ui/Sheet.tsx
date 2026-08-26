'use client';

import React, { useEffect, ReactNode } from 'react';
import clsx from 'clsx';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ isOpen, onClose, title, children, className }: SheetProps) {
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
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className={clsx('sheet-content', className)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          {title && <h3 style={{ fontSize: '1.3rem' }}>{title}</h3>}
          <button onClick={onClose} className="toast-close-btn" aria-label="Fechar menu lateral">
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
