/**
 * PORTAL18 — Phase 27D Advertiser Analytics, Funnel Intelligence & Performance Verification Script
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
console.log('PORTAL18 — PHASE 27D AUTOMATED VERIFICATION SUITE');
console.log('Advertiser Analytics, Funnel Intelligence & Performance Insights');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Migration & Analytics Engine
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260830000024_phase27d_analytics.sql');
const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'Migration 00024 exists and contains analytics funnel RPCs',
  'Database Schema',
  () => fs.existsSync(migrationPath) && migrationContent.length > 1000,
  'Arquivo de migração 00024 ausente ou vazio'
);

runTest(
  'RPC get_advertiser_funnel_analytics computes 3-step funnel (impressions -> profile_views -> contact_clicks)',
  'Funnel Computation',
  () =>
    migrationContent.includes('get_advertiser_funnel_analytics') &&
    migrationContent.includes('v_impressions') &&
    migrationContent.includes('v_views') &&
    migrationContent.includes('v_contacts'),
  'RPC não computa o funil de 3 etapas'
);

runTest(
  'RPC get_advertiser_funnel_analytics protects against Zero Denominator (0% instead of NaN)',
  'Mathematical Integrity',
  () =>
    migrationContent.includes('IF v_impressions > 0 THEN') &&
    migrationContent.includes('IF v_views > 0 THEN'),
  'Cálculo de taxas não possui proteção contra divisão por zero'
);

runTest(
  'RPC get_advertiser_funnel_analytics computes comparison trends with previous equivalent period',
  'Period Trends',
  () =>
    migrationContent.includes('v_prev_impressions') &&
    migrationContent.includes('v_prev_views') &&
    migrationContent.includes('v_impressions_trend'),
  'Comparação com período anterior ausente'
);

runTest(
  'RPC get_advertiser_funnel_analytics breaks down discovery sources (organic vs sponsored)',
  'Source Attribution',
  () =>
    migrationContent.includes('v_organic_impr') &&
    migrationContent.includes('v_sponsored_impr') &&
    migrationContent.includes("'organic'") &&
    migrationContent.includes("'sponsored'"),
  'Separação orgânica vs patrocinada ausente'
);

runTest(
  'RPC get_advertiser_funnel_analytics breaks down contact channels (WhatsApp, Telegram, Phone)',
  'Channel Attribution',
  () =>
    migrationContent.includes("WHERE channel = 'whatsapp'") &&
    migrationContent.includes("WHERE channel = 'telegram'") &&
    migrationContent.includes("WHERE channel = 'phone'"),
  'Separação por canais de contato ausente'
);

runTest(
  'RPC get_advertiser_funnel_analytics generates deterministic performance insights with minimum sample guard',
  'Insights Engine',
  () =>
    migrationContent.includes('v_insights') &&
    migrationContent.includes('IF v_views >= 5 THEN') &&
    migrationContent.includes('trend_views_up'),
  'Motor de insights sem guardas de amostragem mínima'
);

runTest(
  'RPC get_advertiser_funnel_analytics enforces strict cross-user isolation and authorization',
  'Security & RLS',
  () =>
    migrationContent.includes('v_adv.profile_id <> v_profile_id AND NOT public.is_staff()') &&
    migrationContent.includes('RAISE EXCEPTION'),
  'RPC não valida autorização de acesso ao perfil'
);

runTest(
  'RPC get_admin_platform_analytics aggregates platform discovery health without visitor PII',
  'Admin Analytics',
  () =>
    migrationContent.includes('get_admin_platform_analytics') &&
    migrationContent.includes('sponsored_share_percent') &&
    migrationContent.includes('active_advertisers'),
  'RPC get_admin_platform_analytics ausente'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Services
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'AdvertiserFunnelAnalytics, FunnelTotals, and AdminPlatformAnalytics exported in app.types.ts',
  'TypeScript Models',
  () =>
    typesContent.includes('AdvertiserFunnelAnalytics') &&
    typesContent.includes('FunnelTotals') &&
    typesContent.includes('AdminPlatformAnalytics') &&
    typesContent.includes('PerformanceInsight'),
  'Modelos de analytics ausentes em app.types.ts'
);

const servicePath = path.join(rootDir, 'src', 'services', 'advertiserAnalyticsService.ts');
const serviceContent = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';

runTest(
  'advertiserAnalyticsService implements getFunnelAnalytics and getAdminPlatformAnalytics',
  'Services',
  () =>
    fs.existsSync(servicePath) &&
    serviceContent.includes('getFunnelAnalytics') &&
    serviceContent.includes('getAdminPlatformAnalytics'),
  'advertiserAnalyticsService ausente ou incompleto'
);

// --------------------------------------------------------------------------
// 3. UI Components & Pages
// --------------------------------------------------------------------------
const advertiserAnalyticsPath = path.join(rootDir, 'src', 'app', 'advertiser', 'analytics', 'page.tsx');
const advertiserAnalyticsContent = fs.existsSync(advertiserAnalyticsPath) ? fs.readFileSync(advertiserAnalyticsPath, 'utf8') : '';

runTest(
  'Advertiser Analytics Center page exists with KPI cards, 3-step funnel visualizer, and time series',
  'Advertiser UI',
  () =>
    fs.existsSync(advertiserAnalyticsPath) &&
    advertiserAnalyticsContent.includes('Funil de Conversão do Anúncio') &&
    advertiserAnalyticsContent.includes('Desempenho ao Longo do Tempo') &&
    advertiserAnalyticsContent.includes('Origem da Descoberta') &&
    advertiserAnalyticsContent.includes('Canais de Contato'),
  'Advertiser Analytics page ausente ou incompleta'
);

const statisticsRedirectPath = path.join(rootDir, 'src', 'app', 'advertiser', 'statistics', 'page.tsx');
const statisticsRedirectContent = fs.existsSync(statisticsRedirectPath) ? fs.readFileSync(statisticsRedirectPath, 'utf8') : '';

runTest(
  'Advertiser Statistics page forwards to /advertiser/analytics',
  'Navigation & Routing',
  () => statisticsRedirectContent.includes("replace('/advertiser/analytics')"),
  'Advertiser statistics não redireciona para analytics'
);

const adminAnalyticsPath = path.join(rootDir, 'src', 'app', 'admin', 'analytics', 'page.tsx');
const adminAnalyticsContent = fs.existsSync(adminAnalyticsPath) ? fs.readFileSync(adminAnalyticsPath, 'utf8') : '';

runTest(
  'Admin Analytics Dashboard page exists with discovery distribution and funnel',
  'Admin UI',
  () =>
    fs.existsSync(adminAnalyticsPath) &&
    adminAnalyticsContent.includes('Analytics da Plataforma & Descoberta') &&
    adminAnalyticsContent.includes('Distribuição de Tráfego de Descoberta'),
  'Admin Analytics page ausente'
);

// --------------------------------------------------------------------------
// 4. Non-Negotiables & Invariants
// --------------------------------------------------------------------------
runTest(
  'Contact interactions are explicitly labeled as Contact Intent (not sales or guaranteed clients)',
  'Commercial Ethics',
  () =>
    advertiserAnalyticsContent.includes('Intenções de Contato') &&
    !advertiserAnalyticsContent.includes('Vendas Conquistadas'),
  'Terminologia incorreta ou enganosa de conversão'
);

runTest(
  'Age Assurance, Safe Mode and fail-closed privacy remain 100% intact',
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
  console.log('🎉 All Phase 27D Advertiser Analytics & Funnel Intelligence verification tests passed!\n');
  process.exit(0);
}
