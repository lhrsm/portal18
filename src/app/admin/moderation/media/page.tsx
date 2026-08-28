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
import { 
  Image as ImageIcon, 
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const loadMediaQueue = useCallback(async () => {
    setLoading(true);
    const res = await adminService.getPendingMediaQueue({ status: statusFilter });
    setMediaList(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadMediaQueue();
  }, [loadMediaQueue]);

  const handleApprove = async (mediaId: string) => {
    const res = await adminService.approveMedia(mediaId);
    if (res.success) {
      showToast({ type: 'success', title: 'Foto Aprovada!' });
      await loadMediaQueue();
    }
  };

  const handleReject = async (mediaId: string, reason: string) => {
    const res = await adminService.rejectMedia(mediaId, reason);
    if (res.success) {
      showToast({ type: 'info', title: 'Foto Rejeitada' });
      await loadMediaQueue();
    }
  };

  const handleBlock = async (mediaId: string, reason: string) => {
    const res = await adminService.blockMedia(mediaId, reason);
    if (res.success) {
      showToast({ type: 'ruby', title: 'Foto Bloqueada por Violação' });
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
            Fotos e vídeos de anunciantes aguardando validação de diretrizes
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
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
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: statusFilter === tab.id ? 'var(--accent-gold)' : 'transparent',
                color: statusFilter === tab.id ? '#000' : 'var(--text-secondary)',
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
                }}
                onClick={() => setSelectedMedia(media)}
              >
                <img
                  src={media.thumbnail_path || media.storage_path}
                  alt="Mídia"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

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
