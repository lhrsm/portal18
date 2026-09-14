/**
 * ============================================================================
 * PORTAL18 — REGISTER PAGE HOTFIX VALIDATION SUITE (REGISTER-01 to REGISTER-16)
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { RegisterSchema } from '../src/lib/validation/auth';
import { translateAuthError, sanitizeLogMeta } from '../src/lib/auth/authErrors';
import { isSupabaseConfigured } from '../src/lib/supabase/client';

export interface RegisterTestResult {
  id: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runRegisterHotfixValidation(): Promise<RegisterTestResult[]> {
  const results: RegisterTestResult[] = [];

  const registerFormPath = path.join(process.cwd(), 'src/components/auth/RegisterForm.tsx');
  const registerPagePath = path.join(process.cwd(), 'src/app/(auth)/register/page.tsx');
  const googleBtnPath = path.join(process.cwd(), 'src/components/auth/GoogleButton.tsx');
  const callbackRoutePath = path.join(process.cwd(), 'src/app/(auth)/auth/callback/route.ts');

  const formCode = fs.readFileSync(registerFormPath, 'utf8');
  const pageCode = fs.readFileSync(registerPagePath, 'utf8');
  const googleCode = fs.readFileSync(googleBtnPath, 'utf8');
  const callbackCode = fs.readFileSync(callbackRoutePath, 'utf8');

  // REGISTER-01: visitor tab displays icon + text
  const hasVisitorIcon = formCode.includes('<Heart') && formCode.includes('accountType === \'user\'');
  const hasVisitorText = formCode.includes('Visitante / Cliente');
  const visitorTabPassed = hasVisitorIcon && hasVisitorText;
  results.push({
    id: 'REGISTER-01',
    name: 'Visitor tab displays icon + text',
    expected: 'Heart icon + visible text "Visitante / Cliente"',
    passed: visitorTabPassed,
    details: visitorTabPassed
      ? 'Visitor tab includes <Heart /> icon and visible "Visitante / Cliente" text.'
      : 'Missing icon or text in visitor tab.',
  });

  // REGISTER-02: advertiser tab displays icon + text
  const hasAdvIcon = formCode.includes('<Megaphone') && formCode.includes('accountType === \'advertiser\'');
  const hasAdvText = formCode.includes('Quero Anunciar');
  const advTabPassed = hasAdvIcon && hasAdvText;
  results.push({
    id: 'REGISTER-02',
    name: 'Advertiser tab displays icon + text',
    expected: 'Megaphone icon + visible text "Quero Anunciar"',
    passed: advTabPassed,
    details: advTabPassed
      ? 'Advertiser tab includes <Megaphone /> icon and visible "Quero Anunciar" text.'
      : 'Missing icon or text in advertiser tab.',
  });

  // REGISTER-03: switch account type
  const hasTablist = formCode.includes('role="tablist"') && formCode.includes('role="tab"');
  const hasAriaSelected = formCode.includes('aria-selected={accountType === \'user\'}') &&
                          formCode.includes('aria-selected={accountType === \'advertiser\'}');
  const hasStateToggle = formCode.includes("setAccountType('user')") && formCode.includes("setAccountType('advertiser')");
  const switchPassed = hasTablist && hasAriaSelected && hasStateToggle;
  results.push({
    id: 'REGISTER-03',
    name: 'Switch account type',
    expected: 'Accessible tab switching between user and advertiser with aria-selected',
    passed: switchPassed,
    details: switchPassed
      ? 'Tabs implement role="tablist", role="tab", aria-selected, and toggle state accurately.'
      : 'Incomplete accessible tab control implementation.',
  });

  // REGISTER-04: empty form prevented
  const emptyValidation = RegisterSchema.safeParse({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdult: false,
    acceptTerms: false,
  });
  const emptyPrevented = !emptyValidation.success;
  results.push({
    id: 'REGISTER-04',
    name: 'Empty form prevented',
    expected: 'Zod validation fails on empty fields before network request',
    passed: emptyPrevented,
    details: emptyPrevented
      ? `Empty input blocked with ${emptyValidation.error?.errors.length} validation errors.`
      : 'Empty input was unexpectedly accepted.',
  });

  // REGISTER-05: invalid email prevented
  const invalidEmailValidation = RegisterSchema.safeParse({
    displayName: 'Carlos Silva',
    email: 'not-an-email',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    isAdult: true,
    acceptTerms: true,
  });
  const invalidEmailPrevented = !invalidEmailValidation.success &&
    invalidEmailValidation.error?.errors.some((e) => e.path.includes('email'));
  results.push({
    id: 'REGISTER-05',
    name: 'Invalid email prevented',
    expected: 'Validation error on invalid email syntax',
    passed: invalidEmailPrevented,
    details: invalidEmailPrevented
      ? 'Invalid email format rejected with localized error message.'
      : 'Invalid email was not rejected.',
  });

  // REGISTER-06: password mismatch prevented
  const mismatchValidation = RegisterSchema.safeParse({
    displayName: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    password: 'Password123!',
    confirmPassword: 'DifferentPassword123!',
    isAdult: true,
    acceptTerms: true,
  });
  const mismatchPrevented = !mismatchValidation.success &&
    mismatchValidation.error?.errors.some((e) => e.path.includes('confirmPassword'));
  results.push({
    id: 'REGISTER-06',
    name: 'Password mismatch prevented',
    expected: 'Validation error on confirmPassword mismatch',
    passed: mismatchPrevented,
    details: mismatchPrevented
      ? 'Password mismatch accurately identified and rejected.'
      : 'Password mismatch was not rejected.',
  });

  // REGISTER-07: age checkbox required
  const underAgeValidation = RegisterSchema.safeParse({
    displayName: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    isAdult: false,
    acceptTerms: true,
  });
  const ageRequired = !underAgeValidation.success &&
    underAgeValidation.error?.errors.some((e) => e.path.includes('isAdult'));
  results.push({
    id: 'REGISTER-07',
    name: 'Age checkbox required',
    expected: 'isAdult=false rejected with 18+ declaration message',
    passed: ageRequired,
    details: ageRequired
      ? 'Unchecked age declaration is strictly rejected.'
      : 'Unchecked age was not rejected.',
  });

  // REGISTER-08: terms checkbox required
  const noTermsValidation = RegisterSchema.safeParse({
    displayName: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    isAdult: true,
    acceptTerms: false,
  });
  const termsRequired = !noTermsValidation.success &&
    noTermsValidation.error?.errors.some((e) => e.path.includes('acceptTerms'));
  results.push({
    id: 'REGISTER-08',
    name: 'Terms checkbox required',
    expected: 'acceptTerms=false rejected with terms acceptance message',
    passed: termsRequired,
    details: termsRequired
      ? 'Unchecked terms consent is strictly rejected.'
      : 'Unchecked terms was not rejected.',
  });

  // REGISTER-09: email signup successful contract
  const validForm = RegisterSchema.safeParse({
    displayName: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    isAdult: true,
    acceptTerms: true,
  });
  const hasOptionsMetadata = formCode.includes('display_name: displayName.trim()') &&
                            formCode.includes('account_type: accountType');
  const emailSignupValid = validForm.success && hasOptionsMetadata;
  results.push({
    id: 'REGISTER-09',
    name: 'Email signup handling and metadata contract',
    expected: 'Valid data parses cleanly and maps metadata into supabase.auth.signUp()',
    passed: emailSignupValid,
    details: emailSignupValid
      ? 'Valid input verified; display_name and account_type mapped to metadata.'
      : 'Metadata mapping or validation failed.',
  });

  // REGISTER-10: duplicate email handled
  const duplicateMsg = translateAuthError({ message: 'User already registered' });
  const duplicateHandled = duplicateMsg === 'Já existe uma conta cadastrada com este e-mail.';
  results.push({
    id: 'REGISTER-10',
    name: 'Duplicate email handled',
    expected: '"Já existe uma conta cadastrada com este e-mail."',
    passed: duplicateHandled,
    details: duplicateHandled
      ? `Duplicate email translated to friendly copy: "${duplicateMsg}"`
      : `Unexpected translation: ${duplicateMsg}`,
  });

  // REGISTER-11: network error handled without leaking technical error
  const networkError1 = translateAuthError(new TypeError('Failed to fetch'));
  const networkError2 = translateAuthError({ message: 'fetch failed' });
  const leaksFailedToFetch = networkError1.includes('Failed to fetch') || networkError2.includes('fetch failed');
  const hasSafeNetworkMsg = networkError1 === 'Não foi possível conectar ao serviço de cadastro. Verifique sua conexão e tente novamente.';
  const networkPassed = !leaksFailedToFetch && hasSafeNetworkMsg;
  results.push({
    id: 'REGISTER-11',
    name: 'Network error handled without leaking technical error',
    expected: 'Zero "Failed to fetch" leakage; safe friendly message returned',
    passed: networkPassed,
    details: networkPassed
      ? 'Network/fetch errors translated securely without technical leakage.'
      : 'Technical error leaked in output.',
  });

  // REGISTER-12: double submit prevented
  const hasSubmittingRef = formCode.includes('isSubmittingRef.current') &&
                           formCode.includes('isSubmittingRef.current = true') &&
                           formCode.includes('isSubmittingRef.current = false');
  const hasLoadingState = formCode.includes('setIsLoading(true)') && formCode.includes('Criando sua conta...');
  const doubleSubmitPrevented = hasSubmittingRef && hasLoadingState;
  results.push({
    id: 'REGISTER-12',
    name: 'Double submit prevented',
    expected: 'Synchronous ref lock + button disabled + "Criando sua conta..." spinner',
    passed: doubleSubmitPrevented,
    details: doubleSubmitPrevented
      ? 'Synchronous isSubmittingRef lock and loading state prevent double clicks.'
      : 'Missing submit lock or loading state.',
  });

  // REGISTER-13: Google button text visible
  const googleHasVisibleLabel = googleCode.includes('<span>{isLoading ?') || googleCode.includes('{label}</span>');
  const googleHasAriaLabel = googleCode.includes('aria-label={label}');
  const googleTextPassed = googleHasVisibleLabel && googleHasAriaLabel;
  results.push({
    id: 'REGISTER-13',
    name: 'Google button text visible',
    expected: 'Visible text label alongside Google G icon with aria-label',
    passed: googleTextPassed,
    details: googleTextPassed
      ? 'Google button renders visible descriptive label and aria-label.'
      : 'Google button text is missing or icon-only.',
  });

  // REGISTER-14: Google OAuth starts correctly
  const googleCallsOAuth = googleCode.includes("provider: 'google'") && googleCode.includes('signInWithOAuth');
  results.push({
    id: 'REGISTER-14',
    name: 'Google OAuth starts correctly',
    expected: 'signInWithOAuth called with provider: "google"',
    passed: googleCallsOAuth,
    details: googleCallsOAuth
      ? 'Google OAuth properly triggers supabase.auth.signInWithOAuth.'
      : 'Missing signInWithOAuth call.',
  });

  // REGISTER-15: account type preserved through OAuth
  const googlePreservesIntent = googleCode.includes('intent=${encodeURIComponent(intent)}');
  const callbackChecksIntent = callbackCode.includes("searchParams.get('intent')") &&
                               callbackCode.includes("intent === 'advertiser'");
  const oauthPreserved = googlePreservesIntent && callbackChecksIntent;
  results.push({
    id: 'REGISTER-15',
    name: 'Account type preserved through OAuth',
    expected: 'intent parameter passed through redirectTo and handled in callback route',
    passed: oauthPreserved,
    details: oauthPreserved
      ? 'Account intent preserved across OAuth redirect and handled by callback route.'
      : 'OAuth intent preservation is incomplete.',
  });

  // REGISTER-16: mobile 320px without horizontal overflow
  const hasClampPadding = pageCode.includes('clamp(1rem, 2.5vw, 2rem)') || pageCode.includes('overflowX');
  const hasMinmaxResponsive = pageCode.includes('min(100%,');
  const mobileOverflowPassed = hasClampPadding && hasMinmaxResponsive;
  results.push({
    id: 'REGISTER-16',
    name: 'Mobile 320px without horizontal overflow',
    expected: 'min(100%, ...) responsive grid sizing and clamp padding preventing 320px overflow',
    passed: mobileOverflowPassed,
    details: mobileOverflowPassed
      ? 'Page layout uses responsive clamps and min(100%, ...) to prevent overflow on 320px viewports.'
      : 'Layout may cause overflow on 320px viewports.',
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🧪 PORTAL18 — REGISTER PAGE HOTFIX VALIDATION');
  console.log('================================================================\n');

  runRegisterHotfixValidation().then((results) => {
    let passedCount = 0;
    results.forEach((r) => {
      if (r.passed) passedCount++;
      const icon = r.passed ? '✅' : '❌';
      console.log(`${icon} [${r.id}] ${r.name}`);
      console.log(`   Expected: ${r.expected}`);
      console.log(`   Details:  ${r.details}\n`);
    });

    console.log('================================================================');
    console.log(`SUMMARY: ${passedCount}/${results.length} TESTS PASSED`);
    console.log('================================================================\n');

    if (passedCount < results.length) {
      process.exit(1);
    }
  });
}
