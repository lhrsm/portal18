'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { ReferralDashboard } from '@/components/advertiser/ReferralProgram/ReferralDashboard';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { advertisersService } from '@/services/advertisersService';
import { AdvertiserProfile } from '@/types/app.types';

export default function AdvertiserReferralsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdvertiser() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        if (adv) {
          setAdvertiser(adv);
        }
      }
      setLoading(false);
    }
    if (!authLoading) {
      loadAdvertiser();
    }
  }, [profile, authLoading]);

  return (
    <AdvertiserLayout advertiser={advertiser}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '2rem' }}>
        {loading || authLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton height="160px" />
            <Skeleton height="240px" />
          </div>
        ) : advertiser ? (
          <ReferralDashboard advertiserId={advertiser.id} />
        ) : (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Perfil Não Encontrado</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Complete o seu cadastro de anunciante para acessar o programa de indicação.
            </p>
          </Card>
        )}
      </div>
    </AdvertiserLayout>
  );
}
