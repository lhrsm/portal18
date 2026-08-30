import { MetadataRoute } from 'next';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';
import { getCanonicalBaseUrl } from '@/lib/seo/seoEngine';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getCanonicalBaseUrl();

  const [states, categories, activeCities, publicProfiles] = await Promise.all([
    locationService.getStates(),
    locationService.getCategories(),
    publicProfilesService.getCitiesWithActiveProfiles(),
    publicProfilesService.getPublicAdvertisers({ limit: 100 }),
  ]);

  // 1. Static Core Canonical URLs
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explorar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/plans`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/anunciar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/anunciar/salvador`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/trust`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/trust/age-verification`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trust/content-removal`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trust/lgpd`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trust/minors`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trust/moderation`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trust/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/trust/security`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // 2. 27 Brazilian State Directories
  const stateRoutes: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${baseUrl}/acompanhantes/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 3. Active City Directories (Only cities with active approved advertisers)
  const cityRoutes: MetadataRoute.Sitemap = activeCities
    .filter((c) => c.profileCount > 0 || c.citySlug === 'salvador' || c.citySlug === 'sao-paulo' || c.citySlug === 'rio-de-janeiro')
    .map((c) => ({
      url: `${baseUrl}/acompanhantes/${c.stateSlug}/${c.citySlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  // 4. Active Category Directories
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 5. Approved Public Advertiser Profile URLs (Excludes demo/unapproved/suspended profiles)
  const profileRoutes: MetadataRoute.Sitemap = (publicProfiles?.data || [])
    .filter((adv) => adv.state_slug && adv.city_slug && adv.slug && adv.profile_status === 'approved' && !adv.slug.startsWith('demo-'))
    .map((adv) => {
      const sourceDate = adv.updated_at ?? adv.created_at;
      return {
        url: `${baseUrl}/perfil/${adv.state_slug}/${adv.city_slug}/${adv.slug}`,
        ...(sourceDate ? { lastModified: new Date(sourceDate) } : { lastModified: new Date() }),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      };
    });

  return [
    ...staticRoutes,
    ...stateRoutes,
    ...cityRoutes,
    ...categoryRoutes,
    ...profileRoutes,
  ];
}
