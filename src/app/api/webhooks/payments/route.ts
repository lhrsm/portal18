import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '@/services/payments/factory';
import { PaymentProviderRegistry } from '@/services/payments/registry';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Identify Target Provider (via query param, header, or default)
    const { searchParams } = new URL(req.url);
    const providerParam = searchParams.get('provider');
    const headerProvider = req.headers.get('x-payment-provider');
    const targetProviderCode = (providerParam || headerProvider || process.env.PAYMENT_PROVIDER || 'unconfigured').toLowerCase();

    const provider = PaymentProviderRegistry.get(targetProviderCode) || PaymentProviderFactory.getProvider();

    // 2. Reject Unsupported / Prohibited Providers
    if (provider.code === 'stripe') {
      return NextResponse.json(
        { error: 'Provedor não suportado para o modelo de negócios.' },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // 3. Cryptographic Signature Verification
    const isValidSignature = await provider.verifyWebhookSignature(headers, rawBody);
    if (!isValidSignature) {
      console.warn(`[WEBHOOK_SECURITY] Invalid webhook signature rejected for provider: ${provider.code}`);
      return NextResponse.json(
        { error: 'Assinatura de webhook de pagamento inválida.' },
        { status: 401 }
      );
    }

    // 4. Parse Normalized Event
    const event = await provider.parseWebhookEvent(headers, rawBody);

    // 5. Invoke Secure Database RPC (Idempotency Guard + Replay Protection)
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('process_payment_webhook', {
      p_provider: provider.code,
      p_event_id: event.eventId,
      p_event_type: event.eventType,
      p_provider_reference: event.providerPaymentReference,
      p_status: event.status,
      p_amount: event.amount,
      p_metadata: event.metadata || {},
    });

    if (error) {
      console.error('[WEBHOOK_ERROR] Database error processing payment webhook:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      received: true,
      provider: provider.code,
      processed: data?.success ?? true,
      status: data?.status,
    });
  } catch (err: any) {
    console.error('[WEBHOOK_FATAL] Error in payment webhook processing:', err?.message || err);
    return NextResponse.json(
      { error: 'Falha interna ao processar evento financeiro.' },
      { status: 500 }
    );
  }
}
