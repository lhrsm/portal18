import { createClient } from '@/lib/supabase/client';
import { AdvertiserEntitlements, SubscriptionPlan } from '@/types/app.types';

export interface UsageMeters {
  photos: {
    current: number;
    limit: number;
    canAddMore: boolean;
  };
  videos: {
    current: number;
    limit: number;
    canAddMore: boolean;
  };
  categories: {
    current: number;
    limit: number;
    canAddMore: boolean;
  };
  cities: {
    current: number;
    limit: number;
    canAddMore: boolean;
  };
  boosts: {
    monthlyAllowance: number;
    usedThisMonth: number;
    remaining: number;
  };
  analyticsLevel: 'basic' | 'advanced' | 'premium';
  isGrandfathered?: boolean;
  isOverLimit?: boolean;
  overLimitNotice?: string | null;
}

export const entitlementService = {
  /**
   * Evaluates server-authoritative entitlements for a given advertiser.
   */
  async getAdvertiserEntitlements(advertiserId: string): Promise<AdvertiserEntitlements> {
    const supabase = createClient();
    const defaultEntitlements: AdvertiserEntitlements = {
      has_active_subscription: false,
      plan_name: 'Plano Básico / Inicial',
      plan_slug: 'free',
      media_limit: 10,
      video_limit: 0,
      boost_allowance: 0,
      analytics_level: 'basic',
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_advertiser_entitlements', {
        p_advertiser_id: advertiserId,
      });

      if (error || !data) {
        return defaultEntitlements;
      }

      return data as AdvertiserEntitlements;
    } catch {
      return defaultEntitlements;
    }
  },

  /**
   * Retrieves accurate usage meters (photos, videos, categories, active boosts) vs. plan limits.
   */
  async getUsageMeters(advertiserId: string): Promise<UsageMeters> {
    const supabase = createClient();
    const entitlements = await this.getAdvertiserEntitlements(advertiserId);

    // Parallel count queries for actual advertiser assets
    const [mediaRes, catRes, campaignsRes] = await Promise.all([
      supabase
        .from('advertiser_media')
        .select('id, media_type, moderation_status')
        .eq('advertiser_id', advertiserId)
        .is('deleted_at', null),
      supabase
        .from('advertiser_categories')
        .select('category_id', { count: 'exact' })
        .eq('advertiser_id', advertiserId),
      supabase
        .from('advertiser_campaigns')
        .select('id, starts_at')
        .eq('advertiser_id', advertiserId)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    const media = (mediaRes.data || []) as any[];
    const photoCount = media.filter((m) => m.media_type !== 'video').length;
    const videoCount = media.filter((m) => m.media_type === 'video').length;
    const categoryCount = catRes.count || 0;
    const boostUsedCount = (campaignsRes.data || []).length;

    const photoLimit = entitlements.media_limit || 10;
    const videoLimit = entitlements.video_limit || 0;
    const categoryLimit = 3; // Standard 3 categories allowance
    const cityLimit = 1;

    const isOverPhotoLimit = photoCount > photoLimit;
    const isOverVideoLimit = videoCount > videoLimit;
    const isOverLimit = isOverPhotoLimit || isOverVideoLimit;

    let overLimitNotice: string | null = null;
    if (isOverLimit) {
      overLimitNotice =
        'Seu anúncio possui mais mídias do que o limite do plano atual. Suas mídias já publicadas foram preservadas com segurança, mas a inclusão de novas fotos está temporariamente bloqueada até a realização de upgrade ou ajuste.';
    }

    return {
      photos: {
        current: photoCount,
        limit: photoLimit,
        canAddMore: photoCount < photoLimit,
      },
      videos: {
        current: videoCount,
        limit: videoLimit,
        canAddMore: videoCount < videoLimit,
      },
      categories: {
        current: categoryCount,
        limit: categoryLimit,
        canAddMore: categoryCount < categoryLimit,
      },
      cities: {
        current: 1,
        limit: cityLimit,
        canAddMore: false,
      },
      boosts: {
        monthlyAllowance: entitlements.boost_allowance || 0,
        usedThisMonth: boostUsedCount,
        remaining: Math.max(0, (entitlements.boost_allowance || 0) - boostUsedCount),
      },
      analyticsLevel: entitlements.analytics_level as any || 'basic',
      isOverLimit,
      overLimitNotice,
    };
  },

  /**
   * Helper permission checks.
   */
  canUploadPhoto(currentCount: number, limit: number): boolean {
    return currentCount < limit;
  },

  canUploadVideo(currentCount: number, limit: number): boolean {
    return limit > 0 && currentCount < limit;
  },

  canAddCategory(currentCount: number, limit: number): boolean {
    return currentCount < limit;
  },

  canUseAdvancedAnalytics(level: string): boolean {
    return level === 'advanced' || level === 'premium';
  },

  canUseCommercialBadge(planSlug: string): boolean {
    return planSlug === 'premium' || planSlug === 'vip';
  },

  /**
   * Evaluates downgrade impact without deleting any existing data.
   */
  evaluateDowngrade(usage: UsageMeters, targetPlan: SubscriptionPlan): {
    canDowngrade: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    if (usage.photos.current > targetPlan.media_limit) {
      warnings.push(
        `Você possui ${usage.photos.current} fotos ativas. O plano ${targetPlan.name} suporta até ${targetPlan.media_limit} fotos. Nenhuma foto será apagada, mas você não poderá adicionar novas fotos.`
      );
    }

    if (usage.videos.current > targetPlan.video_limit) {
      warnings.push(
        `O plano ${targetPlan.name} não inclui vídeos na galeria. Seus vídeos atuais permanecerão seguros mas não serão exibidos em destaque.`
      );
    }

    return {
      canDowngrade: true,
      warnings,
    };
  },
};
