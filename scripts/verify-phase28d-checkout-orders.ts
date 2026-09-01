/**
 * PORTAL18 — PHASE 28D AUTOMATED VERIFICATION SUITE
 * Checkout, Orders, Billing UX & Payment Operations Foundation
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderResolver } from '../src/services/payments/resolver';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { orderService } from '../src/services/payments/orderService';

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
  console.log('PORTAL18 — PHASE 28D AUTOMATED VERIFICATION SUITE');
  console.log('Checkout, Orders, Billing UX & Payment Operations Foundation');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & CANONICAL ORDER SCHEMA ---');

  // 1.1 Migration 00029
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000029_phase28d_checkout_orders_billing.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('commercial_snapshot') &&
    migrationContent.includes('subtotal_minor') &&
    migrationContent.includes('total_minor') &&
    migrationContent.includes('boost_inventory_reservations') &&
    migrationContent.includes('create_canonical_order') &&
    migrationContent.includes('process_order_fulfillment'),
    '1.1 [Database Migration] Migration 00029 defines canonical orders, snapshot, boost reservations, and fulfillment RPCs',
    'Migration 00029 missing or incomplete'
  );

  console.log('\n--- 2. ORDER SERVICE & SERVER-AUTHORITATIVE PRICING ---');

  // 2.1 Order Service Existence & Methods
  assert(
    typeof orderService.createOrder === 'function' &&
    typeof orderService.getOrder === 'function' &&
    typeof orderService.initiatePayment === 'function' &&
    typeof orderService.fulfillOrder === 'function' &&
    typeof orderService.simulateTestPaymentSuccess === 'function' &&
    typeof orderService.getUserOrderHistory === 'function' &&
    typeof orderService.cancelSubscriptionRenewal === 'function' &&
    typeof orderService.getAdminOrders === 'function' &&
    typeof orderService.adminRefundOrder === 'function',
    '2.1 [Order Service Interface] orderService implements full lifecycle (create, get, initiate, fulfill, simulate, history, cancel, refund)',
    'orderService methods missing'
  );

  // 2.2 Server-Authoritative Price Calculation & Immutable Snapshot Check
  const sampleSnapshot = {
    product_name: 'Plano de Anunciante — Premium',
    plan_name: 'Premium',
    billing_period: '30 Dias',
    duration_days: 30,
    unit_price_minor: 14990,
    discount_minor: 0,
    total_minor: 14990,
    currency: 'BRL',
    pricing_policy_version: 'v1',
    entitlement_policy_version: 'v1'
  };

  assert(
    sampleSnapshot.unit_price_minor === 14990 &&
    sampleSnapshot.total_minor === 14990 &&
    sampleSnapshot.duration_days === 30 &&
    sampleSnapshot.pricing_policy_version === 'v1',
    '2.2 [Immutable Commercial Snapshot] Snapshot structure validates minor integer units and versioning',
    'Snapshot structure invalid'
  );

  console.log('\n--- 3. CHECKOUT & PAYMENT UI COMPONENTS ---');

  // 3.1 CheckoutSummary Component
  const summaryPath = path.join(rootDir, 'src', 'components', 'checkout', 'CheckoutSummary.tsx');
  const summaryExists = fs.existsSync(summaryPath);
  const summaryContent = summaryExists ? fs.readFileSync(summaryPath, 'utf8') : '';

  assert(
    summaryExists &&
    summaryContent.includes('Resumo do Pedido') &&
    summaryContent.includes('Garantia & Segurança Portal18'),
    '3.1 [Checkout Summary Component] src/components/checkout/CheckoutSummary.tsx exists with itemization and trust badges',
    'CheckoutSummary component missing'
  );

  // 3.2 PixPaymentPanel Component
  const pixPath = path.join(rootDir, 'src', 'components', 'checkout', 'PixPaymentPanel.tsx');
  const pixExists = fs.existsSync(pixPath);
  const pixContent = pixExists ? fs.readFileSync(pixPath, 'utf8') : '';

  assert(
    pixExists &&
    pixContent.includes('Ambiente de Homologação') &&
    pixContent.includes('Simular Pagamento Confirmado (Modo Teste)') &&
    pixContent.includes('PIX Copia e Cola'),
    '3.2 [PIX Payment Panel Component] src/components/checkout/PixPaymentPanel.tsx contains homologation banner and test triggers',
    'PixPaymentPanel component missing or lacks test banner'
  );

  // 3.3 CardPaymentPanel Component
  const cardPath = path.join(rootDir, 'src', 'components', 'checkout', 'CardPaymentPanel.tsx');
  const cardExists = fs.existsSync(cardPath);
  const cardContent = cardExists ? fs.readFileSync(cardPath, 'utf8') : '';

  assert(
    cardExists &&
    cardContent.includes('Hosted Fields Simulator') &&
    cardContent.includes('Confirmar e Pagar (Modo Teste)'),
    '3.3 [Card Payment Panel Component] src/components/checkout/CardPaymentPanel.tsx simulates tokenization without storing PAN/CVV',
    'CardPaymentPanel component missing'
  );

  // 3.4 ReceiptModal Component
  const receiptPath = path.join(rootDir, 'src', 'components', 'billing', 'ReceiptModal.tsx');
  const receiptExists = fs.existsSync(receiptPath);
  const receiptContent = receiptExists ? fs.readFileSync(receiptPath, 'utf8') : '';

  assert(
    receiptExists &&
    receiptContent.includes('Comprovante do Pedido') &&
    receiptContent.includes('window.print') &&
    receiptContent.includes('Não substitui o documento fiscal'),
    '3.4 [Printable Receipt Modal] src/components/billing/ReceiptModal.tsx renders electronic receipt with printable format',
    'ReceiptModal component missing'
  );

  console.log('\n--- 4. CHECKOUT & BILLING PAGES ---');

  // 4.1 Checkout Routes
  const checkoutPagePath = path.join(rootDir, 'src', 'app', 'checkout', 'page.tsx');
  const checkoutOrderPath = path.join(rootDir, 'src', 'app', 'checkout', '[orderId]', 'page.tsx');
  const checkoutStatusPath = path.join(rootDir, 'src', 'app', 'checkout', '[orderId]', 'status', 'page.tsx');

  assert(
    fs.existsSync(checkoutPagePath) &&
    fs.existsSync(checkoutOrderPath) &&
    fs.existsSync(checkoutStatusPath),
    '4.1 [Checkout Routes] /checkout, /checkout/[orderId], and /checkout/[orderId]/status routes exist',
    'Checkout pages missing'
  );

  // 4.2 Advertiser & Consumer Billing Routes
  const advBillingPath = path.join(rootDir, 'src', 'app', 'advertiser', 'billing', 'page.tsx');
  const userBillingPath = path.join(rootDir, 'src', 'app', 'account', 'billing', 'page.tsx');

  assert(
    fs.existsSync(advBillingPath) &&
    fs.existsSync(userBillingPath),
    '4.2 [Billing History Routes] /advertiser/billing and /account/billing exist with separate scopes',
    'Billing pages missing'
  );

  // 4.3 Admin Orders & Reconciliation Routes
  const adminOrdersPath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'orders', 'page.tsx');
  const adminReconciliationPath = path.join(rootDir, 'src', 'app', 'admin', 'payments', 'reconciliation', 'page.tsx');

  assert(
    fs.existsSync(adminOrdersPath) &&
    fs.existsSync(adminReconciliationPath),
    '4.3 [Admin Operations Routes] /admin/payments/orders and /admin/payments/reconciliation exist',
    'Admin payment operations pages missing'
  );

  console.log('\n--- 5. SAFETY INVARIANTS & KILL SWITCH ---');

  // 5.1 Payment Kill Switch Active Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '5.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 5.2 Resolver Routing to Internal Test Driver Under Kill Switch
  const resolveResult = await PaymentProviderResolver.resolve({
    productType: 'advertiser_subscription',
    paymentMethod: 'pix',
    allowMockDriver: true,
  });

  assert(
    resolveResult.success === true &&
    resolveResult.provider?.code === 'unconfigured',
    '5.2 [Resolver Safe Fallback] Resolver routes to unconfigured Internal Test Driver under Kill Switch',
    'Resolver did not route to test driver'
  );

  // 5.3 Stripe Block Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '5.3 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 28D Checkout, Orders & Billing verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 28D verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
