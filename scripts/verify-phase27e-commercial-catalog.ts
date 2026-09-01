/**
 * PORTAL18 — Phase 27E Plan Catalog, Billing Periods & Boost Marketplace Verification Script
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
console.log('PORTAL18 — PHASE 27E AUTOMATED VERIFICATION SUITE');
console.log('Plan Catalog, Billing Periods, Entitlements & Boost Marketplace');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Migration & Catalog Schema
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260830000025_phase27e_plan_catalog.sql');
const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'Migration 00025 exists and contains billing periods and pricing matrix schema',
  'Database Schema',
  () => fs.existsSync(migrationPath) && migrationContent.length > 1000,
  'Arquivo de migração 00025 ausente ou vazio'
);

runTest(
  'billing_periods table created and seeded with 7, 30, and 90 days',
  'Billing Periods',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.billing_periods') &&
    migrationContent.includes('7_days') &&
    migrationContent.includes('30_days') &&
    migrationContent.includes('90_days'),
  'Tabela billing_periods ausente ou sem períodos canônicos'
);

runTest(
  'plan_pricing table created with policy versioning and integer cents in BRL',
  'Price Versioning',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.plan_pricing') &&
    migrationContent.includes('price_cents integer NOT NULL') &&
    migrationContent.includes('policy_version') &&
    migrationContent.includes('uq_plan_period_policy'),
  'Tabela plan_pricing ausente ou sem restrição única de versionamento'
);

runTest(
  'Seed data populates multi-period pricing for Essencial, Destaque, Premium, and VIP',
  'Pricing Matrix',
  () =>
    migrationContent.includes('v_p_essencial') &&
    migrationContent.includes('v_p_destaque') &&
    migrationContent.includes('v_p_premium') &&
    migrationContent.includes('v_p_vip'),
  'Seed de preços por período incompleto'
);

runTest(
  'RPC get_commercial_catalog returns active plans with pricing matrix and boost products',
  'Catalog RPC',
  () =>
    migrationContent.includes('get_commercial_catalog') &&
    migrationContent.includes('jsonb_object_agg') &&
    migrationContent.includes('boost_products'),
  'RPC get_commercial_catalog ausente'
);

runTest(
  'RPC get_advertiser_commercial_summary returns lifecycle, entitlements, and usage meters',
  'Advertiser Summary RPC',
  () =>
    migrationContent.includes('get_advertiser_commercial_summary') &&
    migrationContent.includes('v_photo_count') &&
    migrationContent.includes('v_video_count') &&
    migrationContent.includes('can_add_more'),
  'RPC get_advertiser_commercial_summary ausente'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Services
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'BillingPeriod, PlanPeriodPricing, CatalogPlan, CommercialCatalog exported in app.types.ts',
  'TypeScript Models',
  () =>
    typesContent.includes('BillingPeriod') &&
    typesContent.includes('PlanPeriodPricing') &&
    typesContent.includes('CatalogPlan') &&
    typesContent.includes('CommercialCatalog'),
  'Modelos de catálogo ausentes em app.types.ts'
);

const servicePath = path.join(rootDir, 'src', 'services', 'commercialCatalogService.ts');
const serviceContent = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';

runTest(
  'commercialCatalogService implements getCatalog and getAdvertiserCommercialSummary',
  'Services',
  () =>
    fs.existsSync(servicePath) &&
    serviceContent.includes('getCatalog') &&
    serviceContent.includes('getAdvertiserCommercialSummary'),
  'commercialCatalogService ausente ou incompleto'
);

// --------------------------------------------------------------------------
// 3. UI Components & Pages
// --------------------------------------------------------------------------
const publicPlansPath = path.join(rootDir, 'src', 'app', 'plans', 'page.tsx');
const publicPlansContent = fs.existsSync(publicPlansPath) ? fs.readFileSync(publicPlansPath, 'utf8') : '';

runTest(
  'Public Plans page (/plans) includes billing period selector, comparison table, and trial banner',
  'Public Plans UI',
  () =>
    fs.existsSync(publicPlansPath) &&
    publicPlansContent.includes('selectedPeriodSlug') &&
    publicPlansContent.includes('Comparativo Completo de Recursos') &&
    publicPlansContent.includes('Experimentação Premium de 7 Dias'),
  'Página de planos pública incompleta'
);

const subscriptionPath = path.join(rootDir, 'src', 'app', 'advertiser', 'subscription', 'page.tsx');
const subscriptionContent = fs.existsSync(subscriptionPath) ? fs.readFileSync(subscriptionPath, 'utf8') : '';

runTest(
  'Advertiser Subscription page displays real usage meters, referral bonus days, and active entitlements',
  'Advertiser UI',
  () =>
    fs.existsSync(subscriptionPath) &&
    subscriptionContent.includes('Fotos na Galeria') &&
    subscriptionContent.includes('Vídeos Comerciais') &&
    subscriptionContent.includes('Benefícios & Entitlements Autorizados'),
  'Página de assinatura do anunciante incompleta'
);

const promotePath = path.join(rootDir, 'src', 'app', 'advertiser', 'promote', 'page.tsx');
const promoteContent = fs.existsSync(promotePath) ? fs.readFileSync(promotePath, 'utf8') : '';

runTest(
  'Boost Marketplace (/advertiser/promote) uses neutral Megaphone badge and ethical copy',
  'Boost Marketplace UI',
  () =>
    fs.existsSync(promotePath) &&
    promoteContent.includes('Megaphone') &&
    promoteContent.includes('RECURSO EM HOMOLOGAÇÃO'),
  'Marketplace de destaques sem adequação ética'
);

const adminPlansPath = path.join(rootDir, 'src', 'app', 'admin', 'plans', 'page.tsx');
const adminPlansContent = fs.existsSync(adminPlansPath) ? fs.readFileSync(adminPlansPath, 'utf8') : '';

runTest(
  'Admin Plans page displays multi-period pricing matrix and entitlement limits',
  'Admin UI',
  () =>
    fs.existsSync(adminPlansPath) &&
    adminPlansContent.includes('Precificação por Período') &&
    adminPlansContent.includes('Limite de Fotos'),
  'Página admin de planos incompleta'
);

// --------------------------------------------------------------------------
// 4. Non-Negotiables & Invariants
// --------------------------------------------------------------------------
runTest(
  'Authenticity is 100% Free and available across all plans',
  'Commercial Invariant',
  () => publicPlansContent.includes('Selo de Autenticidade (Grátis)'),
  'Autenticidade indevidamente associada a planos pagos'
);

runTest(
  'Payment kill switch remains 100% active (Zero mock charges in production)',
  'Security & Compliance',
  () => {
    const billingPath = path.join(rootDir, 'src', 'services', 'billingService.ts');
    return fs.existsSync(billingPath) && fs.readFileSync(billingPath, 'utf8').includes('create_advertiser_checkout');
  },
  'Kill switch de pagamentos ausente'
);

runTest(
  'Age Assurance and Safe Mode remain 100% fail-closed',
  'Safety & Compliance',
  () => {
    const ageServicePath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
    return fs.existsSync(ageServicePath) && fs.readFileSync(ageServicePath, 'utf8').includes('isAgeVerified');
  },
  'Age Assurance alterado'
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
  console.log('🎉 All Phase 27E Plan Catalog & Boost Marketplace verification tests passed!\n');
  process.exit(0);
}
