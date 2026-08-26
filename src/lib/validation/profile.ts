import { z } from 'zod';

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.').max(60, 'Nome muito longo.').optional(),
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres.')
    .max(30, 'Username deve ter no máximo 30 caracteres.')
    .regex(/^[a-z0-9_.-]+$/, 'Username deve conter apenas letras minúsculas, números, ponto, hífen ou sublinhado.')
    .optional(),
  avatarPath: z.string().optional(),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
