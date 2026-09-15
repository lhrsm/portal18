/**
 * Portal18 — Privacy-Preserving Age Assurance Observability Engine
 * Phase AGE-DIDIT-01: Structured events with zero PII, zero biometrics, and zero raw secrets.
 */

export type AgeAssuranceEventType =
  | 'age_verification_started'
  | 'age_verification_returned'
  | 'age_verification_verified'
  | 'age_verification_rejected'
  | 'age_verification_review'
  | 'age_verification_failed'
  | 'age_verification_webhook_received';

export interface AgeAssuranceEventData {
  correlationId?: string;
  provider: string;
  workflowReferenceHash?: string;
  result?: string;
  latencyMs?: number;
  reason?: string;
  isReused?: boolean;
}

export function logAgeAssuranceEvent(
  eventType: AgeAssuranceEventType,
  data: AgeAssuranceEventData
): void {
  const timestamp = new Date().toISOString();
  const structuredLog = {
    domain: 'visitor_age_assurance',
    event: eventType,
    timestamp,
    provider: data.provider,
    correlationId: data.correlationId || 'none',
    workflowReferenceHash: data.workflowReferenceHash,
    result: data.result,
    latencyMs: data.latencyMs,
    reason: data.reason,
    isReused: data.isReused,
  };

  // Structured JSON output for auditability and CloudWatch/Vercel log indexing
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[AGE_ASSURANCE_AUDIT] ${JSON.stringify(structuredLog)}`);
  }
}
