import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt = 'Avatar', fallback = 'U', size = 'md', className }: AvatarProps) {
  return (
    <div className={clsx('avatar', `avatar-${size}`, className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 64px, 96px"
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <span>{fallback.toUpperCase().slice(0, 2)}</span>
      )}
    </div>
  );
}
