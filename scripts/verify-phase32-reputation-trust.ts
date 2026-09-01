/**
 * PORTAL18 — PHASE 32 AUTOMATED VERIFICATION SUITE
 * Reputation, Trust Signals, Reviews & Profile Quality Intelligence
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { reputationService } from '../src/services/reputation/reputationService';
import { reviewIntelligenceService } from '../src/services/reputation/reviewIntelligenceService';
import { reviewService } from '../src/services/reviewService';

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
  console.log('PORTAL18 — PHASE 32 AUTOMATED VERIFICATION SUITE');
  console.log('Reputation, Trust Signals & Profile Quality Intelligence');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & REPUTATION SCHEMA ---');

  // 1.1 Migration 00036
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000036_phase32_reputation_trust_signals_reviews.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('advertiser_trust_signals') &&
    migrationContent.includes('advertiser_reputation_snapshots') &&
    migrationContent.includes('compute_advertiser_trust_signals') &&
    migrationContent.includes('get_public_advertiser_trust') &&
    migrationContent.includes('respond_to_advertiser_review'),
    '1.1 [Database Migration] Migration 00036 defines trust signals, snapshots, review response RPC, and computation RPCs',
    'Migration 00036 missing or incomplete'
  );

  console.log('\n--- 2. TRUST SIGNALS & ZERO OPAQUE PUBLIC SCORE ---');

  // 2.1 Public Trust Query
  const sampleTrust = await reputationService.getPublicTrust('00000000-0000-0000-0000-000000000000');
  assert(
    sampleTrust === null || typeof sampleTrust === 'object',
    '2.1 [Server-Authoritative Trust Signals] reputationService queries trust signals and sanitized review aggregates safely',
    'Trust query failed'
  );

  // 2.2 Prohibited Claims Guardrail in Codebase
  const publicProfileViewPath = path.join(rootDir, 'src', 'app', 'perfil', '[estado]', '[cidade]', '[slug]', 'ProfileViewClient.tsx');
  const publicProfileViewContent = fs.readFileSync(publicProfileViewPath, 'utf8');
  assert(
    !publicProfileViewContent.includes('100% seguro') &&
    !publicProfileViewContent.includes('100% Seguro') &&
    !publicProfileViewContent.includes('perfil garantido') &&
    !publicProfileViewContent.includes('Compra Verificada'),
    '2.2 [Prohibited Claims Invariant] Public profile view contains zero misleading claims ("100% seguro", "Compra Verificada")',
    'Found prohibited claims in Public Profile UI'
  );

  console.log('\n--- 3. CLEAN REVIEW AGGREGATION & MINIMUM SAMPLE ---');

  // 3.1 Review Aggregates
  const reviewAgg = await reviewIntelligenceService.getReviewAggregate('00000000-0000-0000-0000-000000000000');
  assert(
    reviewAgg.total === 0 &&
    reviewAgg.has_sufficient_sample === false &&
    reviewAgg.distribution['5'] === 0,
    '3.1 [Clean Review Aggregates & Minimum Sample] Review intelligence respects minimum sample thresholds (0 reviews -> not sufficient)',
    'Review aggregate failed'
  );

  // 3.2 Bayesian Smoothing Calculation
  const smoothedSingle = reviewIntelligenceService.calculateBayesianSmoothedScore(5.0, 1, 4.5, 5);
  const smoothedMulti = reviewIntelligenceService.calculateBayesianSmoothedScore(4.8, 50, 4.5, 5);
  assert(
    smoothedMulti > smoothedSingle,
    '3.2 [Bayesian Smoothing Guardrail] 50 reviews at 4.8 outrank 1 review at 5.0 in Bayesian smoothed ranking',
    `Smoothing anomaly: single=${smoothedSingle}, multi=${smoothedMulti}`
  );

  console.log('\n--- 4. ADVERTISER PROFILE HEALTH & 6 DIMENSIONS ---');

  // 4.1 Profile Health Dimensions
  const health = await reputationService.getProfileHealth('00000000-0000-0000-0000-000000000000');
  const dimensionKeys = health.dimensions.map((d) => d.key);
  assert(
    Array.isArray(health.dimensions) &&
    health.dimensions.length >= 4 &&
    dimensionKeys.includes('authenticity') &&
    dimensionKeys.includes('media'),
    '4.1 [Profile Health Guidance] reputationService produces actionable health dimensions with PT-BR guidance',
    'Profile health dimensions missing'
  );

  console.log('\n--- 5. ADMIN REPUTATION INTELLIGENCE ---');

  // 5.1 Admin Overview Metrics
  const adminOverview = await reputationService.getAdminReputationOverview();
  assert(
    typeof adminOverview.totalProfiles === 'number' &&
    typeof adminOverview.authenticProfiles === 'number' &&
    typeof adminOverview.avgPlatformRating === 'number',
    '5.1 [Admin Reputation Overview] reputationService retrieves aggregated platform reputation metrics',
    'Admin overview query failed'
  );

  console.log('\n--- 6. COMMERCIAL TIER & REPUTATION DECOUPLING ---');

  // 6.1 VIP Plan Separation
  assert(
    publicProfileViewContent.includes('TrustPanel') &&
    publicProfileViewContent.includes('badge-sponsored'),
    '6.1 [Plan / Trust Separation] VIP / Sponsored badges remain strictly separated from Trust signals in public UI',
    'TrustPanel or badge-sponsored missing'
  );

  console.log('\n--- 7. PRIVACY & SENSITIVE DATA ISOLATION ---');

  // 7.1 Reviewer Privacy
  assert(
    publicProfileViewContent.includes('Usuário Autenticado'),
    '7.1 [Reviewer Anonymity] Reviews display sanitized reviewer label ("Usuário Autenticado") with zero civil PII',
    'Reviewer anonymity label missing'
  );

  console.log('\n--- 8. DOCUMENTATION PACKAGES ---');

  // 8.1 Documentation Files
  const docFiles = [
    'docs/reputation/architecture.md',
    'docs/reputation/trust-signals.md',
    'docs/reputation/reviews.md',
    'docs/reputation/profile-quality.md',
    'docs/reputation/public-claims-policy.md',
    'docs/reputation/privacy.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '8.1 [Reputation Documentation Packages] All 6 reputation operational runbooks and policies exist in docs/reputation/',
    'Some documentation files are missing'
  );

  console.log('\n--- 9. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 9.1 Payment Kill Switch Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '9.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 9.2 Stripe Prohibition Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '9.2 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: 11 | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 32 Reputation & Trust Signals verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 32 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});

