import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CityDirectoryLoading() {
  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem 1rem', maxWidth: '1400px' }}>
      {/* Breadcrumb Skeleton */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
        <Skeleton width="60px" height="14px" />
        <Skeleton width="80px" height="14px" />
        <Skeleton width="90px" height="14px" />
      </div>

      {/* Header Skeleton */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Skeleton width="180px" height="16px" style={{ marginBottom: '0.35rem' }} />
        <Skeleton width="340px" height="32px" style={{ marginBottom: '0.35rem' }} />
        <Skeleton width="520px" height="16px" />
      </div>

      {/* Filter Toolbar Skeleton */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <Skeleton width="80px" height="32px" borderRadius="var(--radius-full)" />
        <Skeleton width="110px" height="32px" borderRadius="var(--radius-full)" />
        <Skeleton width="100px" height="32px" borderRadius="var(--radius-full)" />
        <Skeleton width="90px" height="32px" borderRadius="var(--radius-full)" />
        <Skeleton width="120px" height="32px" borderRadius="var(--radius-full)" />
      </div>

      {/* Grid Skeleton (5 cards) */}
      <div className="advertiser-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <Skeleton width="100%" height="280px" borderRadius="0" />
            <div style={{ padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <Skeleton width="70%" height="16px" />
              <Skeleton width="50%" height="12px" />
              <Skeleton width="90%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
