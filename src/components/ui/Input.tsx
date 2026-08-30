import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, 'aria-invalid': ariaInvalid, ...props }, ref) => {
    return (
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon-left" aria-hidden="true">{leftIcon}</span>}
        <input
          ref={ref}
          aria-invalid={ariaInvalid !== undefined ? ariaInvalid : (error ? true : undefined)}
          className={clsx(
            'input',
            error && 'input-error',
            leftIcon && 'input-has-left-icon',
            rightIcon && 'input-has-right-icon',
            className
          )}
          {...props}
        />
        {rightIcon && <span className="input-icon-right" aria-hidden="true">{rightIcon}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
