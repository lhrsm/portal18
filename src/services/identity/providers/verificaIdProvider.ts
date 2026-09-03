import { IdentityVerificationProvider } from '../provider';
import {
  CreateSessionParams,
  VerificationSessionResult,
  WebhookEventData,
  VerificationResult
} from '../types';

/**
 * Verifica ID Provider Adapter Stub (Track P3)
 * Decoupled provider interface awaiting production credentials and enterprise contract.
 */
export class VerificaIdIdentityVerificationProvider implements IdentityVerificationProvider {
  readonly name = 'verifica_id';

  async createVerificationSession(params: CreateSessionParams): Promise<VerificationSessionResult> {
    const apiKey = process.env.VERIFICA_ID_API_KEY || process.env.IDENTITY_PROVIDER_API_KEY;
    if (!apiKey) {
      throw new Error('Provedor Verifica ID não configurado no ambiente de produção.');
    }

    throw new Error('Verifica ID adapter pronto para ativação mediante credenciais de produção.');
  }

  async verifyWebhookSignature(headers: Record<string, string>, rawBody: string): Promise<boolean> {
    const secret = process.env.VERIFICA_ID_WEBHOOK_SECRET || process.env.IDENTITY_PROVIDER_WEBHOOK_SECRET;
    if (!secret) return false;
    const signature = headers['x-verifica-id-signature'] || headers['x-webhook-signature'];
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
      eventId: parsed.event_id || `evt_${Date.now()}`,
      eventType: parsed.event_name || 'verification_finished',
      providerReference: parsed.transaction_id || 'unknown_ref',
      status: parsed.status === 'SUCCESS' ? 'verified' : parsed.status === 'FAILED' ? 'rejected' : 'processing',
      ageVerified: Boolean(parsed.age_eligible),
      identityVerified: Boolean(parsed.document_valid),
      resultCode: parsed.status_code || 'pending',
      rawPayloadHash: `sha256_${Date.now()}`,
    };
  }

  async getVerificationStatus(providerReference: string): Promise<VerificationResult> {
    return {
      providerReference,
      status: 'pending',
      ageVerified: false,
      identityVerified: false,
      resultCode: 'verifica_id_unactivated',
    };
  }
}
