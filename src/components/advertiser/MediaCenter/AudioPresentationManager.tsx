'use client';

import React, { useState, useRef, useEffect } from 'react';
import { mediaService } from '@/services/mediaService';
import { AdvertiserMedia, AdvertiserEntitlements } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  UploadCloud, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  Lock,
  RotateCcw,
  Volume2
} from 'lucide-react';
import Link from 'next/link';

interface AudioPresentationManagerProps {
  advertiserId: string;
  existingAudio?: AdvertiserMedia | null;
  audioPresentationUrl?: string | null;
  entitlements?: AdvertiserEntitlements | null;
  onAudioUpdated: () => void;
}

export function AudioPresentationManager({
  advertiserId,
  existingAudio,
  audioPresentationUrl,
  entitlements,
  onAudioUpdated,
}: AudioPresentationManagerProps) {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const isAudioAllowed = entitlements?.audio_allowed ?? true;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (!isAudioAllowed) {
      showToast({
        type: 'warning',
        title: 'Recurso Premium',
        message: 'A apresentação em áudio é um benefício de planos ativos e do período de experiência. Faça upgrade para ativar.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop all tracks in stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Acesso ao Microfone Negado',
        message: 'Por favor, conceda permissão de microfone ao navegador para gravar sua apresentação de voz.',
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const discardRecording = () => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleUploadAudio = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const res = await mediaService.uploadAudioPresentation(advertiserId, audioBlob, recordingDuration);
      if (!res.success) {
        showToast({ type: 'error', title: 'Erro no envio', message: res.error || 'Não foi possível enviar o áudio.' });
        return;
      }

      showToast({
        type: 'success',
        title: 'Áudio Enviado com Sucesso! 🎙️',
        message: 'Sua apresentação de voz foi enviada para moderação e em breve estará visível no seu perfil.',
      });

      discardRecording();
      onAudioUpdated();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Falha no upload', message: err?.message || 'Tente novamente.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAudio = async () => {
    if (!confirm('Deseja realmente remover sua apresentação em áudio?')) return;
    setIsDeleting(true);

    try {
      const res = await mediaService.removeAudioPresentation(advertiserId, existingAudio?.id);
      if (!res.success) {
        showToast({ type: 'error', title: 'Erro', message: res.error });
        return;
      }
      showToast({ type: 'success', title: 'Áudio Removido', message: 'A apresentação foi removida do seu perfil.' });
      onAudioUpdated();
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível remover o áudio.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Volume2 size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Apresentação em Áudio</h3>
            <Badge variant="gold" style={{ fontSize: '0.7rem' }}>Exclusivo 18+</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '600px', lineHeight: 1.45 }}>
            Grave uma mensagem de voz de até 60 segundos se apresentando. Perfis com áudio geram <strong>3x mais conexões</strong> e transmitem autenticidade imediata.
          </p>
        </div>

        {/* Existing Audio Status Badge */}
        {existingAudio && (
          <div>
            {existingAudio.moderation_status === 'approved' && (
              <Badge variant="success">
                <ShieldCheck size={12} /> Áudio Aprovado e Ativo
              </Badge>
            )}
            {existingAudio.moderation_status === 'pending' && (
              <Badge variant="warning">
                <Clock size={12} /> Em Análise de Moderação
              </Badge>
            )}
            {existingAudio.moderation_status === 'rejected' && (
              <Badge variant="ruby">
                <AlertTriangle size={12} /> Rejeitado
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Plan Entitlement Warning if Limited */}
      {!isAudioAllowed && (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={18} color="var(--accent-gold)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              A apresentação em áudio está incluída nos planos <strong>Premium</strong> e no <strong>Período de Experiência</strong>.
            </span>
          </div>
          <Link href="/advertiser/subscription/plans">
            <Button variant="ruby" size="sm" style={{ fontWeight: 700 }}>Conhecer Planos</Button>
          </Link>
        </div>
      )}

      {/* 1. Existing Active Audio Player */}
      {(existingAudio || audioPresentationUrl) && !isRecording && !audioBlob && (
        <div style={{
          padding: '1rem',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--accent-gold)',
              display: 'grid',
              placeItems: 'center',
              color: '#000',
              flexShrink: 0
            }}>
              <Volume2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Apresentação Gravada</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Duração: {existingAudio?.duration_seconds ? `${existingAudio.duration_seconds}s` : '60s'} • Formato de alta qualidade
              </div>
            </div>
          </div>

          <audio 
            controls 
            src={existingAudio?.storage_path || audioPresentationUrl || undefined}
            style={{ maxHeight: '36px', minWidth: '220px' }}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAudio}
            isLoading={isDeleting}
            leftIcon={<Trash2 size={14} />}
            style={{ color: 'var(--accent-ruby)', borderColor: 'rgba(225, 29, 72, 0.3)' }}
          >
            Remover Áudio
          </Button>
        </div>
      )}

      {/* 2. Recording in Progress */}
      {isRecording && (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(225, 29, 72, 0.06)',
          border: '1px solid var(--accent-ruby)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--accent-ruby)',
              animation: 'pulse 1s infinite'
            }} />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-ruby)' }}>
              {formatSeconds(recordingDuration)} / 01:00
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
            Fale com clareza em um ambiente silencioso. A gravação será encerrada automaticamente aos 60 segundos.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isPaused ? (
              <Button variant="outline" size="sm" onClick={pauseRecording} leftIcon={<Pause size={14} />}>
                Pausar
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={resumeRecording} leftIcon={<Play size={14} />}>
                Continuar
              </Button>
            )}
            <Button variant="ruby" size="sm" onClick={stopRecording} leftIcon={<Square size={14} />}>
              Concluir Gravação
            </Button>
          </div>
        </div>
      )}

      {/* 3. Recorded Audio Preview & Submission */}
      {audioBlob && audioUrl && !isRecording && (
        <div style={{
          padding: '1.25rem',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pré-visualização da Gravação ({formatSeconds(recordingDuration)})</span>
            <Button variant="outline" size="sm" onClick={discardRecording} leftIcon={<RotateCcw size={12} />}>
              Descartar e Regravar
            </Button>
          </div>

          <audio ref={audioPreviewRef} controls src={audioUrl} style={{ width: '100%' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="ruby"
              size="md"
              onClick={handleUploadAudio}
              isLoading={isUploading}
              leftIcon={<UploadCloud size={16} />}
              style={{ fontWeight: 700 }}
            >
              Confirmar e Enviar para Moderação
            </Button>
          </div>
        </div>
      )}

      {/* 4. Action Trigger to Record */}
      {!isRecording && !audioBlob && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            variant="primary"
            size="md"
            onClick={startRecording}
            leftIcon={<Mic size={18} />}
            disabled={!isAudioAllowed}
            style={{ fontWeight: 700 }}
          >
            {existingAudio || audioPresentationUrl ? 'Gravar Novo Áudio' : 'Gravar Apresentação'}
          </Button>
        </div>
      )}
    </Card>
  );
}
