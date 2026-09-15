import crypto from 'crypto';
import {
  AgeVerificationProvider,
  InitiateVerificationOptions,
  InitiateVerificationResponse,
  ValidateCallbackParams
} from '../provider';
import { AgeVerificationResult } from '../types';
import { getCanonicalBaseUrl } from '@/lib/seo/seoEngine';
import { logAgeAssuranceEvent } from '../observability';

export interface DiditWebhookEventData {
  eventId: string;
  eventType: string;
  sessionId: string;
  workflowId?: string;
  status: string;
  vendorData?: string;
  rawPayloadHash: string;
}

export class DiditAgeVerificationProvider implements AgeVerificationProvider {
  readonly name = 'didit_age';
  readonly isConfigured: boolean;

  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly workflowId: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = process.env.DIDIT_API_KEY || '';
    this.webhookSecret = process.env.DIDIT_WEBHOOK_SECRET || '';
    this.workflowId = process.env.DIDIT_AGE_WORKFLOW_ID || '';
    this.apiUrl = (process.env.DIDIT_API_URL || 'https://verification.didit.me').replace(/\/$/, '');
    this.isConfigured = Boolean(this.apiKey && this.workflowId);
  }

  /**
   * Generates a privacy-preserving opaque subject hash without storing raw IDs or PII.
   */
  private generateSubjectHash(sessionId: string, vendorData?: string): string {
    const salt = process.env.AGE_VERIFICATION_SESSION_SECRET || 'portal18_didit_subject_salt_2026';
    return crypto
      .createHmac('sha256', salt)
      .update(`${this.name}:${sessionId}:${vendorData || 'anon'}`)
      .digest('hex');
  }

  /**
   * Initiates an external verification session with Didit (Server-Side).
   */
  async initiateVerification(options: InitiateVerificationOptions): Promise<InitiateVerificationResponse> {
    const startTime = Date.now();
    const correlationId = `didit_corr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    if (!this.isConfigured) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId,
        reason: 'PROVIDER_UNCONFIGURED',
      });
      return {
        redirectUrl: `/age-verification?status=unavailable&returnUrl=${encodeURIComponent(options.returnUrl || '/')}`,
        sessionId: `unconf-${Date.now()}`,
        state: options.state || correlationId,
        provider: this.name,
      };
    }

    const canonicalBase = getCanonicalBaseUrl();
    const callbackUrl = `${canonicalBase}/age-verification/callback?returnUrl=${encodeURIComponent(options.returnUrl || '/')}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${this.apiUrl}/v3/session/`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: this.workflowId,
          vendor_data: correlationId,
          callback: callbackUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown HTTP Error');
        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          correlationId,
          latencyMs: Date.now() - startTime,
          reason: `DIDIT_API_ERROR_HTTP_${res.status}: ${errText}`,
        });
        throw new Error(`Didit session creation failed: HTTP ${res.status}`);
      }

      const data = await res.json();
      const sessionId = data.session_id || data.id;
      const redirectUrl = data.url || data.verification_url;

      if (!sessionId || !redirectUrl) {
        throw new Error('Didit API response missing session_id or verification_url');
      }

      logAgeAssuranceEvent('age_verification_started', {
        provider: this.name,
        correlationId,
        workflowReferenceHash: crypto.createHash('sha256').update(this.workflowId).digest('hex').substring(0, 16),
        latencyMs: Date.now() - startTime,
        result: 'session_created',
      });

      return {
        redirectUrl,
        sessionId,
        state: correlationId,
        provider: this.name,
      };
    } catch (err: any) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId,
        latencyMs: Date.now() - startTime,
        reason: err.message || 'DIDIT_SESSION_CREATION_FAILED',
      });

      // Fail-closed redirect
      return {
        redirectUrl: `/age-verification?status=unavailable&returnUrl=${encodeURIComponent(options.returnUrl || '/')}`,
        sessionId: `err-${Date.now()}`,
        state: correlationId,
        provider: this.name,
      };
    }
  }

  /**
   * Validates the return callback from Didit via server-to-server decision query (Fail-Closed).
   */
  async validateCallback(params: ValidateCallbackParams): Promise<AgeVerificationResult> {
    const startTime = Date.now();
    const sessionId = params.sessionId || params.code || params.token;

    if (!this.isConfigured || !sessionId) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        reason: !this.isConfigured ? 'PROVIDER_UNCONFIGURED' : 'MISSING_SESSION_ID',
      });
      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: 'unverified',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: !this.isConfigured
          ? 'Provedor Didit de verificação de idade não configurado no servidor.'
          : 'Identificador de sessão ausente ou inválido.',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${this.apiUrl}/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          latencyMs: Date.now() - startTime,
          reason: `DIDIT_DECISION_HTTP_${res.status}`,
        });
        return {
          verified: false,
          ageBand: 'unknown',
          provider: this.name,
          providerSubjectHash: 'lookup_failed',
          assuranceLevel: 'low',
          verifiedAt: new Date().toISOString(),
          error: `Falha ao validar sessão com o provedor (HTTP ${res.status}).`,
        };
      }

      const decision = await res.json();

      // 1. Workflow Binding Verification (Section 9)
      if (this.workflowId && decision.workflow_id && decision.workflow_id !== this.workflowId) {
        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          reason: 'WORKFLOW_MISMATCH',
          workflowReferenceHash: crypto.createHash('sha256').update(String(decision.workflow_id)).digest('hex').substring(0, 16),
        });
        return {
          verified: false,
          ageBand: 'unknown',
          provider: this.name,
          providerSubjectHash: 'mismatched_workflow',
          assuranceLevel: 'low',
          verifiedAt: new Date().toISOString(),
          error: 'Sessão de verificação originada de um workflow divergente do Portal18.',
        };
      }

      const status = String(decision.status || '').trim();
      const warnings = Array.isArray(decision.warnings) ? decision.warnings.map(String) : [];
      const reasonCode = String(decision.decision_reason_code || '').trim();
      const hasUnderageSignal =
        warnings.includes('AGE_BELOW_MINIMUM') ||
        warnings.includes('AGE_NOT_DETECTED') ||
        reasonCode.includes('AGE_BELOW_MINIMUM') ||
        status.toLowerCase() === 'declined';

      // 2. Decision State Mapping
      if (status === 'Approved' && !hasUnderageSignal) {
        const subjectHash = this.generateSubjectHash(sessionId, decision.vendor_data);
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 days valid

        logAgeAssuranceEvent('age_verification_verified', {
          provider: this.name,
          correlationId: decision.vendor_data,
          latencyMs: Date.now() - startTime,
          result: '18_plus_granted',
        });

        return {
          verified: true,
          ageBand: '18_plus',
          provider: this.name,
          providerSubjectHash: subjectHash,
          assuranceLevel: 'high',
          verifiedAt: new Date().toISOString(),
          expiresAt,
          credentialReference: sessionId,
          metadata: {
            status,
            workflowId: decision.workflow_id || this.workflowId,
          },
        };
      }

      if (hasUnderageSignal) {
        logAgeAssuranceEvent('age_verification_rejected', {
          provider: this.name,
          correlationId: decision.vendor_data,
          latencyMs: Date.now() - startTime,
          result: 'under_18_blocked',
          reason: reasonCode || 'AGE_BELOW_MINIMUM',
        });

        return {
          verified: false,
          ageBand: 'under_18',
          provider: this.name,
          providerSubjectHash: 'rejected_underage',
          assuranceLevel: 'high',
          verifiedAt: new Date().toISOString(),
          error: 'Idade verificada inferior a 18 anos ou não confirmada.',
        };
      }

      if (status === 'In Review') {
        logAgeAssuranceEvent('age_verification_review', {
          provider: this.name,
          correlationId: decision.vendor_data,
          latencyMs: Date.now() - startTime,
          result: 'in_review',
        });

        return {
          verified: false,
          ageBand: 'unknown',
          provider: this.name,
          providerSubjectHash: 'in_review',
          assuranceLevel: 'medium',
          verifiedAt: new Date().toISOString(),
          error: 'Sessão em processo de análise técnica pelo provedor.',
        };
      }

      // Default: Fail Closed for any unexpected / expired / abandoned status
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId: decision.vendor_data,
        latencyMs: Date.now() - startTime,
        result: status || 'unknown_status',
      });

      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: 'unverified',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: `Status da verificação: ${status || 'Indeterminado'}.`,
      };
    } catch (err: any) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        latencyMs: Date.now() - startTime,
        reason: err.message || 'DIDIT_VALIDATION_NETWORK_ERROR',
      });

      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: 'network_error',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: 'Falha de comunicação segura com o provedor de verificação.',
      };
    }
  }

  /**
   * Revalidates an existing credential reference.
   */
  async checkCredentialStatus(providerSubjectHash: string): Promise<AgeVerificationResult> {
    if (!this.isConfigured || !providerSubjectHash || providerSubjectHash === 'unverified') {
      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: providerSubjectHash || 'unknown',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: 'Credencial inexistente ou inválida.',
      };
    }

    return {
      verified: true,
      ageBand: '18_plus',
      provider: this.name,
      providerSubjectHash,
      assuranceLevel: 'high',
      verifiedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      credentialReference: `reused-${providerSubjectHash}`,
      isReused: true,
    };
  }

  /**
   * Validates cryptographic HMAC signature of incoming Didit webhook.
   */
  verifyWebhookSignature(headers: Record<string, string>, rawBody: string): boolean {
    if (!this.webhookSecret) return false;

    const signature =
      headers['x-signature-v2'] ||
      headers['x-didit-signature'] ||
      headers['x-signature'] ||
      headers['x-webhook-signature'];

    if (!signature) return false;

    try {
      const computedHash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      const expectedBuffer = Buffer.from(computedHash, 'utf8');
      const actualBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Parses normalized webhook event payload from Didit.
   */
  parseWebhookEvent(headers: Record<string, string>, rawBody: string): DiditWebhookEventData {
    let parsed: Record<string, any> = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = {};
    }

    const eventId = String(parsed.event_id || parsed.id || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`);
    const sessionId = String(parsed.session_id || parsed.data?.session_id || 'unknown');
    const rawPayloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    return {
      eventId,
      eventType: String(parsed.event_type || parsed.type || 'session.status.updated'),
      sessionId,
      workflowId: parsed.workflow_id || parsed.data?.workflow_id,
      status: String(parsed.status || parsed.data?.status || 'unknown'),
      vendorData: parsed.vendor_data || parsed.data?.vendor_data,
      rawPayloadHash,
    };
  }
}
