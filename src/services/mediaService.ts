import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import { AdvertiserMedia } from '@/types/app.types';

type MediaInsert = Database['public']['Tables']['advertiser_media']['Insert'];

export const mediaService = {
  async getAdvertiserMedia(advertiserId: string): Promise<AdvertiserMedia[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_media')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching media:', error);
      return [];
    }
    return (data as AdvertiserMedia[]) || [];
  },

  async uploadMedia(
    advertiserId: string,
    file: File,
    mediaType: 'image' | 'video'
  ): Promise<{ success: boolean; data?: AdvertiserMedia; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Upload to advertiser-media bucket
    const { error: uploadError } = await supabase.storage
      .from('advertiser-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const insertPayload: MediaInsert = {
      advertiser_id: advertiserId,
      media_type: mediaType,
      storage_path: filePath,
      moderation_status: 'pending',
      visibility: 'public',
    };

    // Insert database record (will automatically have moderation_status = 'pending' via trigger)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: dbError } = await (supabase.from('advertiser_media') as any)
      .insert(insertPayload)
      .select()
      .single();

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true, data: data as AdvertiserMedia };
  },

  async deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase
      .from('advertiser_media')
      .delete()
      .eq('id', mediaId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },
};
