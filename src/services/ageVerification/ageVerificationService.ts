import { createClient } from '@/lib/supabase/client';
import { AgeVerificationFactory } from './factory';
import { ageSessionService } from './ageSessionService';
import { AgeVerificationResult, AgeVerificationSession, AgeGateState } from './types';

export const ageVerificationService = {
  /**
   * Evaluates if visitor is verified (Client-side fast check).
   */
  isAgeVerified(): boolean {
    if (typeof document === 'undefined') return false;

    const cookieMatch = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${ageSessionService.cookieName}=`));

    if (!cookieMatch) return false;

    const rawValue = cookieMatch.split('=')[1];
    const session = ageSessionService.parseSession(rawValue);
    return ageSessionService.isSessionValid(session);
  },

  /**
   * Sanitizes return URLs to protect against Open Redirect vulnerabilities.
   */
  sanitizeReturnUrl(url?: string | null): string {
    if (!url) return '/';
    const trimmed = url.trim();

    // Only allow relative internal paths
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
      return trimmed;
    }

    return '/';
  },

  /**
   * Initiates age verification flow with provider.
   */
  async startVerification(options: { returnUrl?: string; isReturningVisitor?: boolean } = {}) {
    const safeReturnUrl = this.sanitizeReturnUrl(options.returnUrl);
    const provider = AgeVerificationFactory.getProvider();

    const response = await provider.initiateVerification({
      returnUrl: safeReturnUrl,
      isReturningVisitor: options.isReturningVisitor,
    });

    return response;
  },

  /**
   * Processes provider callback after verification attempt.
   */
  async processCallback(params: {
    code?: string;
    state?: string;
    token?: string;
    signature?: string;
    returnUrl?: string;
  }): Promise<{
    result: AgeVerificationResult;
    redirectUrl: string;
  }> {
    const provider = AgeVerificationFactory.getProvider();
    const result = await provider.validateCallback(params);
    const safeReturnUrl = this.sanitizeReturnUrl(params.returnUrl);

    if (result.verified && result.ageBand === '18_plus') {
      // Create and set signed session cookie
      const { serialized } = ageSessionService.createSignedSession(result);

      if (typeof document !== 'undefined') {
        const maxAge = 30 * 86400; // 30 days
        document.cookie = `${ageSessionService.cookieName}=${serialized}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
      }

      // Record to database if user is authenticated (without PII)
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.rpc as any)('record_age_assurance_credential', {
            p_provider: result.provider,
            p_provider_subject_hash: result.providerSubjectHash,
            p_age_band: result.ageBand,
            p_assurance_level: result.assuranceLevel,
            p_credential_reference: result.credentialReference || null,
            p_expires_at: result.expiresAt || null,
          });
        }
      } catch (err) {
        console.warn('Could not record age credential to user profile:', err);
      }

      return {
        result,
        redirectUrl: safeReturnUrl,
      };
    }

    return {
      result,
      redirectUrl: `/age-verification?status=${result.ageBand === 'under_18' ? 'underage' : 'failed'}&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
    };
  },

  /**
   * Clears age verification on current device ("Esquecer minha verificação neste dispositivo").
   */
  clearDeviceVerification(): void {
    if (typeof document !== 'undefined') {
      document.cookie = `${ageSessionService.cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
    }
  },
};
