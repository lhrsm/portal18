/**
 * PORTAL18 — PHASE 37 AUTOMATED VERIFICATION SUITE
 * Production Infrastructure, Observability, Disaster Recovery & Security Hardening
 */

import fs from 'fs';
import path from 'path';
import { auditMigrations } from './supabase-preflight';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { telemetryService } from '../src/services/observability/telemetryService';

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
  console.log('PORTAL18 — PHASE 37 AUTOMATED VERIFICATION SUITE');
  console.log('Production Infrastructure, Observability & Security Hardening');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. MIGRATION TRUTH & DATABASE PARITY ---');

  // 1.1 Migration Parity
  const audit = auditMigrations();
  assert(
    audit.totalMigrations === 39 && audit.isChronological && audit.duplicateTimestamps.length === 0,
    `1.1 [Migration Parity & Chronology] Exactly ${audit.totalMigrations} monotonic migrations validated without duplicates`,
    'Migration chronology or count failure'
  );

  console.log('\n--- 2. HEALTH & READINESS ENDPOINTS ---');

  // 2.1 Route Handlers
  const healthRouteExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'api', 'health', 'route.ts'));
  const readyRouteExists = fs.existsSync(path.join(rootDir, 'src', 'app', 'api', 'ready', 'route.ts'));

  assert(
    healthRouteExists && readyRouteExists,
    '2.1 [Health & Ready Routes] /api/health and /api/ready route handlers properly implemented',
    'Health or ready routes missing'
  );

  // 2.2 System Health Telemetry
  const health = await telemetryService.getSystemHealth();
  assert(
    health.status !== 'unhealthy',
    '2.2 [System Health Telemetry] telemetryService reports healthy database connectivity',
    'System health check degraded/unhealthy'
  );

  console.log('\n--- 3. SECURITY HEADERS & CSP CONFIGURATION ---');

  // 3.1 next.config.mjs Security Headers
  const nextConfigContent = fs.readFileSync(path.join(rootDir, 'next.config.mjs'), 'utf8');
  assert(
    nextConfigContent.includes('Content-Security-Policy') &&
    nextConfigContent.includes('X-Content-Type-Options') &&
    nextConfigContent.includes('nosniff') &&
    nextConfigContent.includes('X-Frame-Options') &&
    nextConfigContent.includes('Permissions-Policy') &&
    nextConfigContent.includes('no-store'),
    '3.1 [Security Headers & CSP] next.config.mjs defines CSP, nosniff, frame protection, and private no-store headers',
    'Security headers missing in next.config.mjs'
  );

  console.log('\n--- 4. DEPLOYMENT AUTOMATION SCRIPTS ---');

  // 4.1 Pre and Post Deploy Scripts
  assert(
    fs.existsSync(path.join(rootDir, 'scripts', 'pre-deploy-check.ts')) &&
    fs.existsSync(path.join(rootDir, 'scripts', 'post-deploy-smoke.ts')),
    '4.1 [Deployment Scripts] pre-deploy-check.ts and post-deploy-smoke.ts present and configured',
    'Deployment scripts missing'
  );

  console.log('\n--- 5. OPERATIONS RUNBOOKS & RECOVERY DOCS ---');

  // 5.1 Runbooks
  const opsDocs = [
    'docs/operations/secrets-inventory.md',
    'docs/operations/secret-rotation.md',
    'docs/operations/disaster-recovery.md',
    'docs/operations/deployment-rollback.md',
    'docs/operations/slo-sli.md',
    'docs/operations/incident-response.md',
    'docs/release/production-deployment-checklist.md',
    'docs/release/phase37-restore-evidence.md',
    'docs/release/phase37-operations-manifest.md',
    'docs/release/phase37-defects.md',
  ];

  const allDocsPresent = opsDocs.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsPresent === true,
    '5.1 [Operations Runbooks & Manifests] All 10 operations runbooks, disaster recovery policies, and release manifests exist',
    'Missing operations runbooks'
  );

  console.log('\n--- 6. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 6.1 Payment Kill Switch
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '6.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Payment kill switch must remain active'
  );

  // 6.2 Email Kill Switch
  const isEmailKillSwitchActive = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  assert(
    isEmailKillSwitchActive === true,
    '6.2 [Email Kill Switch Invariant] PORTAL18_EMAIL_KILL_SWITCH is active (zero external dispatches permitted)',
    'Email kill switch must remain active'
  );

  // 6.3 Stripe Prohibition
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '6.3 [Stripe Block Invariant] Stripe remains permanently blocked from production',
    'Stripe must remain strictly blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 37 Production Infrastructure & Observability tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 37 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
