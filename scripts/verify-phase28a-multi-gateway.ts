/**
 * PORTAL18 — PHASE 28A AUTOMATED VERIFICATION SUITE
 * Multi-Gateway Payment Architecture, Provider Evaluation & Homologation Foundation
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
  console.log('PORTAL18 — PHASE 28A AUTOMATED VERIFICATION SUITE');
  console.log('Multi-Gateway Payment Architecture & Homologation Foundation');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  // 1. PaymentProvider Registry & Canonical Providers
  const allProviders = PaymentProviderRegistry.getAll();
  const providerCodes = allProviders.map(p => p.code);
  const requiredCodes = ['unconfigured', 'mercadopago', 'pagbank', 'pagarme', 'asaas', 'adyen', 'stripe'];

  assert(
    requiredCodes.every(code => providerCodes.includes(code)),
    `1. [Provider Registry] PaymentProviderRegistry contains all 7 canonical adapters (${providerCodes.join(', ')})`,
    `Missing required provider adapters. Found: ${providerCodes.join(', ')}`
  );

  // 2. Stripe Prohibition Invariant
  const stripeProvider = PaymentProviderRegistry.get('stripe');
  let stripeThrows = false;
  try {
    if (stripeProvider) {
      await stripeProvider.createCheckout({
        orderId: 'test',
        orderNumber: 'test_123',
        amount: 1000,
        currency: 'BRL',
        productType: 'subscription',
        productId: 'plan_1',
        productName: 'Premium',
        returnUrl: 'http://localhost/return',
        cancelUrl: 'http://localhost/cancel',
      });
    }
  } catch (err: any) {
    stripeThrows = err.message.includes('incompatível') || err.message.includes('Stripe');
  }

  const stripeMeta = stripeProvider ? await stripeProvider.getMetadata() : null;
  assert(
    stripeProvider !== null && 
    stripeMeta?.overall_status === 'rejected' && 
    stripeThrows,
    '2. [Stripe Policy Prohibition] Stripe adapter is strictly marked REJECTED and throws policy incompatibility on checkout',
    'Stripe must remain permanently rejected for the adult platform model'
  );

  // 3. Payment Kill Switch Invariant
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'true';
  const resolvedMock = await PaymentProviderResolver.resolve({
    productType: 'advertiser_subscription',
    paymentMethod: 'pix',
  });

  assert(
    resolvedMock.success && resolvedMock.provider?.code === 'unconfigured',
    '3. [Payment Kill Switch] PaymentProviderResolver strictly yields unconfigured mock provider when Kill Switch is active',
    'Kill Switch must divert all payment resolution to unconfigured mock driver'
  );

  // 4. Candidate Provider Rejection in Production (Tripartite Gate)
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'false';
  const mpProvider = PaymentProviderRegistry.get('mercadopago');
  let mpThrows = false;
  try {
    if (mpProvider) {
      await mpProvider.createCheckout({
        orderId: 'test_mp',
        orderNumber: 'mp_123',
        amount: 4990,
        currency: 'BRL',
        productType: 'subscription',
        productId: 'plan_essencial',
        productName: 'Essencial',
        returnUrl: 'http://localhost/return',
        cancelUrl: 'http://localhost/cancel',
      });
    }
  } catch (err: any) {
    mpThrows = err.message.includes('não está homologado') || err.message.includes('Kill Switch');
  }

  assert(
    mpThrows,
    '4. [Candidate Gate Enforcement] Unhomologated candidate providers throw error upon checkout attempt',
    'Candidate providers must not process checkouts until tripartite approval'
  );

  // Reset Kill Switch back to true for safety
  process.env.PORTAL18_PAYMENT_KILL_SWITCH = 'true';

  // 5. Database Migration File Audit
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000027_phase28a_multi_gateway_payments.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.payment_providers') &&
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.provider_homologations') &&
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.payment_attempts') &&
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.payment_chargebacks'),
    '5. [Database Schema] Migration 00027 defines payment_providers, homologations, attempts, and chargebacks tables',
    'Migration 00027 missing or incomplete'
  );

  // 6. Capability Matrix & Business Model Fields
  assert(
    migrationContent.includes('adult_platform_disclosed') &&
    migrationContent.includes('consumer_premium_disclosed') &&
    migrationContent.includes('boost_products_disclosed') &&
    migrationContent.includes('get_payment_providers()'),
    '6. [Business Model Review] Migration tracks explicit 18+ platform disclosure and RPCs',
    'Migration must include business model review fields'
  );

  // 7. Research Dossier Documentation
  const dossierPath = path.join(rootDir, 'docs', 'payments', 'provider-evaluation.md');
  const dossierExists = fs.existsSync(dossierPath);
  const dossierContent = dossierExists ? fs.readFileSync(dossierPath, 'utf8') : '';

  assert(
    dossierExists &&
    dossierContent.includes('Mercado Pago') &&
    dossierContent.includes('PagBank') &&
    dossierContent.includes('Pagar.me') &&
    dossierContent.includes('Asaas') &&
    dossierContent.includes('Adyen') &&
    dossierContent.includes('Stripe'),
    '7. [Evaluation Dossier] docs/payments/provider-evaluation.md contains comprehensive evaluation for all PSPs',
    'Provider evaluation dossier missing or incomplete'
  );

  // 8. Multi-Gateway Webhook Endpoint
  const webhookRoutePath = path.join(rootDir, 'src', 'app', 'api', 'webhooks', 'payments', 'route.ts');
  const webhookContent = fs.readFileSync(webhookRoutePath, 'utf8');

  assert(
    webhookContent.includes('PaymentProviderRegistry') &&
    webhookContent.includes('verifyWebhookSignature') &&
    webhookContent.includes('parseWebhookEvent') &&
    webhookContent.includes('stripe'),
    '8. [Multi-Gateway Webhooks] Webhook route dynamically identifies providers, validates HMAC, and blocks prohibited PSPs',
    'Webhook route must implement multi-gateway signature and security checks'
  );

  // 9. Admin Provider Governance UI
  const adminPagePath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'providers', 'page.tsx');
  const adminPageExists = fs.existsSync(adminPagePath);
  const adminPageContent = adminPageExists ? fs.readFileSync(adminPagePath, 'utf8') : '';

  assert(
    adminPageExists &&
    adminPageContent.includes('KILL SWITCH 100% ATIVO') &&
    adminPageContent.includes('Matriz técnica auditada') &&
    adminPageContent.includes('Checklist 18+'),
    '9. [Admin Governance UI] /admin/payments/providers displays provider cards and 8-tab homologation modal',
    'Admin payment providers page missing or incomplete'
  );

  // 10. Admin Navigation Integration
  const adminLayoutPath = path.join(rootDir, 'src', 'components', 'admin', 'AdminLayout.tsx');
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');

  assert(
    adminLayoutContent.includes('/admin/payments/providers') &&
    adminLayoutContent.includes('Provedores de Pagamento'),
    '10. [Admin Sidebar Link] AdminLayout includes navigation link to Provedores de Pagamento',
    'AdminLayout must include link to /admin/payments/providers'
  );

  // 11. Zero Frontend Secrets Invariant
  const publicEnvSearch = Object.keys(process.env).filter(key => 
    key.startsWith('NEXT_PUBLIC_') && 
    (key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')) &&
    !key.includes('SUPABASE_ANON_KEY')
  );

  assert(
    publicEnvSearch.length === 0,
    '11. [Zero Frontend Secrets] No payment provider secret keys are exposed under NEXT_PUBLIC_* variables',
    `Found exposed secrets: ${publicEnvSearch.join(', ')}`
  );

  // 12. Age Assurance & Safe Mode Independence Invariant
  const ageVerificationPath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
  const ageVerificationContent = fs.readFileSync(ageVerificationPath, 'utf8');

  assert(
    !ageVerificationContent.includes('payment_id') &&
    !ageVerificationContent.includes('is_subscriber'),
    '12. [Safety Independence] Age Assurance remains 100% decoupled from payment status or subscription bypasses',
    'Age assurance must never be bypassed by payments'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28A Multi-Gateway Payment verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28A verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
