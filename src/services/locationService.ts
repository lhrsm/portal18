import { createClient } from '@/lib/supabase/client';
import { BrazilState, BrazilCity, Category } from '@/types/app.types';
import { DEMO_STATES, DEMO_CITIES, DEMO_CATEGORIES } from '@/data/demoProfiles';

export const locationService = {
  async getStates(): Promise<BrazilState[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brazil_states')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_STATES;
    }
    return data;
  },

  async getCitiesByState(stateId: string): Promise<BrazilCity[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brazil_cities')
      .select('*')
      .eq('state_id', stateId)
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_CITIES.filter((c) => c.state_id === stateId);
    }
    return data;
  },

  async getCategories(): Promise<Category[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_CATEGORIES;
    }
    return data;
  },
};
