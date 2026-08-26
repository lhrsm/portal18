import React, { ReactNode } from 'react';
import clsx from 'clsx';

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
          {required && <span className="form-label-required">*</span>}
        </label>
      )}
      {children}
      {error && <span className="form-error">⚠️ {error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
}
