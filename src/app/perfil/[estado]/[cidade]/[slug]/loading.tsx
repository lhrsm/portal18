import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <div className="container" style={{ padding: '1.25rem 1rem 4rem 1rem', maxWidth: '1400px' }}>
      {/* Breadcrumb Skeleton */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
        <Skeleton width="60px" height="14px" />
        <Skeleton width="80px" height="14px" />
        <Skeleton width="90px" height="14px" />
        <Skeleton width="120px" height="14px" />
      </div>

      {/* 60/40 Hero Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {/* Left: 3:4 Gallery */}
        <div>
          <Skeleton width="100%" height="480px" borderRadius="var(--radius-lg)" style={{ marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Skeleton width="80px" height="80px" borderRadius="var(--radius-md)" />
            <Skeleton width="80px" height="80px" borderRadius="var(--radius-md)" />
            <Skeleton width="80px" height="80px" borderRadius="var(--radius-md)" />
          </div>
        </div>

        {/* Right: Info & Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton width="180px" height="18px" />
          <Skeleton width="320px" height="40px" />
          <Skeleton width="220px" height="20px" />
          <Skeleton width="100%" height="90px" borderRadius="var(--radius-md)" />
          <Skeleton width="100%" height="56px" borderRadius="var(--radius-md)" />
          <Skeleton width="100%" height="160px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    </div>
  );
}
