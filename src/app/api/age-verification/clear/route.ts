import { NextResponse } from 'next/server';
import { ageSessionService } from '@/services/ageVerification/ageSessionService';

export async function POST() {
  const res = NextResponse.json({ cleared: true });
  res.cookies.set(ageSessionService.cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
