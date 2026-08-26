import { MetadataRoute } from 'next';
import { publicProfilesService } from '@/services/publicProfilesService';
import { locationService } from '@/services/locationService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portaladulto.com.br';

  const [states, categories, activeCities, publicProfiles] = await Promise.all([
    locationService.getStates(),
    locationService.getCategories(),
    publicProfilesService.getCitiesWithActiveProfiles(),
    publicProfilesService.getPublicAdvertisers({ limit: 100 }),
  ]);

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
  ];

  // State routes
  const stateRoutes: MetadataRoute.Sitemap = states.map((s) => ({
    url: `${baseUrl}/acompanhantes/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // City routes with active profiles
  const cityRoutes: MetadataRoute.Sitemap = activeCities.map((c) => ({
    url: `${baseUrl}/acompanhantes/${c.stateSlug}/${c.citySlug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Category routes
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Approved public advertiser profile routes
  const profileRoutes: MetadataRoute.Sitemap = publicProfiles.data.map((adv) => ({
    url: `${baseUrl}/perfil/${adv.state_slug}/${adv.city_slug}/${adv.slug}`,
    lastModified: new Date(adv.updated_at || adv.created_at),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...stateRoutes,
    ...cityRoutes,
    ...categoryRoutes,
    ...profileRoutes,
  ];
}
