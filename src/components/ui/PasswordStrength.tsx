'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteria = [
    { label: 'Pelo menos 8 caracteres', met: hasLength },
    { label: 'Uma letra maiúscula', met: hasUppercase },
    { label: 'Pelo menos um número', met: hasNumber },
    { label: 'Um caractere especial (opcional para maior força)', met: hasSpecial },
  ];

  const score = [hasLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (score <= 1) return { label: 'Fraca', color: 'var(--color-error)' };
    if (score === 2) return { label: 'Média', color: 'var(--color-warning)' };
    if (score === 3) return { label: 'Forte', color: 'var(--color-success)' };
    return { label: 'Excelente', color: 'var(--accent-gold)' };
  };

  const strength = getStrengthLabel();

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Força da Senha:</span>
        <span style={{ fontWeight: 600, color: strength.color }}>{strength.label}</span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          height: '4px',
          marginBottom: '0.65rem',
        }}
      >
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            style={{
              height: '100%',
              borderRadius: '2px',
              backgroundColor: step <= score ? strength.color : 'var(--bg-tertiary)',
              transition: 'background-color 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Criteria list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {criteria.map((c, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: c.met ? 'var(--color-success)' : 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            {c.met ? <Check size={12} /> : <X size={12} />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
