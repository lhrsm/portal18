import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { Profile, UserRole } from '@/types/app.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profilesService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching current profile:', error);
      return null;
    }
    return data as Profile;
  },

  async getUserRoles(profileId: string): Promise<UserRole[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
    return (data as UserRole[]) || [];
  },

  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<{ success: boolean; data?: Profile; error?: string }> {
    const supabase = createClient();
    const safeUpdates: ProfileUpdate = {
      display_name: updates.display_name,
      username: updates.username,
      avatar_path: updates.avatar_path,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
      .update(safeUpdates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as Profile };
  },
};
