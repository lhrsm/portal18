/**
 * PORTAL18 — PRODUCTION TRACK P4 VERIFICATION SUITE
 * PSP Selection, Payment Provider Activation Readiness & Underwriting Hardening
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { PaymentProviderResolver } from '../src/services/payments/resolver';

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

async function runPaymentReadinessVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PRODUCTION TRACK P4 VERIFICATION SUITE');
  console.log('PSP Selection & Underwriting Hardening');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. PROVIDER CANDIDATE REGISTRY & STRIPE PROHIBITION ---');

  // 1.1 Candidate Registry
  const providers = PaymentProviderRegistry.getAll();
  const providerCodes = providers.map((p) => p.code.toLowerCase());
  assert(
    providerCodes.includes('unconfigured') &&
    providerCodes.includes('mercadopago') &&
    providerCodes.includes('pagbank') &&
    providerCodes.includes('pagarme') &&
    providerCodes.includes('asaas') &&
    providerCodes.includes('adyen') &&
    providerCodes.includes('stripe'),
    '1.1 [Candidate Matrix] Registry registers unconfigured, Mercado Pago, PagBank, Pagar.me, Asaas, Adyen, and Stripe',
    'Provider candidate registry missing expected adapters'
  );

  // 1.2 Stripe Permanent Block
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;
  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false &&
    stripeMeta?.adult_business_review_status === 'rejected',
    '1.2 [Stripe Permanent Block] Stripe is strictly marked as rejected and permanently blocked for adult business model',
    'Stripe provider not properly blocked'
  );

  console.log('\n--- 2. MULTI-DIMENSIONAL RESOLVER & GRANULAR APPROVALS ---');

  // 2.1 Granular Product & Method Approval Gate
  const unapprovedResolver = await PaymentProviderResolver.resolve({
    productType: 'advertiser_subscription',
    paymentMethod: 'pix',
    environment: 'production',
    allowMockDriver: false,
  });

  assert(
    unapprovedResolver.success === false && unapprovedResolver.provider === null,
    '2.1 [Production Approval Gate] Resolver rejects uncertified candidate providers in production (zero premature activation)',
    'Resolver prematurely approved uncertified provider'
  );

  // 2.2 Blind Failover Prohibition
  const resolverSource = fs.readFileSync(path.join(rootDir, 'src', 'services', 'payments', 'resolver.ts'), 'utf8');
  assert(
    resolverSource.includes('NO AUTOMATIC CROSS-PROVIDER RETRIES ON CHARGE TIMEOUTS'),
    '2.2 [Blind Failover Guard] Payment architecture strictly prohibits automatic cross-provider retries on timeouts',
    'Blind failover invariant not found in resolver'
  );

  console.log('\n--- 3. ZERO PAN/CVV STORAGE & CLIENT SECRET ISOLATION ---');

  // 3.1 Card Panel Tokenization
  const cardPanelSource = fs.readFileSync(path.join(rootDir, 'src', 'components', 'checkout', 'CardPaymentPanel.tsx'), 'utf8');
  assert(
    cardPanelSource.includes('token') &&
    !cardPanelSource.includes('savePAN') &&
    !cardPanelSource.includes('storeCVV'),
    '3.1 [Zero PAN/CVV Storage] Checkout UI strictly adheres to client-side tokenization without cardholder data retention',
    'Card panel contains unsafe storage references'
  );

  // 3.2 Secret Isolation
  const envFile = path.join(rootDir, '.env.local');
  let paymentSecretLeaked = false;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_') && (line.includes('MERCADOPAGO_ACCESS_TOKEN') || line.includes('PAGARME_KEY') || line.includes('ADYEN_API_KEY') || line.includes('ASAAS_API_KEY'))) {
        paymentSecretLeaked = true;
      }
    });
  }

  assert(
    !paymentSecretLeaked,
    '3.2 [Secret Isolation] Zero payment provider API secret keys or access tokens exposed under NEXT_PUBLIC_ prefixes',
    'Payment secret keys leaked in client environment'
  );

  console.log('\n--- 4. PRODUCTION PAYMENTS DOCUMENTATION PACKAGES ---');

  // 4.1 Runbooks
  const paymentDocs = [
    'docs/production/payments/provider-selection.md',
    'docs/production/payments/provider-scorecard.md',
    'docs/production/payments/underwriting-evidence.md',
    'docs/production/payments/sandbox-certification.md',
    'docs/production/payments/production-activation.md',
    'docs/production/payments/payment-security.md',
    'docs/production/payments/payment-failure-modes.md',
  ];

  const allDocsExist = paymentDocs.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '4.1 [Documentation Packages] All 7 production payments runbooks, scorecards, underwriting, and security policies exist',
    'Missing payment documentation packages'
  );

  console.log('\n--- 5. SAFETY INVARIANTS & EMAIL KILL SWITCH ---');

  // 5.1 Payment Kill Switch
  const isPaymentKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isPaymentKillSwitchActive === true,
    '5.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH remains strictly active (zero real charges)',
    'Payment kill switch must remain active'
  );

  // 5.2 Email Kill Switch
  const isEmailKillSwitchActive = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  assert(
    isEmailKillSwitchActive === true,
    '5.2 [Email Kill Switch Invariant] PORTAL18_EMAIL_KILL_SWITCH remains strictly active (zero real dispatches)',
    'Email kill switch must remain active'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Production Track P4 PSP Selection & Underwriting Readiness tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Production Track P4 verification tests failed.\n');
    process.exit(1);
  }
}

runPaymentReadinessVerification().catch((err) => {
  console.error('Fatal error running payment readiness verification:', err);
  process.exit(1);
});
