import { z } from 'zod';

export const AdvertiserProfileSchema = z.object({
  stageName: z.string().min(2, 'Nome artístico deve ter no mínimo 2 caracteres.').max(60, 'Nome artístico muito longo.'),
  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres.')
    .max(50, 'Slug deve ter no máximo 50 caracteres.')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens.'),
  headline: z.string().max(120, 'Chamada deve ter no máximo 120 caracteres.').optional(),
  bio: z.string().max(2000, 'Biografia deve ter no máximo 2000 caracteres.').optional(),
  birthDate: z
    .string()
    .refine((dateStr) => {
      const birth = new Date(dateStr);
      if (isNaN(birth.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 18;
    }, {
      message: 'O anunciante deve ter obrigatoriamente 18 anos ou mais.',
    }),
  gender: z.string().optional(),
  presentation: z.string().optional(),
  stateId: z.string().uuid('Estado inválido.').optional(),
  cityId: z.string().uuid('Cidade inválida.').optional(),
  neighborhood: z.string().max(100, 'Bairro muito longo.').optional(),
});

export type AdvertiserProfileInput = z.infer<typeof AdvertiserProfileSchema>;
