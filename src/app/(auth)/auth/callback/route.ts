import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SAFE_INTERNAL_PREFIXES = [
  '/account',
  '/advertiser',
  '/explorar',
  '/perfil',
  '/acompanhantes',
  '/categoria',
  '/help',
  '/trust',
  '/status',
  '/',
];

function sanitizeRedirectUrl(urlParam: string | null, defaultFallback: string): string {
  if (!urlParam) return defaultFallback;

  // Prevent Open Redirects: must start with single '/' and NOT with '//' or containing protocols like 'https:' or 'javascript:'
  if (!urlParam.startsWith('/') || urlParam.startsWith('//') || urlParam.includes('\\') || urlParam.includes(':')) {
    return defaultFallback;
  }

  const isSafe = SAFE_INTERNAL_PREFIXES.some((prefix) => urlParam.startsWith(prefix));
  return isSafe ? urlParam : defaultFallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const intent = searchParams.get('intent') || 'user';
  const rawNext = searchParams.get('next');

  const defaultDestination = intent === 'advertiser' ? '/advertiser/onboarding' : '/account';
  const safeNext = sanitizeRedirectUrl(rawNext, defaultDestination);

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (!sessionError && sessionData.user) {
      const authUser = sessionData.user;

      // 1. Resolve Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, account_type')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (profile) {
        const profileId = (profile as { id: string; account_type: string }).id;

        // 2. Check Legal Consents
        const { data: consents } = await supabase
          .from('consent_records')
          .select('consent_type')
          .eq('profile_id', profileId)
          .eq('revoked', false);

        const consentTypes = (consents || []).map((c: any) => c.consent_type);
        const has18 = consentTypes.includes('age_18_verification');
        const hasTerms = consentTypes.includes('terms_of_service');

        // If consents are missing (fresh Google login), forward to complete-profile gate
        if (!has18 || !hasTerms) {
          const completeProfileUrl = `${origin}/auth/complete-profile?intent=${encodeURIComponent(intent)}&next=${encodeURIComponent(safeNext)}`;
          return NextResponse.redirect(completeProfileUrl);
        }

        // 3. Handle Advertiser Intent
        if (intent === 'advertiser') {
          // Attempt idempotent become_advertiser conversion
          await (supabase.rpc as any)('become_advertiser', {
            p_terms_accepted: true,
            p_is_adult: true,
          });
          return NextResponse.redirect(`${origin}/advertiser/onboarding`);
        }
      }

      // Safe canonical destination
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return the user to login with error explanation if code exchange failed or was cancelled
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
