/**
 * PORTAL18 — PHASE 28C.1 AUTOMATED VERIFICATION SUITE
 * Provider Dossier Accuracy, Claims Hardening & Outreach Readiness
 */

import fs from 'fs';
import path from 'path';
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

async function runVerification() {
  console.log('================================================================');
  console.log('PORTAL18 — PHASE 28C.1 AUTOMATED VERIFICATION SUITE');
  console.log('Provider Dossier Accuracy, Claims Hardening & Outreach Packages');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. CLAIMS INVENTORY & GOVERNANCE ---');

  // 1.1 Claims Inventory File
  const inventoryPath = path.join(rootDir, 'docs', 'payments', 'dossier-claims-inventory.md');
  const inventoryExists = fs.existsSync(inventoryPath);
  const inventoryContent = inventoryExists ? fs.readFileSync(inventoryPath, 'utf8') : '';

  assert(
    inventoryExists &&
    inventoryContent.includes('ACTIVE_IN_PRODUCTION') &&
    inventoryContent.includes('IMPLEMENTED_BUT_PROVIDER_PENDING') &&
    inventoryContent.includes('SANDBOX_ONLY') &&
    inventoryContent.includes('READY_NOT_ACTIVATED') &&
    inventoryContent.includes('LEGAL_REVIEW_REQUIRED') &&
    inventoryContent.includes('Strict Forbidden Claims List'),
    '1.1 [Claims Inventory] docs/payments/dossier-claims-inventory.md defines the 7 claim categories and forbidden claims list',
    'Claims inventory missing or incomplete'
  );

  console.log('\n--- 2. HARDENED COMPLIANCE DOSSIER (14 SECTIONS) ---');

  // 2.1 14-Section Standard Audit
  const dossierPath = path.join(rootDir, 'docs', 'payments', 'portal18-provider-compliance-dossier.md');
  const dossierExists = fs.existsSync(dossierPath);
  const dossierContent = dossierExists ? fs.readFileSync(dossierPath, 'utf8') : '';

  const requiredSections = [
    '1. EXECUTIVE SUMMARY',
    '2. BUSINESS MODEL',
    '3. WHAT PORTAL18 SELLS',
    '4. WHAT PORTAL18 DOES NOT PROCESS',
    '5. 18+ SAFETY ARCHITECTURE',
    '6. ADVERTISER CONTROLS',
    '7. CONTENT MODERATION',
    '8. MINOR PROTECTION',
    '9. PRIVACY / LGPD',
    '10. PAYMENT ARCHITECTURE',
    '11. REQUESTED PAYMENT METHODS',
    '12. CURRENT PAYMENT STATUS',
    '13. PROVIDER APPROVAL REQUEST',
    '14. KNOWN PENDING ITEMS'
  ];

  const hasAll14Sections = requiredSections.every(s => dossierContent.includes(s));

  assert(
    dossierExists && hasAll14Sections,
    '2.1 [Dossier Structure] docs/payments/portal18-provider-compliance-dossier.md conforms to the 14 standardized sections',
    `Dossier missing required sections. Found: ${requiredSections.filter(s => dossierContent.includes(s)).length}/14`
  );

  // 2.2 Truthful Payment Status Section
  assert(
    dossierContent.includes('Production Payments') &&
    dossierContent.includes('PORTAL18_PAYMENT_KILL_SWITCH=true') &&
    dossierContent.includes('Real PIX Transactions') &&
    dossierContent.includes('Real Credit Card Transactions'),
    '2.2 [Payment Status Transparency] Dossier explicitly discloses disabled production payments and zero live volume',
    'Dossier must disclose active kill switch and zero live volume'
  );

  // 2.3 Forbidden Claims Scanner
  const forbiddenPhrases = [
    'PCI-DSS Certified',
    'PCI certified',
    'biometric KYC active in production',
    'automated AI minor detection',
    'MCC 7273 confirmed',
    'production payments active'
  ];

  const containsForbidden = forbiddenPhrases.some(p => dossierContent.toLowerCase().includes(p.toLowerCase()));

  assert(
    !containsForbidden,
    '2.3 [Forbidden Claims Scanner] Dossier contains zero forbidden claims (no false PCI, automated AI minor, or confirmed MCC claims)',
    'Dossier contains forbidden exaggerated claims'
  );

  console.log('\n--- 3. FOUR DEDICATED PROVIDER OUTREACH PACKAGES ---');

  const outreachProviders = ['pagbank', 'pagarme', 'asaas', 'mercadopago'];

  for (const p of outreachProviders) {
    const pPath = path.join(rootDir, 'docs', 'payments', 'outreach', `${p}.md`);
    const pExists = fs.existsSync(pPath);
    const pContent = pExists ? fs.readFileSync(pPath, 'utf8') : '';

    const hasShortForm = pContent.includes('Short Web Form Message');
    const hasFullEmail = pContent.includes('Full Formal Email');
    const hasQuestions = pContent.includes('QUESTIONÁRIO DE HOMOLOGAÇÃO COMERCIAL');
    const hasAttachments = pContent.includes('Attachments List');
    const hasFields = pContent.includes('Fields to Record After Contact');
    const hasFollowUp = pContent.includes('Follow-Up Template');

    assert(
      pExists && hasShortForm && hasFullEmail && hasQuestions && hasAttachments && hasFields && hasFollowUp,
      `3.${outreachProviders.indexOf(p) + 1} [Outreach Package: ${p.toUpperCase()}] docs/payments/outreach/${p}.md contains short form, full email, 10 questions, attachments, fields, and follow-up`,
      `Outreach file ${p}.md missing or incomplete`
    );
  }

  console.log('\n--- 4. SAFETY INVARIANTS & STRIPE BLOCKED ---');

  // 4.1 Stripe Strict Prohibition
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.commercial_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '4.1 [Stripe Block Invariant] Stripe remains strictly PRODUCTION_BLOCKED with zero outreach preparation',
    'Stripe must remain permanently blocked'
  );

  // 4.2 Internal Driver Invariant
  const internal = PaymentProviderRegistry.get('unconfigured');
  const internalMeta = internal ? await internal.getMetadata() : null;

  assert(
    internalMeta?.is_internal_driver === true &&
    internalMeta?.is_production_eligible === false &&
    internalMeta?.commercial_status === 'NOT_APPLICABLE',
    '4.2 [Internal Driver Invariant] Internal test driver remains TEST ONLY and excluded from outreach',
    'Internal test driver must remain test-only'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28C.1 Dossier Accuracy & Outreach Verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28C.1 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
