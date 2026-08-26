'use client';

import React, { useState, ReactNode } from 'react';

export interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
