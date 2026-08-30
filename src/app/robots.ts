import { MetadataRoute } from 'next';
import { getCanonicalBaseUrl, isPreviewEnvironment } from '@/lib/seo/seoEngine';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getCanonicalBaseUrl();
  const isPreview = isPreviewEnvironment();

  // If in Preview / Staging deployment, block all crawling completely
  if (isPreview) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  // Production Robots configuration
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin',
          '/advertiser/',
          '/advertiser',
          '/account/',
          '/account',
          '/auth/',
          '/api/',
          '/age-verification/callback',
          '/payment/success',
          '/payment/cancelled',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ],
      },
      // Search Engine / AI Discovery Crawlers (Adhere to standard public disallow rules)
      {
        userAgent: ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot'],
        allow: '/',
        disallow: [
          '/admin/',
          '/advertiser/',
          '/account/',
          '/auth/',
          '/api/',
          '/age-verification/callback',
          '/payment/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
