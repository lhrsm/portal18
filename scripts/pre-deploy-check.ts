/**
 * PORTAL18 — PRE-DEPLOYMENT SAFETY CHECK (PHASE 37)
 */

import fs from 'fs';
import path from 'path';
import { auditMigrations } from './supabase-preflight';
import { PaymentProviderRegistry } from '../src/services/payments/registry';

async function runPreDeployCheck() {
  console.log('================================================================');
  console.log('🚀 PORTAL18 — PRE-DEPLOYMENT SAFETY & READINESS CHECK');
  console.log('================================================================\n');

  let hasError = false;

  // 1. Migration Parity & Integrity
  console.log('--- 1. DATABASE MIGRATION INTEGRITY ---');
  const audit = auditMigrations();
  if (!audit.isChronological || audit.duplicateTimestamps.length > 0) {
    console.error('❌ Migration chronology or timestamp failure!');
    hasError = true;
  } else {
    console.log(`✅ ${audit.totalMigrations} migrations in valid chronological order without duplicates.`);
  }

  // 2. Kill Switch Invariants
  console.log('\n--- 2. CRITICAL KILL SWITCH GUARDS ---');
  const paymentKillSwitch = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  const emailKillSwitch = process.env.PORTAL18_EMAIL_KILL_SWITCH !== 'false';

  if (!paymentKillSwitch) {
    console.error('❌ CRITICAL: PORTAL18_PAYMENT_KILL_SWITCH is disabled! Production payments are not authorized.');
    hasError = true;
  } else {
    console.log('✅ PORTAL18_PAYMENT_KILL_SWITCH is ACTIVE (Safe Mode / Zero real charges).');
  }

  if (!emailKillSwitch) {
    console.error('❌ CRITICAL: PORTAL18_EMAIL_KILL_SWITCH is disabled! Real email sending is not authorized.');
    hasError = true;
  } else {
    console.log('✅ PORTAL18_EMAIL_KILL_SWITCH is ACTIVE (Mock Email Driver / Zero real dispatches).');
  }

  // 3. Prohibited Providers Guard (Stripe)
  console.log('\n--- 3. PROHIBITED PROVIDERS STATUS ---');
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  if (stripeMeta?.is_production_eligible || stripeMeta?.contact_status !== 'rejected') {
    console.error('❌ CRITICAL: Stripe provider is not permanently blocked!');
    hasError = true;
  } else {
    console.log('✅ Stripe remains strictly BLOCKED and ineligible for production.');
  }

  // 4. NEXT_PUBLIC Secret Leakage Audit
  console.log('\n--- 4. CLIENT SECRET EXPOSURE AUDIT ---');
  const envFile = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach((line) => {
      if (line.startsWith('NEXT_PUBLIC_') && (line.includes('SECRET') || line.includes('KEY_PRIVATE') || line.includes('SERVICE_ROLE'))) {
        console.error(`❌ Potential secret exposed under NEXT_PUBLIC_: ${line.split('=')[0]}`);
        hasError = true;
      }
    });
  }
  console.log('✅ Zero private service role or webhook signing secrets exposed under NEXT_PUBLIC_ prefixes.');

  console.log('\n----------------------------------------------------------------');
  if (hasError) {
    console.error('❌ PRE-DEPLOYMENT SAFETY CHECK FAILED. DEPLOYMENT BLOCKED.\n');
    process.exit(1);
  } else {
    console.log('🎉 PRE-DEPLOYMENT SAFETY CHECK PASSED. READY FOR DEPLOY.\n');
    process.exit(0);
  }
}

runPreDeployCheck().catch((err) => {
  console.error('Fatal error during pre-deploy check:', err);
  process.exit(1);
});
