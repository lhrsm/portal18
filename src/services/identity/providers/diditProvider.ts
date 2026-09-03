import { IdentityVerificationProvider } from '../provider';
import {
  CreateSessionParams,
  VerificationSessionResult,
  WebhookEventData,
  VerificationResult
} from '../types';

/**
 * Didit Identity Verification Adapter Stub (Track P3)
 * Decoupled provider interface awaiting production credentials and enterprise contract.
 */
export class DiditIdentityVerificationProvider implements IdentityVerificationProvider {
  readonly name = 'didit';

  async createVerificationSession(params: CreateSessionParams): Promise<VerificationSessionResult> {
    const apiKey = process.env.DIDIT_API_KEY || process.env.IDENTITY_PROVIDER_API_KEY;
    if (!apiKey) {
      throw new Error('Provedor Didit não configurado no ambiente de produção.');
    }

    throw new Error('Didit adapter pronto para ativação mediante credenciais de produção.');
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    const secret = process.env.DIDIT_WEBHOOK_SECRET || process.env.IDENTITY_PROVIDER_WEBHOOK_SECRET;
    if (!secret) return false;
    const signature = headers['x-didit-signature'] || headers['x-webhook-signature'];
    return Boolean(signature && signature.length >= 16);
  }

  async parseWebhookEvent(headers: Record<string, string>, rawBody: string): Promise<WebhookEventData> {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = {};
    }

    return {
      eventId: parsed.id || `evt_${Date.now()}`,
      eventType: parsed.type || 'session.completed',
      providerReference: parsed.session_id || 'unknown_ref',
      status: parsed.status === 'approved' ? 'verified' : parsed.status === 'declined' ? 'rejected' : 'processing',
      ageVerified: Boolean(parsed.is_over_18),
      identityVerified: Boolean(parsed.identity_matched),
      resultCode: parsed.decision || 'pending',
      rawPayloadHash: `sha256_${Date.now()}`,
    };
  }

  async getVerificationStatus(providerReference: string): Promise<VerificationResult> {
    return {
      providerReference,
      status: 'pending',
      ageVerified: false,
      identityVerified: false,
      resultCode: 'didit_unactivated',
    };
  }
}
