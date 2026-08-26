import { createClient } from '@/lib/supabase/client';
import { PublicAdvertiser, ExploreFilters, BrazilCity, Category } from '@/types/app.types';

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
      // Find category id by slug first
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
      // 'recommended' default: verified first, then updated
      query = query
        .order('verification_status', { ascending: false })
        .order('updated_at', { ascending: false });
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching public advertisers:', error);
      return { data: [], totalCount: 0, hasMore: false };
    }

    const profiles = (data as PublicAdvertiser[]) || [];
    const totalCount = count || 0;

    return {
      data: profiles,
      totalCount,
      hasMore: to < totalCount - 1,
    };
  },

  async getPublicProfileBySlug(
    stateSlug: string,
    citySlug: string,
    slug: string
  ): Promise<PublicAdvertiser | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('public_advertiser_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('state_slug', stateSlug.toLowerCase())
      .eq('city_slug', citySlug.toLowerCase())
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as PublicAdvertiser;
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
    const supabase = createClient();
    const { data, error } = await supabase
      .from('public_advertiser_profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .select('city_name, city_slug, state_code, state_slug') as any;

    if (error || !data) return [];

    // Group and count
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
  },

  async getCategoriesWithCount(): Promise<(Category & { profileCount: number })[]> {
    const supabase = createClient();
    const [catsRes, profilesRes] = await Promise.all([
      supabase.from('categories').select('*').eq('status', 'active').order('sort_order', { ascending: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('public_advertiser_profiles').select('category_ids') as any,
    ]);

    if (catsRes.error || !catsRes.data) return [];

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
  },

  async searchCitiesAutocomplete(
    searchTerm: string,
    limit = 8
  ): Promise<(BrazilCity & { state_code: string; state_slug: string })[]> {
    if (!searchTerm || searchTerm.trim().length < 2) return [];

    const supabase = createClient();
    const { data, error } = await supabase
      .from('brazil_cities')
      .select('id, name, slug, state_id, brazil_states(code, slug)')
      .ilike('name', `%${searchTerm.trim()}%`)
      .limit(limit);

    if (error || !data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      state_id: item.state_id,
      ibge_code: null,
      state_code: item.brazil_states?.code || '',
      state_slug: item.brazil_states?.slug || '',
    }));
  },

  // Non-blocking view increment (Section 57 & 58)
  async incrementProfileView(advertiserId: string): Promise<void> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_profile_view', {
        p_advertiser_id: advertiserId,
      });
    } catch {
      // Non-blocking: fail gracefully
    }
  },

  // Non-blocking contact click increment (Section 50 & 57)
  async incrementContactClick(advertiserId: string, contactType: string): Promise<void> {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_contact_click', {
        p_advertiser_id: advertiserId,
        p_contact_type: contactType,
      });
    } catch {
      // Non-blocking: fail gracefully
    }
  },
};
