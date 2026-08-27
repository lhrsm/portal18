import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CategoryDirectoryLoading() {
  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        <Skeleton width="60px" height="14px" />
        <Skeleton width="90px" height="14px" />
      </div>
      <Skeleton width="160px" height="18px" style={{ marginBottom: '0.5rem' }} />
      <Skeleton width="320px" height="36px" style={{ marginBottom: '0.5rem' }} />
      <Skeleton width="500px" height="16px" style={{ marginBottom: '2rem' }} />
      <div className="advertiser-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} width="100%" height="320px" borderRadius="var(--radius-md)" />
        ))}
      </div>
    </div>
  );
}
