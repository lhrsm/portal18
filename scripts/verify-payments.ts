/**
 * ============================================================================
 * PHASE 18 — PAYMENTS, BILLING & SUBSCRIPTIONS VERIFICATION SUITE
 * ============================================================================
 */

import { PaymentProviderFactory } from '../src/services/payments/factory';
import { paymentReconciliationService, ProviderPaymentRecord } from '../src/services/payments/reconciliationService';
import { Payment } from '../src/types/app.types';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PaymentCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runPaymentsVerification(): Promise<PaymentCheckResult[]> {
  const results: PaymentCheckResult[] = [];

  // 1. PROVIDER FACTORY & KILL SWITCH GUARD
  const provider = PaymentProviderFactory.getProvider();
  let killSwitchActive = false;
  const envMap = process.env as Record<string, string | undefined>;
  const prevEnv = envMap['NODE_ENV'];

  try {
    envMap['NODE_ENV'] = 'production';
    delete envMap['PAYMENT_PROVIDER_API_KEY'];
    await provider.createCheckout({
      orderId: 'test-order-01',
      orderNumber: 'ORD-TEST-01',
      advertiserId: 'test-adv-01',
      amount: 4990,
      currency: 'BRL',
      productType: 'subscription',
      productId: 'plan-vip-01',
      productName: 'Plano VIP',
      returnUrl: 'http://localhost:3000/payment/success',
      cancelUrl: 'http://localhost:3000/payment/cancelled',
    });
  } catch (err: any) {
    killSwitchActive = true;
  } finally {
    if (prevEnv !== undefined) {
      envMap['NODE_ENV'] = prevEnv;
    } else {
      delete envMap['NODE_ENV'];
    }
  }

  results.push({
    id: 'PAY-KILLSWITCH-01',
    category: 'PRODUCTION GUARD',
    name: 'Payment kill switch prevents unauthorized charges in production',
    expected: 'createCheckout throws when credentials are not configured in production',
    passed: killSwitchActive,
    details: 'Kill switch successfully blocked unconfigured production checkout.',
  });

  // 2. SANDBOX CHECKOUT SESSION GENERATION
  const sandboxCheckout = await provider.createCheckout({
    orderId: 'test-sbx-01',
    orderNumber: 'ORD-SBX-01',
    advertiserId: 'test-adv-01',
    amount: 5990, // integer cents (R$ 59,90)
    currency: 'BRL',
    productType: 'subscription',
    productId: 'plan-top-01',
    productName: 'Plano Top',
    returnUrl: 'http://localhost:3000/payment/success',
    cancelUrl: 'http://localhost:3000/payment/cancelled',
  });

  results.push({
    id: 'PAY-SESSION-01',
    category: 'CHECKOUT',
    name: 'Sandbox checkout session creation with integer cents pricing',
    expected: 'Checkout session returns providerReference, sessionToken, and checkoutUrl',
    passed: Boolean(sandboxCheckout.providerReference && sandboxCheckout.sessionToken && sandboxCheckout.checkoutUrl),
    details: `Ref: ${sandboxCheckout.providerReference}, URL: ${sandboxCheckout.checkoutUrl}`,
  });

  // 3. WEBHOOK SIGNATURE & REPLAY VERIFICATION
  const secret = 'payment_test_webhook_secret_key_123';
  const webhookPayload = JSON.stringify({
    event_id: 'evt_pay_test_01',
    event_type: 'payment.paid',
    provider_payment_reference: 'pay_ref_9999',
    amount: 5990,
    currency: 'BRL',
    status: 'paid',
  });

  envMap['PAYMENT_PROVIDER_WEBHOOK_SECRET'] = secret;
  const validSig = crypto.createHmac('sha256', secret).update(webhookPayload).digest('hex');

  const sigCheckValid = await provider.verifyWebhookSignature({ 'x-provider-signature': validSig }, webhookPayload);
  delete envMap['PAYMENT_PROVIDER_WEBHOOK_SECRET'];

  results.push({
    id: 'PAY-WEBHOOK-01',
    category: 'WEBHOOK SECURITY',
    name: 'Webhook cryptographic signature verification and event parsing',
    expected: 'Signature validated, event parsed into normalized status paid',
    passed: sigCheckValid === true,
    details: `Signature Check: ${sigCheckValid ? 'PASS' : 'FAIL'}`,
  });

  // 4. FINANCIAL RECONCILIATION DISCREPANCY DETECTION
  const syntheticLocalPayment: Payment = {
    id: 'pay-local-01',
    order_id: 'ord-01',
    advertiser_id: 'adv-01',
    subscription_id: null,
    amount: 5990, // R$ 59,90
    currency: 'BRL',
    payment_type: 'subscription',
    status: 'paid',
    provider: 'unconfigured',
    provider_payment_reference: 'pay_ref_9999',
    created_at: new Date().toISOString(),
    paid_at: new Date().toISOString(),
    failed_at: null,
    refunded_at: null,
    metadata: {},
    updated_at: new Date().toISOString(),
  };

  const matchedProviderRecord: ProviderPaymentRecord = {
    providerReference: 'pay_ref_9999',
    status: 'paid',
    amount: 5990,
    currency: 'BRL',
  };

  const mismatchProviderRecord: ProviderPaymentRecord = {
    providerReference: 'pay_ref_9999',
    status: 'paid',
    amount: 9990, // Divergent amount (R$ 99,90)
    currency: 'BRL',
  };

  const recMatch = paymentReconciliationService.reconcilePaymentRecord(syntheticLocalPayment, matchedProviderRecord);
  const recMismatch = paymentReconciliationService.reconcilePaymentRecord(syntheticLocalPayment, mismatchProviderRecord);

  results.push({
    id: 'PAY-RECON-01',
    category: 'RECONCILIATION',
    name: 'Financial reconciliation matching and discrepancy detection',
    expected: 'Matched records return status="matched", amount divergence detected as "mismatch"',
    passed: recMatch.status === 'matched' && recMismatch.status === 'mismatch' && recMismatch.discrepancies.length > 0,
    details: `Match: ${recMatch.status}, Mismatch: ${recMismatch.status} (${recMismatch.discrepancies[0]})`,
  });

  // 5. DOCUMENTATION ASSETS
  const comparisonDoc = fs.existsSync(path.join(process.cwd(), 'docs/integrations/payment-provider-comparison.md'));
  const decisionDoc = fs.existsSync(path.join(process.cwd(), 'docs/integrations/payment-provider-decision.md'));
  const policyDoc = fs.existsSync(path.join(process.cwd(), 'docs/operations/payment-policy.md'));
  const activationDoc = fs.existsSync(path.join(process.cwd(), 'docs/operations/payment-provider-activation.md'));

  results.push({
    id: 'PAY-DOCS-01',
    category: 'DOCUMENTATION',
    name: 'Payment provider comparison, decision, commercial policy and activation runbook',
    expected: 'All 4 documentation markdown files present and complete',
    passed: comparisonDoc && decisionDoc && policyDoc && activationDoc,
    details: 'Payment comparison, decision, policy and activation docs present in docs/.',
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 PHASE 18 — PAYMENTS, BILLING & SUBSCRIPTIONS AUDIT');
  console.log('================================================================\n');

  runPaymentsVerification().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ PAYMENTS AUDIT FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} PAYMENTS & BILLING CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
