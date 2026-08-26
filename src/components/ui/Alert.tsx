import React, { ReactNode } from 'react';
import clsx from 'clsx';

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ type = 'info', title, children, className }: AlertProps) {
  const icons = {
    success: '✅',
    error: '🚫',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={clsx('alert', `alert-${type}`, className)} role="alert">
      <span className="alert-icon" style={{ fontSize: '1.2rem' }}>
        {icons[type]}
      </span>
      <div className="alert-content">
        {title && <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
