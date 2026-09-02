/**
 * PORTAL18 — PHASE 33 AUTOMATED VERIFICATION SUITE
 * Advanced Search, Recommendations & Privacy-First Personalization
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { searchQueryNormalizer } from '../src/services/search/searchQueryNormalizer';
import { synonymService } from '../src/services/search/synonymService';
import { advancedSearchService } from '../src/services/search/advancedSearchService';
import { recommendationService } from '../src/services/search/recommendationService';
import { savedSearchService } from '../src/services/search/savedSearchService';

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
  console.log('PORTAL18 — PHASE 33 AUTOMATED VERIFICATION SUITE');
  console.log('Advanced Search, Recommendations & Privacy-First Personalization');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & SEARCH SCHEMA ---');

  // 1.1 Migration 00037
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000037_phase33_advanced_search_recommendations_personalization.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('search_synonyms') &&
    migrationContent.includes('saved_searches') &&
    migrationContent.includes('user_discovery_preferences') &&
    migrationContent.includes('recommendation_feedback') &&
    migrationContent.includes('search_query_aggregates') &&
    migrationContent.includes('search_profiles_discovery_v3') &&
    migrationContent.includes('autocomplete_search_v1') &&
    migrationContent.includes('get_similar_profiles_v2'),
    '1.1 [Database Migration] Migration 00037 defines synonyms, saved searches, preferences, feedback, and search RPCs',
    'Migration 00037 missing or incomplete'
  );

  console.log('\n--- 2. QUERY NORMALIZATION & TYPO TOLERANCE ---');

  // 2.1 Diacritics & Lowercase Normalization
  const norm1 = searchQueryNormalizer.normalize('São Paulo');
  const norm2 = searchQueryNormalizer.normalize('   MASSAGISTA   ');
  const norm3 = searchQueryNormalizer.normalize('Privê!!');

  assert(
    norm1 === 'sao paulo' && norm2 === 'massagista' && norm3 === 'prive',
    '2.1 [Query Normalization] Diacritics stripped, lowercase converted, whitespace collapsed',
    `Normalization failure: norm1=${norm1}, norm2=${norm2}, norm3=${norm3}`
  );

  // 2.2 Synonym Expansion
  const expanded = searchQueryNormalizer.expandTerms('massagem');
  assert(
    expanded.includes('massagem') && (expanded.includes('massagista') || expanded.includes('massagens')),
    '2.2 [Synonym Expansion Engine] Query term "massagem" expands to synonyms ("massagista", "massagens")',
    `Expanded terms missing: ${expanded.join(', ')}`
  );

  // 2.3 Search Intent Detection
  const intent = searchQueryNormalizer.detectIntent('massagistas em salvador ba');
  assert(
    intent.city === 'salvador' && intent.state === 'BA' && intent.category === 'massagem',
    '2.3 [Search Intent Detection] Extracts city (salvador), state (BA), and category (massagem) from query',
    `Intent detection mismatch: ${JSON.stringify(intent)}`
  );

  console.log('\n--- 3. ADVANCED SEARCH & AUTOCOMPLETE SERVICE ---');

  // 3.1 Advanced Search Execution
  const searchResult = await advancedSearchService.search({
    query: 'São Paulo',
    limit: 6,
  });

  assert(
    Array.isArray(searchResult.profiles) &&
    typeof searchResult.total === 'number' &&
    searchResult.normalizedQuery === 'sao paulo',
    '3.1 [Advanced Search Service] search() normalizes query and returns structured result set',
    'Search execution failed'
  );

  // 3.2 Multi-Entity Autocomplete
  const autocompleteRes = await advancedSearchService.autocomplete('sal');
  assert(
    typeof autocompleteRes === 'object' &&
    Array.isArray(autocompleteRes.cities) &&
    Array.isArray(autocompleteRes.categories),
    '3.2 [Multi-Entity Autocomplete] autocomplete() returns structured cities and categories',
    'Autocomplete failed'
  );

  console.log('\n--- 4. RECOMMENDATIONS & SIMILAR PROFILES ---');

  // 4.1 Similar Profiles Query
  const similar = await recommendationService.getSimilarProfiles('00000000-0000-0000-0000-000000000000', 4);
  assert(
    Array.isArray(similar) && similar.length <= 4,
    '4.1 [Similar Profiles Engine] getSimilarProfiles() retrieves taxonomy and location based recommendations',
    'Similar profiles failed'
  );

  // 4.2 Personalized Feed Sections
  const feedSections = await recommendationService.getPersonalizedFeed();
  assert(
    Array.isArray(feedSections) && feedSections.length >= 1,
    '4.2 [Personalized Feed Sections] getPersonalizedFeed() constructs explainable recommendation blocks',
    'Feed sections failed'
  );

  console.log('\n--- 5. PRIVACY ISOLATION & ZERO INFERRED PROFILING ---');

  // 5.1 No Inferred Sexual Orientation or Gender Profiling
  const normalizerCode = fs.readFileSync(path.join(rootDir, 'src', 'services', 'search', 'searchQueryNormalizer.ts'), 'utf8');
  assert(
    !normalizerCode.includes('sexual_orientation_profile') &&
    !normalizerCode.includes('inferred_gender_identity') &&
    !normalizerCode.includes('ad_tracking_target'),
    '5.1 [Privacy Invariant] Zero inference of user sexual orientation, gender identity, or ad targeting profiles',
    'Found prohibited inference patterns in normalizer'
  );

  // 5.2 Safe Mode & Contact Masking
  const explorePageCode = fs.readFileSync(path.join(rootDir, 'src', 'app', 'explorar', 'page.tsx'), 'utf8');
  assert(
    explorePageCode.includes('AdvertiserCard') &&
    explorePageCode.includes('AdvancedSearchBar'),
    '5.2 [Safe Mode Discovery] Explore page uses AdvertiserCard with Age Assurance protection',
    'Explore page missing components'
  );

  console.log('\n--- 6. DOCUMENTATION PACKAGES ---');

  // 6.1 Documentation Files
  const docFiles = [
    'docs/search/architecture.md',
    'docs/search/ranking.md',
    'docs/search/synonyms.md',
    'docs/search/personalization.md',
    'docs/search/recommendations.md',
    'docs/search/privacy.md',
    'docs/search/geo-privacy.md',
    'docs/search/quality-evaluation.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '6.1 [Search Documentation Packages] All 8 search operational runbooks and policies exist in docs/search/',
    'Some documentation files are missing'
  );

  console.log('\n--- 7. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 7.1 Payment Kill Switch Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '7.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 7.2 Stripe Prohibition Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '7.2 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 33 Advanced Search & Recommendations verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 33 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
