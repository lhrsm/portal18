'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { billingRecoveryService } from '@/services/payments/billingRecoveryService';
import { CreditCard, QrCode, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface PaymentMethodUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionType: 'advertiser' | 'consumer';
  subscriptionId: string;
  profileId: string;
  onSuccess?: () => void;
}

export function PaymentMethodUpdateModal({
  isOpen,
  onClose,
  subscriptionType,
  subscriptionId,
  profileId,
  onSuccess,
}: PaymentMethodUpdateModalProps) {
  const { showToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [cardName, setCardName] = useState('NOME NO CARTÃO');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('•••');
  const [updating, setUpdating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await billingRecoveryService.updatePaymentMethod(
        subscriptionType,
        subscriptionId,
        selectedMethod,
        profileId
      );

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Forma de Pagamento Atualizada',
          message: 'Os novos dados serão utilizados na próxima tentativa de renovação.',
        });
        onClose();
        if (onSuccess) onSuccess();
      } else {
        showToast({
          type: 'error',
          title: 'Erro',
          message: res.error || 'Falha ao atualizar forma de pagamento.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Falha ao processar atualização.',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atualizar Forma de Pagamento" maxWidth="500px">
      {/* Test Environment Safety Banner */}
      <div style={{ background: 'rgba(229, 185, 92, 0.12)', border: '1px solid var(--accent-gold)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
          Ambiente de Homologação: O formulário abaixo simula a substituição de token seguro sem armazenamento de dados bancários reais.
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Method Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setSelectedMethod('credit_card')}
            style={{
              background: selectedMethod === 'credit_card' ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-input)',
              border: selectedMethod === 'credit_card' ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              color: selectedMethod === 'credit_card' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <CreditCard size={18} color={selectedMethod === 'credit_card' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cartão de Crédito</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('pix')}
            style={{
              background: selectedMethod === 'pix' ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-input)',
              border: selectedMethod === 'pix' ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              color: selectedMethod === 'pix' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <QrCode size={18} color={selectedMethod === 'pix' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PIX Dinâmico</span>
          </button>
        </div>

        {selectedMethod === 'credit_card' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Nome no Cartão
              </label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Número do Cartão
              </label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Validade (MM/AA)
                </label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  CVV
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Ao selecionar PIX, um novo QR Code será gerado automaticamente quando a renovação for devida ou em tentativas manuais.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" leftIcon={<Lock size={14} />} isLoading={updating}>
            Salvar Alteração
          </Button>
        </div>
      </form>
    </Modal>
  );
}
