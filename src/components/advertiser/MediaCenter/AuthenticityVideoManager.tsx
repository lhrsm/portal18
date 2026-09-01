'use client';

import React, { useState, useEffect, useRef } from 'react';
import { authenticityService, ChallengeResponse } from '@/services/authenticityService';
import { AuthenticityChallenge, AdvertiserProfile } from '@/types/app.types';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  Video,
  Sparkles,
  Clock,
  AlertTriangle,
  UploadCloud,
  Camera,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Lock
} from 'lucide-react';

interface AuthenticityVideoManagerProps {
  advertiser: AdvertiserProfile;
  onStatusUpdated: () => void;
}

export function AuthenticityVideoManager({
  advertiser,
  onStatusUpdated,
}: AuthenticityVideoManagerProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeChallenge, setActiveChallenge] = useState<AuthenticityChallenge | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadChallenge();
  }, [advertiser.id]);

  const loadChallenge = async () => {
    const latest = await authenticityService.getLatestChallenge(advertiser.id);
    if (latest) {
      setActiveChallenge(latest);
      if (latest.status === 'issued' && new Date(latest.expires_at).getTime() > Date.now()) {
        setGeneratedCode(latest.challenge_code);
        setChallengeId(latest.id);
        setExpiresAt(latest.expires_at);
        const rem = Math.max(0, Math.floor((new Date(latest.expires_at).getTime() - Date.now()) / 1000));
        setSecondsRemaining(rem);
      }
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
        setGeneratedCode(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerateChallenge = async () => {
    setIsGenerating(true);
    try {
      const res = await authenticityService.generateChallenge(advertiser.id);
      if (!res.success || !res.challenge_code || !res.challenge_id) {
        showToast({ type: 'error', title: 'Erro', message: res.error || 'Não foi possível gerar o código.' });
        return;
      }

      setGeneratedCode(res.challenge_code);
      setChallengeId(res.challenge_id);
      setExpiresAt(res.expires_at || new Date(Date.now() + 900000).toISOString());
      setSecondsRemaining(res.duration_seconds || 900);
      setSelectedFile(null);
      setPreviewUrl(null);

      showToast({
        type: 'success',
        title: 'Código Gerado com Sucesso',
        message: `Seu código de desafio é ${res.challenge_code}. Grave seu vídeo segurando ou exibindo este código.`,
      });
      loadChallenge();
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Tente novamente.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast({ type: 'warning', title: 'Formato Inválido', message: 'Selecione um arquivo de vídeo válido (MP4, WEBM ou MOV).' });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showToast({ type: 'warning', title: 'Arquivo Muito Grande', message: 'O vídeo de autenticidade não pode ultrapassar 100MB.' });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmitVideo = async () => {
    if (!selectedFile || !challengeId) return;
    setIsUploading(true);

    try {
      const supabase = createClient();
      const ext = selectedFile.name.split('.').pop() || 'mp4';
      const fileId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now();
      const filePath = `authenticity/${advertiser.id}/auth_${fileId}.${ext}`;

      // Upload to private bucket
      const { error: uploadError } = await supabase.storage
        .from('advertiser-private-media')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: true,
        });

      if (uploadError) {
        showToast({ type: 'error', title: 'Erro no upload', message: uploadError.message });
        return;
      }

      // Submit challenge
      const res = await authenticityService.submitVideo(challengeId, filePath);
      if (!res.success) {
        showToast({ type: 'error', title: 'Erro na submissão', message: res.error });
        return;
      }

      showToast({
        type: 'success',
        title: 'Vídeo Enviado para Moderação',
        message: 'Nossa equipe de conformidade analisará sua evidência com total confidencialidade.',
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setGeneratedCode(null);
      loadChallenge();
      onStatusUpdated();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro', message: err?.message || 'Falha ao processar vídeo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={22} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Vídeo de Autenticidade Portal18</h3>
            <Badge variant="gold" style={{ fontSize: '0.7rem' }}>100% Gratuito</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '650px', lineHeight: 1.45 }}>
            Comprove que você é a pessoa real por trás deste perfil. A evidência de vídeo é <strong>estritamente confidencial e privada</strong> e concede o selo <strong>Perfil Autenticado</strong> nas buscas.
          </p>
        </div>

        {/* Status Badge */}
        {advertiser.authenticity_verified ? (
          <Badge variant="success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 800 }}>
            <ShieldCheck size={14} /> Selo de Autenticidade Ativo
          </Badge>
        ) : activeChallenge?.status === 'submitted' ? (
          <Badge variant="warning" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <Clock size={14} /> Em Análise de Moderação
          </Badge>
        ) : (
          <Badge variant="neutral" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            Não Autenticado
          </Badge>
        )}
      </div>

      {/* Instructions Box */}
      <div style={{
        padding: '1rem',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <HelpCircle size={16} /> Como funciona a verificação de autenticidade:
        </div>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>Gere um <strong>código de desafio único</strong> válido por 15 minutos (ex: <code>P18-7K9M</code>).</li>
          <li>Grave um breve vídeo (5 a 15 segundos) mostrando seu rosto e pronunciando ou exibindo o código anotado em um papel.</li>
          <li>Envie o vídeo com segurança. Nosso time de compliance valida a correspondência com suas fotos públicas.</li>
          <li><strong>Privacidade Garantida:</strong> Seu vídeo nunca será exibido publicamente. Apenas o selo oficial será liberado.</li>
        </ol>
      </div>

      {/* Rejection Alert if applicable */}
      {activeChallenge?.status === 'rejected' && (
        <div style={{
          padding: '0.85rem 1rem',
          background: 'rgba(225, 29, 72, 0.08)',
          border: '1px solid var(--accent-ruby)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-ruby)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={16} /> Solicitação Anterior Não Aprovada
          </div>
          <p style={{ margin: 0 }}>{activeChallenge.rejection_reason || 'Por favor, gere um novo código e grave o vídeo com boa iluminação e nitidez.'}</p>
        </div>
      )}

      {/* Active Challenge Code Card */}
      {generatedCode && secondsRemaining > 0 ? (
        <div style={{
          padding: '1.5rem',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.15) 0%, var(--bg-tertiary) 100%)',
          border: '2px solid var(--accent-gold)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--shadow-glow-gold)'
        }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
            Seu Código de Desafio
          </div>

          <div style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            color: 'var(--accent-gold)',
            letterSpacing: '0.1em',
            fontFamily: 'monospace',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '0.4rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-accent)'
          }}>
            {generatedCode}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Clock size={14} color="var(--accent-gold)" />
            <span>Código expira em: <strong>{formatTimer(secondsRemaining)}</strong></span>
          </div>

          {/* Video Preview & File Upload */}
          {previewUrl && (
            <div style={{ width: '100%', maxWidth: '420px', marginTop: '0.5rem' }}>
              <video src={previewUrl} controls style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '240px' }} />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            capture="user"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Camera size={16} />}
            >
              {selectedFile ? 'Trocar Vídeo' : 'Gravar ou Selecionar Vídeo'}
            </Button>

            {selectedFile && (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitVideo}
                isLoading={isUploading}
                leftIcon={<UploadCloud size={16} />}
                style={{ fontWeight: 700 }}
              >
                Enviar Vídeo de Autenticidade
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Action Button to Start */
        !advertiser.authenticity_verified && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateChallenge}
              isLoading={isGenerating}
              leftIcon={<Sparkles size={16} />}
              style={{ fontWeight: 700 }}
            >
              Gerar Código de Desafio
            </Button>
          </div>
        )
      )}
    </Card>
  );
}
