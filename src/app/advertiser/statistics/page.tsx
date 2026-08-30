'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdvertiserStatisticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/advertiser/analytics');
  }, [router]);

  return null;
}
