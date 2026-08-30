/**
 * Portal18 — Centralized SEO, Canonical & Structured Data Engine
 * Phase 26E: Technical SEO, Programmatic SEO & AI Discovery
 */

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

  // 3. Fallback standard production domain
  return 'https://portal18.com.br';
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
 * Builds WebSite JSON-LD Schema
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
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/explorar?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
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
