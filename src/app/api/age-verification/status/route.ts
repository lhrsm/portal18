import { NextRequest, NextResponse } from 'next/server';
import { ageSessionService } from '@/services/ageVerification/ageSessionService';

export async function GET(req: NextRequest) {
  const cookieValue = req.cookies.get(ageSessionService.cookieName)?.value;
  const session = ageSessionService.parseSession(cookieValue);
  const isValid = ageSessionService.isSessionValid(session);

  return NextResponse.json({
    verified: isValid,
    ageBand: session?.age_band || 'unknown',
    provider: session?.provider || null,
    expiresAt: session?.expires_at ? new Date(session.expires_at).toISOString() : null,
  });
}
