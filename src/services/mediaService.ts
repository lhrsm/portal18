import { createClient } from '@/lib/supabase/client';
import { AdvertiserMedia, MediaVariants, MediaProcessingJob } from '@/types/app.types';

export const mediaService = {
  /**
   * Fetches only approved, publicly available media for the public profile and search cards.
   */
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

  /**
   * Fetches all gallery media for the authenticated advertiser (including pending/processing/rejected).
   */
  async getAdvertiserMedia(advertiserId: string): Promise<AdvertiserMedia[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('advertiser_media')
      .select('*')
      .eq('advertiser_id', advertiserId)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching advertiser media:', error);
      return [];
    }
    return (data as AdvertiserMedia[]) || [];
  },

  /**
   * Calculates SHA-256 cryptographic hash of a file in the browser (Section 38 & 110).
   */
  async calculateSHA256(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return `hash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  },

  /**
   * Client-side EXIF removal & canvas re-encoding (Section 13 & 14).
   */
  async stripExifAndResize(file: File, maxWidth = 1600): Promise<{ blob: Blob; width: number; height: number }> {
    return new Promise((resolve) => {
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
          resolve({ blob: file, width: img.width, height: img.height });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve({ blob: blob || file, width, height });
          },
          'image/webp',
          0.88
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ blob: file, width: 1200, height: 1600 });
      };

      img.src = url;
    });
  },

  /**
   * Full asynchronous media upload pipeline (Section 3, 8, 19, 73, 114).
   */
  async uploadMedia(
    advertiserId: string,
    file: File,
    mediaType: 'image' | 'video' = 'image',
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; data?: AdvertiserMedia; error?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Usuário não autenticado.' };

    // 1. Security Check: Reject forbidden extensions & polyglots (Sections 104, 106, 107, 108, 109)
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.svg') || lowerName.endsWith('.html') || lowerName.endsWith('.js') || lowerName.endsWith('.exe') || lowerName.endsWith('.zip')) {
      return { success: false, error: 'Formato de arquivo não permitido por segurança.' };
    }

    if (mediaType === 'image') {
      const validImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      if (!validImageMimes.includes(file.type)) {
        return { success: false, error: 'Formato de imagem inválido. Aceito: JPG, PNG, WEBP ou AVIF.' };
      }
      if (file.size > 15 * 1024 * 1024) {
        return { success: false, error: 'Imagem excede o limite máximo de 15MB.' };
      }
    } else {
      const validVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validVideoMimes.includes(file.type)) {
        return { success: false, error: 'Formato de vídeo inválido. Aceito: MP4, WebM ou QuickTime.' };
      }
      if (file.size > 300 * 1024 * 1024) {
        return { success: false, error: 'Vídeo excede o limite máximo de 300MB.' };
      }
    }

    onProgress?.(15);

    // 2. Compute Content Hash (Section 38)
    const contentHash = await this.calculateSHA256(file);
    onProgress?.(30);

    // 3. Reserve Upload Quota via RPC (Section 73 & 74)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: resData, error: resError } = await (supabase.rpc as any)('reserve_media_upload', {
      p_media_type: mediaType,
      p_file_size: file.size,
    });

    if (resError) {
      return { success: false, error: resError.message };
    }

    const reservationId = resData.reservation_id;
    const targetStoragePath = `${advertiserId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${mediaType === 'image' ? 'webp' : 'mp4'}`;

    onProgress?.(50);

    // 4. Process & Strip EXIF if image
    let uploadPayload: Blob = file;
    let width: number | null = null;
    let height: number | null = null;

    if (mediaType === 'image') {
      try {
        const processed = await this.stripExifAndResize(file);
        uploadPayload = processed.blob;
        width = processed.width;
        height = processed.height;
      } catch {
        // Fallback to original blob
      }
    }

    onProgress?.(70);

    // 5. Upload to Private Originals Bucket (Section 8 & 9)
    const { error: uploadError } = await supabase.storage
      .from('advertiser-private-media')
      .upload(targetStoragePath, uploadPayload, {
        cacheControl: '3600',
        contentType: mediaType === 'image' ? 'image/webp' : file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    onProgress?.(90);

    // 6. Finalize Media Upload via RPC (Section 114)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: finData, error: finError } = await (supabase.rpc as any)('finalize_media_upload', {
      p_reservation_id: reservationId,
      p_storage_path: targetStoragePath,
      p_mime_type: mediaType === 'image' ? 'image/webp' : file.type,
      p_file_size: file.size,
      p_content_hash: contentHash,
      p_width: width,
      p_height: height,
      p_duration: mediaType === 'video' ? 60 : null,
    });

    if (finError) {
      return { success: false, error: finError.message };
    }

    onProgress?.(100);

    // Fetch created media record
    const { data: mediaRecord } = await (supabase
      .from('advertiser_media')
      .select('*')
      .eq('id', finData.media_id)
      .maybeSingle() as any);

    return { success: true, data: (mediaRecord as AdvertiserMedia) || undefined };
  },

  /**
   * Resolves responsive image URLs and public variants (Section 15, 16, 58).
   */
  getMediaUrls(media: AdvertiserMedia): MediaVariants {
    const supabase = createClient();
    const isPublicBucket = media.moderation_status === 'approved' && media.visibility === 'public';
    const bucket = isPublicBucket ? 'advertiser-media-public' : 'advertiser-private-media';

    const path = media.storage_path || '';
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      thumbnailUrl: media.thumbnail_path ? supabase.storage.from(bucket).getPublicUrl(media.thumbnail_path).data.publicUrl : publicUrl,
      cardUrl: media.card_path ? supabase.storage.from(bucket).getPublicUrl(media.card_path).data.publicUrl : publicUrl,
      profileUrl: media.profile_path ? supabase.storage.from(bucket).getPublicUrl(media.profile_path).data.publicUrl : publicUrl,
      fullUrl: media.full_path ? supabase.storage.from(bucket).getPublicUrl(media.full_path).data.publicUrl : publicUrl,
    };
  },

  /**
   * Reorders advertiser media items.
   */
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

  /**
   * Sets a specific media as the primary cover photo.
   */
  async setMainPhoto(advertiserId: string, mediaId: string): Promise<{ success: boolean; error?: string }> {
    const mediaList = await this.getAdvertiserMedia(advertiserId);
    const target = mediaList.find((m) => m.id === mediaId);
    if (!target) return { success: false, error: 'Mídia não encontrada.' };

    const reordered = [mediaId, ...mediaList.filter((m) => m.id !== mediaId).map((m) => m.id)];
    return this.reorderMedia(advertiserId, reordered);
  },

  /**
   * Soft deletes a media file.
   */
  async deleteMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from('advertiser_media') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', mediaId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  },

  /**
   * Admin Media Processing Queue (Section 95).
   */
  async getAdminProcessingJobs(limit = 20) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('media_processing_jobs')
      .select('*, advertiser_media(id, advertiser_id, media_type, storage_path, moderation_status)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching processing jobs:', error);
      return [];
    }
    return (data || []) as (MediaProcessingJob & { advertiser_media?: AdvertiserMedia })[];
  },

  /**
   * Admin Reprocess Action (Section 118).
   */
  async adminReprocessMedia(mediaId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('reprocess_failed_media', {
      p_media_id: mediaId,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: data?.success ?? true };
  },
};
