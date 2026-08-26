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

  async uploadAvatar(
    file: File
  ): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      return { success: false, error: 'Formato inválido. Aceito: JPG, PNG ou WEBP.' };
    }

    // Validate size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Tamanho máximo permitido é de 5MB.' };
    }

    const fileExt = file.name.split('.').pop() || 'webp';
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Upload to avatars bucket (enforcing user ownership folder)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile record with avatar path
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (profile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any)
        .update({ avatar_path: publicUrl })
        .eq('id', (profile as { id: string }).id);
    }

    return { success: true, avatarUrl: publicUrl };
  },
};
