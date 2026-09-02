/**
 * PORTAL18 — PHASE 35 AUTOMATED VERIFICATION SUITE
 * Advertiser Conversion, Profile Performance & Commercial Intelligence
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { conversionIntelligenceService } from '../src/services/advertiser/conversionIntelligenceService';

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
  console.log('PORTAL18 — PHASE 35 AUTOMATED VERIFICATION SUITE');
  console.log('Advertiser Conversion, Profile Performance & Commercial Intelligence');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & CONVERSION SCHEMA ---');

  // 1.1 Migration 00038
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260902000038_phase35_advertiser_conversion_intelligence.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('advertiser_media_stats') &&
    migrationContent.includes('record_media_interaction_event') &&
    migrationContent.includes('get_advertiser_conversion_intelligence_v1') &&
    migrationContent.includes('get_admin_commercial_intelligence_v1'),
    '1.1 [Database Migration] Migration 00038 defines media stats table and conversion intelligence RPCs',
    'Migration 00038 missing or incomplete'
  );

  console.log('\n--- 2. CONVERSION INTELLIGENCE SERVICE & FUNNEL ---');

  // 2.1 Conversion Intelligence Query
  const intelligence = await conversionIntelligenceService.getConversionIntelligence('00000000-0000-0000-0000-000000000000', 30);

  assert(
    intelligence !== null &&
    typeof intelligence.funnel === 'object' &&
    typeof intelligence.funnel.impressions === 'number' &&
    typeof intelligence.funnel.profile_views === 'number' &&
    typeof intelligence.funnel.contact_intents === 'number' &&
    typeof intelligence.funnel.profile_open_rate === 'number' &&
    typeof intelligence.funnel.contact_ctr === 'number',
    '2.1 [Conversion Intelligence Service] getConversionIntelligence returns structured funnel metrics',
    'Funnel metrics structure invalid'
  );

  // 2.2 Mathematical Integrity
  assert(
    intelligence !== null &&
    intelligence.funnel.impressions >= 0 &&
    intelligence.funnel.profile_views >= 0 &&
    intelligence.funnel.contact_intents >= 0 &&
    intelligence.funnel.contact_ctr >= 0 &&
    intelligence.funnel.contact_ctr <= 100,
    '2.2 [Funnel Mathematical Validity] Zero negative counts and valid CTR percentages (0-100%)',
    'Mathematical limits violated'
  );

  console.log('\n--- 3. PRIVACY ISOLATION & VISITOR ANONYMITY ---');

  // 3.1 Zero Visitor PII in Payload
  const serialized = JSON.stringify(intelligence);
  assert(
    !serialized.includes('visitor_email') &&
    !serialized.includes('visitor_phone') &&
    !serialized.includes('visitor_ip') &&
    !serialized.includes('precise_latitude') &&
    !serialized.includes('precise_longitude') &&
    !serialized.includes('facial_embedding') &&
    !serialized.includes('cpf'),
    '3.1 [Privacy Invariant] Zero visitor PII (emails, phones, IPs, GPS, KYC) in advertiser payload',
    'Found leaked PII fields in intelligence payload'
  );

  // 3.2 Small Sample Guardrail
  assert(
    intelligence !== null &&
    typeof intelligence.comparison.insufficient_sample === 'boolean',
    '3.2 [Small Sample Protection] Comparison includes insufficient_sample guardrail',
    'insufficient_sample guard missing'
  );

  console.log('\n--- 4. CSV EXPORT INTEGRITY ---');

  // 4.1 Sanitized CSV Export
  if (intelligence) {
    const csv = conversionIntelligenceService.exportToCSV(intelligence);
    assert(
      csv.includes('Métrica,Valor') &&
      csv.includes('Visualizações do Perfil') &&
      !csv.includes('@') &&
      !csv.includes('user_id'),
      '4.1 [Sanitized CSV Export] exportToCSV generates clean ledger data with zero visitor identity',
      'CSV export contains identity or invalid format'
    );
  }

  console.log('\n--- 5. DOCUMENTATION PACKAGES ---');

  // 5.1 Documentation Files
  const docFiles = [
    'docs/analytics/event-taxonomy.md',
    'docs/analytics/privacy-model.md',
    'docs/analytics/attribution.md',
    'docs/analytics/advertiser-metrics.md',
    'docs/analytics/data-quality.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '5.1 [Analytics Documentation Packages] All 5 analytics runbooks and privacy policies exist in docs/analytics/',
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
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 35 Advertiser Conversion Intelligence verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 35 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
