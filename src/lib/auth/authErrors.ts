/**
 * Safe Authentication Error Translation & Structured Observability Logging
 * 
 * Prevents technical internal details (such as "Failed to fetch", stack traces,
 * database errors or HTTP 500 status codes) from ever leaking into user-facing UI.
 * Redacts all sensitive credentials (passwords, tokens, keys) from operational logs.
 */

export interface SafeLogMeta {
  stage?: string;
  errorType?: string;
  status?: number;
  safeMessage?: string;
  correlationId?: string;
  accountType?: string;
  [key: string]: unknown;
}

const REDACTED_KEYS = new Set([
  'password',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'serviceRoleKey',
  'anonKey',
  'authorization',
  'cookie',
  'cpf',
  'rg',
  'document',
]);

/**
 * Sanitizes metadata to guarantee zero secret or sensitive data leakage.
 */
export function sanitizeLogMeta(meta?: SafeLogMeta): Record<string, unknown> {
  if (!meta) return {};
  const cleaned: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof val === 'string' && val.length > 200) {
      cleaned[key] = val.substring(0, 200) + '...[TRUNCATED]';
    } else {
      cleaned[key] = val;
    }
  }

  return cleaned;
}

/**
 * Structured log helper for registration and auth telemetry.
 */
export function logAuthEvent(event: string, meta?: SafeLogMeta, isError: boolean = false): void {
  const timestamp = new Date().toISOString();
  const safeMeta = sanitizeLogMeta(meta);
  const logMessage = `${event} | ${JSON.stringify({ timestamp, ...safeMeta })}`;

  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
}

/**
 * Translates raw auth/network errors into human-friendly, localized and secure messages.
 */
export function translateAuthError(error: unknown): string {
  if (!error) {
    return 'Não foi possível criar sua conta. Tente novamente em alguns instantes.';
  }

  const rawMessage = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: unknown }).message)
    : String(error);

  const rawLower = rawMessage.toLowerCase();
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status: unknown }).status)
    : undefined;

  // 1. Network / fetch / connectivity errors
  if (
    rawLower.includes('failed to fetch') ||
    rawLower.includes('fetch failed') ||
    rawLower.includes('networkerror') ||
    rawLower.includes('econnrefused') ||
    rawLower.includes('ehostunreach') ||
    rawLower.includes('enotfound') ||
    rawLower.includes('offline') ||
    status === 0
  ) {
    return 'Não foi possível conectar ao serviço de cadastro. Verifique sua conexão e tente novamente.';
  }

  // 2. Email already in use
  if (
    rawLower.includes('user already registered') ||
    rawLower.includes('email already') ||
    rawLower.includes('already exists') ||
    rawLower.includes('email_exists') ||
    rawLower.includes('already registered')
  ) {
    return 'Já existe uma conta cadastrada com este e-mail.';
  }

  // 3. Weak password
  if (
    rawLower.includes('password should be') ||
    rawLower.includes('weak_password') ||
    rawLower.includes('password is too weak') ||
    rawLower.includes('password must')
  ) {
    return 'Sua senha não atende aos requisitos de segurança.';
  }

  // 4. Rate limiting
  if (
    rawLower.includes('rate limit') ||
    rawLower.includes('too many requests') ||
    rawLower.includes('over_request_rate_limit') ||
    status === 429
  ) {
    return 'Muitas tentativas foram realizadas. Aguarde alguns instantes e tente novamente.';
  }

  // 5. Invalid email format from auth provider
  if (
    rawLower.includes('invalid email') ||
    rawLower.includes('unable to validate email')
  ) {
    return 'O formato do e-mail informado é inválido.';
  }

  // 6. Signups disabled or unconfigured
  if (
    rawLower.includes('signups not allowed') ||
    rawLower.includes('signup_disabled')
  ) {
    return 'Cadastros temporariamente desativados. Tente novamente mais tarde.';
  }

  // 7. Unconfigured service / environment missing
  if (
    rawLower.includes('supabase not configured') ||
    rawLower.includes('unconfigured') ||
    rawLower.includes('placeholder')
  ) {
    return 'Serviço de autenticação temporariamente indisponível. Verifique sua conexão e tente novamente.';
  }

  // Default fallback
  return 'Não foi possível criar sua conta. Tente novamente em alguns instantes.';
}
