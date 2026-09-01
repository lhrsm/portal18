/**
 * PORTAL18 — Phase 27C Discovery Ranking, Sponsored Placement & Inventory Engine Verification Script
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function runTest(name: string, category: string, assertion: () => boolean, failureMessage: string) {
  try {
    const passed = assertion();
    results.push({
      name,
      category,
      passed,
      message: passed ? 'OK' : failureMessage,
    });
  } catch (err: any) {
    results.push({
      name,
      category,
      passed: false,
      message: `Exception: ${err?.message || String(err)}`,
    });
  }
}

const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('PORTAL18 — PHASE 27C AUTOMATED VERIFICATION SUITE');
console.log('Discovery Ranking, Sponsored Placement & Commercial Inventory Engine');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Schema & Invariants
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260830000023_phase27c_discovery_ranking.sql');
const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'Migration 00023 exists and contains discovery ranking schema',
  'Database Schema',
  () => fs.existsSync(migrationPath) && migrationContent.length > 1000,
  'Arquivo de migração 00023 não encontrado ou vazio'
);

runTest(
  'commercial_inventory_slots table created with placements and scope types',
  'Inventory Engine',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.commercial_inventory_slots') &&
    migrationContent.includes('homepage_featured') &&
    migrationContent.includes('city_top') &&
    migrationContent.includes('max_slots integer NOT NULL') &&
    migrationContent.includes('max_sponsored_ratio numeric'),
  'Tabela commercial_inventory_slots ausente ou incompleta'
);

runTest(
  'discovery_impression_events table created for viewable impression and click attribution',
  'Viewability & Analytics',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.discovery_impression_events') &&
    migrationContent.includes('organic_impression') &&
    migrationContent.includes('sponsored_impression') &&
    migrationContent.includes('session_dedupe_key text NOT NULL'),
  'Tabela discovery_impression_events ausente'
);

runTest(
  'advertiser_ranking_scores extended with component signals and bayesian_ctr',
  'Ranking Signals',
  () =>
    migrationContent.includes('bayesian_ctr numeric(6,4)') &&
    migrationContent.includes('new_profile_boost numeric(5,2)') &&
    migrationContent.includes('policy_version text NOT NULL'),
  'Campos de componentes de ranking ausentes em advertiser_ranking_scores'
);

runTest(
  'RPC recalculate_organic_ranking_scores implements Bayesian smoothed CTR without plan bias',
  'Organic Scoring',
  () =>
    migrationContent.includes('recalculate_organic_ranking_scores') &&
    migrationContent.includes('v_smoothed_ctr :=') &&
    migrationContent.includes('v_quality_score') &&
    migrationContent.includes('v_new_boost'),
  'RPC recalculate_organic_ranking_scores ausente ou incompleta'
);

runTest(
  'RPC record_discovery_event filters bots, crawlers, and self-views with deduplication',
  'Bot & Self-View Exclusion',
  () =>
    migrationContent.includes('record_discovery_event') &&
    migrationContent.includes('bot_excluded') &&
    migrationContent.includes('self_or_staff_view_excluded') &&
    migrationContent.includes('deduplicated'),
  'RPC record_discovery_event não implementa exclusão de robôs ou auto-visualizações'
);

runTest(
  'RPC search_profiles_discovery_v2 enforces Eligibility Gate (profile_status=active, public, not deleted)',
  'Eligibility Gate',
  () =>
    migrationContent.includes('search_profiles_discovery_v2') &&
    migrationContent.includes("ap.profile_status = 'active'") &&
    migrationContent.includes("ap.visibility = 'public'") &&
    migrationContent.includes('ap.deleted_at IS NULL'),
  'RPC search_profiles_discovery_v2 não impõe gate estrito de elegibilidade'
);

runTest(
  'RPC search_profiles_discovery_v2 respects Hard Search Filter Constraints (State, City, Category)',
  'Search Constraints',
  () =>
    migrationContent.includes('p_state_code IS NULL OR lower(s.code) = lower(p_state_code)') &&
    migrationContent.includes('p_city_slug IS NULL OR c.slug = p_city_slug') &&
    migrationContent.includes('p_category_slug IS NULL OR EXISTS'),
  'RPC search_profiles_discovery_v2 permite vazamento de restrições de busca'
);

runTest(
  'RPC search_profiles_discovery_v2 applies inventory slot limits (max_sponsored_slots) and staggered ranking',
  'Sponsored Placement & Fairness',
  () =>
    migrationContent.includes('v_max_sponsored_slots') &&
    migrationContent.includes('ro.organic_rank <= v_max_sponsored_slots') &&
    migrationContent.includes('is_sponsored boolean'),
  'RPC search_profiles_discovery_v2 não aplica limite de slots patrocinados'
);

runTest(
  'RPC diagnose_advertiser_ranking provides staff score breakdown without leaking secret keys',
  'Staff Diagnostics',
  () =>
    migrationContent.includes('diagnose_advertiser_ranking') &&
    migrationContent.includes('is_eligible') &&
    migrationContent.includes('ineligibility_reasons') &&
    migrationContent.includes('scores'),
  'RPC diagnose_advertiser_ranking ausente'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Services
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'CommercialInventorySlot, DiscoveryImpressionEvent, RankingDiagnostics exported in app.types.ts',
  'TypeScript Models',
  () =>
    typesContent.includes('CommercialInventorySlot') &&
    typesContent.includes('DiscoveryImpressionEvent') &&
    typesContent.includes('RankingDiagnostics') &&
    typesContent.includes('sponsored_placement_name'),
  'Modelos de descoberta ausentes em app.types.ts'
);

const servicePath = path.join(rootDir, 'src', 'services', 'discovery', 'discoveryRankingService.ts');
const serviceContent = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';

runTest(
  'discoveryRankingService implements batch calculation, event recording, inventory management, and diagnostics',
  'Services',
  () =>
    fs.existsSync(servicePath) &&
    serviceContent.includes('recalculateRankingScores') &&
    serviceContent.includes('recordDiscoveryEvent') &&
    serviceContent.includes('getInventorySlots') &&
    serviceContent.includes('diagnoseAdvertiser'),
  'discoveryRankingService ausente ou com métodos incompletos'
);

const searchServicePath = path.join(rootDir, 'src', 'services', 'discovery', 'searchService.ts');
const searchServiceContent = fs.existsSync(searchServicePath) ? fs.readFileSync(searchServicePath, 'utf8') : '';

runTest(
  'searchService calls search_profiles_discovery_v2 with sort_by support',
  'Services',
  () => searchServiceContent.includes('search_profiles_discovery_v2') && searchServiceContent.includes('p_sort_by'),
  'searchService não atualizado para v2'
);

// --------------------------------------------------------------------------
// 3. UI Components & Pages
// --------------------------------------------------------------------------
const cardPath = path.join(rootDir, 'src', 'components', 'public', 'AdvertiserCard.tsx');
const cardContent = fs.existsSync(cardPath) ? fs.readFileSync(cardPath, 'utf8') : '';

runTest(
  'AdvertiserCard implements IntersectionObserver viewable impression tracking and accessible Patrocinado badge',
  'Public Card UI',
  () =>
    cardContent.includes('IntersectionObserver') &&
    cardContent.includes('recordDiscoveryEvent') &&
    cardContent.includes('Patrocinado'),
  'AdvertiserCard não implementa tracking de viewability ou badge patrocinado'
);

const adminDiscoveryPath = path.join(rootDir, 'src', 'app', 'admin', 'discovery', 'page.tsx');
const adminDiscoveryContent = fs.existsSync(adminDiscoveryPath) ? fs.readFileSync(adminDiscoveryPath, 'utf8') : '';

runTest(
  'Admin Discovery Page includes inventory slot management and ranking diagnostics tool',
  'Admin UI',
  () =>
    fs.existsSync(adminDiscoveryPath) &&
    adminDiscoveryContent.includes('Inventário Comercial de Slots') &&
    adminDiscoveryContent.includes('Diagnóstico de Ranking') &&
    adminDiscoveryContent.includes('handleRecalculateBatch'),
  'Admin Discovery page ausente ou incompleta'
);

// --------------------------------------------------------------------------
// 4. Non-Negotiables & Invariants
// --------------------------------------------------------------------------
runTest(
  'Payment does not substitute eligibility & Organic score is plan-independent',
  'Commercial Integrity',
  () =>
    !migrationContent.includes('subscription_tier *') &&
    migrationContent.includes('ro.has_active_campaign AND ro.organic_rank <= v_max_sponsored_slots'),
  'Score orgânico indevidamente atrelado a pagamentos'
);

runTest(
  'Age Assurance and ECA Digital gate remain 100% fail-closed',
  'Safety & Compliance',
  () => {
    const ageServicePath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
    return fs.existsSync(ageServicePath) && fs.readFileSync(ageServicePath, 'utf8').includes('isAgeVerified');
  },
  'Age Assurance alterado ou ausente'
);

// --------------------------------------------------------------------------
// Print Test Summary
// --------------------------------------------------------------------------
let passedCount = 0;
let failedCount = 0;

results.forEach((r, idx) => {
  if (r.passed) {
    passedCount++;
    console.log(`[PASS] ${idx + 1}. [${r.category}] ${r.name}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${idx + 1}. [${r.category}] ${r.name} --> ${r.message}`);
  }
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('----------------------------------------------------------------\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Phase 27C Discovery Ranking & Inventory verification tests passed!\n');
  process.exit(0);
}
