'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CanonicalOrder } from '@/services/payments/types';
import { ShieldCheck, Lock, Sparkles, Check } from 'lucide-react';

interface CheckoutSummaryProps {
  order: CanonicalOrder;
}

export function CheckoutSummary({ order }: CheckoutSummaryProps) {
  const snapshot = order.commercial_snapshot;
  const subtotal = (order.subtotal_minor || order.subtotal || 0) / 100;
  const discount = (order.discount_minor || order.discount_amount || 0) / 100;
  const total = (order.total_minor || order.total_amount || 0) / 100;

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card variant="glass" padding="lg" style={{ position: 'sticky', top: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resumo do Pedido
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
            {snapshot.plan_name || snapshot.product_name}
          </h3>
        </div>
        <Badge variant="gold">
          {snapshot.billing_period || `${snapshot.duration_days} dias`}
        </Badge>
      </div>

      {/* Itemization */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Item:</span>
          <strong style={{ color: '#fff' }}>{snapshot.product_name}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Duração:</span>
          <span>{snapshot.duration_days} dias de acesso</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
          <span>{formatBRL(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
            <span>Desconto Aplicado:</span>
            <span>- {formatBRL(discount)}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Total a pagar:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {formatBRL(total)}
          </span>
        </div>
      </div>

      {/* Trust & Guarantee Box */}
      <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontWeight: 700, marginBottom: '0.35rem' }}>
          <ShieldCheck size={14} /> Garantia & Segurança Portal18
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.5 }}>
          <li>Ativação imediata dos benefícios após confirmação</li>
          <li>Cancelamento simples a qualquer momento no painel</li>
          <li>Transação criptografada e segura sem armazenamento de dados sensíveis</li>
        </ul>
      </div>
    </Card>
  );
}
