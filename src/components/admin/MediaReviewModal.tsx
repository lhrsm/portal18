'use client';

import React, { useState } from 'react';
import { AdvertiserMedia } from '@/types/app.types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { X, Check, AlertTriangle, ShieldAlert, Ban } from 'lucide-react';

export interface MediaReviewModalProps {
  media: (AdvertiserMedia & { advertiser_profiles?: { stage_name: string; slug: string } }) | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (mediaId: string) => Promise<void>;
  onReject: (mediaId: string, reason: string) => Promise<void>;
  onBlock: (mediaId: string, reason: string) => Promise<void>;
}

export function MediaReviewModal({
  media,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onBlock,
}: MediaReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('quality');
  const [blockReason, setBlockReason] = useState('prohibited_content');
  const [activeTab, setActiveTab] = useState<'view' | 'reject' | 'block'>('view');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !media) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove(media.id);
    setIsProcessing(false);
    onClose();
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(media.id, rejectReason);
    setIsProcessing(false);
    onClose();
  };

  const handleBlock = async () => {
    setIsProcessing(true);
    await onBlock(media.id, blockReason);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Revisão de Mídia</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Anunciante: {media.advertiser_profiles?.stage_name || 'Desconhecido'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Media Preview Area */}
        <div style={{ flex: 1, backgroundColor: '#000', display: 'grid', placeItems: 'center', minHeight: '320px', maxHeight: '480px', overflow: 'hidden', padding: '1rem' }}>
          {media.media_type === 'audio' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#fff' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'grid', placeItems: 'center', color: '#000' }}>
                <Check size={32} />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 700 }}>Apresentação em Áudio</span>
              <audio controls src={media.storage_path} style={{ width: '280px' }} />
            </div>
          ) : media.media_type === 'video' || media.media_type === 'authenticity_video' ? (
            <video
              controls
              src={media.storage_path}
              style={{ maxWidth: '100%', maxHeight: '440px', objectFit: 'contain' }}
            />
          ) : (
            <img
              src={media.storage_path}
              alt="Mídia em revisão"
              style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Action Panel */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          {activeTab === 'view' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('reject')}
                  style={{ color: 'var(--color-warning)' }}
                >
                  <AlertTriangle size={15} /> Rejeitar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('block')}
                  style={{ color: 'var(--accent-ruby)' }}
                >
                  <Ban size={15} /> Bloquear Violação
                </Button>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleApprove}
                isLoading={isProcessing}
                leftIcon={<Check size={16} />}
              >
                {media.media_type === 'authenticity_video'
                  ? 'Aprovar Selo de Autenticidade'
                  : media.media_type === 'audio'
                  ? 'Aprovar Áudio'
                  : media.media_type === 'video'
                  ? 'Aprovar Vídeo'
                  : 'Aprovar Foto'}
              </Button>
            </div>
          )}

          {activeTab === 'reject' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField label="Motivo da Rejeição (Enviado ao anunciante)">
                <Select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                  <option value="quality">Baixa resolução ou nitidez insuficiente</option>
                  <option value="incorrect_content">Conteúdo não compatível com anúncio</option>
                  <option value="privacy_exposure">Exposição de terceiros ou dados sensíveis</option>
                  <option value="impersonation">Imagem de banco/falsa (Direito de imagem)</option>
                  <option value="policy_violation">Violação leve das diretrizes comunitárias</option>
                  <option value="other">Outro motivo operacional</option>
                </Select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('view')}>Cancelar</Button>
                <Button variant="ruby" size="sm" onClick={handleReject} isLoading={isProcessing}>
                  Confirmar Rejeição
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'block' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(163, 0, 33, 0.15)', border: '1px solid var(--accent-ruby)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--accent-ruby)' }}>
                O bloqueio permanente suspende o anunciante preventivamente caso envolva menores ou conteúdo não consensual.
              </div>

              <FormField label="Motivo Crítico de Bloqueio">
                <Select value={blockReason} onChange={(e) => setBlockReason(e.target.value)}>
                  <option value="suspected_minor">Suspeita de Menor de Idade (Gera alerta crítico)</option>
                  <option value="non_consensual_content">Conteúdo Não Consensual</option>
                  <option value="prohibited_content">Conteúdo Proibido pela Legislação</option>
                  <option value="fraud_impersonation">Fraude / Falsidade Ideológica</option>
                </Select>
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('view')}>Cancelar</Button>
                <Button variant="ruby" size="sm" onClick={handleBlock} isLoading={isProcessing}>
                  Bloquear Mídia
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
