'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnunciarGatewayPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/advertiser/start');
  }, [router]);

  return null;
}
