export interface RateLimitRule {
  keyPrefix: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  retryAfter: number;
}

// In-memory token store for client-side / edge simulation
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export const rateLimitService = {
  // Standard application rate limit rules (Section 31-38)
  RULES: {
    LOGIN: { keyPrefix: 'rl_login', maxRequests: 5, windowSeconds: 60 },
    REGISTER: { keyPrefix: 'rl_register', maxRequests: 3, windowSeconds: 300 },
    PASSWORD_RESET: { keyPrefix: 'rl_pwd_reset', maxRequests: 3, windowSeconds: 3600 },
    MFA_OTP: { keyPrefix: 'rl_mfa', maxRequests: 5, windowSeconds: 600 },
    UPLOAD: { keyPrefix: 'rl_upload', maxRequests: 20, windowSeconds: 60 },
    REPORT: { keyPrefix: 'rl_report', maxRequests: 10, windowSeconds: 600 },
    SUPPORT_TICKET: { keyPrefix: 'rl_support', maxRequests: 5, windowSeconds: 600 },
    SOCIAL_ACTIONS: { keyPrefix: 'rl_social', maxRequests: 60, windowSeconds: 60 },
  } as const,

  /**
   * Evaluates if an action is within allowed limits (Section 39-43).
   */
  checkRateLimit(identifier: string, rule: RateLimitRule): RateLimitResult {
    const bucketKey = `${rule.keyPrefix}:${identifier}`;
    const now = Date.now();
    const current = rateLimitBuckets.get(bucketKey);

    if (!current || now >= current.resetAt) {
      // New window
      const resetAt = now + rule.windowSeconds * 1000;
      rateLimitBuckets.set(bucketKey, { count: 1, resetAt });
      return {
        allowed: true,
        limit: rule.maxRequests,
        remaining: rule.maxRequests - 1,
        resetInSeconds: rule.windowSeconds,
        retryAfter: 0,
      };
    }

    // Existing window
    const resetInSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

    if (current.count >= rule.maxRequests) {
      return {
        allowed: false,
        limit: rule.maxRequests,
        remaining: 0,
        resetInSeconds,
        retryAfter: resetInSeconds,
      };
    }

    current.count += 1;
    return {
      allowed: true,
      limit: rule.maxRequests,
      remaining: rule.maxRequests - current.count,
      resetInSeconds,
      retryAfter: 0,
    };
  },

  /**
   * Formats HTTP 429 response headers (Section 42 & 43).
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetInSeconds.toString(),
    };

    if (!result.allowed) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  },
};
