import { NextRequest, NextResponse } from 'next/server';
import { AgeVerificationFactory } from '@/services/ageVerification/factory';
import { DiditAgeVerificationProvider } from '@/services/ageVerification/providers/diditAgeProvider';
import { createClient } from '@/lib/supabase/server';
import { logAgeAssuranceEvent } from '@/services/ageVerification/observability';

const ALLOWED_EVENT_TYPES = new Set([
  'session.status.updated',
  'session.completed',
  'status.updated',
  'verification.approved',
  'verification.declined',
]);

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const provider = AgeVerificationFactory.getProvider();

    // 1. Signature Verification (Fail-Closed)
    if (provider instanceof DiditAgeVerificationProvider) {
      const isValidSignature = provider.verifyWebhookSignature(headers, rawBody);
      if (!isValidSignature) {
        logAgeAssuranceEvent('age_verification_webhook_received', {
          provider: provider.name,
          result: 'unauthorized_invalid_signature',
          reason: 'HMAC_SIGNATURE_MISMATCH',
        });
        return NextResponse.json(
          { error: 'Assinatura criptográfica do webhook inválida ou ausente.' },
          { status: 401 }
        );
      }
    }

    // 2. Parse Normalized Event
    let event: {
      eventId: string;
      eventType: string;
      sessionId: string;
      workflowId?: string;
      status: string;
      vendorData?: string;
      rawPayloadHash: string;
    };

    if (provider instanceof DiditAgeVerificationProvider) {
      event = provider.parseWebhookEvent(headers, rawBody);
    } else {
      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        parsed = {};
      }
      event = {
        eventId: String(parsed.event_id || parsed.id || `evt_${Date.now()}`),
        eventType: String(parsed.event_type || parsed.type || 'unknown'),
        sessionId: String(parsed.session_id || 'unknown'),
        status: String(parsed.status || 'unknown'),
        rawPayloadHash: 'hash',
      };
    }

    // 3. Event Allowlist Validation
    if (!ALLOWED_EVENT_TYPES.has(event.eventType)) {
      return NextResponse.json({
        received: true,
        ignored: true,
        reason: 'Event type not in allowlist',
      });
    }

    // 4. Workflow ID Binding Check
    const expectedWorkflowId = process.env.DIDIT_AGE_WORKFLOW_ID;
    if (expectedWorkflowId && event.workflowId && event.workflowId !== expectedWorkflowId) {
      logAgeAssuranceEvent('age_verification_webhook_received', {
        provider: provider.name,
        result: 'workflow_mismatch_ignored',
        reason: 'WORKFLOW_MISMATCH',
      });
      return NextResponse.json({
        received: true,
        ignored: true,
        reason: 'Workflow mismatch',
      });
    }

    // 5. Idempotency & Replay Protection (Reusing public.webhook_events)
    const supabase = await createClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingEvent } = await (supabase.from('webhook_events') as any)
        .select('id, status')
        .eq('provider', provider.name)
        .eq('event_id', event.eventId)
        .maybeSingle();

      if (existingEvent) {
        logAgeAssuranceEvent('age_verification_webhook_received', {
          provider: provider.name,
          correlationId: event.vendorData,
          result: 'idempotent_replay_ignored',
        });
        return NextResponse.json({
          received: true,
          idempotent: true,
          status: existingEvent.status,
        });
      }

      // Record incoming event to prevent replays
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('webhook_events') as any).insert({
        provider: provider.name,
        event_id: event.eventId,
        event_type: event.eventType,
        payload_hash: event.rawPayloadHash,
        status: 'processed',
      });
    } catch (dbErr) {
      console.warn('Webhook idempotency check warning:', dbErr);
    }

    // 6. State Machine Update
    const normalizedStatus = event.status.toLowerCase();

    if (normalizedStatus === 'approved') {
      try {
        // Record 18+ credential in database (without biometric PII)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('record_age_assurance_credential', {
          p_provider: provider.name,
          p_provider_subject_hash: `wh_hash_${event.sessionId}`,
          p_age_band: '18_plus',
          p_assurance_level: 'high',
          p_credential_reference: event.sessionId,
          p_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      } catch (err) {
        console.warn('Failed to record approved credential via webhook:', err);
      }
    } else if (normalizedStatus === 'declined' || normalizedStatus === 'rejected' || normalizedStatus === 'revoked') {
      try {
        // Mark credential as revoked
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('age_verification_credentials') as any)
          .update({
            status: 'revoked',
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('credential_reference', event.sessionId);
      } catch (err) {
        console.warn('Failed to update revoked credential via webhook:', err);
      }
    }

    logAgeAssuranceEvent('age_verification_webhook_received', {
      provider: provider.name,
      correlationId: event.vendorData,
      latencyMs: Date.now() - startTime,
      result: `processed_${event.status}`,
    });

    return NextResponse.json({
      received: true,
      processed: true,
      status: event.status,
    });
  } catch (err: any) {
    console.error('Fatal error in age verification webhook:', err);
    return NextResponse.json(
      { error: 'Falha interna ao processar webhook de verificação de idade.' },
      { status: 500 }
    );
  }
}
