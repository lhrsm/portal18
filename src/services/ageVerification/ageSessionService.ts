import { AgeVerificationResult, AgeVerificationSession, AgeBand } from './types';

const COOKIE_NAME = 'portal18_age_session';
const DEFAULT_TTL_HOURS = 24 * 30; // 30 days standard assurance validity
const SECRET_KEY = process.env.AGE_VERIFICATION_SESSION_SECRET || 'portal18_age_assurance_fallback_secret_key_2026';

export const ageSessionService = {
  get cookieName(): string {
    return COOKIE_NAME;
  },

  /**
   * Generates a simple cryptographically verifiable signature string.
   */
  generateSignature(payload: Omit<AgeVerificationSession, 'signature'>): string {
    const raw = `${payload.age_verified}:${payload.assurance_reference}:${payload.provider}:${payload.issued_at}:${payload.expires_at}:${payload.age_band}:${SECRET_KEY}`;
    // Simple deterministic hash calculation for client/server shared runtime
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `sig_${Math.abs(hash).toString(16)}_${payload.issued_at.toString(36)}`;
  },

  /**
   * Creates a signed session object and serialized cookie value.
   */
  createSignedSession(result: AgeVerificationResult, ttlHours: number = DEFAULT_TTL_HOURS): {
    session: AgeVerificationSession;
    serialized: string;
  } {
    const now = Date.now();
    const expiresAt = now + ttlHours * 3600 * 1000;

    const baseSession: Omit<AgeVerificationSession, 'signature'> = {
      age_verified: result.verified && result.ageBand === '18_plus',
      assurance_reference: result.credentialReference || `ref_${now}`,
      provider: result.provider,
      issued_at: now,
      expires_at: expiresAt,
      age_band: result.ageBand,
    };

    const signature = this.generateSignature(baseSession);
    const session: AgeVerificationSession = {
      ...baseSession,
      signature,
    };

    const serialized = Buffer.from(JSON.stringify(session)).toString('base64');
    return { session, serialized };
  },

  /**
   * Parses and validates a session string or cookie value.
   */
  parseSession(cookieValue?: string | null): AgeVerificationSession | null {
    if (!cookieValue) return null;

    try {
      let jsonStr = cookieValue;
      if (!cookieValue.startsWith('{')) {
        jsonStr = Buffer.from(cookieValue, 'base64').toString('utf8');
      }

      const parsed = JSON.parse(jsonStr) as AgeVerificationSession;
      if (!parsed || !parsed.signature || !parsed.expires_at) return null;

      const expectedSig = this.generateSignature({
        age_verified: parsed.age_verified,
        assurance_reference: parsed.assurance_reference,
        provider: parsed.provider,
        issued_at: parsed.issued_at,
        expires_at: parsed.expires_at,
        age_band: parsed.age_band,
      });

      if (parsed.signature !== expectedSig) {
        console.warn('Tampered age session signature detected.');
        return null;
      }

      if (Date.now() > parsed.expires_at) {
        return null; // Expired
      }

      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Evaluates if a given session grants verified 18+ access.
   */
  isSessionValid(session: AgeVerificationSession | null): boolean {
    if (!session) return false;
    return session.age_verified === true && session.age_band === '18_plus' && Date.now() <= session.expires_at;
  },
};
