import { z } from 'zod';

export const AdvertiserProfileUpdateSchema = z.object({
  stageName: z.string().min(2, 'O nome artístico deve ter no mínimo 2 caracteres.').max(60, 'Máximo de 60 caracteres.'),
  headline: z.string().max(120, 'O slogan não pode exceder 120 caracteres.').optional().nullable(),
  bio: z.string().max(2000, 'A bio não pode exceder 2000 caracteres.').optional().nullable(),
  gender: z.string().optional().nullable(),
  presentation: z.string().max(500).optional().nullable(),
  stateId: z.string().uuid('Estado inválido.').optional().nullable(),
  cityId: z.string().uuid('Cidade inválida.').optional().nullable(),
  neighborhood: z.string().max(80).optional().nullable(),
});

export const AdvertiserContactSchema = z.object({
  contactType: z.enum(['whatsapp', 'telegram', 'phone', 'website']),
  contactValue: z.string().min(3, 'Valor de contato inválido.').max(150),
  isPrimary: z.boolean().default(false),
  isVisible: z.boolean().default(true),
});

export const AdvertiserVisibilitySchema = z.object({
  visibility: z.enum(['public', 'private', 'hidden', 'unlisted']),
});
