'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { mediaService } from '@/services/mediaService';
import { mediaQuotaService } from '@/services/media/quotaService';
import { AdvertiserProfile, AdvertiserMedia, MediaQuota } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  UploadCloud, 
  Trash2, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Play, 
  Sparkles,
  Lock 
} from 'lucide-react';
import Link from 'next/link';

export default function AdvertiserGalleryPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [quota, setQuota] = useState<MediaQuota | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const loadData = async () => {
    if (profile) {
      const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
      if (adv) {
        setAdvertiser(adv);
        const [list, quotaData] = await Promise.all([
          mediaService.getAdvertiserMedia(adv.id),
          mediaQuotaService.getAdvertiserMediaQuota(adv.id),
        ]);
        setMediaList(list);
        setQuota(quotaData);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  const handleUpload = async (files: FileList | File[], mediaType: 'image' | 'video') => {
    if (!advertiser || !quota) return;

    if (mediaType === 'video' && !quota.canUploadVideo) {
      showToast({
        type: 'warning',
        title: 'Recurso Não Incluso',
        message: 'O envio de vídeos está disponível para planos Premium e VIP. Faça upgrade para desbloquear.',
      });
      return;
    }

    const currentCount = mediaType === 'image' ? quota.currentImages : quota.currentVideos;
    const maxCount = mediaType === 'image' ? quota.maxImages : quota.maxVideos;

    if (currentCount >= maxCount) {
      showToast({
        type: 'warning',
        title: 'Limite de Mídia Atingido',
        message: `Você já atingiu o limite de ${maxCount} ${mediaType === 'image' ? 'fotos' : 'vídeos'} do seu plano.`,
      });
      return;
    }

    const filesArray = Array.from(files).slice(0, maxCount - currentCount);
    setIsUploading(true);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      setUploadMessage(`Enviando ${mediaType === 'image' ? 'foto' : 'vídeo'} ${i + 1} de ${filesArray.length}...`);
      setUploadPercent(10);

      const res = await mediaService.uploadMedia(advertiser.id, file, mediaType, (pct) => {
        setUploadPercent(pct);
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Arquivo Enviado!',
          message: 'Mídia salva e encaminhada para a fila de processamento e moderação.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Erro no Upload',
          message: res.error || 'Falha ao processar arquivo.',
        });
      }
    }

    setIsUploading(false);
    setUploadMessage(null);
    setUploadPercent(0);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';

    await loadData();
  };

  const handleSetMainPhoto = async (mediaId: string) => {
    if (!advertiser) return;
    const res = await mediaService.setMainPhoto(advertiser.id, mediaId);
    if (res.success) {
      showToast({ type: 'success', title: 'Capa Atualizada', message: 'A imagem foi definida como capa principal do anúncio.' });
      await loadData();
    }
  };

  const handleMoveMedia = async (index: number, direction: 'up' | 'down') => {
    if (!advertiser) return;
    const filtered = mediaList.filter((m) => m.media_type === (activeTab === 'images' ? 'image' : 'video'));
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filtered.length) return;

    const newList = [...filtered];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    const otherMedia = mediaList.filter((m) => m.media_type !== (activeTab === 'images' ? 'image' : 'video'));
    const combined = [...newList, ...otherMedia].map((m) => m.id);

    const res = await mediaService.reorderMedia(advertiser.id, combined);
    if (res.success) {
      await loadData();
    } else {
      showToast({ type: 'error', title: 'Erro ao reordenar mídia' });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Deseja realmente excluir esta mídia da sua galeria?')) return;
    const res = await mediaService.deleteMedia(mediaId);
    if (res.success) {
      showToast({ type: 'info', title: 'Mídia Removida' });
      await loadData();
    }
  };

  const getStatusBadge = (media: AdvertiserMedia) => {
    if (media.moderation_status === 'blocked') {
      return <Badge variant="ruby"><AlertTriangle size={12} /> Bloqueada</Badge>;
    }
    if (media.moderation_status === 'approved') {
      return <Badge variant="success"><ShieldCheck size={12} /> Aprovada</Badge>;
    }
    if (media.processing_status === 'processing' || media.processing_status === 'queued') {
      return <Badge variant="gold"><Sparkles size={12} /> Processando</Badge>;
    }
    return <Badge variant="warning"><Clock size={12} /> Em análise</Badge>;
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  const currentTabMedia = mediaList.filter((m) => m.media_type === (activeTab === 'images' ? 'image' : 'video'));

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Galeria & Mídias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Envio seguro de fotos e vídeos, variantes otimizadas e remoção de metadados EXIF
          </p>
        </div>

        {/* Quota Badges */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Badge variant="gold">
            <ImageIcon size={12} /> Fotos: {quota?.currentImages}/{quota?.maxImages}
          </Badge>
          <Badge variant={quota?.canUploadVideo ? 'ruby' : 'neutral'}>
            <VideoIcon size={12} /> Vídeos: {quota?.currentVideos}/{quota?.maxVideos}
          </Badge>
        </div>
      </div>

      {/* Media Type Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('images')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'images' ? 'rgba(229, 185, 92, 0.15)' : 'transparent',
            color: activeTab === 'images' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ImageIcon size={16} /> Fotos ({quota?.currentImages})
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'videos' ? 'rgba(229, 185, 92, 0.15)' : 'transparent',
            color: activeTab === 'videos' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <VideoIcon size={16} /> Vídeos ({quota?.currentVideos})
          {!quota?.canUploadVideo && <Lock size={12} />}
        </button>
      </div>

      {/* Video Upgrade Banner if not entitled */}
      {activeTab === 'videos' && !quota?.canUploadVideo && (
        <Card variant="glass" padding="md" style={{ border: '1px solid var(--accent-gold)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--accent-gold)' }}>
                Desbloqueie o Envio de Vídeos no seu Anúncio
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Perfis com vídeo possuem até 4x mais visualizações e contatos diretos. Faça upgrade para o plano Premium ou VIP.
              </p>
            </div>
            <Link href="/advertiser/subscription/plans">
              <Button variant="primary" size="sm">Fazer Upgrade</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Upload Dropzone */}
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
        onClick={() => {
          if (activeTab === 'images') imageInputRef.current?.click();
          else if (quota?.canUploadVideo) videoInputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files, activeTab === 'images' ? 'image' : 'video');
        }}
      >
        <input
          type="file"
          ref={imageInputRef}
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleUpload(e.target.files, 'image')}
        />

        <input
          type="file"
          ref={videoInputRef}
          accept="video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleUpload(e.target.files, 'video')}
        />

        <UploadCloud size={44} color="var(--accent-gold)" style={{ margin: '0 auto 0.75rem auto' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
          {isUploading ? `${uploadMessage} (${uploadPercent}%)` : `Arraste seus arquivos de ${activeTab === 'images' ? 'fotos' : 'vídeo'} aqui`}
        </h3>

        {/* Progress Bar */}
        {isUploading && (
          <div style={{ width: '100%', maxWidth: '360px', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', margin: '0.75rem auto', overflow: 'hidden' }}>
            <div style={{ width: `${uploadPercent}%`, height: '100%', backgroundColor: 'var(--accent-gold)', transition: 'width 0.3s' }} />
          </div>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1rem auto' }}>
          {activeTab === 'images'
            ? 'Formatos: JPG, PNG, WEBP, AVIF (máx. 15MB). Metadados de GPS são removidos automaticamente.'
            : 'Formatos: MP4, WebM (máx. 300MB, até 180s). Transcodificado e otimizado para streaming.'}
        </p>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={isUploading}
          disabled={activeTab === 'videos' && !quota?.canUploadVideo}
          leftIcon={<Plus size={16} />}
        >
          {isUploading ? 'Processando...' : `Adicionar ${activeTab === 'images' ? 'Fotos' : 'Vídeo'}`}
        </Button>
      </Card>

      {/* Media Grid */}
      {currentTabMedia.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          {activeTab === 'images' ? (
            <ImageIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          ) : (
            <VideoIcon size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          )}
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Nenhum arquivo de {activeTab === 'images' ? 'foto' : 'vídeo'} cadastrado
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Envie mídias de alta qualidade para atrair mais clientes para o seu anúncio.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {currentTabMedia.map((media, idx) => {
            const isMainPhoto = idx === 0 && media.media_type === 'image';
            const urls = mediaService.getMediaUrls(media);

            return (
              <Card key={media.id} variant="glass" padding="sm" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Media Container */}
                <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', marginBottom: '0.75rem' }}>
                  {media.media_type === 'image' ? (
                    <img
                      src={urls.thumbnailUrl}
                      alt="Foto da galeria"
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                      {media.thumbnail_path ? (
                        <img src={urls.thumbnailUrl} alt="Thumbnail de vídeo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : null}
                      <div style={{ position: 'absolute', width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={20} color="#fff" />
                      </div>
                      {media.duration_seconds && (
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {Math.floor(media.duration_seconds / 60)}:{(media.duration_seconds % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Cover Badge */}
                  {isMainPhoto && (
                    <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                      <Badge variant="gold">
                        <Star size={11} fill="var(--accent-gold)" /> Foto de Capa
                      </Badge>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px' }}>
                    {getStatusBadge(media)}
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
                      style={{ padding: '0.35rem' }}
                    >
                      <ArrowUp size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={idx === currentTabMedia.length - 1}
                      onClick={() => handleMoveMedia(idx, 'down')}
                      style={{ padding: '0.35rem' }}
                    >
                      <ArrowDown size={14} />
                    </Button>
                  </div>

                  {/* Main / Delete Buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {!isMainPhoto && media.media_type === 'image' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetMainPhoto(media.id)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        Capa
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMedia(media.id)}
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
