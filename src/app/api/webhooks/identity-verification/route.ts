import { NextRequest, NextResponse } from 'next/server';
import { IdentityProviderFactory } from '@/services/identity/factory';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const provider = IdentityProviderFactory.getProvider();

    // 1. Signature Verification (Requirement 27 & 80)
    const isValidSignature = await provider.verifyWebhookSignature(headers, rawBody);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Assinatura de webhook inválida ou ausente.' },
        { status: 401 }
      );
    }

    // 2. Parse Normalized Event
    const event = await provider.parseWebhookEvent(headers, rawBody);

    // 3. Invoke Secure Database RPC
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('process_verification_webhook', {
      p_provider: provider.name,
      p_event_id: event.eventId,
      p_event_type: event.eventType,
      p_provider_reference: event.providerReference,
      p_status: event.status,
      p_age_verified: event.ageVerified,
      p_identity_verified: event.identityVerified,
      p_result_code: event.resultCode,
      p_payload_hash: event.rawPayloadHash,
    });

    if (error) {
      console.error('Database error processing KYC webhook:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      processed: data?.success ?? true,
      status: data?.status,
    });
  } catch (err) {
    console.error('Fatal error in identity verification webhook:', err);
    return NextResponse.json(
      { error: 'Falha interna ao processar evento de verificação.' },
      { status: 500 }
    );
  }
}
