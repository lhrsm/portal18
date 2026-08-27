import { z } from 'zod';

/**
 * Public Environment Variables Schema
 * Safe for Client & Server
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://placeholder-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
});

/**
 * Server-Only Environment Variables Schema
 * Validated strictly on server-side runtime
 */
export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  KYC_PROVIDER: z.string().default('unconfigured'),
  PAYMENT_PROVIDER: z.string().default('unconfigured'),
  EMAIL_PROVIDER: z.string().default('fallback'),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates the runtime environment variables without exposing sensitive secret values in error messages.
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorPaths = result.error.errors.map((e) => `Missing or invalid config at: ${e.path.join('.')}`);
    return { valid: false, errors: errorPaths };
  }
  return { valid: true, errors: [] };
}

export const env = {
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
  get isKycConfigured(): boolean {
    return !!process.env.KYC_PROVIDER && process.env.KYC_PROVIDER !== 'unconfigured';
  },
  get isPaymentConfigured(): boolean {
    return !!process.env.PAYMENT_PROVIDER && process.env.PAYMENT_PROVIDER !== 'unconfigured';
  },
};
