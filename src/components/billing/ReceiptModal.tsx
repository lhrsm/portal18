'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CanonicalOrder } from '@/services/payments/types';
import { Printer, CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CanonicalOrder | null;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  if (!order) return null;

  const snapshot = order.commercial_snapshot;
  const total = (order.total_minor || order.total_amount || 0) / 100;
  const subtotal = (order.subtotal_minor || order.subtotal || 0) / 100;
  const discount = (order.discount_minor || order.discount_amount || 0) / 100;

  const isRefunded = order.status === 'refunded' || order.payment_status === 'refunded';
  const isPartiallyRefunded = order.status === 'partially_refunded' || order.payment_status === 'partially_refunded';

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprovante do Pedido" maxWidth="560px">
      <div id="printable-receipt" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
        {/* Receipt Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-gold)', margin: 0 }}>
              PORTAL18
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Portal18 Tecnologia e Publicidade Digital Ltda.
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            {isRefunded ? (
              <Badge variant="ruby" style={{ marginBottom: '0.25rem' }}>
                <RotateCcw size={12} /> REEMBOLSADO
              </Badge>
            ) : isPartiallyRefunded ? (
              <Badge variant="gold" style={{ marginBottom: '0.25rem' }}>
                <RotateCcw size={12} /> PARCIALMENTE REEMBOLSADO
              </Badge>
            ) : (
              <Badge variant="success" style={{ marginBottom: '0.25rem' }}>
                <CheckCircle2 size={12} /> PAGAMENTO CONFIRMADO
              </Badge>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {order.order_number}
            </div>
          </div>
        </div>

        {/* Order Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Data da Compra:</span>
            <strong>{new Date(order.created_at).toLocaleString('pt-BR')}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Forma de Pagamento:</span>
            <strong style={{ textTransform: 'uppercase' }}>{order.selected_payment_method || 'PIX'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Identificador do Pedido:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{order.id}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Autenticação / Gateway:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{order.provider_code || 'internal_driver'}</span>
          </div>
        </div>

        {/* Item Summary Table */}
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}>
            <span>Descrição do Item</span>
            <span>Valor Original</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            <span>{snapshot?.product_name || 'Assinatura Portal18'} ({snapshot?.billing_period || `${snapshot?.duration_days || 30} dias`})</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)', marginBottom: '0.35rem' }}>
              <span>Desconto</span>
              <span>- {formatBRL(discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 800, fontSize: '1rem' }}>
            <span>Valor Total</span>
            <span style={{ color: 'var(--accent-gold)' }}>{formatBRL(total)}</span>
          </div>

          {(isRefunded || isPartiallyRefunded) && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-ruby)', fontWeight: 600 }}>
                <span>Status da Transação</span>
                <span>{isRefunded ? 'Estorno Total Processado' : 'Estorno Parcial Processado'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Receipt Legal Disclaimer */}
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
          Este documento é um comprovante eletrônico de transação emitido pelo Portal18 para fins de controle de assinatura e prestação de serviços digitais. Não substitui o documento fiscal emitido conforme a legislação tributária vigente.
        </p>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
        <Button variant="primary" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrint}>
          Imprimir Comprovante
        </Button>
      </div>
    </Modal>
  );
}
