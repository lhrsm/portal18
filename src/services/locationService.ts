import { createClient } from '@/lib/supabase/client';
import { BrazilState, BrazilCity, Category } from '@/types/app.types';

export const locationService = {
  async getStates(): Promise<BrazilState[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brazil_states')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching states:', error);
      return [];
    }
    return data || [];
  },

  async getCitiesByState(stateId: string): Promise<BrazilCity[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brazil_cities')
      .select('*')
      .eq('state_id', stateId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
    return data || [];
  },

  async getCategories(): Promise<Category[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data || [];
  },
};
