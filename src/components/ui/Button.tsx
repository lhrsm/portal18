import React, { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ruby' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'btn',
          `btn-${variant}`,
          size !== 'md' && `btn-${size}`,
          fullWidth && 'btn-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="btn-spinner" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            <span>Carregando...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="btn-icon-left" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="btn-icon-right" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
