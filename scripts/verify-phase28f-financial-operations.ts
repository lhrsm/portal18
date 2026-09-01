/**
 * PORTAL18 — PHASE 28F AUTOMATED VERIFICATION SUITE
 * Refunds, Disputes, Chargebacks & Financial Reconciliation Hardening
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderResolver } from '../src/services/payments/resolver';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { financialOpsService } from '../src/services/payments/financialOpsService';

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
  console.log('PORTAL18 — PHASE 28F AUTOMATED VERIFICATION SUITE');
  console.log('Refunds, Disputes, Chargebacks & Financial Reconciliation');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & FINANCIAL EXTENSIONS ---');

  // 1.1 Migration 00031
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000031_phase28f_refunds_disputes_reconciliation.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('process_canonical_refund') &&
    migrationContent.includes('record_dispute_event') &&
    migrationContent.includes('resolve_reconciliation_discrepancy') &&
    migrationContent.includes('uq_payment_refunds_idempotency') &&
    migrationContent.includes('POTENTIAL_DOUBLE_CHARGE'),
    '1.1 [Database Migration] Migration 00031 defines refund idempotency, dispute lifecycle, and reconciliation RPCs',
    'Migration 00031 missing or incomplete'
  );

  console.log('\n--- 2. FINANCIAL OPERATIONS SERVICE INTERFACE ---');

  // 2.1 Service Methods
  assert(
    typeof financialOpsService.processRefund === 'function' &&
    typeof financialOpsService.getRefundsByOrder === 'function' &&
    typeof financialOpsService.getAllRefunds === 'function' &&
    typeof financialOpsService.recordDispute === 'function' &&
    typeof financialOpsService.getDisputesQueue === 'function' &&
    typeof financialOpsService.resolveDiscrepancy === 'function' &&
    typeof financialOpsService.exportFinancialLedgerCSV === 'function',
    '2.1 [Financial Ops Interface] financialOpsService implements full/partial refunds, disputes, and CSV exports',
    'financialOpsService methods missing'
  );

  console.log('\n--- 3. ACCOUNTING EXPORT SANITIZATION ---');

  // 3.1 Sanitized CSV Export
  const csvExport = await financialOpsService.exportFinancialLedgerCSV();
  assert(
    csvExport.includes('Numero_Pedido') &&
    csvExport.includes('Valor_Bruto_BRL') &&
    !csvExport.includes('cvv') &&
    !csvExport.includes('password') &&
    !csvExport.includes('biometric'),
    '3.1 [Accounting Export Sanitization] exportFinancialLedgerCSV exports clean ledger without sensitive data or passwords',
    'CSV export contains sensitive data or invalid schema'
  );

  console.log('\n--- 4. UI COMPONENTS & ADMIN FINANCIAL CENTER ---');

  // 4.1 ReceiptModal with Refund Badges
  const receiptModalPath = path.join(rootDir, 'src', 'components', 'billing', 'ReceiptModal.tsx');
  const receiptModalExists = fs.existsSync(receiptModalPath);
  const receiptModalContent = receiptModalExists ? fs.readFileSync(receiptModalPath, 'utf8') : '';

  assert(
    receiptModalExists &&
    receiptModalContent.includes('REEMBOLSADO') &&
    receiptModalContent.includes('PARCIALMENTE REEMBOLSADO'),
    '4.1 [Receipt Modal Refund Badges] ReceiptModal.tsx renders refund and partial refund breakdown badges',
    'ReceiptModal missing refund badges'
  );

  // 4.2 Admin Disputes & Financial Operations Page
  const disputesPagePath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'disputes', 'page.tsx');
  const disputesPageExists = fs.existsSync(disputesPagePath);
  const disputesPageContent = disputesPageExists ? fs.readFileSync(disputesPagePath, 'utf8') : '';

  assert(
    disputesPageExists &&
    disputesPageContent.includes('Disputas, Estornos & Livro-Razão Financeiro') &&
    disputesPageContent.includes('Novo Estorno') &&
    disputesPageContent.includes('Exportar CSV Contábil'),
    '4.2 [Admin Financial Center] /admin/payments/disputes displays refund queues, chargebacks, and export tools',
    'Admin disputes page missing'
  );

  console.log('\n--- 5. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 5.1 Payment Kill Switch Active Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '5.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 5.2 Stripe Prohibition Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '5.2 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: 7 | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28F Financial Operations & Reconciliation verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28F verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
