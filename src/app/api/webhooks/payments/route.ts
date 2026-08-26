import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '@/services/payments/factory';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const provider = PaymentProviderFactory.getProvider();

    // 1. Signature Verification (Requirement 29)
    const isValidSignature = await provider.verifyWebhookSignature(headers, rawBody);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Assinatura de webhook de pagamento inválida.' },
        { status: 401 }
      );
    }

    // 2. Parse Normalized Event
    const event = await provider.parseWebhookEvent(headers, rawBody);

    // 3. Invoke Secure Database RPC (Replay Protection + State Activation)
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('process_payment_webhook', {
      p_provider: provider.name,
      p_event_id: event.eventId,
      p_event_type: event.eventType,
      p_provider_reference: event.providerPaymentReference,
      p_status: event.status,
      p_amount: event.amount,
      p_metadata: event.metadata || {},
    });

    if (error) {
      console.error('Database error processing payment webhook:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      processed: data?.success ?? true,
      status: data?.status,
    });
  } catch (err) {
    console.error('Fatal error in payment webhook:', err);
    return NextResponse.json(
      { error: 'Falha interna ao processar evento financeiro.' },
      { status: 500 }
    );
  }
}
