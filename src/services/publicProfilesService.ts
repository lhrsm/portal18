import { createClient } from '@/lib/supabase/client';
import { PublicAdvertiser, ExploreFilters, BrazilCity, Category, isValidPublicAdvertiser } from '@/types/app.types';
import { DEMO_PUBLIC_ADVERTISERS, DEMO_CATEGORIES, DEMO_CITIES, DEMO_STATES } from '@/data/demoProfiles';

function filterDemoAdvertisers(filters: ExploreFilters = {}): {
  data: PublicAdvertiser[];
  totalCount: number;
  hasMore: boolean;
} {
  let list = [...DEMO_PUBLIC_ADVERTISERS];

  // Filter by State
  if (filters.state) {
    const s = filters.state.toLowerCase();
    list = list.filter(
      (p) => (p.state_slug && p.state_slug.toLowerCase() === s) || (p.state_code && p.state_code.toLowerCase() === s)
    );
  }

  // Filter by City
  if (filters.city) {
    const c = filters.city.toLowerCase();
    list = list.filter((p) => p.city_slug && p.city_slug.toLowerCase() === c);
  }

  // Filter by Verified
  if (filters.verified) {
    list = list.filter((p) => p.verification_status === 'verified');
  }

  // Filter by Age Range
  if (filters.ageRange) {
    if (filters.ageRange === '18-24') {
      list = list.filter((p) => (p.age || 18) >= 18 && (p.age || 18) <= 24);
    } else if (filters.ageRange === '25-34') {
      list = list.filter((p) => (p.age || 18) >= 25 && (p.age || 18) <= 34);
    } else if (filters.ageRange === '35-44') {
      list = list.filter((p) => (p.age || 18) >= 35 && (p.age || 18) <= 44);
    } else if (filters.ageRange === '45+') {
      list = list.filter((p) => (p.age || 18) >= 45);
    }
  }

  // Filter by Category
  if (filters.category) {
    const targetCat = DEMO_CATEGORIES.find((cat) => cat.slug === filters.category?.toLowerCase());
    if (targetCat) {
      list = list.filter((p) => p.category_ids && p.category_ids.includes(targetCat.id));
    }
  }

  // Sorting
  if (filters.sort === 'recent') {
    list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  } else if (filters.sort === 'active') {
    list.sort((a, b) => new Date(b.last_active_at || '').getTime() - new Date(a.last_active_at || '').getTime());
  } else {
    // 'recommended' default: verified first, then updated
    list.sort((a, b) => {
      if (a.verification_status === 'verified' && b.verification_status !== 'verified') return -1;
      if (a.verification_status !== 'verified' && b.verification_status === 'verified') return 1;
      return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
    });
  }

  const limit = filters.limit || 24;
  const page = filters.page || 1;
  const from = (page - 1) * limit;
  const to = from + limit;

  const paginated = list.slice(from, to);

  return {
    data: paginated,
    totalCount: list.length,
    hasMore: to < list.length,
  };
}

