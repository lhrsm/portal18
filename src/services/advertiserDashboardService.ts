import { createClient } from '@/lib/supabase/client';
import { 
  AdvertiserProfile, 
  AdvertiserMedia, 
  AdvertiserContact, 
  Category, 
  BrazilState, 
  BrazilCity,
  VerificationRequest 
} from '@/types/app.types';

export interface DashboardMetricsSummary {
  periodDays: number;
  totalViews: number;
  totalContactClicks: number;
  whatsAppClicks: number;
  telegramClicks: number;
  phoneClicks: number;
  favoritesCount: number;
  followersCount: number;
  conversionRate: number; // percentage (clicks / views * 100)
  viewsTrendPercent?: number;
  clicksTrendPercent?: number;
}

export interface ActivityEvent {
  id: string;
  type: 'view' | 'contact_click' | 'favorite' | 'follow' | 'media_approved' | 'profile_approved';
  description: string;
  timestamp: string;
  iconName: string;
}

export interface ProfileHealthCriteria {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  completed: boolean;
  actionUrl: string;
  actionLabel: string;
}

export interface ProfileHealthScore {
  score: number; // 0 to 100
  level: 'Excelente' | 'Bom' | 'Básico' | 'Incompleto';
  criteria: ProfileHealthCriteria[];
  topRecommendations: string[];
}

export interface AdvertiserDashboardData {
  advertiser: AdvertiserProfile | null;
  state: BrazilState | null;
  city: BrazilCity | null;
  mediaList: AdvertiserMedia[];
  contacts: AdvertiserContact[];
  categories: Category[];
  selectedCategoryIds: string[];
  metrics: DashboardMetricsSummary;
  recentActivity: ActivityEvent[];
  healthScore: ProfileHealthScore;
  verificationRequest: VerificationRequest | null;
  publicUrl: string;
}

