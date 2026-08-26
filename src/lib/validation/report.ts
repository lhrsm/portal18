import { z } from 'zod';

export const ReportCreateSchema = z.object({
  targetType: z.enum(['advertiser', 'media', 'review', 'user']),
  targetId: z.string().uuid('ID de destino inválido.'),
  reason: z.string().min(5, 'O motivo deve conter no mínimo 5 caracteres.').max(100, 'Motivo muito longo.'),
  description: z.string().max(1000, 'Descrição não pode exceder 1000 caracteres.').optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export type ReportCreateInput = z.infer<typeof ReportCreateSchema>;