export const publicProfilesService = {
  async getPublicAdvertisers(filters: ExploreFilters = {}): Promise<{
    data: PublicAdvertiser[];
    totalCount: number;
    hasMore: boolean;
  }> {
    const supabase = createClient();
    const limit = filters.limit || 24;
    const page = filters.page || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('public_advertiser_profiles')
        .select('*', { count: 'exact' });

      // Filter by State
      if (filters.state) {
        query = query.or(`state_slug.eq.${filters.state.toLowerCase()},state_code.ilike.${filters.state}`);
      }

      // Filter by City
      if (filters.city) {
        query = query.ilike('city_slug', filters.city.toLowerCase());
      }

      // Filter by Verified
      if (filters.verified) {
        query = query.eq('verification_status', 'verified');
      }

      // Filter by Age Range
      if (filters.ageRange) {
        if (filters.ageRange === '18-24') {
          query = query.gte('age', 18).lte('age', 24);
        } else if (filters.ageRange === '25-34') {
          query = query.gte('age', 25).lte('age', 34);
        } else if (filters.ageRange === '35-44') {
          query = query.gte('age', 35).lte('age', 44);
        } else if (filters.ageRange === '45+') {
          query = query.gte('age', 45);
        }
      }

      // Filter by Category
      if (filters.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.category.toLowerCase())
          .maybeSingle();

        if (cat) {
          query = query.contains('category_ids', [(cat as { id: string }).id]);
        }
      }

      // Sorting
      if (filters.sort === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sort === 'active') {
        query = query.order('last_active_at', { ascending: false, nullsFirst: false });
      } else {
        query = query
          .order('verification_status', { ascending: false })
          .order('updated_at', { ascending: false });
      }

      const { data, count, error } = await query.range(from, to);

      if (!error && data && data.length > 0) {
        const profiles = data.filter(isValidPublicAdvertiser);
        const totalCount = count || 0;
        return {
          data: profiles,
          totalCount,
          hasMore: to < totalCount - 1,
        };
      }
    } catch {
      // Fallback to rich demo data
    }

    return filterDemoAdvertisers(filters);
  },

  async getPublicProfileBySlug(
    stateSlug: string,
    citySlug: string,
    slug: string
  ): Promise<PublicAdvertiser | null> {
    // 1. Fast-path in-memory lookup for demo profiles (< 0.1ms)
    const demoFound = DEMO_PUBLIC_ADVERTISERS.find(
      (p) =>
        (p.slug === slug || p.slug.includes(slug)) &&
        p.state_slug?.toLowerCase() === stateSlug.toLowerCase() &&
        p.city_slug?.toLowerCase() === citySlug.toLowerCase()
    );

    if (demoFound) {
      return demoFound;
    }

    // 2. Query Supabase for real production profiles
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('public_advertiser_profiles')
        .select('*')
        .eq('slug', slug)
        .eq('state_slug', stateSlug.toLowerCase())
        .eq('city_slug', citySlug.toLowerCase())
        .maybeSingle();

      if (!error && data && isValidPublicAdvertiser(data)) {
        return data;
      }
    } catch {
      // Fallback
    }

    return null;
  },

  async getRecommendedAdvertisers(limit = 6): Promise<PublicAdvertiser[]> {
    const res = await this.getPublicAdvertisers({ sort: 'recommended', limit });
    return res.data;
  },

  async getRecentAdvertisers(limit = 6): Promise<PublicAdvertiser[]> {
    const res = await this.getPublicAdvertisers({ sort: 'recent', limit });
    return res.data;
  },

  async getCitiesWithActiveProfiles(): Promise<{
    cityName: string;
    citySlug: string;
    stateCode: string;
    stateSlug: string;
    profileCount: number;
  }[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('public_advertiser_profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select('city_name, city_slug, state_code, state_slug') as any;

      if (!error && data && data.length > 0) {
        const map = new Map<string, {
          cityName: string;
          citySlug: string;
          stateCode: string;
          stateSlug: string;
          profileCount: number;
        }>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((p: any) => {
          if (p.city_name && p.city_slug && p.state_code && p.state_slug) {
            const key = `${p.state_slug}/${p.city_slug}`;
            const existing = map.get(key);
            if (existing) {
              existing.profileCount += 1;
            } else {
              map.set(key, {
                cityName: p.city_name,
                citySlug: p.city_slug,
                stateCode: p.state_code,
                stateSlug: p.state_slug,
                profileCount: 1,
              });
            }
          }
        });

        return Array.from(map.values()).sort((a, b) => b.profileCount - a.profileCount);
      }
    } catch {
      // Fallback
    }

    // Demo aggregation
    const map = new Map<string, {
      cityName: string;
      citySlug: string;
      stateCode: string;
      stateSlug: string;
      profileCount: number;
    }>();

    DEMO_PUBLIC_ADVERTISERS.forEach((p) => {
      if (p.city_name && p.city_slug && p.state_code && p.state_slug) {
        const key = `${p.state_slug}/${p.city_slug}`;
        const existing = map.get(key);
        if (existing) {
          existing.profileCount += 1;
        } else {
          map.set(key, {
            cityName: p.city_name,
            citySlug: p.city_slug,
            stateCode: p.state_code,
            stateSlug: p.state_slug,
            profileCount: 1,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.profileCount - a.profileCount);
  },

  async getCategoriesWithCount(): Promise<(Category & { profileCount: number })[]> {
    try {
      const supabase = createClient();
      const [catsRes, profilesRes] = await Promise.all([
        supabase.from('categories').select('*').eq('status', 'active').order('sort_order', { ascending: true }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from('public_advertiser_profiles').select('category_ids') as any,
      ]);

      if (!catsRes.error && catsRes.data && catsRes.data.length > 0) {
        const catProfiles = profilesRes.data || [];
        const countMap = new Map<string, number>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        catProfiles.forEach((p: any) => {
          if (Array.isArray(p.category_ids)) {
            p.category_ids.forEach((cId: string) => {
              countMap.set(cId, (countMap.get(cId) || 0) + 1);
            });
          }
        });

        return (catsRes.data as Category[]).map((cat) => ({
          ...cat,
          profileCount: countMap.get(cat.id) || 0,
        }));
      }
    } catch {
      // Fallback
    }

    // Demo aggregation
    const countMap = new Map<string, number>();
    DEMO_PUBLIC_ADVERTISERS.forEach((p) => {
      if (Array.isArray(p.category_ids)) {
        p.category_ids.forEach((cId: string) => {
          countMap.set(cId, (countMap.get(cId) || 0) + 1);
        });
      }
    });

    return DEMO_CATEGORIES.map((cat) => ({
      ...cat,
      profileCount: countMap.get(cat.id) || 0,
    }));
  },

  async searchCitiesAutocomplete(
    searchTerm: string,
    limit = 8
  ): Promise<(BrazilCity & { state_code: string; state_slug: string })[]> {
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brazil_cities')
        .select('id, name, slug, state_id, brazil_states(code, slug)')
        .ilike('name', `%${searchTerm.trim()}%`)
        .limit(limit);

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          state_id: item.state_id,
          ibge_code: null,
          latitude: null,
          longitude: null,
          population: null,
          capital: false,
          region: null,
          state_code: item.brazil_states?.code || '',
          state_slug: item.brazil_states?.slug || '',
        }));
      }
    } catch {
      // Fallback
    }

    const term = searchTerm.trim().toLowerCase();
    return DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(term))
      .slice(0, limit)
      .map((c) => {
        const state = DEMO_STATES.find((s) => s.id === c.state_id) || DEMO_STATES[0];
        return {
          ...c,
          state_code: state.code,
          state_slug: state.slug,
        };
      });
  },

  async incrementProfileView(advertiserId: string): Promise<void> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_profile_view', {
        p_advertiser_id: advertiserId,
      });
    } catch {
      // Non-blocking
    }
  },

  async incrementContactClick(advertiserId: string, contactType: string): Promise<void> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_contact_click', {
        p_advertiser_id: advertiserId,
        p_contact_type: contactType,
      });
    } catch {
      // Non-blocking
    }
  },
};
