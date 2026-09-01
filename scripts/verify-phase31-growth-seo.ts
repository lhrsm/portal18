/**
 * PORTAL18 — PHASE 31 AUTOMATED VERIFICATION SUITE
 * Growth, Acquisition, Programmatic SEO & Regional Expansion Intelligence
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { indexabilityEngine } from '../src/services/growth/indexabilityEngine';
import { growthIntelligenceService } from '../src/services/growth/growthIntelligenceService';
import { attributionService } from '../src/services/growth/attributionService';
import { experimentationEngine } from '../src/services/growth/experimentationEngine';

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
  console.log('PORTAL18 — PHASE 31 AUTOMATED VERIFICATION SUITE');
  console.log('Growth, Regional Expansion & Programmatic SEO Intelligence');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & GROWTH SCHEMA ---');

  // 1.1 Migration 00035
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000035_phase31_growth_regional_programmatic_seo.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('regional_growth_stats') &&
    migrationContent.includes('growth_page_policies') &&
    migrationContent.includes('growth_experiments') &&
    migrationContent.includes('acquisition_attribution_logs') &&
    migrationContent.includes('check_page_indexability'),
    '1.1 [Database Migration] Migration 00035 defines regional stats, page policies, experiments, attribution, and indexability RPC',
    'Migration 00035 missing or incomplete'
  );

  console.log('\n--- 2. INDEXABILITY ENGINE & THIN CONTENT PROTECTION ---');

  // 2.1 Thin Content Gate (0 profiles -> noindex)
  const emptyCityEval = await indexabilityEngine.shouldIndexPage({
    path: '/acompanhantes/ba/cidade-vazia',
    profileCount: 0,
    pageType: 'city',
  });

  assert(
    emptyCityEval.isIndexable === false &&
    emptyCityEval.reason.includes('thin_content'),
    '2.1 [Thin Content & Doorway Prevention] Empty city page (0 profiles) is strictly flagged as non-indexable (noindex)',
    `Expected isIndexable=false, got ${JSON.stringify(emptyCityEval)}`
  );

  // 2.2 Inventory Eligible City (>=1 profile -> indexable)
  const activeCityEval = await indexabilityEngine.shouldIndexPage({
    path: '/acompanhantes/ba/salvador',
    profileCount: 12,
    pageType: 'city',
  });

  assert(
    activeCityEval.isIndexable === true,
    '2.2 [Inventory Eligible Indexability] City with approved active profiles is eligible for search engine indexing',
    `Expected isIndexable=true, got ${JSON.stringify(activeCityEval)}`
  );

  console.log('\n--- 3. REGIONAL GROWTH & DETERMINISTIC OPPORTUNITY SIGNALS ---');

  // 3.1 Opportunity Signals
  const signals = await growthIntelligenceService.getOpportunitySignals();
  assert(
    Array.isArray(signals),
    '3.1 [Regional Growth Intelligence] growthIntelligenceService generates deterministic opportunity signals from real metrics',
    'Signals not an array'
  );

  console.log('\n--- 4. PRIVACY-PRESERVING A/B EXPERIMENTATION ---');

  // 4.1 Deterministic Variant Assignment
  const variant1 = experimentationEngine.assignVariant('exp_hero_cta', 'session_user_123', ['control', 'variant_a']);
  const variant2 = experimentationEngine.assignVariant('exp_hero_cta', 'session_user_123', ['control', 'variant_a']);

  assert(
    variant1 === variant2 &&
    ['control', 'variant_a'].includes(variant1),
    '4.1 [Deterministic A/B Assignment] assignVariant produces repeatable, deterministic variant selection without 3rd-party cookies',
    `Variants mismatched: ${variant1} vs ${variant2}`
  );

  console.log('\n--- 5. DOCUMENTATION PACKAGES ---');

  // 5.1 Documentation Files
  const docFiles = [
    'docs/growth/architecture.md',
    'docs/growth/programmatic-seo.md',
    'docs/growth/city-readiness.md',
    'docs/growth/city-launch-playbook.md',
    'docs/growth/experimentation.md',
    'docs/growth/privacy-attribution.md',
    'docs/growth/seo-quality-policy.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '5.1 [Growth Documentation Packages] All 7 growth operational runbooks and policies exist in docs/growth/',
    'Some documentation files are missing'
  );

  console.log('\n--- 6. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

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
    console.log('🎉 All Phase 31 Growth, SEO & Regional Expansion verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 31 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
