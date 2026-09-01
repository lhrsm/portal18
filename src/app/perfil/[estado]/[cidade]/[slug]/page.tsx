import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicProfilesService } from '@/services/publicProfilesService';
import { ProfileViewClient } from './ProfileViewClient';
import {
  getCanonicalBaseUrl,
  generateBreadcrumbSchema
} from '@/lib/seo/seoEngine';

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

  const adv = await publicProfilesService.getPublicProfileBySlug(stateSlug, citySlug, slug);

  if (!adv) {
    notFound();
  }

  // Generate BreadcrumbList Schema for Structured Data
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: adv.state_name || stateSlug.toUpperCase(), url: `/acompanhantes/${adv.state_slug || stateSlug}` },
    { name: adv.city_name || citySlug, url: `/acompanhantes/${adv.state_slug || stateSlug}/${adv.city_slug || citySlug}` },
    { name: adv.stage_name, url: `/perfil/${adv.state_slug || stateSlug}/${adv.city_slug || citySlug}/${adv.slug}` },
  ]);

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
      />
    </>
  );
}
