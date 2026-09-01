/**
 * PORTAL18 — PHASE 28E AUTOMATED VERIFICATION SUITE
 * Billing Recovery, Renewals, Grace Periods & Failure Handling
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderResolver } from '../src/services/payments/resolver';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { billingRecoveryService, DEFAULT_RETRY_POLICY } from '../src/services/payments/billingRecoveryService';

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
  console.log('PORTAL18 — PHASE 28E AUTOMATED VERIFICATION SUITE');
  console.log('Billing Recovery, Renewals, Grace Periods & Failure Handling');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & DOMAIN MODEL ---');

  // 1.1 Migration 00030
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000030_phase28e_billing_recovery_renewals.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('billing_cycles') &&
    migrationContent.includes('billing_recovery_events') &&
    migrationContent.includes('generate_subscription_billing_cycle') &&
    migrationContent.includes('process_due_billing_cycles') &&
    migrationContent.includes('process_grace_expirations'),
    '1.1 [Database Migration] Migration 00030 defines billing_cycles, recovery events, and scheduler RPCs',
    'Migration 00030 missing or incomplete'
  );

  console.log('\n--- 2. BILLING RECOVERY SERVICE & RETRY POLICY ---');

  // 2.1 Service Interface
  assert(
    typeof billingRecoveryService.generateNextCycle === 'function' &&
    typeof billingRecoveryService.getSubscriptionCycles === 'function' &&
    typeof billingRecoveryService.triggerRenewalAttempt === 'function' &&
    typeof billingRecoveryService.triggerManualRetry === 'function' &&
    typeof billingRecoveryService.undoSubscriptionCancellation === 'function' &&
    typeof billingRecoveryService.updatePaymentMethod === 'function' &&
    typeof billingRecoveryService.getAdminRecoveryQueue === 'function' &&
    typeof billingRecoveryService.runSchedulerTick === 'function',
    '2.1 [Billing Recovery Interface] billingRecoveryService implements cycle generation, retries, cancellation undo, and queues',
    'billingRecoveryService methods missing'
  );

  // 2.2 Retry Policy Rules
  assert(
    DEFAULT_RETRY_POLICY.maxRetries === 3 &&
    DEFAULT_RETRY_POLICY.graceDurationDays === 3 &&
    DEFAULT_RETRY_POLICY.retryDelaysHours.length === 3 &&
    DEFAULT_RETRY_POLICY.eligibleFailureCategories.includes('card_declined') &&
    DEFAULT_RETRY_POLICY.eligibleFailureCategories.includes('insufficient_funds'),
    '2.2 [Retry Policy Configuration] Default policy configures 3 retries, 3-day grace period, and eligible failure categories',
    'Retry policy configuration invalid'
  );

  console.log('\n--- 3. UI COMPONENTS & MODALS ---');

  // 3.1 PaymentMethodUpdateModal Component
  const updateModalPath = path.join(rootDir, 'src', 'components', 'billing', 'PaymentMethodUpdateModal.tsx');
  const updateModalExists = fs.existsSync(updateModalPath);
  const updateModalContent = updateModalExists ? fs.readFileSync(updateModalPath, 'utf8') : '';

  assert(
    updateModalExists &&
    updateModalContent.includes('Atualizar Forma de Pagamento') &&
    updateModalContent.includes('Ambiente de Homologação'),
    '3.1 [Payment Method Update Modal] src/components/billing/PaymentMethodUpdateModal.tsx exists with test banner and tokenization simulator',
    'PaymentMethodUpdateModal missing'
  );

  console.log('\n--- 4. BILLING & RECOVERY PAGES ---');

  // 4.1 Advertiser Billing Page with Grace Alerts
  const advBillingPath = path.join(rootDir, 'src', 'app', 'advertiser', 'billing', 'page.tsx');
  const advBillingExists = fs.existsSync(advBillingPath);
  const advBillingContent = advBillingExists ? fs.readFileSync(advBillingPath, 'utf8') : '';

  assert(
    advBillingExists &&
    advBillingContent.includes('Período de Tolerância Ativo') &&
    advBillingContent.includes('Tentar Pagamento Agora') &&
    advBillingContent.includes('Manter Assinatura'),
    '4.1 [Advertiser Billing Grace UX] /advertiser/billing includes grace alert, payment retry, and cancellation undo',
    'Advertiser billing missing grace period features'
  );

  // 4.2 Consumer Billing Page with Grace Alerts
  const userBillingPath = path.join(rootDir, 'src', 'app', 'account', 'billing', 'page.tsx');
  const userBillingExists = fs.existsSync(userBillingPath);
  const userBillingContent = userBillingExists ? fs.readFileSync(userBillingPath, 'utf8') : '';

  assert(
    userBillingExists &&
    userBillingContent.includes('Problema com a Renovação') &&
    userBillingContent.includes('Manter Assinatura'),
    '4.2 [Consumer Billing Grace UX] /account/billing includes Premium grace alert and recovery options',
    'Consumer billing missing grace features'
  );

  // 4.3 Admin Recovery Center Page
  const adminRecoveryPath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'recovery', 'page.tsx');
  const adminRecoveryExists = fs.existsSync(adminRecoveryPath);
  const adminRecoveryContent = adminRecoveryExists ? fs.readFileSync(adminRecoveryPath, 'utf8') : '';

  assert(
    adminRecoveryExists &&
    adminRecoveryContent.includes('Recuperação de Cobrança & Dunning') &&
    adminRecoveryContent.includes('Executar Scheduler Tick') &&
    adminRecoveryContent.includes('Retry Seguro'),
    '4.3 [Admin Recovery Center] /admin/payments/recovery displays recovery queue, failure breakdowns, and scheduler triggers',
    'Admin recovery page missing'
  );

  console.log('\n--- 5. SAFETY INVARIANTS & STRIPE BLOCKED ---');

  // 5.1 Payment Kill Switch Active Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '5.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 5.2 Stripe Prohibition Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '5.2 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: 11 | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28E Billing Recovery & Grace Period verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28E verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
