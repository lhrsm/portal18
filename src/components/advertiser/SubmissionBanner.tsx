'use client';

import React, { useState, useRef } from 'react';
import { AdvertiserProfile, CompletenessResult } from '@/types/app.types';
import { advertisersService } from '@/services/advertisersService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { Send, Clock, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

export interface SubmissionBannerProps {
  advertiser: AdvertiserProfile;
  completeness: CompletenessResult;
  onStatusChange: () => Promise<void>;
}

export function SubmissionBanner({ advertiser, completeness, onStatusChange }: SubmissionBannerProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const handleSubmitForReview = async () => {
    if (isSubmittingRef.current || isSubmitting) return;

    if (!completeness.isReadyForSubmission) {
      setErrorMsg('Preencha os requisitos obrigatórios antes de submeter o perfil.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await advertisersService.submitProfileForReview(advertiser.id);
      if (!res.success) {
        if (res.missing_requirements && res.missing_requirements.length > 0) {
          setErrorMsg(`Pendências: ${res.missing_requirements.join(', ')}`);
        } else {
          setErrorMsg(res.error || 'Não foi possível submeter o perfil.');
        }
        return;
      }

      showToast({
        type: 'success',
        title: 'Perfil Enviado para Análise',
        message: 'Nossa equipe de moderação avaliará seu anúncio em breve.',
      });

      await onStatusChange();
    } catch (err) {
      console.error('Error submitting profile:', err);
      setErrorMsg('Erro inesperado ao enviar perfil. Tente novamente.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (advertiser.profile_status === 'approved' || advertiser.profile_status === 'active') {
    return (
      <Card variant="glass" padding="md" style={{ border: '1px solid var(--color-success)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={24} color="var(--color-success)" />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>Perfil Publicado & Ativo</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Seu anúncio está visível para visitantes nas buscas de sua cidade.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (advertiser.profile_status === 'pending_review') {
    return (
      <Card variant="glass" padding="md" style={{ border: '1px solid var(--accent-gold)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={24} color="var(--accent-gold)" />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>Perfil em Análise pela Moderação</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Enviado em {advertiser.submitted_at ? new Date(advertiser.submitted_at).toLocaleString('pt-BR') : 'hoje'}. Prazo médio de aprovação: poucas horas.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (advertiser.profile_status === 'rejected') {
    return (
      <Card variant="glass" padding="md" style={{ border: '1px solid var(--accent-ruby)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={24} color="var(--accent-ruby)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-ruby)' }}>Revisão Necessária</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {advertiser.rejection_reason || 'Por favor ajuste suas fotos ou informações antes de enviar novamente.'}
            </div>
          </div>
        </div>
        <Button
          variant="ruby"
          size="sm"
          onClick={handleSubmitForReview}
          isLoading={isSubmitting}
          disabled={!completeness.isReadyForSubmission}
        >
          Reenviar para Análise
        </Button>
      </Card>
    );
  }

  // Default: Draft mode
  return (
    <Card variant="elevated" padding="md" style={{ border: '1px solid var(--accent-gold)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ maxWidth: '540px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={18} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pronto para publicar seu anúncio?</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Após preencher os dados obrigatórios e galeria, envie seu perfil para a equipe de moderação.
          </p>
        </div>

        <Button
          variant="ruby"
          size="md"
          onClick={handleSubmitForReview}
          isLoading={isSubmitting}
          disabled={!completeness.isReadyForSubmission || isSubmitting}
          leftIcon={<Send size={16} />}
        >
          Enviar perfil para análise
        </Button>
      </div>

      {errorMsg && (
        <div style={{ marginTop: '0.75rem' }}>
          <Alert type="error" title="Atenção">
            {errorMsg}
          </Alert>
        </div>
      )}
    </Card>
  );
}
