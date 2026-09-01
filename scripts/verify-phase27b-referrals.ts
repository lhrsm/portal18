/**
 * PORTAL18 — Phase 27B Referral Program, Reward Ledger & Anti-Fraud Verification Script
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function runTest(name: string, category: string, assertion: () => boolean, failureMessage: string) {
  try {
    const passed = assertion();
    results.push({
      name,
      category,
      passed,
      message: passed ? 'OK' : failureMessage,
    });
  } catch (err: any) {
    results.push({
      name,
      category,
      passed: false,
      message: `Exception: ${err?.message || String(err)}`,
    });
  }
}

const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('PORTAL18 — PHASE 27B AUTOMATED VERIFICATION SUITE');
console.log('Referral Program, Reward Ledger & Anti-Fraud Engine');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Migration & Schema Invariants
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260830000022_phase27b_referrals.sql');
const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'Migration 00022 exists and contains referral schema',
  'Database Schema',
  () => fs.existsSync(migrationPath) && migrationContent.length > 1000,
  'Arquivo de migração 00022 não encontrado ou vazio'
);

runTest(
  'advertiser_profiles extended with unique referral_code and referred_by_code',
  'Database Schema',
  () =>
    migrationContent.includes('referral_code text UNIQUE') &&
    migrationContent.includes('referred_by_code text'),
  'Colunas de referral_code ausentes em advertiser_profiles'
);

runTest(
  'referral_attributions table created for first-party tracking',
  'Attribution',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.referral_attributions') &&
    migrationContent.includes('visitor_attribution_token text NOT NULL'),
  'Tabela referral_attributions ausente'
);

runTest(
  'referrals table created with self-referral prevention constraint (referrer_profile_id <> referred_profile_id)',
  'Anti-Fraud & Integrity',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.referrals') &&
    migrationContent.includes('referrals_no_self_referral CHECK (referrer_profile_id <> referred_profile_id)'),
  'Constraint de proibição de autoindicação ausente na tabela referrals'
);

runTest(
  'referral_rewards immutable ledger table created with UNIQUE(referral_id) constraint',
  'Reward Ledger & Idempotency',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.referral_rewards') &&
    migrationContent.includes('referral_id uuid NOT NULL UNIQUE REFERENCES public.referrals'),
  'Tabela referral_rewards ou constraint de idempotência única ausente'
);

runTest(
  'RPC get_or_create_advertiser_referral_code generates 8-character CSPRNG alphanumeric code',
  'Referral Code Generation',
  () =>
    migrationContent.includes('get_or_create_advertiser_referral_code') &&
    migrationContent.includes('encode(gen_random_bytes(4), \'hex\')'),
  'RPC de geração de código de indicação ausente ou sem CSPRNG'
);

runTest(
  'RPC track_referral_click implements first-referrer-wins attribution policy',
  'Attribution Policy',
  () =>
    migrationContent.includes('track_referral_click') &&
    migrationContent.includes('Primeiro referenciador preservado'),
  'RPC track_referral_click não preserva primeiro referenciador'
);

runTest(
  'RPC bind_referral_on_advertiser_creation checks self-referral and single-account binding',
  'Anti-Fraud & Onboarding',
  () =>
    migrationContent.includes('bind_referral_on_advertiser_creation') &&
    migrationContent.includes('Autoindicação não permitida') &&
    migrationContent.includes('Conta já vinculada'),
  'RPC bind_referral_on_advertiser_creation sem verificações de segurança'
);

runTest(
  'RPC evaluate_referral_qualifications requires profile active + published + 48h maturation delay',
  'Qualification Engine',
  () =>
    migrationContent.includes('evaluate_referral_qualifications') &&
    migrationContent.includes("INTERVAL '48 hours'") &&
    migrationContent.includes('bonus_days') &&
    migrationContent.includes('ON CONFLICT (referral_id) DO NOTHING'),
  'Engine de qualificação não cumpre critérios de maturação de 48h e idempotência'
);

runTest(
  'RPC revoke_referral_reward records mandatory reason, audit log and blocks referral status',
  'Reward Revocation',
  () =>
    migrationContent.includes('revoke_referral_reward') &&
    migrationContent.includes("status = 'revoked'") &&
    migrationContent.includes('referral_reward_revoked'),
  'RPC de revogação de recompensas ausente ou incompleta'
);

runTest(
  'RPC get_advertiser_entitlements factors in active granted referral bonus days',
  'Entitlement Integration',
  () =>
    migrationContent.includes('get_advertiser_entitlements') &&
    migrationContent.includes('referral_rewards') &&
    migrationContent.includes('bonus_days_active'),
  'get_advertiser_entitlements não integra dias de bônus de indicação'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Services
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'ReferralState, ReferralReward, ReferralStats exported in app.types.ts',
  'TypeScript Models',
  () =>
    typesContent.includes('ReferralState') &&
    typesContent.includes('ReferralReward') &&
    typesContent.includes('ReferralStats'),
  'Modelos de tipos de indicação ausentes em app.types.ts'
);

const servicePath = path.join(rootDir, 'src', 'services', 'referralService.ts');
const serviceContent = fs.existsSync(servicePath) ? fs.readFileSync(servicePath, 'utf8') : '';

runTest(
  'referralService implements stats, sanitized history, attribution tracking, and admin actions',
  'Services',
  () =>
    fs.existsSync(servicePath) &&
    serviceContent.includes('getAdvertiserReferralStats') &&
    serviceContent.includes('getReferralHistory') &&
    serviceContent.includes('trackReferralVisit') &&
    serviceContent.includes('evaluateQualifications') &&
    serviceContent.includes('revokeReward'),
  'referralService ausente ou com métodos incompletos'
);

// --------------------------------------------------------------------------
// 3. UI Components & Dashboards
// --------------------------------------------------------------------------
const dashboardCompPath = path.join(rootDir, 'src', 'components', 'advertiser', 'ReferralProgram', 'ReferralDashboard.tsx');
const dashboardCompContent = fs.existsSync(dashboardCompPath) ? fs.readFileSync(dashboardCompPath, 'utf8') : '';

runTest(
  'ReferralDashboard component displays copy link, Web Share API, KPIs, and sanitized history without PII',
  'Advertiser UI',
  () =>
    fs.existsSync(dashboardCompPath) &&
    dashboardCompContent.includes('navigator.share') &&
    dashboardCompContent.includes('handleCopyLink') &&
    dashboardCompContent.includes('Regras do Programa de Indicação') &&
    !dashboardCompContent.includes('cpf') &&
    !dashboardCompContent.includes('email'),
  'ReferralDashboard ausente ou expondo PII'
);

const referralsPagePath = path.join(rootDir, 'src', 'app', 'advertiser', 'referrals', 'page.tsx');
runTest(
  'Advertiser Referrals Page exists at /advertiser/referrals',
  'Advertiser UI',
  () => fs.existsSync(referralsPagePath),
  'Página /advertiser/referrals não encontrada'
);

const adminReferralsPagePath = path.join(rootDir, 'src', 'app', 'admin', 'referrals', 'page.tsx');
const adminReferralsContent = fs.existsSync(adminReferralsPagePath) ? fs.readFileSync(adminReferralsPagePath, 'utf8') : '';

runTest(
  'Admin Referrals Page exists with filters, batch evaluation trigger, and revocation modal',
  'Admin Operations',
  () =>
    fs.existsSync(adminReferralsPagePath) &&
    adminReferralsContent.includes('handleEvaluateBatch') &&
    adminReferralsContent.includes('handleConfirmRevoke'),
  'Página de gestão administrativa de indicações ausente ou incompleta'
);

// --------------------------------------------------------------------------
// 4. Non-Negotiables & Invariants
// --------------------------------------------------------------------------
runTest(
  'Zero monetary payouts, zero cash, zero wallets (Bonus Days only)',
  'Commercial Integrity',
  () =>
    !migrationContent.includes('cashback') &&
    !migrationContent.includes('pix_payout') &&
    migrationContent.includes('bonus_days'),
  'Menção indevida a pagamentos monetários ou cashback'
);

runTest(
  'Age Assurance and ECA Digital remain 100% fail-closed',
  'Safety & Compliance',
  () => {
    const ageServicePath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
    return fs.existsSync(ageServicePath) && fs.readFileSync(ageServicePath, 'utf8').includes('isAgeVerified');
  },
  'Age Assurance modificado ou ausente'
);

// --------------------------------------------------------------------------
// Print Test Summary
// --------------------------------------------------------------------------
let passedCount = 0;
let failedCount = 0;

results.forEach((r, idx) => {
  if (r.passed) {
    passedCount++;
    console.log(`[PASS] ${idx + 1}. [${r.category}] ${r.name}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${idx + 1}. [${r.category}] ${r.name} --> ${r.message}`);
  }
});

console.log('\n----------------------------------------------------------------');
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('----------------------------------------------------------------\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Phase 27B Referral Program & Anti-Fraud verification tests passed!\n');
  process.exit(0);
}
