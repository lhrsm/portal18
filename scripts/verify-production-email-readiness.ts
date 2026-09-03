/**
 * PORTAL18 — PRODUCTION TRACK P2 VERIFICATION SUITE
 * Transactional Email Production Readiness
 */

import fs from 'fs';
import path from 'path';
import { emailProviderRegistry } from '../src/services/communications/emailProviderRegistry';
import { templateEngine } from '../src/services/communications/templateEngine';
import { DISCREET_TEMPLATES } from '../src/services/communication/emailProvider';
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

async function runEmailReadinessVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PRODUCTION TRACK P2 VERIFICATION SUITE');
  console.log('Transactional Email Production Readiness');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. PROVIDER REGISTRY & ADAPTER ABSTRACTION ---');

  // 1.1 Provider Registry
  const providers = emailProviderRegistry.getProviders();
  const providerCodes = providers.map((p) => p.code);
  assert(
    providerCodes.includes('unconfigured') &&
    providerCodes.includes('internal_mock') &&
    providerCodes.includes('resend') &&
    providerCodes.includes('ses') &&
    providerCodes.includes('smtp'),
    '1.1 [Provider Registry] Registry supports unconfigured, internal_mock, resend, ses, and smtp adapters',
    'Provider registry missing supported adapters'
  );

  // 1.2 Fail-Closed Kill Switch Enforcement
  const isKillSwitch = emailProviderRegistry.isKillSwitchActive();
  const dispatchRes = await emailProviderRegistry.sendEmail({
    to: 'test@portal18.homolog',
    subject: 'Teste de Notificação',
    html: '<p>Teste</p>',
    category: 'security',
  });

  assert(
    isKillSwitch === true && dispatchRes.status === 'disabled_by_policy' && dispatchRes.is_simulated === true,
    '1.2 [Fail-Closed Kill Switch] Dispatch strictly resolves to disabled_by_policy under PORTAL18_EMAIL_KILL_SWITCH = true',
    'Kill switch fail-closed validation failed'
  );

  console.log('\n--- 2. SUPPRESSION & BOUNCE HANDLING ---');

  // 2.1 Suppression Check
  const suppressedEmail = 'bounced-user@example.test';
  emailProviderRegistry.addSuppression(suppressedEmail, 'hard_bounce');
  const suppressedRes = await emailProviderRegistry.sendEmail({
    to: suppressedEmail,
    subject: 'Alerta',
    html: '<p>Teste</p>',
    category: 'account',
  });

  assert(
    suppressedRes.status === 'suppressed',
    '2.1 [Suppression Protection] Addresses in suppression list are blocked pre-dispatch (status: suppressed)',
    'Suppression check failed'
  );

  console.log('\n--- 3. TEMPLATE DISCRETION & SANITIZATION ---');

  // 3.1 Discreet Templates
  const templateKeys = Object.keys(DISCREET_TEMPLATES);
  const hasExplicitTerms = templateKeys.some((k) => {
    const t = DISCREET_TEMPLATES[k];
    const subj = t.subject.toLowerCase();
    return subj.includes('adulto') || subj.includes('sexo') || subj.includes('acompanhante');
  });

  assert(
    templateKeys.length >= 10 && !hasExplicitTerms,
    `3.1 [Discreet Subjects] All ${templateKeys.length} templates adhere to discreet lockscreen subjects with 0 explicit terms`,
    'Templates contain non-discreet subjects'
  );

  // 3.2 Template Sanitization
  const rendered = templateEngine.render('<p>Olá {{name}}</p><script>alert("xss")</script><iframe src="evil.com"></iframe>', {
    name: 'Carlos',
  });

  assert(
    rendered.includes('Carlos') && !rendered.includes('<script>') && !rendered.includes('<iframe>'),
    '3.2 [Template Sanitization] templateEngine sanitizes script and iframe injection tags',
    'Template tag sanitization failure'
  );

  console.log('\n--- 4. CLIENT SECRET EXPOSURE AUDIT ---');

  // 4.1 Secret Isolation
  const envFile = path.join(rootDir, '.env.local');
  let emailSecretLeaked = false;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_') && (line.includes('RESEND') || line.includes('SES') || line.includes('SMTP_PASS') || line.includes('SENDGRID'))) {
        emailSecretLeaked = true;
      }
    });
  }

  assert(
    !emailSecretLeaked,
    '4.1 [Secret Isolation] Zero email provider API keys or passwords exposed under NEXT_PUBLIC_ prefixes',
    'Email secrets exposed in client bundle'
  );

  console.log('\n--- 5. PRODUCTION EMAIL DOCUMENTATION PACKAGES ---');

  // 5.1 Runbooks
  const emailDocs = [
    'docs/production/email-architecture.md',
    'docs/production/email-provider-activation.md',
    'docs/production/email-domain-dns.md',
    'docs/production/email-deliverability.md',
    'docs/production/email-incident-response.md',
    'docs/production/email-auth-flows.md',
  ];

  const allDocsExist = emailDocs.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '5.1 [Documentation Packages] All 6 transactional email architecture, activation, deliverability, and incident runbooks exist',
    'Missing email documentation packages'
  );

  console.log('\n--- 6. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 6.1 Payment Kill Switch
  const isPaymentKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isPaymentKillSwitchActive === true,
    '6.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH remains strictly active',
    'Payment kill switch must remain active'
  );

  // 6.2 Stripe Block
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '6.2 [Stripe Block Invariant] Stripe remains permanently blocked from production',
    'Stripe must remain strictly blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Production Track P2 Transactional Email Readiness tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Production Track P2 verification tests failed.\n');
    process.exit(1);
  }
}

runEmailReadinessVerification().catch((err) => {
  console.error('Fatal error running email readiness verification:', err);
  process.exit(1);
});
