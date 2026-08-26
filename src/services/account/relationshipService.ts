import { createClient } from '@/lib/supabase/client';
import { UserRelationship } from '@/types/app.types';

export const relationshipService = {
  /**
   * Fetches favorite, follow, and block status for a batch of advertiser IDs (Section 95 & 96).
   */
  async getUserRelationshipMap(advertiserIds: string[]): Promise<Record<string, UserRelationship>> {
    if (!advertiserIds || advertiserIds.length === 0) return {};

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_user_relationship_map', {
      p_advertiser_ids: advertiserIds,
    });

    if (error || !data) {
      return {};
    }

    const map: Record<string, UserRelationship> = {};
    for (const item of data) {
      map[item.advertiser_id] = {
        advertiser_id: item.advertiser_id,
        is_favorite: Boolean(item.is_favorite),
        is_following: Boolean(item.is_following),
        is_blocked: Boolean(item.is_blocked),
      };
    }
    return map;
  },
};
