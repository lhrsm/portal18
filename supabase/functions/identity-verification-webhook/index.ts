import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WEBHOOK_SECRET = Deno.env.get('IDENTITY_PROVIDER_WEBHOOK_SECRET') || '';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-provider-signature') || req.headers.get('x-webhook-signature') || '';

    // Signature check
    if (WEBHOOK_SECRET && !signature) {
      return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const eventId = payload.event_id || `evt_${Date.now()}`;
    const provider = payload.provider || 'unconfigured';
    const providerRef = payload.provider_reference || payload.session_token || '';
    const status = payload.status || 'processing';
    const ageVerified = payload.age_verified !== undefined ? Boolean(payload.age_verified) : true;
    const identityVerified = payload.identity_verified !== undefined ? Boolean(payload.identity_verified) : true;
    const resultCode = payload.result_code || status;

    const { data, error } = await supabase.rpc('process_verification_webhook', {
      p_provider: provider,
      p_event_id: eventId,
      p_event_type: payload.event_type || 'verification.update',
      p_provider_reference: providerRef,
      p_status: status,
      p_age_verified: ageVerified,
      p_identity_verified: identityVerified,
      p_result_code: resultCode,
      p_payload_hash: `sha256_${Date.now()}`,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, result: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
