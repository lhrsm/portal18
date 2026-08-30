'use client';

import React, { useEffect, ReactNode } from 'react';
import clsx from 'clsx';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Sheet({ isOpen, onClose, title, children, className, id }: SheetProps) {
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
    <>
      <div 
        className="sheet-overlay" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div 
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Painel lateral'}
        className={clsx('sheet-content', className)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          {title && <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{title}</h3>}
          <button 
            type="button" 
            onClick={onClose} 
            className="toast-close-btn" 
            aria-label="Fechar painel lateral"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
