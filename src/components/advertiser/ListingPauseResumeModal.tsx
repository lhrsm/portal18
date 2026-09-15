'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { advertisersService } from '@/services/advertisersService';
import { ReactivationEligibilityResult } from '@/types/app.types';
import {
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Image as ImageIcon,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export interface ListingPauseResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  advertiserId: string;
  stageName: string;
  isCurrentlyPaused: boolean;
  onSuccess: (newStatus: 'paused' | 'active') => void;
}

export function ListingPauseResumeModal({
  isOpen,
  onClose,
  advertiserId,
  stageName,
  isCurrentlyPaused,
  onSuccess,
}: ListingPauseResumeModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<ReactivationEligibilityResult | null>(null);
  const [pauseReason, setPauseReason] = useState('voluntary_pause');

  useEffect(() => {
    if (isOpen && isCurrentlyPaused) {
      // Check pre-flight eligibility on modal open for resume
      setCheckingEligibility(true);
      advertisersService
        .checkReactivationEligibility(advertiserId)
        .then((res) => setEligibility(res))
        .catch(() => {
          setEligibility({ eligible: false, blockers: ['network_error'] });
        })
        .finally(() => setCheckingEligibility(false));
    } else {
      setEligibility(null);
    }
  }, [isOpen, isCurrentlyPaused, advertiserId]);

  if (!isOpen) return null;

  const handlePause = async () => {
    setLoading(true);
    try {
      const res = await advertisersService.pauseListing(advertiserId, pauseReason);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Anúncio Pausado',
          message: 'Seu anúncio foi pausado com sucesso e está oculto nas superfícies públicas.',
        });
        onSuccess('paused');
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao pausar anúncio',
          message: res.error || 'Não foi possível pausar o anúncio.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro inesperado',
        message: err.message || 'Falha ao processar solicitação.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      const res = await advertisersService.resumeListing(advertiserId);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Anúncio Reativado!',
          message: 'Seu anúncio voltou a ser público e elegível para as buscas.',
        });
        onSuccess('active');
        onClose();
      } else {
        showToast({
          type: 'error',
          title: 'Reativação Bloqueada',
          message: res.error || 'O anúncio possui pendências que impedem a publicação.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro inesperado',
        message: err.message || 'Falha ao processar solicitação.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getBlockerLabel = (blocker: string) => {
    switch (blocker) {
      case 'admin_suspended':
        return 'Perfil suspenso pela administração por violação de termos.';
      case 'moderation_not_approved':
        return 'O perfil não possui aprovação ativa da moderação.';
      case 'trust_safety_sanction_active':
        return 'Existe uma sanção ativa de Trust & Safety aplicada a esta conta.';
      case 'kyc_verification_required':
        return 'Verificação de identidade 18+ (KYC) obrigatória não concluída.';
      case 'minimum_approved_media_required':
        return 'É necessário possuir ao menos 1 foto aprovada na galeria.';
      case 'account_deleted':
        return 'Conta marcada como excluída.';
      default:
        return `Critério não atendido: ${blocker}`;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <Card
        variant="glass"
        padding="lg"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#121214',
          border: isCurrentlyPaused ? '1px solid var(--accent-gold)' : '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      >
        {/* Header Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px',
          }}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isCurrentlyPaused ? 'rgba(46, 204, 113, 0.15)' : 'rgba(212, 175, 55, 0.15)',
              border: isCurrentlyPaused ? '1px solid #2ecc71' : '1px solid var(--accent-gold)',
            }}
          >
            {isCurrentlyPaused ? (
              <PlayCircle size={24} color="#2ecc71" />
            ) : (
              <PauseCircle size={24} color="var(--accent-gold)" />
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {isCurrentlyPaused ? 'Reativar Anúncio Público' : 'Pausar Anúncio Temporariamente'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Perfil: <strong style={{ color: '#fff' }}>{stageName}</strong>
            </div>
          </div>
        </div>

        {/* PAUSE FLOW */}
        {!isCurrentlyPaused ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Ao pausar seu anúncio, seu perfil ficará temporariamente oculto para visitantes em todas as superfícies
              (home, buscas, cidades, categorias e links públicos diretos).
            </p>

            {/* Preserved Data List */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                O que acontece com os seus dados:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <li>Suas fotos aprovadas, avaliações e favoritos continuam 100% salvos.</li>
                <li>Seu histórico de estatísticas e reputação são preservados.</li>
                <li>Você pode reativar seu anúncio a qualquer momento com 1 clique.</li>
              </ul>
            </div>

            {/* Mandatory Subscription Warning (Section 9) */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(18, 18, 20, 0.9) 100%)',
                border: '1px solid var(--accent-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <CreditCard size={22} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)', marginBottom: '0.2rem' }}>
                  Aviso Importante sobre sua Assinatura
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong>Pausar seu anúncio não cancela nem interrompe sua assinatura.</strong> A cobrança do plano e a renovação programada continuam ativas normalmente.
                </div>
              </div>
            </div>

            {/* Pause Reason Option */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Motivo da pausa (opcional):
              </label>
              <select
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                }}
              >
                <option value="voluntary_pause">Pausa voluntária temporária</option>
                <option value="vacation">Férias ou viagem</option>
                <option value="agenda_full">Agenda lotada no momento</option>
                <option value="maintenance">Atualização de fotos / serviços</option>
                <option value="personal_reasons">Motivos pessoais</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handlePause}
                disabled={loading}
                leftIcon={loading ? <Loader2 size={16} className="spin" /> : <PauseCircle size={16} />}
                style={{ background: 'var(--accent-gold)', color: '#000', fontWeight: 700 }}
              >
                {loading ? 'Pausando...' : 'Confirmar Pausa do Anúncio'}
              </Button>
            </div>
          </div>
        ) : (
          /* RESUME FLOW */
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Reative seu perfil para voltar a aparecer imediatamente nas buscas da sua cidade, categorias e destaques públicos.
            </p>

            {checkingEligibility ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-gold)' }} />
                <div>Verificando requisitos de elegibilidade de publicação...</div>
              </div>
            ) : eligibility && !eligibility.eligible ? (
              /* Blockers Present: Fail-Closed Gate */
              <div
                style={{
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid var(--accent-ruby)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-ruby)' }}>
                  <ShieldAlert size={20} />
                  <strong style={{ fontSize: '0.9rem' }}>Reativação Bloqueada por Pendências</strong>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Para proteger a segurança do portal e cumprir os requisitos legais, os seguintes critérios precisam ser regularizados:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.825rem', color: '#ffb3b3', lineHeight: 1.6 }}>
                  {eligibility.blockers.map((b, idx) => (
                    <li key={idx}>{getBlockerLabel(b)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              /* All Checks Passed */
              <div
                style={{
                  background: 'rgba(46, 204, 113, 0.1)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <CheckCircle2 size={24} color="#2ecc71" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2ecc71' }}>
                    Todos os critérios validados!
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    Sua conta está aprovada pela moderação, verificada 18+ e apta para publicação imediata.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleResume}
                disabled={loading || checkingEligibility || (eligibility !== null && !eligibility.eligible)}
                leftIcon={loading ? <Loader2 size={16} className="spin" /> : <PlayCircle size={16} />}
                style={{ background: '#2ecc71', color: '#000', fontWeight: 700 }}
              >
                {loading ? 'Reativando...' : 'Confirmar Reativação'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
