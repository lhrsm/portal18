'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProfileHealthScore } from '@/services/advertiserDashboardService';

export interface AdvertiserHealthScoreCardProps {
  health: ProfileHealthScore;
}

export function AdvertiserHealthScoreCard({ health }: AdvertiserHealthScoreCardProps) {
  const getBadgeVariant = (level: ProfileHealthScore['level']) => {
    switch (level) {
      case 'Excelente':
        return 'success';
      case 'Bom':
        return 'gold';
      case 'Básico':
        return 'warning';
      default:
        return 'ruby';
    }
  };

  return (
    <Card variant="glass" padding="md" style={{ marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--accent-gold)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Qualidade do Perfil</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Badge variant={getBadgeVariant(health.level)}>{health.level}</Badge>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {health.score}%
          </span>
        </div>
      </div>

      {/* Health Progress Bar */}
      <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div
          style={{
            height: '100%',
            width: `${health.score}%`,
            backgroundColor: health.score >= 90 ? 'var(--color-success)' : 'var(--accent-gold)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Recommendations & Actionable Steps */}
      {health.criteria.filter((c) => !c.completed).length > 0 ? (
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Recomendações para maximizar o alcance:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {health.criteria
              .filter((c) => !c.completed)
              .slice(0, 3)
              .map((crit) => (
                <Link
                  key={crit.key}
                  href={crit.actionUrl}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={14} color="var(--color-warning)" />
                    <span>{crit.label}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                    {crit.actionLabel} <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-success)' }}>
          <CheckCircle2 size={16} /> Seu perfil está 100% otimizado para as buscas!
        </div>
      )}
    </Card>
  );
}
