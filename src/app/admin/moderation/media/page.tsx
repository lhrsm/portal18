'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { AdvertiserMedia } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MediaReviewModal } from '@/components/admin/MediaReviewModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { Image as ImageIcon, Check, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';

export default function AdminMediaQueuePage() {
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const loadMediaQueue = async () => {
    setLoading(true);
    const res = await adminService.getPendingMediaQueue();
    setMediaList(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadMediaQueue();
  }, []);

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
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fila de Moderação de Mídias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Fotos recém-enviadas pelos anunciantes aguardando validação visual
          </p>
        </div>
        <Badge variant="gold">{totalCount} fotos pendentes</Badge>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <Skeleton height="240px" />
          <Skeleton height="240px" />
          <Skeleton height="240px" />
          <Skeleton height="240px" />
        </div>
      ) : mediaList.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <ShieldCheck size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhuma foto pendente!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Todas as fotos de anunciantes foram moderadas.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {mediaList.map((media) => (
            <Card key={media.id} variant="glass" padding="sm" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{ position: 'relative', height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer', marginBottom: '0.75rem' }}
                onClick={() => setSelectedMedia(media)}
              >
                <img
                  src={media.thumbnail_path || media.storage_path}
                  alt="Mídia pendente"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <Badge variant="warning">Pendente</Badge>
                </div>
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#fff' }}>
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

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(media.id)}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                >
                  <Check size={14} /> Aprovar
                </Button>
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
