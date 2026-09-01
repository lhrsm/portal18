import { IdentityVerificationProvider } from '../provider';
import {
  CreateSessionParams,
  VerificationSessionResult,
  WebhookEventData,
  VerificationResult
} from '../types';

export class UnconfiguredIdentityVerificationProvider implements IdentityVerificationProvider {
  readonly name = 'unconfigured';

  async createVerificationSession(params: CreateSessionParams): Promise<VerificationSessionResult> {
    // Section 89: Environment Guard
    if (process.env.NODE_ENV === 'production' && !process.env.IDENTITY_PROVIDER_API_KEY) {
      throw new Error('Serviço de verificação de identidade temporariamente indisponível.');
    }

    const token = `dev_sess_${params.advertiserId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return {
      providerReference: token,
      sessionToken: token,
      redirectUrl: `${params.returnUrl}?session=${token}`,
      expiresAt,
    };
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.IDENTITY_PROVIDER_WEBHOOK_SECRET;
      if (!secret) return false;
      const signature = headers['x-provider-signature'] || headers['x-webhook-signature'];
      return Boolean(signature && signature.length > 10);
    }
    return true;
  }

  async parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookEventData> {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = {};
    }

    const eventId = parsed.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventType = parsed.event_type || 'verification.completed';
    const providerReference = parsed.provider_reference || parsed.session_token || 'unknown_ref';
    const status = parsed.status === 'verified' ? 'verified' : parsed.status === 'rejected' ? 'rejected' : 'processing';
    const ageVerified = parsed.age_verified !== undefined ? Boolean(parsed.age_verified) : true;
    const identityVerified = parsed.identity_verified !== undefined ? Boolean(parsed.identity_verified) : true;

    // Simple hash simulation for unconfigured provider
    const rawPayloadHash = `sha256_${Date.now()}`;

    return {
      eventId,
      eventType,
      providerReference,
      status,
      ageVerified,
      identityVerified,
      resultCode: parsed.result_code || (status === 'verified' ? 'success' : 'pending'),
      rawPayloadHash,
    };
  }

  async getVerificationStatus(providerReference: string): Promise<VerificationResult> {
    return {
      providerReference,
      status: 'pending',
      ageVerified: false,
      identityVerified: false,
      resultCode: 'unconfigured_adapter',
    };
  }
}
