'use client';

import React from 'react';
import Link from 'next/link';
import { CompletenessResult } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export interface CompletenessCardProps {
  completeness: CompletenessResult;
}

export function CompletenessCard({ completeness }: CompletenessCardProps) {
  return (
    <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Completude do Perfil</h3>
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: completeness.score === 100 ? 'var(--color-success)' : 'var(--accent-gold)' }}>
          {completeness.score}%
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
        <div
          style={{
            height: '100%',
            width: `${completeness.score}%`,
            backgroundColor: completeness.score === 100 ? 'var(--color-success)' : 'var(--accent-gold)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Suggestions if not 100% */}
      {completeness.score < 100 && completeness.items.filter((i) => !i.completed).length > 0 && (
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 600 }}>
            Para atingir 100% e enviar para moderação:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {completeness.items.filter((i) => !i.completed).slice(0, 3).map((item) => (
              <Link
                key={item.key}
                href={item.actionUrl}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={14} color="var(--color-warning)" />
                  <span>{item.label}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center' }}>
                  Preencher <ArrowRight size={10} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
