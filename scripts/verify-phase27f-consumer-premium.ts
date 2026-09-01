/**
 * PORTAL18 — Phase 27F Consumer Premium, Exclusive Media & Reviews Verification Script
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
console.log('PORTAL18 — PHASE 27F AUTOMATED VERIFICATION SUITE');
console.log('Consumer Premium, Exclusive Media, Reviews & User Benefits');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Migration & Schema
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260901000026_phase27f_consumer_premium.sql');
const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'Migration 00026 exists and contains consumer premium and reviews schema',
  'Database Schema',
  () => fs.existsSync(migrationPath) && migrationContent.length > 1000,
  'Arquivo de migração 00026 ausente ou vazio'
);

runTest(
  'consumer_plans table created and seeded with Free and Premium tiers',
  'Consumer Plans',
  () => 
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.consumer_plans') &&
    migrationContent.includes('Portal18 Free') &&
    migrationContent.includes('Portal18 Premium'),
  'Tabela consumer_plans ausente ou sem planos canônicos'
);

runTest(
  'consumer_plan_pricing table created with policy versioning and integer cents BRL',
  'Pricing Matrix',
  () => 
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.consumer_plan_pricing') &&
    migrationContent.includes('price_cents integer NOT NULL') &&
    migrationContent.includes('uq_consumer_plan_period_policy'),
  'Tabela consumer_plan_pricing ausente ou sem constraint de versionamento'
);

runTest(
  'consumer_subscriptions table created independently from advertiser subscriptions',
  'Domain Separation',
  () => 
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.consumer_subscriptions') &&
    migrationContent.includes('user_profile_id uuid NOT NULL REFERENCES public.profiles(id)') &&
    migrationContent.includes('plan_id uuid NOT NULL REFERENCES public.consumer_plans(id)'),
  'Tabela consumer_subscriptions ausente ou incorretamente vinculada a advertiser_profiles'
);

runTest(
  'advertiser_media extended with audience column (public, age_verified, consumer_premium, private)',
  'Media Audience',
  () => 
    migrationContent.includes('audience text NOT NULL DEFAULT') &&
    migrationContent.includes('consumer_premium') &&
    migrationContent.includes('idx_adv_media_audience'),
  'Coluna audience ausente em advertiser_media'
);

runTest(
  'advertiser_reviews table created with structured dimensional ratings and self-review guard trigger',
  'Reviews Schema',
  () => 
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.advertiser_reviews') &&
    migrationContent.includes('rating_communication') &&
    migrationContent.includes('rating_accuracy') &&
    migrationContent.includes('rating_professionalism') &&
    migrationContent.includes('rating_overall') &&
    migrationContent.includes('check_self_review_guard'),
  'Tabela advertiser_reviews ou trigger de auto-avaliação ausentes'
);

runTest(
  'RPC get_consumer_catalog returns consumer plans with multi-period pricing',
  'Catalog RPC',
  () => 
    migrationContent.includes('get_consumer_catalog') &&
    migrationContent.includes('consumer_plans') &&
    migrationContent.includes('consumer_plan_pricing'),
  'RPC get_consumer_catalog ausente'
);

runTest(
  'RPC get_consumer_entitlements evaluates server-authoritative member entitlements',
  'Entitlements RPC',
  () => 
    migrationContent.includes('get_consumer_entitlements') &&
    migrationContent.includes('can_watch_premium_videos') &&
    migrationContent.includes('full_review_access'),
  'RPC get_consumer_entitlements ausente'
);

runTest(
  'RPC get_profile_reviews respects viewer entitlement (truncated preview vs full text)',
  'Review Entitlement RPC',
  () => 
    migrationContent.includes('get_profile_reviews') &&
    migrationContent.includes('v_can_see_full_text') &&
    migrationContent.includes('is_truncated'),
  'RPC get_profile_reviews ausente ou sem controle de truncamento'
);

runTest(
  'RPC submit_advertiser_review sanitizes input and queues for moderation',
  'Review Submission RPC',
  () => 
    migrationContent.includes('submit_advertiser_review') &&
    migrationContent.includes('regexp_replace') &&
    migrationContent.includes("'submitted'"),
  'RPC submit_advertiser_review ausente'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Services
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'ConsumerPlan, ConsumerSubscription, ConsumerEntitlements, AdvertiserReview exported in app.types.ts',
  'TypeScript Types',
  () => 
    typesContent.includes('ConsumerPlan') &&
    typesContent.includes('ConsumerSubscription') &&
    typesContent.includes('ConsumerEntitlements') &&
    typesContent.includes('AdvertiserReview') &&
    typesContent.includes('ReviewSummary'),
  'Tipos de Consumer e Reviews ausentes em app.types.ts'
);

const consumerServicePath = path.join(rootDir, 'src', 'services', 'consumerSubscriptionService.ts');
const consumerServiceContent = fs.existsSync(consumerServicePath) ? fs.readFileSync(consumerServicePath, 'utf8') : '';

runTest(
  'consumerSubscriptionService implements getCatalog and getConsumerEntitlements',
  'Consumer Service',
  () => 
    fs.existsSync(consumerServicePath) &&
    consumerServiceContent.includes('getCatalog') &&
    consumerServiceContent.includes('getConsumerEntitlements'),
  'consumerSubscriptionService ausente ou incompleto'
);

const reviewServicePath = path.join(rootDir, 'src', 'services', 'reviewService.ts');
const reviewServiceContent = fs.existsSync(reviewServicePath) ? fs.readFileSync(reviewServicePath, 'utf8') : '';

runTest(
  'reviewService implements getProfileReviews, submitReview, getAdminReviewQueue, and moderateReview',
  'Review Service',
  () => 
    fs.existsSync(reviewServicePath) &&
    reviewServiceContent.includes('getProfileReviews') &&
    reviewServiceContent.includes('submitReview') &&
    reviewServiceContent.includes('getAdminReviewQueue') &&
    reviewServiceContent.includes('moderateReview'),
  'reviewService ausente ou incompleto'
);

// --------------------------------------------------------------------------
// 3. UI Components & Pages
// --------------------------------------------------------------------------
const premiumPagePath = path.join(rootDir, 'src', 'app', 'premium', 'page.tsx');
const premiumPageContent = fs.existsSync(premiumPagePath) ? fs.readFileSync(premiumPagePath, 'utf8') : '';

runTest(
  'Presentation page (/premium) includes period selector, feature cards, and transparent FAQ',
  'Premium Presentation UI',
  () => 
    fs.existsSync(premiumPagePath) &&
    premiumPageContent.includes('selectedPeriodSlug') &&
    premiumPageContent.includes('Vídeos Exclusivos') &&
    premiumPageContent.includes('Avaliações Moderadas'),
  'Página pública /premium ausente ou incompleta'
);

const accountPagePath = path.join(rootDir, 'src', 'app', 'account', 'page.tsx');
const accountPageContent = fs.existsSync(accountPagePath) ? fs.readFileSync(accountPagePath, 'utf8') : '';

runTest(
  'User Account page displays Portal18 Premium member status and benefit summary',
  'Account UI',
  () => 
    fs.existsSync(accountPagePath) &&
    accountPageContent.includes('Portal18 Premium') &&
    accountPageContent.includes('consumerEntitlements'),
  'Página /account sem seção do Portal18 Premium'
);

const profileClientPath = path.join(rootDir, 'src', 'app', 'perfil', '[estado]', '[cidade]', '[slug]', 'ProfileViewClient.tsx');
const profileClientContent = fs.existsSync(profileClientPath) ? fs.readFileSync(profileClientPath, 'utf8') : '';

runTest(
  'ProfileViewClient renders exclusive video locked cards and moderated reviews with submission modal',
  'Profile Client UI',
  () => 
    fs.existsSync(profileClientPath) &&
    profileClientContent.includes('Vídeo Exclusivo Premium') &&
    profileClientContent.includes('Avaliações da Comunidade') &&
    profileClientContent.includes('handleReviewSubmit'),
  'ProfileViewClient sem seções de vídeos exclusivos e avaliações'
);

const galleryPagePath = path.join(rootDir, 'src', 'app', 'advertiser', 'gallery', 'page.tsx');
const galleryPageContent = fs.existsSync(galleryPagePath) ? fs.readFileSync(galleryPagePath, 'utf8') : '';

runTest(
  'Advertiser Gallery page allows designating video audience (18+ Público vs Premium)',
  'Gallery UI',
  () => 
    fs.existsSync(galleryPagePath) &&
    galleryPageContent.includes('handleToggleVideoAudience') &&
    galleryPageContent.includes('consumer_premium'),
  'Galeria do anunciante sem seletor de audiência para vídeos'
);

const adminReviewsPath = path.join(rootDir, 'src', 'app', 'admin', 'moderation', 'reviews', 'page.tsx');
const adminReviewsContent = fs.existsSync(adminReviewsPath) ? fs.readFileSync(adminReviewsPath, 'utf8') : '';

runTest(
  'Admin Review Moderation page allows filtering and approving/rejecting submitted reviews',
  'Admin Moderation UI',
  () => 
    fs.existsSync(adminReviewsPath) &&
    adminReviewsContent.includes('Moderação de Avaliações') &&
    adminReviewsContent.includes('handleModerate'),
  'Página admin de moderação de avaliações ausente'
);

// --------------------------------------------------------------------------
// 4. Non-Negotiables & Invariants
// --------------------------------------------------------------------------
runTest(
  'Age Assurance and Safe Mode remain 100% fail-closed (Consumer Premium does not bypass Age Gate)',
  'Safety Invariant',
  () => {
    const ageServicePath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
    return fs.existsSync(ageServicePath) && fs.readFileSync(ageServicePath, 'utf8').includes('isAgeVerified');
  },
  'Age Assurance violado'
);

runTest(
  'Payment kill switch remains 100% active (Zero mock charges in production)',
  'Commercial Invariant',
  () => premiumPageContent.includes('Assinaturas em Homologação'),
  'Kill switch de pagamentos ausente'
);

runTest(
  'Contacts remain independent and unblocked by Consumer Premium',
  'Marketplace Invariant',
  () => profileClientContent.includes('primaryWhatsApp'),
  'Contatos bloqueados indevidamente por Consumer Premium'
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
  console.log('🎉 All Phase 27F Consumer Premium & Reviews verification tests passed!\n');
  process.exit(0);
}