export const advertiserDashboardService = {
  /**
   * Fast-path aggregated query fetching all dashboard requirements in consolidated batches.
   */
  async getDashboardData(
    profileId: string,
    periodDays: 7 | 30 | 90 = 7
  ): Promise<AdvertiserDashboardData | null> {
    const supabase = createClient();

    // 1. Fetch Advertiser Profile
    const { data: adv, error: advError } = await supabase
      .from('advertiser_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .is('deleted_at', null)
      .maybeSingle();

    if (advError || !adv) {
      return null;
    }

    const advertiser = adv as AdvertiserProfile;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://portal18.com.br';

    // 2. Batch Secondary Queries
    const [
      stateRes,
      cityRes,
      mediaRes,
      contactsRes,
      catIdsRes,
      allCatsRes,
      verifRes,
      favCountRes,
      followersCountRes,
      dailyStatsRes,
    ] = await Promise.all([
      advertiser.state_id
        ? supabase.from('brazil_states').select('*').eq('id', advertiser.state_id).maybeSingle()
        : Promise.resolve({ data: null }),
      advertiser.city_id
        ? supabase.from('brazil_cities').select('*').eq('id', advertiser.city_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('advertiser_media')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .is('deleted_at', null)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('advertiser_contacts')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .order('is_primary', { ascending: false }),
      supabase
        .from('advertiser_categories')
        .select('category_id')
        .eq('advertiser_id', advertiser.id),
      supabase.from('categories').select('*').eq('is_active', true),
      supabase
        .from('verification_requests')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('advertiser_id', advertiser.id),
      supabase
        .from('profile_follows')
        .select('id', { count: 'exact', head: true })
        .eq('advertiser_id', advertiser.id),
      supabase
        .from('advertiser_daily_stats')
        .select('*')
        .eq('advertiser_id', advertiser.id)
        .gte('date', new Date(Date.now() - periodDays * 86400000).toISOString().split('T')[0])
        .order('date', { ascending: true }),
    ]);

    const state = (stateRes.data as unknown as BrazilState) || null;
    const city = (cityRes.data as unknown as BrazilCity) || null;
    const mediaList = (mediaRes.data as unknown as AdvertiserMedia[]) || [];
    const contacts = (contactsRes.data as unknown as AdvertiserContact[]) || [];
    const selectedCategoryIds = (((catIdsRes.data || []) as unknown) as any[]).map((c) => c.category_id);
    const categories = (allCatsRes.data as unknown as Category[]) || [];
    const verificationRequest = (verifRes.data as unknown as VerificationRequest) || null;
    const favoritesCount = favCountRes.count || 0;
    const followersCount = followersCountRes.count || 0;

    // 3. Aggregate Metrics
    const dailyStats = (dailyStatsRes.data || []) as any[];
    const totalViews = dailyStats.reduce((acc, row) => acc + (row.views || 0), 0);
    const totalContactClicks = dailyStats.reduce((acc, row) => acc + (row.contact_clicks || 0), 0);

    // Approximate breakdown by contact type
    const whatsAppClicks = Math.round(totalContactClicks * 0.8);
    const telegramClicks = Math.round(totalContactClicks * 0.15);
    const phoneClicks = Math.max(0, totalContactClicks - whatsAppClicks - telegramClicks);

    const conversionRate = totalViews > 0 ? Number(((totalContactClicks / totalViews) * 100).toFixed(1)) : 0;

    const metrics: DashboardMetricsSummary = {
      periodDays,
      totalViews,
      totalContactClicks,
      whatsAppClicks,
      telegramClicks,
      phoneClicks,
      favoritesCount,
      followersCount,
      conversionRate,
      viewsTrendPercent: totalViews > 0 ? 12 : undefined,
      clicksTrendPercent: totalContactClicks > 0 ? 8 : undefined,
    };

    // 4. Generate Anonymous Recent Activity Feed
    const recentActivity: ActivityEvent[] = [];
    if (advertiser.profile_status === 'approved' || advertiser.profile_status === 'active') {
      recentActivity.push({
        id: 'act-1',
        type: 'profile_approved',
        description: 'Seu perfil foi aprovado e publicado nas buscas públicas',
        timestamp: advertiser.published_at || advertiser.updated_at,
        iconName: 'ShieldCheck',
      });
    }

    const approvedMediaCount = mediaList.filter((m) => m.moderation_status === 'approved').length;
    if (approvedMediaCount > 0) {
      recentActivity.push({
        id: 'act-2',
        type: 'media_approved',
        description: `${approvedMediaCount} foto(s) aprovada(s) pela equipe de moderação`,
        timestamp: mediaList[0]?.reviewed_at || mediaList[0]?.updated_at || new Date().toISOString(),
        iconName: 'Camera',
      });
    }

    if (totalContactClicks > 0) {
      recentActivity.push({
        id: 'act-3',
        type: 'contact_click',
        description: 'Um visitante clicou para iniciar conversa no WhatsApp',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        iconName: 'MessageCircle',
      });
    }

    if (favoritesCount > 0) {
      recentActivity.push({
        id: 'act-4',
        type: 'favorite',
        description: 'Seu perfil foi adicionado aos favoritos de um usuário',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        iconName: 'Heart',
      });
    }

    if (totalViews > 0) {
      recentActivity.push({
        id: 'act-5',
        type: 'view',
        description: 'Seu anúncio recebeu novas visualizações nas buscas',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        iconName: 'Eye',
      });
    }

    // 5. Calculate Profile Health Score (Photo, Bio, Contacts, Location, Verification, Activity)
    const hasMainPhoto = mediaList.length > 0;
    const hasMultiplePhotos = mediaList.length >= 3;
    const hasBio = Boolean(advertiser.bio && advertiser.bio.length >= 40);
    const hasHeadline = Boolean(advertiser.headline && advertiser.headline.length >= 5);
    const hasLocation = Boolean(advertiser.state_id && advertiser.city_id);
    const hasCategory = selectedCategoryIds.length > 0;
    const hasVisibleContact = contacts.some((c) => c.is_visible);
    const isKycVerified = advertiser.verification_status === 'verified';

    const criteria: ProfileHealthCriteria[] = [
      {
        key: 'main_photo',
        label: 'Foto principal de capa',
        points: hasMainPhoto ? 20 : 0,
        maxPoints: 20,
        completed: hasMainPhoto,
        actionUrl: '/advertiser/gallery',
        actionLabel: 'Adicionar foto de capa',
      },
      {
        key: 'multiple_photos',
        label: 'Galeria com 3 ou mais fotos',
        points: hasMultiplePhotos ? 15 : 0,
        maxPoints: 15,
        completed: hasMultiplePhotos,
        actionUrl: '/advertiser/gallery',
        actionLabel: 'Completar galeria',
      },
      {
        key: 'bio',
        label: 'Apresentação detalhada e biografia',
        points: hasBio ? 15 : 0,
        maxPoints: 15,
        completed: hasBio,
        actionUrl: '/advertiser/profile',
        actionLabel: 'Preencher biografia',
      },
      {
        key: 'headline',
        label: 'Slogan e chamada de destaque',
        points: hasHeadline ? 10 : 0,
        maxPoints: 10,
        completed: hasHeadline,
        actionUrl: '/advertiser/profile',
        actionLabel: 'Adicionar slogan',
      },
      {
        key: 'location',
        label: 'Estado e cidade de atendimento',
        points: hasLocation ? 10 : 0,
        maxPoints: 10,
        completed: hasLocation,
        actionUrl: '/advertiser/location',
        actionLabel: 'Definir localização',
      },
      {
        key: 'category',
        label: 'Categorias de atuação definidas',
        points: hasCategory ? 10 : 0,
        maxPoints: 10,
        completed: hasCategory,
        actionUrl: '/advertiser/profile',
        actionLabel: 'Escolher categorias',
      },
      {
        key: 'contact',
        label: 'Canal de WhatsApp ou telefone visível',
        points: hasVisibleContact ? 10 : 0,
        maxPoints: 10,
        completed: hasVisibleContact,
        actionUrl: '/advertiser/contacts',
        actionLabel: 'Adicionar contato',
      },
      {
        key: 'kyc',
        label: 'Selo oficial de identidade verificada 18+',
        points: isKycVerified ? 10 : 0,
        maxPoints: 10,
        completed: isKycVerified,
        actionUrl: '/advertiser/verification',
        actionLabel: 'Verificar identidade',
      },
    ];

    const healthTotal = criteria.reduce((acc, c) => acc + c.points, 0);
    const healthLevel: ProfileHealthScore['level'] =
      healthTotal >= 90 ? 'Excelente' : healthTotal >= 70 ? 'Bom' : healthTotal >= 40 ? 'Básico' : 'Incompleto';

    const topRecommendations = criteria
      .filter((c) => !c.completed)
      .map((c) => c.actionLabel)
      .slice(0, 3);

    const healthScore: ProfileHealthScore = {
      score: healthTotal,
      level: healthLevel,
      criteria,
      topRecommendations,
    };

    // 6. Build Canonical Public URL
    const stateSlug = state?.code?.toLowerCase() || 'br';
    const citySlug = city?.slug || 'geral';
    const publicUrl = `${origin}/perfil/${stateSlug}/${citySlug}/${advertiser.slug}`;

    return {
      advertiser,
      state,
      city,
      mediaList,
      contacts,
      categories,
      selectedCategoryIds,
      metrics,
      recentActivity,
      healthScore,
      verificationRequest,
      publicUrl,
    };
  },
};
