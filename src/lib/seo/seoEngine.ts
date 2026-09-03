/**
 * Portal18 — Centralized SEO, Canonical & Structured Data Engine
 * Phase 26E.1: SEO Hardening, Search Console Readiness & Accessibility Compliance
 */

import type { Metadata } from 'next';

export interface SeoConfig {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  canonicalBaseUrl: string;
}

export function getCanonicalBaseUrl(): string {
  // 1. Explicit production site url
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  // 2. Vercel deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 3. Dynamic site URL or local development fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export const SEO_CONFIG: SeoConfig = {
  siteName: 'Portal18',
  defaultTitle: 'Portal18 | Perfis Verificados e Descoberta Nacional 18+',
  titleTemplate: '%s | Portal18',
  defaultDescription: 'Plataforma nacional de anúncios e descoberta de acompanhantes e profissionais independentes no Brasil. Fotos moderadas, maioridade estrita e contato direto.',
  defaultOgImage: '/icons/og-portal18-safe.png',
  canonicalBaseUrl: getCanonicalBaseUrl(),
};

/**
 * Builds absolute canonical URL from relative path
 */
export function buildCanonicalUrl(pathname: string): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getCanonicalBaseUrl()}${cleanPath}`;
}

/**
 * Builds WebSite JSON-LD Schema (Clean WebSite schema without SearchAction per Phase 26E.1)
 */
export function generateWebSiteSchema() {
  const baseUrl = getCanonicalBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Portal18',
    url: baseUrl,
    description: SEO_CONFIG.defaultDescription,
    inLanguage: 'pt-BR',
  };
}

/**
 * Builds Organization JSON-LD Schema (Safe public info only)
 */
export function generateOrganizationSchema() {
  const baseUrl = getCanonicalBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Portal18',
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    description: 'Plataforma de anúncios de profissionais independentes 18+ com conformidade e segurança no Brasil.',
  };
}

/**
 * Builds BreadcrumbList JSON-LD Schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  const baseUrl = getCanonicalBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

/**
 * Helper to check if current runtime is a preview / staging build
 */
export function isPreviewEnvironment(): boolean {
  return (
    process.env.VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    Boolean(process.env.NEXT_PUBLIC_PREVIEW_BUILD)
  );
}

/**
 * Gets site verification metadata conditionally for Search Console / Bing Webmaster.
 * Never outputs placeholder tokens.
 */
export function getSiteVerificationMetadata(): Metadata['verification'] {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION;
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION || process.env.MS_VALIDATE;

  const verification: Record<string, any> = {};
  if (google && google.trim().length > 0 && !google.includes('placeholder')) {
    verification.google = google.trim();
  }
  if (bing && bing.trim().length > 0 && !bing.includes('placeholder')) {
    verification.other = {
      'msvalidate.01': bing.trim(),
    };
  }

  return Object.keys(verification).length > 0 ? verification : undefined;
}
