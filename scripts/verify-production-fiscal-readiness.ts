/**
 * PORTAL18 — PRODUCTION TRACK P5 VERIFICATION SUITE
 * Fiscal, NFS-e, Accounting & Tax Production Readiness
 */

import fs from 'fs';
import path from 'path';
import { FiscalProviderFactory } from '../src/services/fiscal/factory';
import { PaymentProviderRegistry } from '../src/services/payments/registry';

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

async function runFiscalReadinessVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PRODUCTION TRACK P5 VERIFICATION SUITE');
  console.log('Fiscal, NFS-e & Accounting Production Readiness');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DOMAIN SEPARATION & NO FAKE ISSUANCE ---');

  // 1.1 Provider Abstraction & Fail-Closed State
  const fiscalProvider = FiscalProviderFactory.getProvider();
  const issueResult = await fiscalProvider.issue({
    internalReference: 'test_ref_001',
    orderId: 'order_test_001',
    competenceDate: new Date().toISOString(),
    grossAmountCents: 10000,
    deductionsCents: 0,
    serviceDescription: 'Assinatura Plataforma',
    dedupeKey: 'dedupe_fiscal_001',
  });

  assert(
    issueResult.success === false && issueResult.status === 'disabled_by_policy',
    '1.1 [Fail-Closed Fiscal Guard] Fiscal provider returns disabled_by_policy under PORTAL18_FISCAL_KILL_SWITCH = true (zero fake NFS-e)',
    'Fiscal provider issued unauthorized simulated document'
  );

  // 1.2 Configuration Validation
  const configVal = fiscalProvider.validateConfiguration();
  assert(
    configVal.configured === false && (configVal.missingKeys?.length ?? 0) > 0,
    '1.2 [Configuration Validation] Provider accurately reports unconfigured status with missing credential keys',
    'Provider falsely reported valid configuration'
  );

  console.log('\n--- 2. CORPORATE IDENTITY & TAX GOVERNANCE GATES ---');

  // 2.1 Admin Fiscal Center Indicators
  const adminFiscalSource = fs.readFileSync(path.join(rootDir, 'src', 'app', 'admin', 'finance', 'fiscal-readiness', 'page.tsx'), 'utf8');
  assert(
    adminFiscalSource.includes('NOT CONFIGURED') &&
    adminFiscalSource.includes('ACCOUNTING_REVIEW_REQUIRED') &&
    adminFiscalSource.includes('LEGAL_REVIEW_REQUIRED') &&
    adminFiscalSource.includes('UNVERIFIED'),
    '2.1 [Fiscal Center Indicators] /admin/finance/fiscal-readiness transparently renders pending governance and review flags',
    'Fiscal center contains premature ready indicators'
  );

  // 2.2 Receipt vs NFS-e Regulatory Distinction
  assert(
    adminFiscalSource.includes('Comprovante Eletrônico (ReceiptModal)') &&
    adminFiscalSource.includes('Nota Fiscal de Serviços Eletrônica (NFS-e)'),
    '2.2 [Regulatory Distinction] Platform maintains explicit distinction between internal payment receipts and official municipal NFS-e',
    'Receipt and NFS-e distinction missing'
  );

  console.log('\n--- 3. CLIENT SECRET ISOLATION & ZERO CERTIFICATE LEAK ---');

  // 3.1 Secret Isolation
  const envFile = path.join(rootDir, '.env.local');
  let fiscalSecretLeaked = false;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_') && (line.includes('CERTIFICATE') || line.includes('FISCAL') || line.includes('NFSE_KEY'))) {
        fiscalSecretLeaked = true;
      }
    });
  }

  assert(
    !fiscalSecretLeaked,
    '3.1 [Secret Isolation] Zero fiscal API keys, certificates, or municipal credentials exposed under NEXT_PUBLIC_ prefixes',
    'Fiscal secrets leaked in client bundle'
  );

  console.log('\n--- 4. PRODUCTION FISCAL DOCUMENTATION PACKAGES ---');

  // 4.1 Runbooks
  const fiscalDocs = [
    'docs/production/fiscal/fiscal-architecture.md',
    'docs/production/fiscal/accounting-readiness.md',
    'docs/production/fiscal/nfse-provider-readiness.md',
    'docs/production/fiscal/tax-configuration.md',
    'docs/production/fiscal/fiscal-reconciliation.md',
    'docs/production/fiscal/fiscal-incident-response.md',
    'docs/production/fiscal/fiscal-activation-checklist.md',
    'docs/production/fiscal/accountant-questionnaire.md',
  ];

  const allDocsExist = fiscalDocs.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '4.1 [Documentation Packages] All 8 fiscal architecture, accounting, reconciliation, questionnaire, and activation runbooks exist',
    'Missing fiscal documentation packages'
  );

  console.log('\n--- 5. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 5.1 Fiscal Kill Switch
  const isFiscalKillSwitchActive = process.env.PORTAL18_FISCAL_KILL_SWITCH !== 'false';
  assert(
    isFiscalKillSwitchActive === true,
    '5.1 [Fiscal Kill Switch Invariant] PORTAL18_FISCAL_KILL_SWITCH remains strictly active',
    'Fiscal kill switch must remain active'
  );

  // 5.2 Payment Kill Switch
  const isPaymentKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isPaymentKillSwitchActive === true,
    '5.2 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH remains strictly active',
    'Payment kill switch must remain active'
  );

  // 5.3 Email Kill Switch
  const isEmailKillSwitchActive = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';
  assert(
    isEmailKillSwitchActive === true,
    '5.3 [Email Kill Switch Invariant] PORTAL18_EMAIL_KILL_SWITCH remains strictly active',
    'Email kill switch must remain active'
  );

  // 5.4 Stripe Prohibition
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;
  assert(
    stripeMeta?.is_production_eligible === false &&
    stripeMeta?.contact_status === 'rejected',
    '5.4 [Stripe Block Invariant] Stripe remains permanently blocked from production',
    'Stripe must remain strictly blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Production Track P5 Fiscal Readiness tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Production Track P5 verification tests failed.\n');
    process.exit(1);
  }
}

runFiscalReadinessVerification().catch((err) => {
  console.error('Fatal error running fiscal readiness verification:', err);
  process.exit(1);
});
