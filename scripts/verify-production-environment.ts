/**
 * PORTAL18 — PRODUCTION TRACK P1 VERIFICATION SUITE
 * Production Environment Provisioning & Domain Readiness
 */

import fs from 'fs';
import path from 'path';
import { auditMigrations } from './supabase-preflight';
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

async function runTrackP1Verification() {
  console.log('================================================================');
  console.log('PORTAL18 — PRODUCTION TRACK P1 VERIFICATION SUITE');
  console.log('Production Environment Provisioning & Domain Readiness');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION INTEGRITY & PARITY ---');

  // 1.1 Migration Parity
  const audit = auditMigrations();
  assert(
    audit.totalMigrations === 39 && audit.isChronological && audit.duplicateTimestamps.length === 0,
    `1.1 [Database Migration Parity] Exactly ${audit.totalMigrations} monotonic migrations validated for production bootstrap`,
    'Migration parity failure'
  );

  console.log('\n--- 2. PRODUCTION DOCUMENTATION PACKAGES ---');

  // 2.1 Production Docs
  const prodDocs = [
    'docs/production/environment.md',
    'docs/production/env-matrix.md',
    'docs/production/domain-dns.md',
    'docs/production/bootstrap.md',
    'docs/production/traffic-gate.md',
    'docs/production/launch-blockers.md',
  ];

  const allDocsExist = prodDocs.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '2.1 [Production Documentation] All 6 production provisioning runbooks and matrices exist in docs/production/',
    'Missing production documentation files'
  );

  console.log('\n--- 3. SAFETY INVARIANTS & KILL SWITCHES ---');

  // 3.1 Payment Kill Switch
  const isPaymentKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isPaymentKillSwitchActive === true,
    '3.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Payment kill switch must remain active'
  );

  // 3.2 Email Kill Switch
  const isEmailKillSwitchActive = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  assert(
    isEmailKillSwitchActive === true,
    '3.2 [Email Kill Switch Invariant] PORTAL18_EMAIL_KILL_SWITCH is active (zero real dispatches permitted)',
    'Email kill switch must remain active'
  );

  // 3.3 Stripe Block
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '3.3 [Stripe Block Invariant] Stripe remains permanently blocked from production',
    'Stripe must remain strictly blocked'
  );

  console.log('\n--- 4. TRAFFIC GATING & DOMAIN READINESS ---');

  // 4.1 Traffic Gating Rules
  const trafficGateDoc = fs.readFileSync(path.join(rootDir, 'docs', 'production', 'traffic-gate.md'), 'utf8');
  assert(
    trafficGateDoc.includes('TRAFFIC STATUS: DISABLED') &&
    trafficGateDoc.includes('EDGE GATING ACTIVE'),
    '4.1 [Traffic Gate Invariant] Production traffic gating explicitly configured as DISABLED',
    'Traffic gating status invalid'
  );

  // 4.2 Launch Blockers Matrix
  const blockersDoc = fs.readFileSync(path.join(rootDir, 'docs', 'production', 'launch-blockers.md'), 'utf8');
  assert(
    blockersDoc.includes('BLK-01') &&
    blockersDoc.includes('BLK-02') &&
    blockersDoc.includes('BLK-03') &&
    blockersDoc.includes('BLK-04') &&
    blockersDoc.includes('BLK-05') &&
    blockersDoc.includes('BLK-06'),
    '4.2 [Launch Blockers Register] All 6 external blockers documented with explicit traffic/payment eligibility decisions',
    'Launch blockers matrix incomplete'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Production Track P1 verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Production Track P1 verification tests failed.\n');
    process.exit(1);
  }
}

runTrackP1Verification().catch((err) => {
  console.error('Fatal error running Track P1 verification:', err);
  process.exit(1);
});
