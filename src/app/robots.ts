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

  const standardDisallows = [
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
  ];

  // Production Robots configuration
  return {
    rules: [
      // 1. Generic User-Agents
      {
        userAgent: '*',
        allow: '/',
        disallow: standardDisallows,
      },
      // 2. Search Engines & Real-Time Discovery Crawlers
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
        ],
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
      // 3. AI Training & Bulk Data Scrapers (Protected per docs/seo/crawler-policy.md)
      {
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'Google-Extended',
          'CCBot',
          'Bytespider',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
