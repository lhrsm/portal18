import React, { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={clsx('form-field', className)}>
      {label && (
        <label className="form-label">
          {label}
          {required && (
            <>
              <span className="form-label-required" aria-hidden="true">*</span>
              <span className="sr-only">(campo obrigatório)</span>
            </>
          )}
        </label>
      )}
      {children}
      {error && (
        <span className="form-error" role="alert" aria-live="polite">
          <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </span>
      )}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
}
