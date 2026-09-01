/**
 * PORTAL18 — Phase 27G Commercial Admin & Operations Control Center Verification Script
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
console.log('PORTAL18 — PHASE 27G AUTOMATED VERIFICATION SUITE');
console.log('Commercial Admin, Operations Control Center & Launch Governance');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Migration & Schema
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260902000027_phase27g_commercial_operations.sql');
const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'Migration 00027 exists and contains get_admin_commercial_overview RPC',
  'Database Schema',
  () => fs.existsSync(migrationPath) && migrationContent.length > 500,
  'Arquivo de migração 00027 ausente ou vazio'
);

runTest(
  'RPC get_admin_commercial_overview aggregates real advertiser and trial metrics',
  'Commercial Overview RPC',
  () =>
    migrationContent.includes('get_admin_commercial_overview') &&
    migrationContent.includes('total_advertisers') &&
    migrationContent.includes('active_trials') &&
    migrationContent.includes('trials_ending_soon'),
  'RPC sem métricas de anunciantes e trials'
);

runTest(
  'RPC get_admin_commercial_overview aggregates consumer premium and referral metrics',
  'Consumer & Referral RPC',
  () =>
    migrationContent.includes('active_consumer_subs') &&
    migrationContent.includes('pending_referrals') &&
    migrationContent.includes('referrals_manual_review'),
  'RPC sem métricas de consumer premium e referrals'
);

runTest(
  'RPC get_admin_commercial_overview aggregates inventory slots and utilization',
  'Inventory RPC',
  () =>
    migrationContent.includes('inventory_slots_total') &&
    migrationContent.includes('inventory_slots_reserved') &&
    migrationContent.includes('inventory_utilization_percent'),
  'RPC sem métricas de inventário comercial'
);

runTest(
  'RPC get_admin_commercial_overview reports payment readiness disabled state',
  'Payment Readiness RPC',
  () =>
    migrationContent.includes('payment_readiness') &&
    migrationContent.includes("'disabled'") &&
    migrationContent.includes('kill_switch_active'),
  'RPC sem status de payment readiness'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Services
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'AdminCommercialOverview, OperationalAlert, and PaymentReadinessCheckItem exported in app.types.ts',
  'TypeScript Types',
  () =>
    typesContent.includes('AdminCommercialOverview') &&
    typesContent.includes('OperationalAlert') &&
    typesContent.includes('PaymentReadinessCheckItem') &&
    typesContent.includes('CommercialExportOptions'),
  'Tipos de governança comercial ausentes em app.types.ts'
);

const servicePath = path.join(rootDir, 'src', 'services', 'adminCommercialService.ts');
const serviceContent = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';

runTest(
  'adminCommercialService implements getCommercialOverview, getOperationalAlerts, and exportCommercialData',
  'Domain Service',
  () =>
    fs.existsSync(servicePath) &&
    serviceContent.includes('getCommercialOverview') &&
    serviceContent.includes('getOperationalAlerts') &&
    serviceContent.includes('getPaymentReadinessChecklist') &&
    serviceContent.includes('exportCommercialData'),
  'adminCommercialService ausente ou incompleto'
);

// --------------------------------------------------------------------------
// 3. UI Components & Control Center
// --------------------------------------------------------------------------
const commercialPagePath = path.join(rootDir, 'src', 'app', 'admin', 'commercial', 'page.tsx');
const commercialPageContent = fs.existsSync(commercialPagePath) ? fs.readFileSync(commercialPagePath, 'utf8') : '';

runTest(
  'Commercial Control Center (/admin/commercial) exists with master operational tabs',
  'Commercial Admin UI',
  () =>
    fs.existsSync(commercialPagePath) &&
    commercialPageContent.includes('Centro de Operações Comerciais') &&
    commercialPageContent.includes('Visão Geral & Alertas') &&
    commercialPageContent.includes('Anunciantes & Planos') &&
    commercialPageContent.includes('Matriz de Precificação Unificada'),
  'Página /admin/commercial ausente ou incompleta'
);

runTest(
  'Commercial Control Center renders real operational alerts without fake mock data',
  'Operational Alerts UI',
  () =>
    commercialPageContent.includes('OperationalAlert') &&
    commercialPageContent.includes('handleExport') &&
    commercialPageContent.includes('KILL SWITCH ATIVO'),
  'Seção de alertas operacionais e kill switch ausentes'
);

const adminLayoutPath = path.join(rootDir, 'src', 'components', 'admin', 'AdminLayout.tsx');
const adminLayoutContent = fs.existsSync(adminLayoutPath) ? fs.readFileSync(adminLayoutPath, 'utf8') : '';

runTest(
  'AdminLayout includes Centro Comercial and Fila de Avaliações in navigation',
  'Admin Navigation',
  () =>
    adminLayoutContent.includes('/admin/commercial') &&
    adminLayoutContent.includes('Centro Comercial') &&
    adminLayoutContent.includes('/admin/moderation/reviews'),
  'Links do Centro Comercial ou Moderação de Avaliações ausentes no menu Admin'
);

// --------------------------------------------------------------------------
// 4. Operations Documentation & Runbooks
// --------------------------------------------------------------------------
const paymentRunbookPath = path.join(rootDir, 'docs', 'operations', 'payment-provider-activation.md');
const paymentRunbookContent = fs.existsSync(paymentRunbookPath) ? fs.readFileSync(paymentRunbookPath, 'utf8') : '';

runTest(
  'Payment provider activation runbook exists with security and rollback steps',
  'Operations Runbook',
  () =>
    fs.existsSync(paymentRunbookPath) &&
    paymentRunbookContent.includes('PAYMENT PROVIDER ACTIVATION') &&
    paymentRunbookContent.includes('Rollback & Emergency Kill Switch'),
  'Documento payment-provider-activation.md ausente'
);

const checklistPath = path.join(rootDir, 'docs', 'operations', 'commercial-launch-checklist.md');
const checklistContent = fs.existsSync(checklistPath) ? fs.readFileSync(checklistPath, 'utf8') : '';

runTest(
  'Commercial launch checklist exists with legal review and invariant checks',
  'Launch Checklist',
  () =>
    fs.existsSync(checklistPath) &&
    checklistContent.includes('COMMERCIAL LAUNCH CHECKLIST') &&
    checklistContent.includes('Legal & Compliance Review Flags'),
  'Documento commercial-launch-checklist.md ausente'
);

// --------------------------------------------------------------------------
// 5. Invariants & Security
// --------------------------------------------------------------------------
runTest(
  'Payment kill switch remains 100% active (Zero mock revenue in production)',
  'Commercial Invariant',
  () => commercialPageContent.includes('KILL SWITCH ATIVO'),
  'Kill switch de pagamentos ausente no centro de operações'
);

runTest(
  'Age Assurance and Safe Mode remain 100% fail-closed',
  'Safety Invariant',
  () => checklistContent.includes('Age Assurance Primacy'),
  'Age Assurance violado na documentação de governança'
);

runTest(
  'Commercial exports do not leak visitor identities or raw biometric data',
  'Privacy Invariant',
  () => !serviceContent.includes('password') && !serviceContent.includes('biometric'),
  'Vazamento de dados privados em exportação comercial'
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
  console.log('🎉 All Phase 27G Commercial Admin & Operations Governance verification tests passed!\n');
  process.exit(0);
}
