import { RateLimitPolicy } from './types';

export type RateLimitScope =
  | 'login'
  | 'register'
  | 'report'
  | 'review'
  | 'referral'
  | 'upload'
  | 'authenticity_challenge';

// In-memory rate limiting cache for high-performance edge/server checks
const memoryBuckets = new Map<string, number[]>();

const defaultPolicies: Record<RateLimitScope, RateLimitPolicy> = {
  login: { key: 'login', maxRequests: 5, windowSeconds: 60 },
  register: { key: 'register', maxRequests: 3, windowSeconds: 300 },
  report: { key: 'report', maxRequests: 5, windowSeconds: 300 },
  review: { key: 'review', maxRequests: 3, windowSeconds: 600 },
  referral: { key: 'referral', maxRequests: 10, windowSeconds: 300 },
  upload: { key: 'upload', maxRequests: 15, windowSeconds: 60 },
  authenticity_challenge: { key: 'authenticity_challenge', maxRequests: 3, windowSeconds: 3600 },
};

export const rateLimitEngine = {
  policies: defaultPolicies,

  /**
   * Checks if an action is within allowed rate limits using a sliding window.
   */
  checkLimit(scope: RateLimitScope, identifier: string): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
  } {
    const policy = this.policies[scope];
    if (!policy) return { allowed: true, remaining: 999, resetInSeconds: 0 };

    const bucketKey = `${policy.key}:${identifier}`;
    const now = Date.now();
    const windowMs = policy.windowSeconds * 1000;

    let timestamps = memoryBuckets.get(bucketKey) || [];
    // Filter out expired timestamps
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= policy.maxRequests) {
      const oldest = timestamps[0];
      const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(1, resetInSeconds),
      };
    }

    timestamps.push(now);
    memoryBuckets.set(bucketKey, timestamps);

    return {
      allowed: true,
      remaining: policy.maxRequests - timestamps.length,
      resetInSeconds: policy.windowSeconds,
    };
  },

  /**
   * Clears rate limit bucket for a specific identifier (e.g. after successful 2FA).
   */
  resetLimit(scope: RateLimitScope, identifier: string): void {
    const bucketKey = `${scope}:${identifier}`;
    memoryBuckets.delete(bucketKey);
  },
};
