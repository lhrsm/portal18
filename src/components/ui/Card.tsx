import React, { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'elevated' | 'bordered' | 'premium';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', padding = 'md', children, style, ...props }, ref) => {
    const paddingStyles = {
      none: '0',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          variant === 'glass' && 'glass-card',
          variant === 'elevated' && 'glass-panel',
          className
        )}
        style={{ padding: paddingStyles[padding], ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
