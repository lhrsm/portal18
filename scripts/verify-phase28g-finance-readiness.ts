/**
 * PORTAL18 — PHASE 28G AUTOMATED VERIFICATION SUITE
 * Finance Operations, Tax/Fiscal Readiness & Production Go/No-Go
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { financeOpsService } from '../src/services/finance/financeOpsService';
import { goNoGoService } from '../src/services/finance/goNoGoService';

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
  console.log('PORTAL18 — PHASE 28G AUTOMATED VERIFICATION SUITE');
  console.log('Finance Operations, Fiscal Readiness & Production Go/No-Go');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & FINANCIAL PERIODS ---');

  // 1.1 Migration 00032
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000032_phase28g_finance_operations_fiscal_readiness.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('payment_settlements') &&
    migrationContent.includes('financial_periods') &&
    migrationContent.includes('fiscal_documents') &&
    migrationContent.includes('close_financial_period') &&
    migrationContent.includes('reopen_financial_period'),
    '1.1 [Database Migration] Migration 00032 defines settlements, financial periods, fiscal documents, and closing RPCs',
    'Migration 00032 missing or incomplete'
  );

  console.log('\n--- 2. FINANCE OPERATIONS & MINOR UNITS INTEGRITY ---');

  // 2.1 Finance Operations Service
  const overview = await financeOpsService.getFinancialOverview();
  assert(
    typeof overview.grossMinor === 'number' &&
    Number.isInteger(overview.grossMinor) &&
    typeof overview.netSettlementMinor === 'number' &&
    Number.isInteger(overview.netSettlementMinor) &&
    overview.environment === 'homologation',
    '2.1 [Minor Units & Integer Cent Integrity] Financial overview operates strictly in integer cents with homologation labeling',
    'Financial figures not integer minor units'
  );

  console.log('\n--- 3. FISCAL READINESS & NFS-E ABSTRACTION ---');

  // 3.1 Fiscal Readiness UI & Disclaimers
  const fiscalPagePath = path.join(rootDir, 'src', 'app', 'admin', 'finance', 'fiscal-readiness', 'page.tsx');
  const fiscalPageExists = fs.existsSync(fiscalPagePath);
  const fiscalPageContent = fiscalPageExists ? fs.readFileSync(fiscalPagePath, 'utf8') : '';

  assert(
    fiscalPageExists &&
    fiscalPageContent.includes('NOT CONFIGURED') &&
    fiscalPageContent.includes('ACCOUNTING_REVIEW_REQUIRED') &&
    fiscalPageContent.includes('ReceiptModal'),
    '3.1 [Fiscal Document Readiness] /admin/finance/fiscal-readiness marks NFS-e as unconfigured and separates receipts from invoices',
    'Fiscal readiness page missing or invalid'
  );

  console.log('\n--- 4. PRODUCTION GO/NO-GO DECISION ENGINE ---');

  // 4.1 Go/No-Go Evaluation
  const readinessReport = await goNoGoService.evaluateProductionReadiness();
  assert(
    readinessReport.overallStatus === 'BLOCKED' &&
    readinessReport.killSwitchState === 'ACTIVE' &&
    readinessReport.gates.length === 8 &&
    readinessReport.gates.some((g) => g.gate === 'TECHNICAL' && g.status === 'PASS') &&
    readinessReport.gates.some((g) => g.gate === 'FISCAL' && g.status === 'NOT_CONFIGURED'),
    '4.1 [Production Go/No-Go Decision] goNoGoService evaluates all 8 gates and strictly blocks production activation',
    'Go/No-Go report evaluation invalid'
  );

  console.log('\n--- 5. DOCUMENTATION PACKAGES ---');

  // 5.1 Documentation Files
  const docFiles = [
    'docs/finance/financial-operations.md',
    'docs/finance/period-closing.md',
    'docs/finance/accounting-export.md',
    'docs/finance/fiscal-readiness.md',
    'docs/finance/production-go-no-go.md',
    'docs/finance/emergency-payment-shutdown.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '5.1 [Finance Documentation Packages] All 6 finance operational runbooks and disclaimers exist in docs/finance/',
    'Some documentation files are missing'
  );

  console.log('\n--- 6. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 6.1 Payment Kill Switch Active Invariant
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
    console.log('🎉 All Phase 28G Finance Readiness & Go/No-Go verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28G verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
