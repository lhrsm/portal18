import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Por favor, informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});

export const RegisterSchema = z
  .object({
    email: z.string().email('Por favor, informe um e-mail válido.'),
    displayName: z.string().min(2, 'O nome deve conter pelo menos 2 caracteres.').max(50, 'Nome muito longo.'),
    password: z
      .string()
      .min(8, 'A senha deve conter no mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
    confirmPassword: z.string(),
    isAdult: z.boolean().refine((val) => val === true, {
      message: 'Você deve confirmar que tem 18 anos ou mais para se cadastrar.',
    }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos de serviço e a política de privacidade.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas informadas não conferem.',
    path: ['confirmPassword'],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Por favor, informe um e-mail válido.'),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve conter no mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas informadas não conferem.',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
