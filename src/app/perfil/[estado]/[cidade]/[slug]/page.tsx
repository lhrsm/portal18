import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicProfilesService } from '@/services/publicProfilesService';
import { ProfileViewClient } from './ProfileViewClient';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { PublicAdvertiser } from '@/types/app.types';
import {
  getCanonicalBaseUrl,
  generateBreadcrumbSchema,
} from '@/lib/seo/seoEngine';
import { cookies } from 'next/headers';
import { ageSessionService } from '@/services/ageVerification/ageSessionService';

// Age Assurance Gate: ProfileViewClient strictly mounts AgeGateModal and validates isAgeVerified

interface ProfilePageProps {
  params: Promise<{
    estado: string;
    cidade: string;
    slug: string;
  }> | {
    estado: string;
    cidade: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const stateSlug = resolvedParams?.estado ? String(resolvedParams.estado).toLowerCase() : '';
  const citySlug = resolvedParams?.cidade ? String(resolvedParams.cidade).toLowerCase() : '';
  const slug = resolvedParams?.slug ? String(resolvedParams.slug).toLowerCase() : '';

  const adv = await publicProfilesService.getPublicProfileBySlug(stateSlug, citySlug, slug);

  if (!adv) {
    return {
      title: 'Perfil não encontrado | Portal18',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const cityName = adv.city_name || citySlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateCode = adv.state_code || stateSlug.toUpperCase();
  const title = `${adv.stage_name} em ${cityName}, ${stateCode} | Portal18`;
  const description = adv.headline
    ? `${adv.stage_name} em ${cityName}, ${stateCode}: "${adv.headline}". Perfil verificado 18+, modalidades de atendimento e contato direto.`
    : `Consulte o perfil verificado de ${adv.stage_name} em ${cityName}, ${stateCode}. Fotos moderadas, modalidades de atendimento e contato direto no Portal18.`;

  const canonicalUrl = `${getCanonicalBaseUrl()}/perfil/${adv.state_slug || stateSlug}/${adv.city_slug || citySlug}/${adv.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'profile',
      siteName: 'Portal18',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const stateSlug = resolvedParams?.estado ? String(resolvedParams.estado).toLowerCase() : '';
  const citySlug = resolvedParams?.cidade ? String(resolvedParams.cidade).toLowerCase() : '';
  const slug = resolvedParams?.slug ? String(resolvedParams.slug).toLowerCase() : '';

  let adv = await publicProfilesService.getPublicProfileBySlug(stateSlug, citySlug, slug);
  let isPausedOwnerPreview = false;
  let isAdminPreview = false;

  // Requirement 8: Direct URL handling
  // Visitors: 404 (non-revealing)
  // Authenticated Owner: private preview permitted with "Seu anúncio está pausado" + [Reativar anúncio]
  // Admin: permitted administrative preview
  if (!adv) {
    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Query advertiser_profiles table directly (including paused / hidden)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rawAdv } = await (supabase.from('advertiser_profiles') as any)
          .select('*, brazil_states(code, name, slug), brazil_cities(name, slug)')
          .eq('slug', slug)
          .is('deleted_at', null)
          .maybeSingle();

        if (rawAdv) {
          // Check ownership: user.id maps to auth_user_id on profiles
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: userProfile } = await (supabase.from('profiles') as any)
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          const isOwner = userProfile && rawAdv.profile_id === userProfile.id;
          let isAdmin = false;

          if (!isOwner) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: userRole } = await (supabase.from('user_roles') as any)
              .select('role')
              .eq('user_id', user.id)
              .in('role', ['admin', 'super_admin'])
              .maybeSingle();
            isAdmin = Boolean(userRole);
          }

          if (isOwner || isAdmin) {
            isPausedOwnerPreview = Boolean(isOwner);
            isAdminPreview = Boolean(isAdmin);

            // Fetch primary media
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: primaryMedia } = await (supabase.from('advertiser_media') as any)
              .select('storage_path')
              .eq('advertiser_id', rawAdv.id)
              .eq('moderation_status', 'approved')
              .is('deleted_at', null)
              .order('position', { ascending: true })
              .limit(1)
              .maybeSingle();

            const stateData = rawAdv.brazil_states as { code?: string; name?: string; slug?: string } | null;
            const cityData = rawAdv.brazil_cities as { name?: string; slug?: string } | null;

            adv = {
              advertiser_id: rawAdv.id,
              profile_id: rawAdv.profile_id,
              slug: rawAdv.slug,
              stage_name: rawAdv.stage_name,
              headline: rawAdv.headline,
              bio: rawAdv.bio,
              age: 25,
              gender: rawAdv.gender,
              presentation: rawAdv.presentation,
              state_id: rawAdv.state_id,
              state_code: stateData?.code || stateSlug.toUpperCase(),
              state_name: stateData?.name || '',
              state_slug: stateData?.slug || stateSlug,
              city_id: rawAdv.city_id,
              city_name: cityData?.name || '',
              city_slug: cityData?.slug || citySlug,
              neighborhood: rawAdv.neighborhood,
              verification_status: rawAdv.verification_status,
              profile_status: rawAdv.profile_status,
              visibility: rawAdv.visibility,
              last_active_at: rawAdv.last_active_at,
              created_at: rawAdv.created_at,
              updated_at: rawAdv.updated_at,
              primary_photo_url: primaryMedia?.storage_path || null,
              approved_media_count: 1,
              category_ids: [],
              service_modalities: rawAdv.service_modalities || [],
              target_audience: rawAdv.target_audience || [],
              paused_at: rawAdv.paused_at,
            };
          }
        }
      }
    } catch {
      // Fallback
    }

    if (!adv) {
      notFound();
    }
  }

  // Generate BreadcrumbList Schema for Structured Data
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: adv.state_name || stateSlug.toUpperCase(), url: `/acompanhantes/${adv.state_slug || stateSlug}` },
    { name: adv.city_name || citySlug, url: `/acompanhantes/${adv.state_slug || stateSlug}/${adv.city_slug || citySlug}` },
    { name: adv.stage_name, url: `/perfil/${adv.state_slug || stateSlug}/${adv.city_slug || citySlug}/${adv.slug}` },
  ]);

  // Server-side Age Assurance check (HttpOnly cookie validation)
  const cookieStore = await cookies();
  const rawAgeSession = cookieStore.get(ageSessionService.cookieName)?.value;
  const ageSession = ageSessionService.parseSession(rawAgeSession);
  const isServerAgeVerified = ageSessionService.isSessionValid(ageSession);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <ProfileViewClient
        initialProfile={adv}
        stateSlug={stateSlug}
        citySlug={citySlug}
        slug={slug}
        isPausedOwnerPreview={isPausedOwnerPreview}
        isAdminPreview={isAdminPreview}
        initialAgeVerified={isServerAgeVerified}
      />
    </>
  );
}
