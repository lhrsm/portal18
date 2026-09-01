'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { orderService } from '@/services/payments/orderService';
import { CanonicalOrder, InitiatePaymentResult } from '@/services/payments/types';
import { QrCode, Copy, Check, Clock, AlertTriangle, Play, RefreshCw, ShieldCheck } from 'lucide-react';

interface PixPaymentPanelProps {
  order: CanonicalOrder;
  paymentResult?: InitiatePaymentResult | null;
  onRefresh?: () => void;
}

export function PixPaymentPanel({ order, paymentResult, onRefresh }: PixPaymentPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins

  const pixCode = paymentResult?.pixQrCodeText || `00020126360014BR.GOV.BCB.PIX0114+5571999999999520400005303986540${order.total_minor || 4990}5802BR5913PORTAL186008SALVADOR62070503***6304TEST`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    showToast({
      type: 'success',
      title: 'Código PIX Copiado',
      message: 'Código de teste copiado para a área de transferência.',
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulateConfirmation = async () => {
    setSimulating(true);
    try {
      const res = await orderService.simulateTestPaymentSuccess(order.id);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Pagamento Confirmado (Modo Teste)',
          message: 'O benefício do plano/serviço foi ativado com sucesso!',
        });
        router.push(`/checkout/${order.id}/status`);
      } else {
        showToast({
          type: 'error',
          title: 'Erro na Simulação',
          message: res.error || 'Falha ao simular confirmação.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro',
        message: err.message || 'Falha ao processar simulação.',
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <Card variant="glass" padding="lg">
      {/* Test Environment Safety Banner */}
      <div style={{ background: 'rgba(229, 185, 92, 0.12)', border: '1px solid var(--accent-gold)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertTriangle size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', display: 'block' }}>
            Ambiente de Homologação / Simulação
          </strong>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
            Este PIX é gerado pelo driver de testes internos do Portal18 e não possui valor financeiro. Nenhuma cobrança real será efetuada.
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Pague com PIX Instantâneo
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Abra o app do seu banco, escolha <strong>Pagar via PIX</strong> e aponte a câmera ou use o Copia e Cola.
        </p>
      </div>

      {/* QR Code Container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-subtle)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <QrCode size={160} color="#000000" />
          <span style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            PORTAL18 TEST PIX
          </span>
        </div>

        {/* Countdown */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Clock size={14} />
          <span>Válido por: <strong style={{ color: 'var(--accent-gold)' }}>{formatTime(timeLeft)}</strong></span>
        </div>
      </div>

      {/* Copy-Paste Payload Area */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
          PIX Copia e Cola (Código de Teste)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            readOnly
            value={pixCode}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.75rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
            }}
          />
          <Button
            variant="secondary"
            size="md"
            leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
            onClick={handleCopyPix}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>

      {/* Test Simulation Trigger */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Para validar a experiência de compra em homologação, clique abaixo:
        </p>
        <Button
          variant="primary"
          size="lg"
          style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}
          leftIcon={<Play size={16} />}
          onClick={handleSimulateConfirmation}
          isLoading={simulating}
        >
          Simular Pagamento Confirmado (Modo Teste)
        </Button>
      </div>
    </Card>
  );
}
