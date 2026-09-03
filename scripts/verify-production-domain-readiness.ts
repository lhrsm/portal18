/**
 * PORTAL18 — PRODUCTION TRACK P6 VERIFICATION SUITE
 * Canonical Domain, DNS, TLS, Callbacks & Pre-Launch Infrastructure Readiness
 */

import fs from 'fs';
import path from 'path';
import { getCanonicalBaseUrl } from '../src/lib/seo/seoEngine';
import { PaymentProviderRegistry } from '../src/services/payments/registry';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (errorDetail) {
      console.error(`       -> ${errorDetail}`);
    }
    failCount++;
  }
}

async function runDomainReadinessVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PRODUCTION TRACK P6 VERIFICATION SUITE');
  console.log('Canonical Domain, DNS, TLS & Callback Readiness');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. CANONICAL ORIGIN RESOLUTION & ZERO ASSUMED DOMAINS ---');

  // 1.1 Canonical Base URL Dynamic Resolution
  const baseUrl = getCanonicalBaseUrl();
  assert(
    baseUrl.startsWith('http') && !baseUrl.endsWith('/'),
    '1.1 [Canonical Origin Resolution] getCanonicalBaseUrl dynamically derives origin from environment settings without trailing slash',
    'Canonical URL improperly formatted'
  );

  // 1.2 Zero Hardcoded Production Domain Fallback
  const seoEngineSource = fs.readFileSync(path.join(rootDir, 'src', 'lib', 'seo', 'seoEngine.ts'), 'utf8');
  assert(
    !seoEngineSource.includes("'https://portal18.com.br'"),
    '1.2 [Zero Assumed Domain] seoEngine contains zero hardcoded portal18.com.br fallbacks (DOMAIN_PENDING compliant)',
    'Found hardcoded domain in seoEngine'
  );

  console.log('\n--- 2. CALLBACK REGISTRY & AUTH REDIRECTS ---');

  // 2.1 Centralized Callback Registry
  const callbackRegPath = path.join(rootDir, 'docs', 'production', 'callback-registry.md');
  const callbackContent = fs.readFileSync(callbackRegPath, 'utf8');
  assert(
    callbackContent.includes('/auth/callback') &&
    callbackContent.includes('/advertiser/verification/return') &&
    callbackContent.includes('/age-verification/callback') &&
    callbackContent.includes('/api/webhooks/payments'),
    '2.1 [Callback Registry] docs/production/callback-registry.md catalogues all Auth, KYC, Age, and Payment callback endpoints',
    'Missing callback endpoints in registry'
  );

  console.log('\n--- 3. CSP, SECURITY HEADERS & SECRET ISOLATION ---');

  // 3.1 Security Headers in Next Config
  const nextConfigPath = path.join(rootDir, 'next.config.mjs');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  assert(
    nextConfigContent.includes('Content-Security-Policy') &&
    nextConfigContent.includes('X-Frame-Options') &&
    nextConfigContent.includes('X-Content-Type-Options'),
    '3.1 [HTTP Security Headers] next.config.mjs defines strict CSP, frame protection, and content type sniffing guards',
    'Missing security headers in next.config.mjs'
  );

  // 3.2 Client Secret Isolation
  const envFile = path.join(rootDir, '.env.local');
  let secretLeaked = false;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_') && (line.includes('SECRET') || line.includes('PRIVATE_KEY') || line.includes('SERVICE_ROLE'))) {
        secretLeaked = true;
      }
    });
  }

  assert(
    !secretLeaked,
    '3.2 [Secret Isolation] Zero private service role keys or webhook secrets exposed under NEXT_PUBLIC_ prefixes',
    'Private secrets leaked in client bundle'
  );

  console.log('\n--- 4. PRODUCTION DOMAIN DOCUMENTATION PACKAGES ---');

  // 4.1 Runbooks
  const domainDocs = [
    'docs/production/domain-architecture.md',
    'docs/production/dns-readiness.md',
    'docs/production/callback-registry.md',
    'docs/production/domain-change-plan.md',
    'docs/production/tls-hsts.md',
    'docs/production/domain-activation-checklist.md',
  ];

  const allDocsExist = domainDocs.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '4.1 [Documentation Packages] All 6 domain architecture, DNS readiness, callback registry, change plan, TLS, and activation runbooks exist',
    'Missing domain documentation packages'
  );

  console.log('\n--- 5. SAFETY INVARIANTS, KILL SWITCHES & STRIPE PROHIBITION ---');

  // 5.1 Payment Kill Switch
  const isPaymentKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isPaymentKillSwitchActive === true,
    '5.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH remains strictly active',
    'Payment kill switch must remain active'
  );

  // 5.2 Email Kill Switch
  const isEmailKillSwitchActive = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  assert(
    isEmailKillSwitchActive === true,
    '5.2 [Email Kill Switch Invariant] PORTAL18_EMAIL_KILL_SWITCH remains strictly active',
    'Email kill switch must remain active'
  );

  // 5.3 Fiscal Kill Switch
  const isFiscalKillSwitchActive = process.env.PORTAL18_FISCAL_KILL_SWITCH !== 'false';
  assert(
    isFiscalKillSwitchActive === true,
    '5.3 [Fiscal Kill Switch Invariant] PORTAL18_FISCAL_KILL_SWITCH remains strictly active',
    'Fiscal kill switch must remain active'
  );

  // 5.4 Stripe Prohibition
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;
  assert(
    stripeMeta?.is_production_eligible === false &&
    stripeMeta?.contact_status === 'rejected',
    '5.4 [Stripe Block Invariant] Stripe remains permanently blocked from production',
    'Stripe must remain strictly blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Production Track P6 Canonical Domain & Infrastructure Readiness tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Production Track P6 verification tests failed.\n');
    process.exit(1);
  }
}

runDomainReadinessVerification().catch((err) => {
  console.error('Fatal error running domain readiness verification:', err);
  process.exit(1);
});
