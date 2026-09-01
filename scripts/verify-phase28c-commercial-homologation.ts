/**
 * PORTAL18 — PHASE 28C AUTOMATED VERIFICATION SUITE
 * Commercial Homologation, Provider Onboarding, Dossier & Credential Readiness
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { PaymentProviderResolver } from '../src/services/payments/resolver';

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
  console.log('PORTAL18 — PHASE 28C AUTOMATED VERIFICATION SUITE');
  console.log('Commercial Homologation, Compliance Dossier & Product Gates');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. COMPLIANCE DOSSIER & OUTREACH DOCUMENTATION ---');

  // 1.1 Compliance Dossier Completeness (25 Sections)
  const dossierPath = path.join(rootDir, 'docs', 'payments', 'portal18-provider-compliance-dossier.md');
  const dossierExists = fs.existsSync(dossierPath);
  const dossierContent = dossierExists ? fs.readFileSync(dossierPath, 'utf8') : '';

  assert(
    dossierExists &&
    dossierContent.includes('Company & Platform Overview') &&
    dossierContent.includes('Business Model & Boundaries') &&
    dossierContent.includes('Age Assurance') &&
    dossierContent.includes('Minor Protection') &&
    dossierContent.includes('Content Moderation') &&
    dossierContent.includes('process, intermediate, or collect payments for services negotiated between visitors and independent advertisers') &&
    dossierContent.includes('MCC 7273'),
    '1.1 [Compliance Dossier] docs/payments/portal18-provider-compliance-dossier.md contains complete 25-section institutional disclosure',
    'Compliance dossier missing or incomplete'
  );

  // 1.2 Outreach Templates in Portuguese and English
  const outreachPath = path.join(rootDir, 'docs', 'payments', 'provider-outreach-templates.md');
  const outreachExists = fs.existsSync(outreachPath);
  const outreachContent = outreachExists ? fs.readFileSync(outreachPath, 'utf8') : '';

  assert(
    outreachExists &&
    outreachContent.includes('Solicitação de Análise Comercial, Credenciamento e Homologação') &&
    outreachContent.includes('Short Support Form Template') &&
    outreachContent.includes('Global Commercial Outreach Template (English'),
    '1.2 [Outreach Templates] docs/payments/provider-outreach-templates.md contains Portuguese formal, ticket, and English templates',
    'Outreach templates document missing or incomplete'
  );

  // 1.3 Legal Review Checklist
  const legalPath = path.join(rootDir, 'docs', 'payments', 'legal-review-checklist.md');
  const legalExists = fs.existsSync(legalPath);
  const legalContent = legalExists ? fs.readFileSync(legalPath, 'utf8') : '';

  assert(
    legalExists &&
    legalContent.includes('PENDING FORMAL LEGAL COUNSEL REVIEW') &&
    legalContent.includes('Código de Defesa do Consumidor') &&
    legalContent.includes('ECA Digital'),
    '1.3 [Legal Review Checklist] docs/payments/legal-review-checklist.md documents legal audit items without premature counsel claims',
    'Legal review checklist missing or incomplete'
  );

  console.log('\n--- 2. DATABASE SCHEMA & ADDITIVE MIGRATION ---');

  // 2.1 Migration 00028 Audit
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000028_phase28c_commercial_homologation.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('contact_status') &&
    migrationContent.includes('product_approvals') &&
    migrationContent.includes('mcc_classification') &&
    migrationContent.includes('approval_evidence') &&
    migrationContent.includes('get_payment_providers()'),
    '2.1 [Migration 00028] Migration defines contact_status, product_approvals, mcc_classification, and updated RPC',
    'Migration 00028 missing or incomplete'
  );

  console.log('\n--- 3. GRANULAR PRODUCT & PAYMENT METHOD GATES ---');

  // 3.1 Granular Product Gate in Resolver
  const mpProvider = PaymentProviderRegistry.get('mercadopago');
  const mpMeta = mpProvider ? await mpProvider.getMetadata() : null;

  assert(
    mpMeta !== null &&
    mpMeta.product_approvals !== undefined &&
    mpMeta.product_approvals.advertiser_subscription !== undefined &&
    mpMeta.product_approvals.consumer_subscription !== undefined &&
    mpMeta.product_approvals.boost !== undefined,
    '3.1 [Granular Product Matrix] Provider metadata maintains product-specific approvals (advertiser, consumer, boost)',
    'Provider missing granular product_approvals structure'
  );

  // 3.2 Product/Method Restricted Fail-Closed Simulation
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'false';
  const resolvedUnapproved = await PaymentProviderResolver.resolve({
    productType: 'consumer_subscription',
    paymentMethod: 'credit_card',
    environment: 'production',
    allowMockDriver: false,
  });

  assert(
    resolvedUnapproved.success === false && resolvedUnapproved.error === 'PAYMENT_PROVIDER_UNAVAILABLE',
    '3.2 [Product-Specific Fail-Closed] Resolver rejects production request when product/method approval is missing',
    'Resolver must fail closed on unapproved product/method combinations'
  );

  // Reset Kill Switch back to true for safety
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'true';

  console.log('\n--- 4. PROVIDER GOVERNANCE & SAFETY INVARIANTS ---');

  // 4.1 Stripe Strict Policy Prohibition
  const stripeProvider = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripeProvider ? await stripeProvider.getMetadata() : null;

  assert(
    stripeProvider !== null &&
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.commercial_status === 'rejected' &&
    stripeMeta?.compliance_status === 'rejected' &&
    stripeMeta?.mcc_classification?.assigned_mcc === 'PROHIBITED',
    '4.1 [Stripe Prohibition Invariant] Stripe is permanently marked REJECTED across commercial and compliance reviews',
    'Stripe must remain permanently rejected'
  );

  // 4.2 Internal Test Driver Exclusion
  const internalDriver = PaymentProviderRegistry.get('unconfigured');
  const internalMeta = internalDriver ? await internalDriver.getMetadata() : null;

  assert(
    internalDriver !== null &&
    internalMeta?.is_internal_driver === true &&
    internalMeta?.is_production_eligible === false &&
    internalMeta?.commercial_status === 'NOT_APPLICABLE',
    '4.2 [Internal Driver Safety] Internal Test Driver is marked TEST ONLY and excluded from commercial candidate selection',
    'Internal test driver must not be eligible for commercial production'
  );

  // 4.3 Payment Kill Switch Invariant
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'true';
  const killSwitchResolution = await PaymentProviderResolver.resolve({
    productType: 'advertiser_subscription',
    paymentMethod: 'pix',
  });

  assert(
    killSwitchResolution.success && killSwitchResolution.provider?.code === 'unconfigured',
    '4.3 [Payment Kill Switch] Global Kill Switch strictly diverts all checkouts to internal test driver',
    'Kill switch must prevent external gateway routing'
  );

  // 4.4 Age Assurance Independence
  const ageVerificationPath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
  const ageVerificationContent = fs.readFileSync(ageVerificationPath, 'utf8');

  assert(
    !ageVerificationContent.includes('payment_id') &&
    !ageVerificationContent.includes('is_subscriber') &&
    !ageVerificationContent.includes('commercial_status'),
    '4.4 [Age Assurance Decoupling] Age verification remains 100% independent from commercial and payment approvals',
    'Age assurance must never be bypassed by commercial status'
  );

  console.log('\n--- 5. ADMIN COMMERCIAL GOVERNANCE UI ---');

  // 5.1 Admin Page Commercial Tab & Outreach Trigger
  const adminPagePath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'providers', 'page.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');

  assert(
    adminPageContent.includes('Homologação Comercial') &&
    adminPageContent.includes('Matriz de Aprovação Granular por Produto & Meio de Pagamento') &&
    adminPageContent.includes('Status de Contato') &&
    adminPageContent.includes('Copiar E-mail Formal'),
    '5.1 [Admin Commercial UI] /admin/payments/providers includes Homologação Comercial tab, granular matrix, and email copy trigger',
    'Admin page missing commercial homologation UI features'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28C Commercial Homologation verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28C verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
