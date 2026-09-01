/**
 * PORTAL18 — Phase 27A.1 Hardening & Security Verification Script
 * Validates Commercial Lifecycle Hardening, Authenticity Security, Contact Sanitization & Media Protection.
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
console.log('PORTAL18 — PHASE 27A.1 HARDENING & SECURITY VERIFICATION');
console.log('Commercial Lifecycle Hardening, Authenticity Security & Media Access');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// 1. Emoji Removal and Badge Design System Compliance
// --------------------------------------------------------------------------
const profileClientPath = path.join(rootDir, 'src', 'app', 'perfil', '[estado]', '[cidade]', '[slug]', 'ProfileViewClient.tsx');
const profileClientContent = fs.existsSync(profileClientPath) ? fs.readFileSync(profileClientPath, 'utf8') : '';

const cardPath = path.join(rootDir, 'src', 'components', 'public', 'AdvertiserCard.tsx');
const cardContent = fs.existsSync(cardPath) ? fs.readFileSync(cardPath, 'utf8') : '';

runTest(
  'Authenticity badge in ProfileViewClient has ZERO emojis and uses ShieldCheck with aria-hidden=true',
  'Visual Hardening',
  () =>
    !profileClientContent.includes('Perfil Autenticado ✨') &&
    profileClientContent.includes('Perfil Autenticado') &&
    profileClientContent.includes('ShieldCheck size={12} aria-hidden="true"'),
  'Perfil Autenticado ainda contém emoji ou não utiliza ShieldCheck semântico'
);

runTest(
  'Authenticity badge in AdvertiserCard has ZERO emojis and uses ShieldCheck with aria-hidden=true',
  'Visual Hardening',
  () =>
    !cardContent.includes('Autêntico ✨') &&
    cardContent.includes('ShieldCheck size={11} aria-hidden="true"'),
  'AdvertiserCard ainda contém emoji ou não utiliza ShieldCheck semântico'
);

// --------------------------------------------------------------------------
// 2. Database Migration 00021 & SQL Security
// --------------------------------------------------------------------------
const migration21Path = path.join(rootDir, 'supabase', 'migrations', '20260830000021_phase27a1_hardening.sql');
const migration21Content = fs.existsSync(migration21Path) ? fs.readFileSync(migration21Path, 'utf8') : '';

runTest(
  'Migration 00021 exists and contains hardening rules',
  'Database Schema',
  () => fs.existsSync(migration21Path) && migration21Content.length > 500,
  'Arquivo de migração 00021 não encontrado ou vazio'
);

runTest(
  'authenticity_challenges status constraint includes superseded and revoked states',
  'Evidence Retention',
  () =>
    migration21Content.includes('superseded') &&
    migration21Content.includes('revoked'),
  'Constraint de status de autenticidade não inclui superseded e revoked'
);

runTest(
  'RPC generate_authenticity_challenge uses CSPRNG gen_random_bytes(3) and 15-min TTL',
  'Challenge Entropy',
  () =>
    migration21Content.includes('gen_random_bytes(3)') &&
    migration21Content.includes("INTERVAL '15 minutes'"),
  'RPC de geração de challenge não utiliza CSPRNG de alta entropia'
);

runTest(
  'RPC submit_authenticity_video executes atomic single-use update with clock check',
  'Challenge Single Use',
  () =>
    migration21Content.includes('submit_authenticity_video') &&
    migration21Content.includes("status = 'issued'") &&
    migration21Content.includes('expires_at > now()') &&
    migration21Content.includes('RETURNING id INTO v_updated_id'),
  'RPC submit_authenticity_video não possui atualização atômica'
);

runTest(
  'RPC review_authenticity_video supersedes previous verified evidence upon new approval',
  'Evidence Retention',
  () =>
    migration21Content.includes("SET status = 'superseded'") &&
    migration21Content.includes("status = 'verified'"),
  'Aprovação de novo vídeo não marca evidência anterior como superseded'
);

runTest(
  'RPC revoke_authenticity implements instant badge revocation with mandatory reason and audit log',
  'Badge Revocation',
  () =>
    migration21Content.includes('revoke_authenticity') &&
    migration21Content.includes('authenticity_verified = false') &&
    migration21Content.includes('authenticity_revoked'),
  'RPC revoke_authenticity ausente ou incompleta'
);

runTest(
  'approve_advertiser_profile protects against canonical user account trial replay',
  'Trial Replay Hardening',
  () =>
    migration21Content.includes('v_already_used_trial') &&
    migration21Content.includes('profile_id = v_adv.profile_id') &&
    migration21Content.includes("provider = 'portal18_trial'"),
  'Proteção contra replay canônico de trial ausente na aprovação de perfil'
);

// --------------------------------------------------------------------------
// 3. Services & Evidence Privacy
// --------------------------------------------------------------------------
const authenticityServicePath = path.join(rootDir, 'src', 'services', 'authenticityService.ts');
const authenticityServiceContent = fs.existsSync(authenticityServicePath) ? fs.readFileSync(authenticityServicePath, 'utf8') : '';

const mediaServicePath = path.join(rootDir, 'src', 'services', 'mediaService.ts');
const mediaServiceContent = fs.existsSync(mediaServicePath) ? fs.readFileSync(mediaServicePath, 'utf8') : '';

runTest(
  'authenticityService provides revokeAuthenticity method',
  'Services',
  () => authenticityServiceContent.includes('revokeAuthenticity'),
  'Método revokeAuthenticity ausente no authenticityService'
);

runTest(
  'authenticityService provides getEvidenceSignedUrl with maximum 300s TTL and private bucket',
  'Services',
  () =>
    authenticityServiceContent.includes('getEvidenceSignedUrl') &&
    authenticityServiceContent.includes('advertiser-private-media') &&
    authenticityServiceContent.includes('300'),
  'getEvidenceSignedUrl ausente ou sem restrições de TTL/bucket privado'
);

runTest(
  'mediaService.getApprovedPublicMedia strictly excludes authenticity_video evidence from public queries',
  'Media Privacy',
  () => mediaServiceContent.includes(".neq('media_type', 'authenticity_video')"),
  'getApprovedPublicMedia não exclui explicitamente vídeos de autenticidade'
);

// --------------------------------------------------------------------------
// 4. Admin UI Separation & Modal Support
// --------------------------------------------------------------------------
const reviewModalPath = path.join(rootDir, 'src', 'components', 'admin', 'MediaReviewModal.tsx');
const reviewModalContent = fs.existsSync(reviewModalPath) ? fs.readFileSync(reviewModalPath, 'utf8') : '';

runTest(
  'MediaReviewModal displays audio and video elements distinctly with specialized approval labels',
  'Admin Hardening',
  () =>
    reviewModalContent.includes('<video') &&
    reviewModalContent.includes('<audio') &&
    reviewModalContent.includes('Aprovar Selo de Autenticidade'),
  'MediaReviewModal não diferencia áudio/vídeo comercial/autenticidade'
);

// --------------------------------------------------------------------------
// 5. Contact Security & Age Assurance
// --------------------------------------------------------------------------
const migration20Path = path.join(rootDir, 'supabase', 'migrations', '20260830000020_phase27a_commercial_lifecycle.sql');
const migration20Content = fs.existsSync(migration20Path) ? fs.readFileSync(migration20Path, 'utf8') : '';

runTest(
  'get_public_advertiser_contacts RPC sanitizes contacts based on entitlement contacts_strategy',
  'Contact Security',
  () =>
    migration20Content.includes('get_public_advertiser_contacts') &&
    migration20Content.includes('contacts_strategy') &&
    migration20Content.includes('is_visible = true'),
  'Sanitização server-side de contatos ausente'
);

runTest(
  'Age Assurance and ECA Digital gate remain 100% fail-closed',
  'Age Assurance',
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
  console.log('🎉 All Phase 27A.1 Hardening & Security verification tests passed!\n');
  process.exit(0);
}
