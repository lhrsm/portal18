import React, { ReactNode } from 'react';
import clsx from 'clsx';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Alert({ type = 'info', title, children, className, style }: AlertProps) {
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--color-success)" aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={18} color="var(--color-error)" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--color-warning)" aria-hidden="true" />;
      case 'info':
      default:
        return <Info size={18} color="var(--color-info)" aria-hidden="true" />;
    }
  };

  return (
    <div className={clsx('alert', `alert-${type}`, className)} style={style} role="alert">
      <span className="alert-icon" style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
        {renderIcon()}
      </span>
      <div className="alert-content">
        {title && <div style={{ fontWeight: 600, marginBottom: '0.2rem', fontSize: '0.925rem' }}>{title}</div>}
        <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  );
}
