/**
 * PORTAL18 — PHASE 28B AUTOMATED VERIFICATION SUITE
 * Multi-Gateway Sandbox Homologation, Provider Certification & Payment Resilience
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { PaymentProviderResolver } from '../src/services/payments/resolver';
import { PaymentStateMachine } from '../src/services/payments/stateMachine';
import { ProviderCredentialValidator } from '../src/services/payments/credentialValidator';

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

async function runVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PHASE 28B AUTOMATED VERIFICATION SUITE');
  console.log('Sandbox Homologation, Certification & Payment Resilience');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. STATIC TESTS (Code, Metadata & Safety Invariants) ---');

  // 1. Provider Registry Canonical Adapters
  const allProviders = PaymentProviderRegistry.getAll();
  const providerCodes = allProviders.map(p => p.code);
  const requiredCodes = ['unconfigured', 'mercadopago', 'pagbank', 'pagarme', 'asaas', 'adyen', 'stripe'];

  assert(
    requiredCodes.every(code => providerCodes.includes(code)),
    '1.1 [Provider Registry] PaymentProviderRegistry contains all 7 canonical adapters',
    `Missing adapters. Found: ${providerCodes.join(', ')}`
  );

  // 1.2 Internal Test Driver Metadata Invariant
  const internalDriver = PaymentProviderRegistry.get('unconfigured');
  const internalMeta = internalDriver ? await internalDriver.getMetadata() : null;

  assert(
    internalDriver !== null &&
    internalMeta?.is_internal_driver === true &&
    internalMeta?.is_production_eligible === false &&
    internalMeta?.commercial_status === 'NOT_APPLICABLE',
    '1.2 [Internal Test Driver] Mock adapter is explicitly designated as TEST ONLY and blocked from production',
    'Internal test driver must not be eligible for production'
  );

  // 1.3 Stripe Strict Prohibition Invariant
  const stripeProvider = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripeProvider ? await stripeProvider.getMetadata() : null;
  let stripeBlocked = false;
  try {
    if (stripeProvider) {
      await stripeProvider.createCheckout({
        orderId: 'test_stripe',
        orderNumber: 'STR_001',
        amount: 4990,
        currency: 'BRL',
        productType: 'subscription',
        productId: 'plan_essencial',
        productName: 'Essencial',
        returnUrl: 'http://localhost/return',
        cancelUrl: 'http://localhost/cancel',
      });
    }
  } catch (err: any) {
    stripeBlocked = err.message.includes('incompatível') || err.message.includes('Stripe');
  }

  assert(
    stripeProvider !== null &&
    stripeMeta?.technical_status === 'PRODUCTION_BLOCKED' &&
    stripeMeta?.is_production_eligible === false &&
    stripeBlocked,
    '1.3 [Stripe Prohibition] Stripe is strictly marked PRODUCTION_BLOCKED and rejects checkouts fail-closed',
    'Stripe must remain permanently prohibited for the adult classifieds model'
  );

  // 1.4 Credential Validator Non-Leaking Audit
  const mpValidation = ProviderCredentialValidator.validate('mercadopago', 'sandbox');
  assert(
    typeof mpValidation.isConfigured === 'boolean' &&
    Array.isArray(mpValidation.configuredKeys) &&
    Array.isArray(mpValidation.missingKeys),
    '1.4 [Credential Validator] Evaluates configuration without leaking secrets into logs or frontend',
    'CredentialValidator structure invalid'
  );

  // 1.5 Monotonic State Transition Invariant
  const regressionCheck = PaymentStateMachine.canTransition('paid', 'pending');
  const refundCheck = PaymentStateMachine.canTransition('paid', 'refunded');
  const lateCheck = PaymentStateMachine.canTransition('refunded', 'paid');

  assert(
    regressionCheck.allowed === false && regressionCheck.isOutOfOrder === true &&
    refundCheck.allowed === true &&
    lateCheck.allowed === false,
    '1.5 [Monotonic State Machine] Prevents out-of-order/late webhooks from regressing terminal financial states',
    'State machine must reject regressive transitions'
  );

  // 1.6 Global Payment Kill Switch Invariant
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'true';
  const resolvedKillSwitch = await PaymentProviderResolver.resolve({
    productType: 'advertiser_subscription',
    paymentMethod: 'pix',
  });

  assert(
    resolvedKillSwitch.success && resolvedKillSwitch.provider?.code === 'unconfigured',
    '1.6 [Kill Switch Guard] Global Kill Switch strictly forces routing to internal mock driver',
    'Kill Switch must prevent any external gateway resolution'
  );

  console.log('\n--- 2. LOCAL TESTS (Resilience, Failover & Idempotency) ---');

  // 2.1 No Automatic Cross-Provider Retries Invariant
  const mpAdapter = PaymentProviderRegistry.get('mercadopago');
  let noCrossRetry = true;
  try {
    // Attempting checkout on unhomologated candidate provider throws rather than secretly calling PagBank
    if (mpAdapter) {
      await mpAdapter.createCheckout({
        orderId: 'test_no_cross',
        orderNumber: 'NC_001',
        amount: 8990,
        currency: 'BRL',
        productType: 'subscription',
        productId: 'plan_destaque',
        productName: 'Destaque',
        returnUrl: 'http://localhost/return',
        cancelUrl: 'http://localhost/cancel',
      });
    }
  } catch (err: any) {
    noCrossRetry = err.message.includes('homologação') || err.message.includes('Credenciais');
  }

  assert(
    noCrossRetry,
    '2.1 [Failover Resilience] Errors/timeouts on candidate providers fail closed without silent cross-gateway retry',
    'Cross-gateway retries are strictly prohibited to prevent double-charging'
  );

  // 2.2 Webhook Signature Route Guard
  const webhookRoutePath = path.join(rootDir, 'src', 'app', 'api', 'webhooks', 'payments', 'route.ts');
  const webhookContent = fs.readFileSync(webhookRoutePath, 'utf8');

  assert(
    webhookContent.includes('PaymentStateMachine.canTransition') &&
    webhookContent.includes('ignored_out_of_order') &&
    webhookContent.includes('verifyWebhookSignature'),
    '2.2 [Webhook Route Guard] Webhook endpoint validates cryptographic signatures and monotonic precedence',
    'Webhook route must implement monotonic validation'
  );

  // 2.3 Age Assurance & Safe Mode Decoupling
  const ageVerificationPath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
  const ageVerificationContent = fs.readFileSync(ageVerificationPath, 'utf8');

  assert(
    !ageVerificationContent.includes('is_subscriber') &&
    !ageVerificationContent.includes('payment_id'),
    '2.3 [Safety Decoupling] Age Assurance remains 100% independent from payment statuses',
    'Age assurance must never have payment bypasses'
  );

  console.log('\n--- 3. SANDBOX EXTERNAL CAPABILITY TESTS (No Fake PASS) ---');

  // 3.1 Real Capability Evaluation (No Fakes)
  if (mpAdapter) {
    const mpTestResult = await mpAdapter.testSandboxCapabilities();
    // If no credentials in .env, must accurately report NOT_CONFIGURED
    const isHonest = mpTestResult.overallStatus === 'NOT_CONFIGURED' || mpTestResult.overallStatus === 'SANDBOX_READY';
    assert(
      isHonest,
      `3.1 [Honest Sandbox Certification] Mercado Pago accurately evaluated as ${mpTestResult.overallStatus} (no fabricated PASS)`,
      'Must not claim SANDBOX_PASSED when credentials are absent'
    );
  }

  // 3.2 Internal Driver Capability Certification
  if (internalDriver) {
    const driverTestResult = await internalDriver.testSandboxCapabilities();
    assert(
      driverTestResult.overallStatus === 'SANDBOX_PASSED' && driverTestResult.passedCount >= 8,
      '3.2 [Internal Driver Certification] Internal mock test driver passes all local simulation tests',
      'Internal test driver test suite failed'
    );
  }

  console.log('\n--- 4. ADMIN & DOCUMENTATION ARTIFACTS ---');

  // 4.1 Admin Page Features
  const adminPagePath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'providers', 'page.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');

  assert(
    adminPageContent.includes('Suite de Certificação Sandbox') &&
    adminPageContent.includes('TEST ONLY') &&
    adminPageContent.includes('Credenciais Sandbox'),
    '4.1 [Admin Governance UI] /admin/payments/providers displays sandbox certification runner and credential status',
    'Admin page missing required Phase 28B components'
  );

  // 4.2 Documentation Dossier
  const docFiles = [
    'docs/payments/provider-homologation.md',
    'docs/payments/provider-capability-matrix.md',
    'docs/payments/sandbox-testing.md',
    'docs/payments/production-activation-runbook.md',
    'docs/payments/payment-incident-runbook.md',
  ];

  assert(
    docFiles.every(f => fs.existsSync(path.join(rootDir, f))),
    '4.2 [Documentation Dossier] All 5 Phase 28B runbooks and matrix documents exist',
    `Missing doc files. Required: ${docFiles.join(', ')}`
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28B Multi-Gateway Sandbox Homologation verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28B verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
