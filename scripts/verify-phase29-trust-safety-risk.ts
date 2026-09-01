/**
 * PORTAL18 — PHASE 29 AUTOMATED VERIFICATION SUITE
 * Trust & Safety, Operational Anti-Fraud & Risk Intelligence
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { riskSignalsService } from '../src/services/trust-safety/riskSignalsService';
import { caseManagementService } from '../src/services/trust-safety/caseManagementService';
import { sanctionsService } from '../src/services/trust-safety/sanctionsService';
import { appealsService } from '../src/services/trust-safety/appealsService';
import { rateLimitEngine } from '../src/services/trust-safety/rateLimitEngine';

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
  console.log('PORTAL18 — PHASE 29 AUTOMATED VERIFICATION SUITE');
  console.log('Trust & Safety, Anti-Fraud & Risk Intelligence');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & T&S SCHEMA ---');

  // 1.1 Migration 00033
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000033_phase29_trust_safety_risk_intelligence.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('risk_signals') &&
    migrationContent.includes('trust_safety_cases') &&
    migrationContent.includes('case_internal_notes') &&
    migrationContent.includes('sanctions') &&
    migrationContent.includes('appeals') &&
    migrationContent.includes('blocked_media_fingerprints') &&
    migrationContent.includes('record_risk_signal') &&
    migrationContent.includes('resolve_appeal'),
    '1.1 [Database Migration] Migration 00033 defines risk signals, cases, sanctions, appeals, and four-eyes review RPCs',
    'Migration 00033 missing or incomplete'
  );

  console.log('\n--- 2. TRUST & SAFETY SERVICES INTERFACE ---');

  // 2.1 Services Interface
  assert(
    typeof riskSignalsService.recordSignal === 'function' &&
    typeof caseManagementService.createOrEscalateCase === 'function' &&
    typeof sanctionsService.applySanction === 'function' &&
    typeof appealsService.submitAppeal === 'function' &&
    typeof appealsService.resolveAppeal === 'function',
    '2.1 [T&S Services Interface] Core Trust & Safety services implement signal recording, case triage, sanctions, and appeals',
    'T&S service methods missing'
  );

  console.log('\n--- 3. RATE LIMIT ENGINE VELOCITY CONTROLS ---');

  // 3.1 Rate Limit Engine Sliding Window
  const testIp = 'test-ip-127.0.0.1';
  rateLimitEngine.resetLimit('login', testIp);

  let allowedCount = 0;
  for (let i = 0; i < 6; i++) {
    const res = rateLimitEngine.checkLimit('login', testIp);
    if (res.allowed) allowedCount++;
  }

  assert(
    allowedCount === 5,
    '3.1 [Velocity Controls & Rate Limiting] rateLimitEngine enforces sliding window limits and rejects requests exceeding threshold (5/min)',
    `Expected 5 allowed requests, got ${allowedCount}`
  );

  console.log('\n--- 4. BLOCKED MEDIA FINGERPRINT CATALOGUE ---');

  // 4.1 Blocked Media Lookup
  const blockedCheck = await riskSignalsService.checkBlockedMedia('sample-clean-hash');
  assert(
    blockedCheck.isBlocked === false,
    '4.1 [Media Duplicate Catalogue] riskSignalsService performs non-blocking lookups on clean media hashes',
    'Blocked media lookup failed'
  );

  console.log('\n--- 5. DOCUMENTATION PACKAGES ---');

  // 5.1 Documentation Files
  const docFiles = [
    'docs/trust-safety/risk-model.md',
    'docs/trust-safety/case-management.md',
    'docs/trust-safety/sanctions.md',
    'docs/trust-safety/appeals.md',
    'docs/trust-safety/incident-response.md',
    'docs/trust-safety/privacy-risk-data.md',
    'docs/trust-safety/referral-abuse.md',
    'docs/trust-safety/review-abuse.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '5.1 [T&S Documentation Packages] All 8 operational runbooks and policy documents exist in docs/trust-safety/',
    'Some documentation files are missing'
  );

  console.log('\n--- 6. SAFETY INVARIANTS & ZERO BIOMETRICS ---');

  // 6.1 Payment Kill Switch Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '6.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 6.2 Stripe Prohibition Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '6.2 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: 7 | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 29 Trust & Safety & Risk Intelligence verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 29 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
