import { AdvertiserProfile, AdvertiserMedia, AdvertiserContact, CompletenessResult, CompletenessItem } from '@/types/app.types';

export const completenessService = {
  calculateProfileCompleteness(
    profile: AdvertiserProfile | null,
    mediaList: AdvertiserMedia[] = [],
    contacts: AdvertiserContact[] = [],
    categoriesCount: number = 0
  ): CompletenessResult {
    if (!profile) {
      return {
        score: 0,
        isReadyForSubmission: false,
        items: [],
        missingSuggestions: ['Crie seu perfil de anunciante.'],
      };
    }

    const hasStageName = Boolean(profile.stage_name && profile.stage_name !== 'Novo Anunciante' && profile.stage_name.trim().length >= 2);
    const hasHeadline = Boolean(profile.headline && profile.headline.trim().length >= 5);
    const hasBio = Boolean(profile.bio && profile.bio.trim().length >= 20);
    const hasBirthDate = Boolean(profile.birth_date);
    const hasLocation = Boolean(profile.state_id && profile.city_id);
    const hasCategories = categoriesCount > 0;
    const hasMainPhoto = mediaList.length > 0;
    const hasAdditionalMedia = mediaList.length >= 2;
    const hasVisibleContact = contacts.some((c) => c.is_visible);
    const hasTermsAccepted = true; // Guaranteed in become_advertiser

    const items: CompletenessItem[] = [
      {
        key: 'stage_name',
        label: 'Nome artístico profissional',
        points: 10,
        completed: hasStageName,
        actionUrl: '/advertiser/profile',
      },
      {
        key: 'headline',
        label: 'Slogan / Chamada de destaque',
        points: 5,
        completed: hasHeadline,
        actionUrl: '/advertiser/profile',
      },
      {
        key: 'bio',
        label: 'Biografia e apresentação detalhada (mín. 20 caracteres)',
        points: 15,
        completed: hasBio,
        actionUrl: '/advertiser/profile',
      },
      {
        key: 'birth_date',
        label: 'Comprovação de maioridade 18+',
        points: 10,
        completed: hasBirthDate,
        actionUrl: '/advertiser/profile',
      },
      {
        key: 'location',
        label: 'Estado e cidade de atendimento',
        points: 10,
        completed: hasLocation,
        actionUrl: '/advertiser/location',
      },
      {
        key: 'category',
        label: 'Ao menos uma categoria selecionada',
        points: 10,
        completed: hasCategories,
        actionUrl: '/advertiser/profile',
      },
      {
        key: 'main_photo',
        label: 'Foto principal da galeria',
        points: 15,
        completed: hasMainPhoto,
        actionUrl: '/advertiser/gallery',
      },
      {
        key: 'additional_media',
        label: 'Fotos adicionais na galeria',
        points: 10,
        completed: hasAdditionalMedia,
        actionUrl: '/advertiser/gallery',
      },
      {
        key: 'public_contact',
        label: 'Ao menos um canal de contato visível',
        points: 10,
        completed: hasVisibleContact,
        actionUrl: '/advertiser/contacts',
      },
      {
        key: 'terms',
        label: 'Termos e diretrizes aceitos',
        points: 5,
        completed: hasTermsAccepted,
        actionUrl: '/advertiser/settings',
      },
    ];

    const score = items.reduce((acc, item) => (item.completed ? acc + item.points : acc), 0);

    const missingSuggestions = items
      .filter((item) => !item.completed)
      .map((item) => item.label);

    const isReadyForSubmission =
      hasStageName &&
      hasBio &&
      hasBirthDate &&
      hasLocation &&
      hasCategories &&
      hasMainPhoto &&
      hasVisibleContact;

    return {
      score,
      isReadyForSubmission,
      items,
      missingSuggestions,
    };
  },
};
