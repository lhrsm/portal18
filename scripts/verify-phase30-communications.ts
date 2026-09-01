/**
 * PORTAL18 — PHASE 30 AUTOMATED VERIFICATION SUITE
 * Communication, Notifications, Messaging & CRM Operations
 */

import fs from 'fs';
import path from 'path';
import { PaymentProviderRegistry } from '../src/services/payments/registry';
import { communicationService } from '../src/services/communications/communicationService';
import { templateEngine } from '../src/services/communications/templateEngine';
import { emailProviderRegistry } from '../src/services/communications/emailProviderRegistry';
import { pushNotificationService } from '../src/services/communications/pushNotificationService';

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
  console.log('PORTAL18 — PHASE 30 AUTOMATED VERIFICATION SUITE');
  console.log('Communication, Notifications, Messaging & CRM Operations');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. DATABASE MIGRATION & COMMUNICATIONS SCHEMA ---');

  // 1.1 Migration 00034
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000034_phase30_communications_notifications_crm.sql');
  const migrationExists = fs.existsSync(migrationPath);
  const migrationContent = migrationExists ? fs.readFileSync(migrationPath, 'utf8') : '';

  assert(
    migrationExists &&
    migrationContent.includes('notification_events') &&
    migrationContent.includes('notification_deliveries') &&
    migrationContent.includes('notification_templates') &&
    migrationContent.includes('communication_campaigns') &&
    migrationContent.includes('dispatch_canonical_notification'),
    '1.1 [Database Migration] Migration 00034 defines canonical events, deliveries, templates, CRM campaigns, and dispatch RPC',
    'Migration 00034 missing or incomplete'
  );

  console.log('\n--- 2. TEMPLATE ENGINE & VARIABLE SANITIZATION ---');

  // 2.1 Template Rendering & Script Stripping
  const rawTemplate = 'Olá {{display_name}}, seu plano {{plan_name}} está ativo.<script>alert("hacked")</script>';
  const rendered = templateEngine.render(rawTemplate, { display_name: 'Carlos', plan_name: 'VIP Plus' });

  assert(
    rendered.includes('Olá Carlos, seu plano VIP Plus está ativo.') &&
    !rendered.includes('<script>'),
    '2.1 [Template Engine & Sanitization] templateEngine.render interpolates variables and strips malicious tags',
    `Rendered template unsafe or invalid: ${rendered}`
  );

  console.log('\n--- 3. EMAIL PROVIDER GOVERNANCE & MOCK DRIVER ---');

  // 3.1 Mock Email Dispatch
  const emailResult = await emailProviderRegistry.sendEmail({
    to: 'test@portal18.com.br',
    subject: 'Teste de Comunicação',
    html: '<p>Mensagem</p>',
    category: 'security',
  });

  assert(
    emailResult.success === true &&
    emailResult.isSimulated === true &&
    Boolean(emailResult.providerReference?.startsWith('MOCK-EMAIL-')),
    '3.1 [Mock Email Driver & Kill Switch] Email dispatches route strictly to simulated test driver (zero external SMTP calls)',
    'Email dispatch not simulated'
  );

  console.log('\n--- 4. PUSH PRIVACY & LOCKSCREEN PROTECTION ---');

  // 4.1 Push Payload Discreteness
  const pushPayload = pushNotificationService.buildDiscretePayload({
    category: 'security',
    actionUrl: '/account/security',
  });

  assert(
    pushPayload.title === 'Portal18' &&
    pushPayload.body.includes('Alerta de segurança') &&
    !pushPayload.body.includes('18+') &&
    !pushPayload.body.includes('sex'),
    '4.1 [Push Notification Privacy] buildDiscretePayload produces privacy-safe lockscreen text without explicit details',
    'Push payload contains sensitive content'
  );

  console.log('\n--- 5. DOCUMENTATION PACKAGES ---');

  // 5.1 Documentation Files
  const docFiles = [
    'docs/communications/architecture.md',
    'docs/communications/notification-policy.md',
    'docs/communications/templates.md',
    'docs/communications/push.md',
    'docs/communications/email-provider-readiness.md',
    'docs/communications/marketing-consent.md',
    'docs/communications/incident-runbook.md',
  ];

  const allDocsExist = docFiles.every((f) => fs.existsSync(path.join(rootDir, f)));
  assert(
    allDocsExist === true,
    '5.1 [Communications Documentation Packages] All 7 communication operational runbooks and policies exist in docs/communications/',
    'Some documentation files are missing'
  );

  console.log('\n--- 6. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 6.1 Payment Kill Switch Invariant
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
    console.log('🎉 All Phase 30 Communication & Messaging verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 30 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
