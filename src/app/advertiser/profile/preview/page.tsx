'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { mediaService } from '@/services/mediaService';
import { contactsService } from '@/services/contactsService';
import { locationService } from '@/services/locationService';
import { AdvertiserProfile, AdvertiserMedia, AdvertiserContact, Category, BrazilState, BrazilCity } from '@/types/app.types';
import { OnboardingPreviewCard } from '@/components/advertiser/OnboardingPreviewCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, Edit3, Send } from 'lucide-react';

export default function AdvertiserProfilePreviewPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (profile) {
        const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
        if (adv) {
          setAdvertiser(adv);
          const [media, advContacts, cats, catIds, statesData] = await Promise.all([
            mediaService.getAdvertiserMedia(adv.id),
            contactsService.getContactsByAdvertiser(adv.id),
            locationService.getCategories(),
            advertisersService.getAdvertiserCategoryIds(adv.id),
            locationService.getStates(),
          ]);

          setMediaList(media);
          setContacts(advContacts);
          setCategories(cats);
          setSelectedCategoryIds(catIds);
          setStates(statesData);

          if (adv.state_id) {
            const citiesData = await locationService.getCitiesByState(adv.state_id);
            setCities(citiesData);
          }
        }
      }
      setIsLoading(false);
    }
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '840px' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="420px" />
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center', maxWidth: '600px' }}>
        <h2>Perfil de anunciante não encontrado.</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
          Você ainda não possui um cadastro de anunciante ativo.
        </p>
        <Link href="/advertiser/start">
          <Button variant="primary">Criar Perfil Profissional</Button>
        </Link>
      </div>
    );
  }

  const selectedState = states.find((s) => s.id === advertiser.state_id);
  const selectedCity = cities.find((c) => c.id === advertiser.city_id);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '840px' }}>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link href="/advertiser" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar ao Painel
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/advertiser/onboarding">
            <Button variant="secondary" size="sm" leftIcon={<Edit3 size={14} />}>
              Editar no Onboarding
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Preview Card */}
      <OnboardingPreviewCard
        advertiser={advertiser}
        mediaList={mediaList}
        contacts={contacts}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        stateName={selectedState?.name}
        cityName={selectedCity?.name}
        onEditSection={(step) => {
          router.push(`/advertiser/onboarding`);
        }}
      />
    </div>
  );
}
