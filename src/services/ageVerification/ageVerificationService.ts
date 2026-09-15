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
   * Asynchronously checks verification status against the secure server-side endpoint.
   */
  async checkServerVerification(): Promise<{ verified: boolean; ageBand: string }> {
    if (typeof window === 'undefined') {
      return { verified: false, ageBand: 'unknown' };
    }

    try {
      const res = await fetch('/api/age-verification/status', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return { verified: false, ageBand: 'unknown' };
      const data = await res.json();
      return {
        verified: Boolean(data.verified),
        ageBand: data.ageBand || 'unknown',
      };
    } catch {
      return { verified: false, ageBand: 'unknown' };
    }
  },

  /**
   * Sanitizes return URLs to protect against Open Redirect vulnerabilities.
   */
  sanitizeReturnUrl(url?: string | null): string {
    if (!url) return '/';
    const trimmed = url.trim();

    // Only allow relative internal paths starting with a single '/'
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\') && !trimmed.includes(':')) {
      return trimmed;
    }

    return '/';
  },

  /**
   * Initiates age verification flow with provider.
   * If running in the browser, requests session creation through the secure server-side API.
   */
  async startVerification(options: { returnUrl?: string; isReturningVisitor?: boolean } = {}) {
    const safeReturnUrl = this.sanitizeReturnUrl(options.returnUrl);

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/age-verification/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: safeReturnUrl,
          isReturningVisitor: Boolean(options.isReturningVisitor),
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao iniciar verificação de idade no servidor.');
      }

      return await res.json();
    }

    // Server-side fallback for scripts / tests
    const provider = AgeVerificationFactory.getProvider();
    return await provider.initiateVerification({
      returnUrl: safeReturnUrl,
      isReturningVisitor: options.isReturningVisitor,
    });
  },

  /**
   * Processes provider callback after verification attempt.
   * If running in browser, delegates validation to the secure server endpoint to ensure fail-closed enforcement.
   */
  async processCallback(params: {
    sessionId?: string;
    code?: string;
    state?: string;
    token?: string;
    signature?: string;
    returnUrl?: string;
  }): Promise<{
    result: AgeVerificationResult;
    redirectUrl: string;
  }> {
    const safeReturnUrl = this.sanitizeReturnUrl(params.returnUrl);

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/age-verification/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: params.sessionId,
            code: params.code,
            token: params.token,
            state: params.state,
            returnUrl: safeReturnUrl,
          }),
        });

        const data = await res.json();

        if (res.ok && data.verified && data.ageBand === '18_plus') {
          return {
            result: {
              verified: true,
              ageBand: '18_plus',
              provider: 'didit_age',
              providerSubjectHash: 'verified',
              assuranceLevel: 'high',
              verifiedAt: new Date().toISOString(),
              credentialReference: data.credentialReference,
            },
            redirectUrl: data.redirectUrl || safeReturnUrl,
          };
        }

        return {
          result: {
            verified: false,
            ageBand: data.ageBand || 'unknown',
            provider: 'didit_age',
            providerSubjectHash: 'unverified',
            assuranceLevel: 'low',
            verifiedAt: new Date().toISOString(),
            error: data.error || 'Verificação rejeitada pelo servidor.',
          },
          redirectUrl: data.redirectUrl || `/age-verification?status=failed&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
        };
      } catch (err: any) {
        return {
          result: {
            verified: false,
            ageBand: 'unknown',
            provider: 'didit_age',
            providerSubjectHash: 'network_error',
            assuranceLevel: 'low',
            verifiedAt: new Date().toISOString(),
            error: err.message,
          },
          redirectUrl: `/age-verification?status=failed&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
        };
      }
    }

    // Direct server/test execution
    const provider = AgeVerificationFactory.getProvider();
    const result = await provider.validateCallback(params);

    if (result.verified && result.ageBand === '18_plus') {
      const { serialized } = ageSessionService.createSignedSession(result);

      if (typeof document !== 'undefined') {
        const maxAge = 30 * 86400; // 30 days
        document.cookie = `${ageSessionService.cookieName}=${serialized}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
      }

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
    if (typeof window !== 'undefined') {
      fetch('/api/age-verification/clear', { method: 'POST' }).catch(() => {});
    }

    if (typeof document !== 'undefined') {
      document.cookie = `${ageSessionService.cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
    }
  },
};
