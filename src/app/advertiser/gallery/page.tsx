'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { mediaService } from '@/services/mediaService';
import { AdvertiserProfile, AdvertiserMedia } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Plus 
} from 'lucide-react';

export default function AdvertiserGalleryPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_GALLERY_LIMIT = 15;

  const loadMedia = async () => {
    if (profile) {
      const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
      if (adv) {
        setAdvertiser(adv);
        const list = await mediaService.getAdvertiserMedia(adv.id);
        setMediaList(list);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadMedia();
    }
  }, [profile, authLoading]);

  // Handle Multi-file Upload (Requirements 27, 28, 29, 62, 63)
  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!advertiser) return;

    const remainingSlots = MAX_GALLERY_LIMIT - mediaList.length;
    if (remainingSlots <= 0) {
      showToast({
        type: 'warning',
        title: 'Limite Atingido',
        message: `Sua galeria já atingiu o limite de ${MAX_GALLERY_LIMIT} fotos.`,
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(`Enviando foto ${i + 1} de ${filesToUpload.length}...`);

      const res = await mediaService.uploadMedia(advertiser.id, file, 'image');
      if (res.success && res.data) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await loadMedia();

    if (successCount > 0) {
      showToast({
        type: 'success',
        title: `${successCount} foto(s) enviada(s)!`,
        message: 'As fotos entraram na fila de moderação.',
      });
    }
    if (failCount > 0) {
      showToast({
        type: 'error',
        title: 'Erro no Upload',
        message: `${failCount} foto(s) não puderam ser enviadas (máx 10MB, JPG/PNG/WEBP).`,
      });
    }
  };

  const handleSetMainPhoto = async (mediaId: string) => {
    if (!advertiser) return;
    const res = await mediaService.setMainPhoto(advertiser.id, mediaId);
    if (res.success) {
      showToast({ type: 'success', title: 'Foto Principal Atualizada', message: 'A imagem foi definida como capa do anúncio.' });
      await loadMedia();
    }
  };

  const handleMoveMedia = async (index: number, direction: 'up' | 'down') => {
    if (!advertiser) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaList.length) return;

    const newList = [...mediaList];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    setMediaList(newList); // optimistic update

    const mediaIds = newList.map((m) => m.id);
    const res = await mediaService.reorderMedia(advertiser.id, mediaIds);
    if (!res.success) {
      await loadMedia(); // revert on failure
      showToast({ type: 'error', title: 'Erro ao reordenar fotos' });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Deseja realmente remover esta foto da sua galeria?')) return;
    const res = await mediaService.deleteMedia(mediaId);
    if (res.success) {
      showToast({ type: 'info', title: 'Foto Removida' });
      await loadMedia();
    }
  };

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><ShieldCheck size={12} /> Aprovada</Badge>;
      case 'rejected':
      case 'flagged':
      case 'blocked':
        return <Badge variant="ruby"><AlertTriangle size={12} /> Revisão necessária</Badge>;
      default:
        return <Badge variant="warning"><Clock size={12} /> Em análise</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Galeria de Fotos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Gerencie as fotos do seu anúncio, selecione a foto de capa e organize a ordem de exibição
          </p>
        </div>
        <Badge variant="gold">{mediaList.length}/{MAX_GALLERY_LIMIT} fotos</Badge>
      </div>

      {/* Upload Dropzone (Requirements 26, 28, 61) */}
      <Card
        variant="glass"
        padding="lg"
        style={{
          border: isDragging ? '2px dashed var(--accent-gold)' : '2px dashed var(--border-subtle)',
          backgroundColor: isDragging ? 'rgba(229, 185, 92, 0.05)' : 'var(--bg-card)',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '2rem',
          transition: 'all var(--transition-fast)',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
        />

        <UploadCloud size={44} color="var(--accent-gold)" style={{ margin: '0 auto 0.75rem auto' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
          {isUploading ? uploadProgress : 'Arraste suas fotos aqui ou clique para selecionar'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1rem auto' }}>
          Aceito: JPG, PNG, WEBP (máx. 10MB por arquivo). Metadados de GPS e câmera são removidos automaticamente.
        </p>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={isUploading}
          leftIcon={<Plus size={16} />}
        >
          {isUploading ? 'Processando...' : 'Adicionar Fotos'}
        </Button>
      </Card>

      {/* Media List Grid (Requirements 34, 35, 39) */}
      {mediaList.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <ImageIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhuma foto enviada ainda</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Adicione ao menos uma foto principal para poder enviar seu perfil para análise da moderação.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {mediaList.map((media, idx) => {
            const isMainPhoto = idx === 0;
            return (
              <Card key={media.id} variant="glass" padding="sm" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Photo Thumbnail Container */}
                <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', marginBottom: '0.75rem' }}>
                  <img
                    src={media.thumbnail_path || media.storage_path}
                    alt="Foto da galeria"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Main Photo Badge */}
                  {isMainPhoto && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                      <Badge variant="gold">
                        <Star size={11} fill="var(--accent-gold)" /> Foto Principal
                      </Badge>
                    </div>
                  )}

                  {/* Moderation Status Badge */}
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                    {getModerationBadge(media.moderation_status)}
                  </div>
                </div>

                {/* Actions & Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  {/* Reorder Buttons */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === 0}
                      onClick={() => handleMoveMedia(idx, 'up')}
                      aria-label="Mover para esquerda/cima"
                      style={{ padding: '0.35rem' }}
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === mediaList.length - 1}
                      onClick={() => handleMoveMedia(idx, 'down')}
                      aria-label="Mover para direita/baixo"
                      style={{ padding: '0.35rem' }}
                    >
                      <ArrowDown size={14} />
                    </Button>
                  </div>

                  {/* Main / Delete Buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {!isMainPhoto && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetMainPhoto(media.id)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        Definir Capa
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMedia(media.id)}
                      aria-label="Excluir foto"
                      style={{ color: 'var(--accent-ruby)', padding: '0.35rem' }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdvertiserLayout>
  );
}
