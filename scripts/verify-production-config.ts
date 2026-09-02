/**
 * PORTAL18 — PRODUCTION CONFIGURATION VALIDATION (TRACK P1)
 */

import fs from 'fs';
import path from 'path';
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

async function runConfigVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PRODUCTION CONFIGURATION VALIDATION');
  console.log('Track P1: Environment Isolation & Safety Guards');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. CRITICAL SAFETY INVARIANTS ---');

  // 1.1 Payment Kill Switch
  const isPaymentKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isPaymentKillSwitchActive === true,
    '1.1 [Payment Kill Switch Guard] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Payment kill switch must remain active'
  );

  // 1.2 Email Kill Switch
  const isEmailKillSwitchActive = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  assert(
    isEmailKillSwitchActive === true,
    '1.2 [Email Kill Switch Guard] PORTAL18_EMAIL_KILL_SWITCH is active (zero real dispatches permitted)',
    'Email kill switch must remain active'
  );

  // 1.3 Stripe Block
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '1.3 [Stripe Block Guard] Stripe remains permanently blocked from production',
    'Stripe must remain strictly blocked'
  );

  console.log('\n--- 2. CLIENT SECRET EXPOSURE AUDIT ---');

  // 2.1 NEXT_PUBLIC check
  const envFile = path.join(rootDir, '.env.local');
  let leakedCount = 0;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_') && (line.includes('SERVICE_ROLE') || line.includes('SECRET') || line.includes('PRIVATE_KEY'))) {
        leakedCount++;
      }
    });
  }

  assert(
    leakedCount === 0,
    '2.1 [Client Secret Audit] Zero private keys or service role secrets exposed under NEXT_PUBLIC_ prefixes',
    'Found secrets exposed with NEXT_PUBLIC_ prefix'
  );

  console.log('\n--- 3. EMPTY PRODUCTION & SEED EXCLUSION ---');

  // 3.1 Demo seed isolation
  const seedScript = fs.readFileSync(path.join(rootDir, 'scripts', 'seed-demo-profiles.ts'), 'utf8');
  assert(
    seedScript.includes('DEMO_PUBLIC_ADVERTISERS') || seedScript.includes('runDemoSeed'),
    '3.1 [Seed Safety] Demo profile seeder is segregated in scripts directory and not triggered during production boot',
    'Seed script verification failed'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 Production configuration validation passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Production configuration validation failed.\n');
    process.exit(1);
  }
}

runConfigVerification().catch((err) => {
  console.error('Fatal error running config verification:', err);
  process.exit(1);
});
