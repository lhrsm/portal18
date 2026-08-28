'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, Image as ImageIcon, Plus, ArrowRight, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdvertiserMedia } from '@/types/app.types';

export interface AdvertiserGallerySummaryCardProps {
  mediaList: AdvertiserMedia[];
}

export function AdvertiserGallerySummaryCard({ mediaList }: AdvertiserGallerySummaryCardProps) {
  const mainPhoto = mediaList.find((m) => m.position === 0) || mediaList[0];
  const approvedCount = mediaList.filter((m) => m.moderation_status === 'approved').length;
  const pendingCount = mediaList.filter((m) => m.moderation_status === 'pending' || !m.moderation_status).length;
  const rejectedCount = mediaList.filter((m) => m.moderation_status === 'rejected' || m.moderation_status === 'blocked').length;

  return (
    <Card variant="glass" padding="md" style={{ marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImageIcon size={18} color="var(--color-info)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Galeria & Fotos</h3>
        </div>
        <Link href="/advertiser/gallery">
          <Button variant="ghost" size="sm" style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
            Gerenciar
          </Button>
        </Link>
      </div>

      {/* Main Image Thumbnail + Quick Stats */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          {mainPhoto ? (
            <img
              src={mainPhoto.thumbnail_path || mainPhoto.storage_path || ''}
              alt="Foto Principal"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <Camera size={24} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {mediaList.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>fotos cadastradas</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <Badge variant="success" style={{ fontSize: '0.7rem' }}>
              <ShieldCheck size={10} /> {approvedCount} aprovadas
            </Badge>
            {pendingCount > 0 && (
              <Badge variant="gold" style={{ fontSize: '0.7rem' }}>
                <Clock size={10} /> {pendingCount} em análise
              </Badge>
            )}
            {rejectedCount > 0 && (
              <Badge variant="ruby" style={{ fontSize: '0.7rem' }}>
                <AlertTriangle size={10} /> {rejectedCount} rejeitadas
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Link href="/advertiser/gallery" style={{ textDecoration: 'none' }}>
        <Button variant="secondary" size="sm" fullWidth leftIcon={<Plus size={14} />}>
          Adicionar Novas Fotos
        </Button>
      </Link>
    </Card>
  );
}
