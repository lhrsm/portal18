import { createClient } from '@/lib/supabase/client';
import { BrazilState, BrazilCity, Category } from '@/types/app.types';
import { DEMO_STATES, DEMO_CITIES, DEMO_CATEGORIES } from '@/data/demoProfiles';

let cachedStates: BrazilState[] | null = null;
const cachedCitiesByState = new Map<string, BrazilCity[]>();
let cachedCategories: Category[] | null = null;

export const locationService = {
  async getStates(): Promise<BrazilState[]> {
    if (cachedStates && cachedStates.length > 0) {
      return cachedStates;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brazil_states')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        cachedStates = data;
        return data;
      }
    } catch {
      // Fallback
    }

    cachedStates = DEMO_STATES;
    return DEMO_STATES;
  },

  async getCitiesByState(stateId: string): Promise<BrazilCity[]> {
    const cached = cachedCitiesByState.get(stateId);
    if (cached && cached.length > 0) {
      return cached;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brazil_cities')
        .select('*')
        .eq('state_id', stateId)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        cachedCitiesByState.set(stateId, data);
        return data;
      }
    } catch {
      // Fallback
    }

    const demoFiltered = DEMO_CITIES.filter((c) => c.state_id === stateId);
    cachedCitiesByState.set(stateId, demoFiltered);
    return demoFiltered;
  },

  async getCategories(): Promise<Category[]> {
    if (cachedCategories && cachedCategories.length > 0) {
      return cachedCategories;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        cachedCategories = data;
        return data;
      }
    } catch {
      // Fallback
    }

    cachedCategories = DEMO_CATEGORIES;
    return DEMO_CATEGORIES;
  },
};
