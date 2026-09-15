import { NextRequest, NextResponse } from 'next/server';
import { AgeVerificationFactory } from '@/services/ageVerification/factory';
import { ageSessionService } from '@/services/ageVerification/ageSessionService';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    let body: {
      sessionId?: string;
      code?: string;
      token?: string;
      state?: string;
      returnUrl?: string;
    } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const safeReturnUrl = ageVerificationService.sanitizeReturnUrl(body.returnUrl);
    const provider = AgeVerificationFactory.getProvider();

    // 1. Server-Side Provider Validation (Fail-Closed)
    const result = await provider.validateCallback({
      sessionId: body.sessionId,
      code: body.code,
      token: body.token,
      state: body.state,
    });

    // 2. Decision Evaluation
    if (result.verified && result.ageBand === '18_plus') {
      const { serialized } = ageSessionService.createSignedSession(result);

      // Persist Credential Record (without raw PII or biometric media)
      try {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('record_age_assurance_credential', {
          p_provider: result.provider,
          p_provider_subject_hash: result.providerSubjectHash,
          p_age_band: result.ageBand,
          p_assurance_level: result.assuranceLevel,
          p_credential_reference: result.credentialReference || null,
          p_expires_at: result.expiresAt || null,
        });
      } catch (dbErr) {
        console.warn('Could not record age credential in database:', dbErr);
      }

      // Build JSON response with HttpOnly, Secure, SameSite=Lax cookie
      const res = NextResponse.json({
        verified: true,
        ageBand: '18_plus',
        redirectUrl: safeReturnUrl,
        credentialReference: result.credentialReference,
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const maxAgeSeconds = 30 * 86400; // 30 days

      res.cookies.set(ageSessionService.cookieName, serialized, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
      });

      return res;
    }

    // 3. Fail-Closed: Underage, In Review, or Validation Failure
    const failureStatus = result.ageBand === 'under_18' ? 'underage' : 'failed';
    const redirectUrl = `/age-verification?status=${failureStatus}&returnUrl=${encodeURIComponent(safeReturnUrl)}`;

    const res = NextResponse.json(
      {
        verified: false,
        ageBand: result.ageBand,
        redirectUrl,
        error: result.error || 'Idade não confirmada pelo provedor.',
      },
      { status: 400 }
    );

    // Ensure any existing invalid/expired age session cookie is cleared
    res.cookies.set(ageSessionService.cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (err: any) {
    console.error('Fatal error in age verification verify-session endpoint:', err);
    return NextResponse.json(
      {
        verified: false,
        ageBand: 'unknown',
        redirectUrl: '/age-verification?status=failed',
        error: 'Erro interno ao validar sessão de maioridade.',
      },
      { status: 500 }
    );
  }
}
