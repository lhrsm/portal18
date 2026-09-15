import { NextRequest, NextResponse } from 'next/server';
import { AgeVerificationFactory } from '@/services/ageVerification/factory';
import { ageVerificationService } from '@/services/ageVerification/ageVerificationService';

export async function POST(req: NextRequest) {
  try {
    let body: { returnUrl?: string; isReturningVisitor?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const safeReturnUrl = ageVerificationService.sanitizeReturnUrl(body.returnUrl);
    const provider = AgeVerificationFactory.getProvider();

    const response = await provider.initiateVerification({
      returnUrl: safeReturnUrl,
      isReturningVisitor: Boolean(body.isReturningVisitor),
    });

    if (process.env.NODE_ENV !== 'test') {
      const category = response.diagnosticCategory || 'SUCCESS';
      console.log(
        `[AGE_ASSURANCE_START_DIAGNOSTIC] correlationId=${response.state} provider=${response.provider} category=${category}`
      );
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error starting age verification session:', err);
    return NextResponse.json(
      {
        redirectUrl: '/age-verification?status=unavailable&reason=AGE_PROVIDER_EXCEPTION',
        sessionId: `err-${Date.now()}`,
        state: 'error',
        provider: 'unconfigured',
        diagnosticCategory: 'AGE_PROVIDER_EXCEPTION',
        error: 'Falha ao iniciar verificação com o provedor.',
      },
      { status: 500 }
    );
  }
}
