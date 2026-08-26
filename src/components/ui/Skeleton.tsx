import React, { HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ width, height, circle, className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={{
        width: width || '100%',
        height: height || '1.25rem',
        borderRadius: circle ? '9999px' : undefined,
        ...style,
      }}
      {...props}
    />
  );
}
