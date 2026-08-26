import { createClient } from '@/lib/supabase/client';
import { AdvertiserMedia } from '@/types/app.types';

export const mediaService = {
  async getApprovedPublicMedia(advertiserId: string): Promise<AdvertiserMedia[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_media')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .eq('moderation_status', 'approved')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching approved media:', error);
      return [];
    }
    return (data as AdvertiserMedia[]) || [];
  },

  async getAdvertiserMedia(advertiserId: string): Promise<AdvertiserMedia[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_media')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching advertiser media:', error);
      return [];
    }
    return (data as AdvertiserMedia[]) || [];
  },

  // Helper to remove EXIF metadata and re-encode image via Canvas (Requirement 33)
  async stripExifAndResize(file: File, maxWidth = 1600): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file); // fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          0.88
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file); // fallback
      };

      img.src = url;
    });
  },

  async uploadMedia(
    advertiserId: string,
    file: File,
    mediaType: 'image' | 'video' = 'image'
  ): Promise<{ success: boolean; data?: AdvertiserMedia; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    // Validate MIME (Requirement 28)
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      return { success: false, error: 'Formato inválido. Aceito: JPG, PNG ou WEBP.' };
    }

    // Validate size limit 10MB (Requirement 29)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'Arquivo excede o tamanho máximo de 10MB.' };
    }

    // Process & Strip EXIF metadata
    let uploadBlob: Blob = file;
    try {
      uploadBlob = await this.stripExifAndResize(file);
    } catch {
      // Continue with original if canvas fails
    }

    const filePath = `${advertiserId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;

    // Upload to advertiser-media bucket
    const { error: uploadError } = await supabase.storage
      .from('advertiser-media')
      .upload(filePath, uploadBlob, {
        cacheControl: '3600',
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('advertiser-media')
      .getPublicUrl(filePath);

    // Fetch existing count to append at last position
    const { count } = await supabase
      .from('advertiser_media')
      .select('id', { count: 'exact', head: true })
      .eq('advertiser_id', advertiserId)
      .is('deleted_at', null);

    const position = count || 0;

    // Insert record with default 'pending' moderation status (Requirement 27)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('advertiser_media') as any)
      .insert({
        advertiser_id: advertiserId,
        media_type: mediaType,
        storage_path: publicUrl,
        position,
        visibility: 'public',
        moderation_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as AdvertiserMedia };
  },

  async reorderMedia(advertiserId: string, mediaIds: string[]): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('reorder_advertiser_media', {
      p_advertiser_id: advertiserId,
      p_media_ids: mediaIds,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: Boolean(data) };
  },

  async setMainPhoto(advertiserId: string, mediaId: string): Promise<{ success: boolean; error?: string }> {
    // Reorder so that selected mediaId is index 0
    const mediaList = await this.getAdvertiserMedia(advertiserId);
    const target = mediaList.find((m) => m.id === mediaId);
    if (!target) return { success: false, error: 'Mídia não encontrada.' };

    const reordered = [mediaId, ...mediaList.filter((m) => m.id !== mediaId).map((m) => m.id)];
    return this.reorderMedia(advertiserId, reordered);
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
