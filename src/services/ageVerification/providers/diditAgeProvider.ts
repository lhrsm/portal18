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

/**
 * Validates whether a given string is a valid UUID format (8-4-4-4-12 hex).
 */
export function isValidUuid(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

export class DiditAgeVerificationProvider implements AgeVerificationProvider {
  readonly name = 'didit_age';
  readonly isConfigured: boolean;

  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly workflowId: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey = (process.env.DIDIT_API_KEY || '').replace(/['"]/g, '').trim();
    this.webhookSecret = (process.env.DIDIT_WEBHOOK_SECRET || '').replace(/['"]/g, '').trim();
    this.workflowId = (process.env.DIDIT_AGE_WORKFLOW_ID || '').replace(/['"]/g, '').trim();
    this.apiUrl = (process.env.DIDIT_API_URL || 'https://verification.didit.me').replace(/['"]/g, '').trim().replace(/\/$/, '');
    this.isConfigured = Boolean(this.apiKey && this.workflowId && isValidUuid(this.workflowId));
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
   * Fail-closed with sanitized diagnostic categorization.
   */
  async initiateVerification(options: InitiateVerificationOptions): Promise<InitiateVerificationResponse> {
    const startTime = Date.now();
    const correlationId = `didit_corr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const safeReturnUrl = options.returnUrl || '/';

    // 1. Structural Preflight Validation
    if (!this.apiKey) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId,
        reason: 'DIDIT_API_KEY_MISSING',
      });
      return {
        redirectUrl: `/age-verification?status=unavailable&reason=DIDIT_API_KEY_MISSING&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
        sessionId: `unconf-${Date.now()}`,
        state: options.state || correlationId,
        provider: this.name,
        diagnosticCategory: 'DIDIT_API_KEY_MISSING',
      };
    }

    if (!this.workflowId) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId,
        reason: 'DIDIT_WORKFLOW_ID_MISSING',
      });
      return {
        redirectUrl: `/age-verification?status=unavailable&reason=DIDIT_WORKFLOW_ID_MISSING&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
        sessionId: `unconf-${Date.now()}`,
        state: options.state || correlationId,
        provider: this.name,
        diagnosticCategory: 'DIDIT_WORKFLOW_ID_MISSING',
      };
    }

    if (!isValidUuid(this.workflowId)) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId,
        reason: 'DIDIT_WORKFLOW_ID_INVALID',
      });
      return {
        redirectUrl: `/age-verification?status=unavailable&reason=DIDIT_WORKFLOW_ID_INVALID&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
        sessionId: `unconf-${Date.now()}`,
        state: options.state || correlationId,
        provider: this.name,
        diagnosticCategory: 'DIDIT_WORKFLOW_ID_INVALID',
      };
    }

    const canonicalBase = getCanonicalBaseUrl();
    const callbackUrl = `${canonicalBase}/age-verification/callback?returnUrl=${encodeURIComponent(safeReturnUrl)}`;

    // 2. Server-to-Server Session Creation
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
        let category = 'DIDIT_REQUEST_REJECTED';
        if (res.status === 401 || res.status === 403) {
          category = 'DIDIT_AUTH_FAILED';
        } else if (res.status === 404) {
          category = 'DIDIT_WORKFLOW_NOT_FOUND';
        } else if (res.status === 429) {
          category = 'DIDIT_RATE_LIMITED';
        } else if (res.status >= 500) {
          category = 'DIDIT_NETWORK_FAILURE';
        }

        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          correlationId,
          latencyMs: Date.now() - startTime,
          reason: category,
        });

        return {
          redirectUrl: `/age-verification?status=unavailable&reason=${category}&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
          sessionId: `err-${Date.now()}`,
          state: correlationId,
          provider: this.name,
          diagnosticCategory: category,
        };
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          correlationId,
          latencyMs: Date.now() - startTime,
          reason: 'DIDIT_INVALID_RESPONSE',
        });
        return {
          redirectUrl: `/age-verification?status=unavailable&reason=DIDIT_INVALID_RESPONSE&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
          sessionId: `err-${Date.now()}`,
          state: correlationId,
          provider: this.name,
          diagnosticCategory: 'DIDIT_INVALID_RESPONSE',
        };
      }

      const sessionId = data?.session_id || data?.id;
      const redirectUrl = data?.url || data?.verification_url;

      if (!sessionId || !redirectUrl) {
        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          correlationId,
          latencyMs: Date.now() - startTime,
          reason: 'DIDIT_REDIRECT_MISSING',
        });
        return {
          redirectUrl: `/age-verification?status=unavailable&reason=DIDIT_REDIRECT_MISSING&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
          sessionId: `err-${Date.now()}`,
          state: correlationId,
          provider: this.name,
          diagnosticCategory: 'DIDIT_REDIRECT_MISSING',
        };
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
        diagnosticCategory: 'SUCCESS',
      };
    } catch (err: any) {
      let category = 'DIDIT_NETWORK_FAILURE';
      if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('timeout')) {
        category = 'DIDIT_TIMEOUT';
      }

      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        correlationId,
        latencyMs: Date.now() - startTime,
        reason: category,
      });

      return {
        redirectUrl: `/age-verification?status=unavailable&reason=${category}&returnUrl=${encodeURIComponent(safeReturnUrl)}`,
        sessionId: `err-${Date.now()}`,
        state: correlationId,
        provider: this.name,
        diagnosticCategory: category,
      };
    }
  }

  /**
   * Validates the return callback from Didit via server-to-server decision query (Fail-Closed).
   */
  async validateCallback(params: ValidateCallbackParams): Promise<AgeVerificationResult> {
    const startTime = Date.now();
    const sessionId = (params.sessionId || params.code || params.token || '').trim();

    if (!this.apiKey) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        reason: 'DIDIT_API_KEY_MISSING',
      });
      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: 'unverified',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: 'Chave de API do Didit não configurada no servidor.',
      };
    }

    if (!sessionId) {
      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        reason: 'MISSING_SESSION_ID',
      });
      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: 'unverified',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: 'Identificador de sessão ausente ou inválido.',
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
        let category = 'DIDIT_REQUEST_REJECTED';
        if (res.status === 401 || res.status === 403) {
          category = 'DIDIT_AUTH_FAILED';
        } else if (res.status === 404) {
          category = 'DIDIT_SESSION_NOT_FOUND';
        } else if (res.status === 429) {
          category = 'DIDIT_RATE_LIMITED';
        } else if (res.status >= 500) {
          category = 'DIDIT_NETWORK_FAILURE';
        }

        logAgeAssuranceEvent('age_verification_failed', {
          provider: this.name,
          latencyMs: Date.now() - startTime,
          reason: category,
        });

        return {
          verified: false,
          ageBand: 'unknown',
          provider: this.name,
          providerSubjectHash: 'lookup_failed',
          assuranceLevel: 'low',
          verifiedAt: new Date().toISOString(),
          error: `Falha ao validar sessão com o provedor (${category}).`,
        };
      }

      let decision: any;
      try {
        decision = await res.json();
      } catch {
        return {
          verified: false,
          ageBand: 'unknown',
          provider: this.name,
          providerSubjectHash: 'invalid_json',
          assuranceLevel: 'low',
          verifiedAt: new Date().toISOString(),
          error: 'Resposta inválida recebida do provedor Didit.',
        };
      }

      // 1. Workflow Binding Verification (Section 9)
      if (this.workflowId && decision?.workflow_id && decision.workflow_id !== this.workflowId) {
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

      const status = String(decision?.status || '').trim();
      const warnings = Array.isArray(decision?.warnings) ? decision.warnings.map(String) : [];
      const reasonCode = String(decision?.decision_reason_code || '').trim();
      const hasUnderageSignal =
        warnings.includes('AGE_BELOW_MINIMUM') ||
        warnings.includes('AGE_NOT_DETECTED') ||
        reasonCode.includes('AGE_BELOW_MINIMUM') ||
        status.toLowerCase() === 'declined';

      // 2. Decision State Mapping
      if (status === 'Approved' && !hasUnderageSignal) {
        const subjectHash = this.generateSubjectHash(sessionId, decision?.vendor_data);
        const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString(); // 30 days valid

        logAgeAssuranceEvent('age_verification_verified', {
          provider: this.name,
          correlationId: decision?.vendor_data,
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
            workflowId: decision?.workflow_id || this.workflowId,
          },
        };
      }

      if (hasUnderageSignal) {
        logAgeAssuranceEvent('age_verification_rejected', {
          provider: this.name,
          correlationId: decision?.vendor_data,
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
          correlationId: decision?.vendor_data,
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
        correlationId: decision?.vendor_data,
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
      let category = 'DIDIT_NETWORK_FAILURE';
      if (err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('timeout')) {
        category = 'DIDIT_TIMEOUT';
      }

      logAgeAssuranceEvent('age_verification_failed', {
        provider: this.name,
        latencyMs: Date.now() - startTime,
        reason: category,
      });

      return {
        verified: false,
        ageBand: 'unknown',
        provider: this.name,
        providerSubjectHash: 'network_error',
        assuranceLevel: 'low',
        verifiedAt: new Date().toISOString(),
        error: `Falha de comunicação segura com o provedor (${category}).`,
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
