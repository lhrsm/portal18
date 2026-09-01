'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { orderService } from '@/services/payments/orderService';
import { CanonicalOrder } from '@/services/payments/types';
import { CreditCard, Lock, AlertTriangle, ShieldCheck, Play } from 'lucide-react';

interface CardPaymentPanelProps {
  order: CanonicalOrder;
}

export function CardPaymentPanel({ order }: CardPaymentPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [cardName, setCardName] = useState('NOME DE TESTE');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('•••');
  const [installments, setInstallments] = useState('1');
  const [processing, setProcessing] = useState(false);

  const handlePayCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate tokenization and authorization
      const res = await orderService.simulateTestPaymentSuccess(order.id);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Transação de Teste Autorizada',
          message: 'Cartão simulado aprovado com sucesso!',
        });
        router.push(`/checkout/${order.id}/status`);
      } else {
        showToast({
          type: 'error',
          title: 'Erro na Autorização',
          message: res.error || 'Falha ao autorizar pagamento simulado.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Falha no processamento.',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card variant="glass" padding="lg">
      {/* Test Environment Safety Banner */}
      <div style={{ background: 'rgba(229, 185, 92, 0.12)', border: '1px solid var(--accent-gold)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', display: 'block' }}>
            Ambiente de Homologação (Hosted Fields Simulator)
          </strong>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            Nenhum dado real de cartão é processado ou transmitido ao servidor. O formulário abaixo simula a interface de tokenização segura do PSP.
          </span>
        </div>
      </div>

      <form onSubmit={handlePayCard}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Nome Impresso no Cartão
            </label>
            <input
              type="text"
              required
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="input"
              placeholder="Ex: NOME SOBRENOME"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Número do Cartão
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="input"
                placeholder="0000 0000 0000 0000"
                style={{ paddingLeft: '2.5rem' }}
              />
              <CreditCard size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Validade (MM/AA)
              </label>
              <input
                type="text"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="input"
                placeholder="MM/AA"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Código de Segurança (CVV)
              </label>
              <input
                type="password"
                required
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="input"
                placeholder="123"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Opções de Parcelamento
            </label>
            <select
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              className="select"
            >
              <option value="1">1x de {((order.total_minor || order.total_amount || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (À vista sem juros)</option>
            </select>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ width: '100%' }}
          leftIcon={<Lock size={16} />}
          isLoading={processing}
        >
          Confirmar e Pagar (Modo Teste)
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} color="var(--color-success)" />
          <span>Transação com simulação 3DS 2.0 e tokenização transparente</span>
        </div>
      </form>
    </Card>
  );
}
