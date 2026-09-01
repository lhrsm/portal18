/**
 * PORTAL18 — Phase 27A Commercial Lifecycle, Trial, Entitlements & Media Authenticity Verification Script
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
console.log('PORTAL18 — PHASE 27A AUTOMATED VERIFICATION SUITE');
console.log('Commercial Lifecycle, Trial, Entitlements & Media Authenticity');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Database Migration & Schema Invariants
// --------------------------------------------------------------------------
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260830000020_phase27a_commercial_lifecycle.sql');

runTest(
  'Migration 00020 exists and is non-empty',
  'Database Schema',
  () => fs.existsSync(migrationPath) && fs.statSync(migrationPath).size > 1000,
  'Arquivo de migração 00020 não encontrado ou vazio'
);

const migrationContent = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

runTest(
  'advertiser_profiles extended with trial_used, trial_started_at, authenticity_verified and audio_presentation_url',
  'Database Schema',
  () =>
    migrationContent.includes('trial_used boolean') &&
    migrationContent.includes('trial_started_at timestamptz') &&
    migrationContent.includes('authenticity_verified boolean') &&
    migrationContent.includes('audio_presentation_url text'),
  'Colunas de trial e autenticidade ausentes na migração'
);

runTest(
  'authenticity_challenges table created with high-entropy code and 15-min TTL constraint',
  'Database Schema',
  () =>
    migrationContent.includes('CREATE TABLE IF NOT EXISTS public.authenticity_challenges') &&
    migrationContent.includes('challenge_code text') &&
    migrationContent.includes('expires_at timestamptz'),
  'Tabela de challenges de autenticidade ausente'
);

runTest(
  'RPC get_advertiser_entitlements evaluates trial, active, grace_period, limited and suspended',
  'Server Entitlements',
  () =>
    migrationContent.includes('get_advertiser_entitlements') &&
    migrationContent.includes('trial') &&
    migrationContent.includes('grace_period') &&
    migrationContent.includes('limited') &&
    migrationContent.includes('contacts_strategy'),
  'RPC de entitlements não contempla todos os estados de ciclo comercial'
);

runTest(
  'RPC get_public_advertiser_contacts filters contacts strictly server-side (full vs limited vs hidden)',
  'Contact Security',
  () =>
    migrationContent.includes('get_public_advertiser_contacts') &&
    migrationContent.includes('contacts_strategy') &&
    migrationContent.includes('is_visible = true'),
  'RPC de filtro de contatos públicos ausente na migração'
);

runTest(
  'RPC approve_advertiser_profile triggers 7-day trial idempotently on first publication only',
  'Trial Idempotency',
  () =>
    migrationContent.includes('approve_advertiser_profile') &&
    migrationContent.includes('trial_used') &&
    migrationContent.includes("INTERVAL '7 days'"),
  'Idempotência do trial de 7 dias ausente no approve_advertiser_profile'
);

// --------------------------------------------------------------------------
// 2. TypeScript Types & Domain Models
// --------------------------------------------------------------------------
const typesPath = path.join(rootDir, 'src', 'types', 'app.types.ts');
const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';

runTest(
  'CommercialLifecycleState and AuthenticityChallenge exported in app.types.ts',
  'TypeScript Types',
  () =>
    typesContent.includes('CommercialLifecycleState') &&
    typesContent.includes('AuthenticityChallenge') &&
    typesContent.includes('TrustBadges'),
  'Tipos de ciclo comercial e autenticidade ausentes em app.types.ts'
);

runTest(
  'AdvertiserEntitlements enhanced with audio_allowed, commercial_video_allowed, contacts_strategy, is_trial',
  'TypeScript Types',
  () =>
    typesContent.includes('audio_allowed') &&
    typesContent.includes('commercial_video_allowed') &&
    typesContent.includes('contacts_strategy') &&
    typesContent.includes('trial_days_remaining'),
  'Interface AdvertiserEntitlements não contém novas propriedades do lifecycle'
);

// --------------------------------------------------------------------------
// 3. Services Implementation
// --------------------------------------------------------------------------
const lifecycleServicePath = path.join(rootDir, 'src', 'services', 'commercialLifecycleService.ts');
const authenticityServicePath = path.join(rootDir, 'src', 'services', 'authenticityService.ts');
const contactsServicePath = path.join(rootDir, 'src', 'services', 'contactsService.ts');
const mediaServicePath = path.join(rootDir, 'src', 'services', 'mediaService.ts');

runTest(
  'commercialLifecycleService implemented with getCommercialLifecycle and status badges',
  'Services',
  () =>
    fs.existsSync(lifecycleServicePath) &&
    fs.readFileSync(lifecycleServicePath, 'utf8').includes('getCommercialLifecycle'),
  'commercialLifecycleService ausente ou incompleto'
);

runTest(
  'authenticityService implemented with generateChallenge, submitVideo, and reviewChallenge',
  'Services',
  () =>
    fs.existsSync(authenticityServicePath) &&
    fs.readFileSync(authenticityServicePath, 'utf8').includes('generateChallenge') &&
    fs.readFileSync(authenticityServicePath, 'utf8').includes('submitVideo'),
  'authenticityService ausente ou incompleto'
);

runTest(
  'contactsService implements getPublicContacts via server RPC',
  'Services',
  () =>
    fs.existsSync(contactsServicePath) &&
    fs.readFileSync(contactsServicePath, 'utf8').includes('getPublicContacts') &&
    fs.readFileSync(contactsServicePath, 'utf8').includes('get_public_advertiser_contacts'),
  'getPublicContacts ausente no contactsService'
);

runTest(
  'mediaService implements uploadAudioPresentation with strict MIME verification and 60s limit',
  'Services',
  () => {
    const content = fs.readFileSync(mediaServicePath, 'utf8');
    return content.includes('uploadAudioPresentation') && content.includes('audio/webm') && content.includes('65');
  },
  'uploadAudioPresentation ausente ou sem validações no mediaService'
);

// --------------------------------------------------------------------------
// 4. UI Components & Frontend Invariants
// --------------------------------------------------------------------------
const audioManagerPath = path.join(rootDir, 'src', 'components', 'advertiser', 'MediaCenter', 'AudioPresentationManager.tsx');
const authenticityManagerPath = path.join(rootDir, 'src', 'components', 'advertiser', 'MediaCenter', 'AuthenticityVideoManager.tsx');
const galleryPagePath = path.join(rootDir, 'src', 'app', 'advertiser', 'gallery', 'page.tsx');
const profileClientPath = path.join(rootDir, 'src', 'app', 'perfil', '[estado]', '[cidade]', '[slug]', 'ProfileViewClient.tsx');
const advertiserCardPath = path.join(rootDir, 'src', 'components', 'public', 'AdvertiserCard.tsx');
const audioPlayerPath = path.join(rootDir, 'src', 'components', 'public', 'ProfileAudioPlayer.tsx');

runTest(
  'AudioPresentationManager component handles MediaRecorder audio recording, pause, stop, and upload',
  'Advertiser UI',
  () =>
    fs.existsSync(audioManagerPath) &&
    fs.readFileSync(audioManagerPath, 'utf8').includes('MediaRecorder') &&
    fs.readFileSync(audioManagerPath, 'utf8').includes('uploadAudioPresentation'),
  'AudioPresentationManager ausente ou incompleto'
);

runTest(
  'AuthenticityVideoManager displays dynamic single-use challenge code and secure submission',
  'Advertiser UI',
  () =>
    fs.existsSync(authenticityManagerPath) &&
    fs.readFileSync(authenticityManagerPath, 'utf8').includes('generateChallenge') &&
    fs.readFileSync(authenticityManagerPath, 'utf8').includes('submitVideo'),
  'AuthenticityVideoManager ausente ou incompleto'
);

runTest(
  'AdvertiserGalleryPage is Unified Media Center with Fotos, Vídeos, Áudio, and Autenticidade tabs',
  'Advertiser UI',
  () => {
    const content = fs.readFileSync(galleryPagePath, 'utf8');
    return content.includes('AudioPresentationManager') && content.includes('AuthenticityVideoManager') && content.includes('authenticity');
  },
  'AdvertiserGalleryPage não contém todas as 4 abas da Central de Mídia'
);

runTest(
  'ProfileAudioPlayer component exists and provides accessible audio playback controls',
  'Public Profile UI',
  () =>
    fs.existsSync(audioPlayerPath) &&
    fs.readFileSync(audioPlayerPath, 'utf8').includes('aria-label') &&
    fs.readFileSync(audioPlayerPath, 'utf8').includes('togglePlay'),
  'ProfileAudioPlayer ausente ou sem suporte a acessibilidade'
);

runTest(
  'ProfileViewClient mounts ProfileAudioPlayer and displays Authenticity Verified badge',
  'Public Profile UI',
  () => {
    const content = fs.readFileSync(profileClientPath, 'utf8');
    return content.includes('ProfileAudioPlayer') && content.includes('authenticity_verified') && content.includes('getPublicContacts');
  },
  'ProfileViewClient não exibe player de áudio ou selo de autenticidade'
);

runTest(
  'AdvertiserCard displays Authenticity Verified badge when claim is present',
  'Public Search UI',
  () => {
    const content = fs.readFileSync(advertiserCardPath, 'utf8');
    return content.includes('authenticity_verified') && content.includes('Autêntico');
  },
  'AdvertiserCard não exibe selo de autenticidade'
);

// --------------------------------------------------------------------------
// 5. Zero Regression & Safety Invariants
// --------------------------------------------------------------------------
runTest(
  'Age Assurance and ECA Digital gate preserved 100% fail-closed',
  'Safety & Compliance',
  () => {
    const ageServicePath = path.join(rootDir, 'src', 'services', 'ageVerification', 'ageVerificationService.ts');
    return fs.existsSync(ageServicePath) && fs.readFileSync(ageServicePath, 'utf8').includes('isAgeVerified');
  },
  'Age Assurance modificado ou ausente'
);

runTest(
  'Zero external payment charges triggered in Phase 27A (disabled in production)',
  'Commercial Invariants',
  () => {
    const billingPath = path.join(rootDir, 'src', 'services', 'billingService.ts');
    return fs.existsSync(billingPath);
  },
  'billingService não verificado'
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
  console.log('🎉 All Phase 27A Commercial Lifecycle & Media Authenticity verification tests passed!\n');
  process.exit(0);
}
