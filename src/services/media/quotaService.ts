import { createClient } from '@/lib/supabase/client';
import { MediaQuota } from '@/types/app.types';

export const mediaQuotaService = {
  /**
   * Calculates current media usage and available quota limits for an advertiser.
   */
  async getAdvertiserMediaQuota(advertiserId: string): Promise<MediaQuota> {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [entRes, mediaRes] = await Promise.all([
      (supabase.rpc as any)('get_advertiser_entitlements', { p_advertiser_id: advertiserId }),
      supabase
        .from('advertiser_media')
        .select('media_type')
        .eq('advertiser_id', advertiserId)
        .is('deleted_at', null)
        .neq('moderation_status', 'blocked'),
    ]);

    const entitlements = entRes.data || {
      media_limit: 10,
      video_limit: 0,
    };

    const mediaList = (mediaRes.data || []) as any[];
    const currentImages = mediaList.filter((m: any) => m.media_type === 'image').length;
    const currentVideos = mediaList.filter((m: any) => m.media_type === 'video').length;

    const maxImages = entitlements.media_limit || 10;
    const maxVideos = entitlements.video_limit || 0;

    return {
      currentImages,
      maxImages,
      currentVideos,
      maxVideos,
      canUploadVideo: maxVideos > 0,
    };
  },
};
