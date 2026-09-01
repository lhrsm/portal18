'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { AdvertiserMedia } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MediaReviewModal } from '@/components/admin/MediaReviewModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { authenticityService } from '@/services/authenticityService';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Volume2,
  Check,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Sparkles,
  Clock,
  Ban,
  Crown
} from 'lucide-react';

export default function AdminMediaQueuePage() {
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'authenticity'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const loadMediaQueue = useCallback(async () => {
    setLoading(true);
    if (categoryFilter === 'authenticity') {
      const authList = await authenticityService.getPendingAuthenticityReviews();
      setMediaList(authList.map((a) => ({
        ...a,
        media_type: 'authenticity_video',
        storage_path: a.video_storage_path,
        thumbnail_path: a.video_storage_path,
        advertiser_profiles: a.advertiser_profiles,
      })));
      setTotalCount(authList.length);
    } else {
      const res = await adminService.getPendingMediaQueue({ status: statusFilter });
      let filtered = res.data;
      if (categoryFilter !== 'all') {
        filtered = filtered.filter((m: any) => m.media_type === categoryFilter);
      }
      setMediaList(filtered);
      setTotalCount(filtered.length);
    }
    setLoading(false);
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    loadMediaQueue();
  }, [loadMediaQueue]);

  const handleApprove = async (mediaId: string) => {
    if (categoryFilter === 'authenticity') {
      const res = await authenticityService.reviewChallenge(mediaId, 'approve');
      if (res.success) {
        showToast({ type: 'success', title: 'Vídeo de Autenticidade Aprovado! Selo Ativado.' });
        await loadMediaQueue();
      }
      return;
    }

    const res = await adminService.approveMedia(mediaId);
    if (res.success) {
      showToast({ type: 'success', title: 'Mídia Aprovada!' });
      await loadMediaQueue();
    }
  };

  const handleReject = async (mediaId: string, reason: string) => {
    if (categoryFilter === 'authenticity') {
      const res = await authenticityService.reviewChallenge(mediaId, 'reject', reason);
      if (res.success) {
        showToast({ type: 'info', title: 'Vídeo de Autenticidade Rejeitado' });
        await loadMediaQueue();
      }
      return;
    }

    const res = await adminService.rejectMedia(mediaId, reason);
    if (res.success) {
      showToast({ type: 'info', title: 'Mídia Rejeitada' });
      await loadMediaQueue();
    }
  };

  const handleBlock = async (mediaId: string, reason: string) => {
    const res = await adminService.blockMedia(mediaId, reason);
    if (res.success) {
      showToast({ type: 'ruby', title: 'Mídia Bloqueada por Violação' });
      await loadMediaQueue();
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">MODERAÇÃO DE MÍDIAS</Badge>
            <Badge variant="neutral">{totalCount} registros</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Fila de Moderação de Mídias</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Fotos, vídeos, áudios e evidências de autenticidade de anunciantes
          </p>
        </div>

        {/* Media Type & Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'image', label: 'Fotos' },
              { id: 'video', label: 'Vídeos' },
              { id: 'audio', label: 'Áudios' },
              { id: 'authenticity', label: 'Autenticidade' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id as any)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: categoryFilter === tab.id ? 'var(--accent-gold)' : 'transparent',
                  color: categoryFilter === tab.id ? '#000' : 'var(--text-secondary)',
                  fontWeight: categoryFilter === tab.id ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          {categoryFilter !== 'authenticity' && (
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {[
                { id: 'pending', label: 'Pendentes' },
                { id: 'approved', label: 'Aprovadas' },
                { id: 'rejected', label: 'Rejeitadas' },
                { id: 'blocked', label: 'Bloqueadas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: statusFilter === tab.id ? 'var(--accent-ruby)' : 'transparent',
                    color: statusFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                    fontWeight: statusFilter === tab.id ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          <Skeleton height="240px" />
          <Skeleton height="240px" />
          <Skeleton height="240px" />
          <Skeleton height="240px" />
        </div>
      ) : mediaList.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <ShieldCheck size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nenhuma mídia nesta fila!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Todas as fotos com o filtro selecionado foram processadas.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {mediaList.map((media) => (
            <Card key={media.id} variant="glass" padding="sm" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  position: 'relative',
                  height: '220px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setSelectedMedia(media)}
              >
                {media.media_type === 'audio' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'grid', placeItems: 'center', color: '#000' }}>
                      <Volume2 size={24} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Apresentação em Áudio</span>
                    <audio controls src={media.storage_path} style={{ width: '180px', height: '32px' }} onClick={(e) => e.stopPropagation()} />
                  </div>
                ) : media.media_type === 'authenticity_video' ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                    <ShieldCheck size={36} color="var(--accent-gold)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '0.25rem' }}>
                      {media.challenge_code || 'Evidência de Autenticidade'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vídeo Confidencial</span>
                  </div>
                ) : (
                  <img
                    src={media.thumbnail_path || media.storage_path}
                    alt="Mídia"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {/* Position 0 Cover badge */}
                {media.position === 0 && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                    <Badge variant="gold"><Crown size={10} /> Foto de Capa</Badge>
                  </div>
                )}

                {/* Moderation Status */}
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <Badge
                    variant={
                      media.moderation_status === 'approved'
                        ? 'success'
                        : media.moderation_status === 'rejected'
                        ? 'ruby'
                        : media.moderation_status === 'blocked'
                        ? 'ruby'
                        : 'warning'
                    }
                  >
                    {media.moderation_status}
                  </Badge>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.75)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#fff',
                    maxWidth: '85%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {media.advertiser_profiles?.stage_name || 'Anunciante'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', marginTop: 'auto' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedia(media)}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                >
                  <Eye size={14} /> Inspecionar
                </Button>

                {media.moderation_status !== 'approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(media.id)}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  >
                    <Check size={14} /> Aprovar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Expanded Review Modal */}
      <MediaReviewModal
        media={selectedMedia}
        isOpen={Boolean(selectedMedia)}
        onClose={() => setSelectedMedia(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onBlock={handleBlock}
      />
    </AdminLayout>
  );
}
