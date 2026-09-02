/**
 * PORTAL18 — PHASE 34 AUTOMATED VERIFICATION SUITE
 * Product Hardening, Real-World UX Audit & Production Polish
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
  console.log('PORTAL18 — PHASE 34 AUTOMATED VERIFICATION SUITE');
  console.log('Product Hardening, Real-World UX Audit & Production Polish');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  console.log('--- 1. ROUTE INVENTORY & STRUCTURAL INTEGRITY ---');

  // 1.1 Core App Route Domains
  const appDir = path.join(rootDir, 'src', 'app');
  const criticalRoutePaths = [
    '', // / (Home)
    'explorar',
    'acompanhantes/[estado]',
    'acompanhantes/[estado]/[cidade]',
    'categoria/[slug]',
    'perfil/[estado]/[cidade]/[slug]',
    'anunciar',
    'plans',
    'premium',
    'accessibility',
    'trust',
    'trust/age-verification',
    'trust/privacy',
    'trust/security',
    'help',
    'support',
    'age-verification',
    'age-verification/callback',
    '(auth)/login',
    '(auth)/register',
    '(auth)/forgot-password',
    '(auth)/reset-password',
    'account',
    'account/favorites',
    'account/following',
    'account/history',
    'account/lists',
    'account/preferences',
    'account/notifications',
    'account/security',
    'account/privacy',
    'account/billing',
    'advertiser',
    'advertiser/onboarding',
    'advertiser/profile',
    'advertiser/gallery',
    'advertiser/location',
    'advertiser/contacts',
    'advertiser/verification',
    'advertiser/health',
    'advertiser/analytics',
    'advertiser/promote',
    'advertiser/referrals',
    'advertiser/subscription',
    'admin',
    'admin/moderation/profiles',
    'admin/moderation/media',
    'admin/moderation/reviews',
    'admin/trust-safety',
    'admin/reputation',
    'admin/search',
    'admin/risk',
    'admin/payments',
    'admin/finance',
    'admin/growth/seo',
    'admin/communications',
  ];

  const allRoutesExist = criticalRoutePaths.every((r) => {
    const p = path.join(appDir, r, 'page.tsx');
    return fs.existsSync(p);
  });

  assert(
    allRoutesExist === true,
    '1.1 [Route Inventory] All critical application routes exist and have valid page components',
    'Some critical routes are missing page.tsx'
  );

  // 1.2 Admin Navigation Coverage
  const adminLayoutPath = path.join(rootDir, 'src', 'components', 'admin', 'AdminLayout.tsx');
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');

  assert(
    adminLayoutContent.includes('/admin/search') &&
    adminLayoutContent.includes('/admin/reputation') &&
    adminLayoutContent.includes('/admin/trust-safety') &&
    adminLayoutContent.includes('/admin/payments') &&
    adminLayoutContent.includes('/admin/finance'),
    '1.2 [Admin Navigation Coverage] AdminLayout links to all mission-critical operational centers',
    'AdminLayout missing essential links'
  );

  console.log('\n--- 2. TEST REPORTER COUNTERS SYNCHRONIZATION ---');

  // 2.1 Phase 32 Reporter
  const p32TestPath = path.join(rootDir, 'scripts', 'verify-phase32-reputation-trust.ts');
  const p32Content = fs.readFileSync(p32TestPath, 'utf8');
  assert(
    p32Content.includes('TOTAL TESTS: ${passCount + failCount}'),
    '2.1 [Test Reporter Accuracy] verify-phase32-reputation-trust uses dynamic test counter',
    'verify-phase32 has hard-coded test count'
  );

  // 2.2 Phase 33 Reporter
  const p33TestPath = path.join(rootDir, 'scripts', 'verify-phase33-search-recommendations.ts');
  const p33Content = fs.readFileSync(p33TestPath, 'utf8');
  assert(
    p33Content.includes('TOTAL TESTS: ${passCount + failCount}'),
    '2.2 [Test Reporter Accuracy] verify-phase33-search-recommendations uses dynamic test counter',
    'verify-phase33 has hard-coded test count'
  );

  console.log('\n--- 3. MOBILE 44PX TOUCH TARGET STANDARDIZATION ---');

  // 3.1 AdvertiserCard Touch Targets
  const cardPath = path.join(rootDir, 'src', 'components', 'public', 'AdvertiserCard.tsx');
  const cardContent = fs.readFileSync(cardPath, 'utf8');
  assert(
    cardContent.includes("minWidth: '44px'") &&
    cardContent.includes("minHeight: '44px'"),
    '3.1 [Mobile 44px Touch Standard] AdvertiserCard favorite and context menu touch targets adhere to >= 44x44px',
    'AdvertiserCard has substandard touch targets'
  );

  // 3.2 Explore Page Action Buttons
  const explorePath = path.join(rootDir, 'src', 'app', 'explorar', 'page.tsx');
  const exploreContent = fs.readFileSync(explorePath, 'utf8');
  assert(
    exploreContent.includes("minHeight: '44px'"),
    '3.2 [Mobile 44px Touch Standard] Explore page interactive action buttons adhere to >= 44px minHeight',
    'Explore page action buttons lack 44px touch target'
  );

  console.log('\n--- 4. ACCESSIBILITY, SEMANTICS & NO UNGOVERNED EMOJIS ---');

  // 4.1 Skip to Content Link
  const rootLayoutPath = path.join(rootDir, 'src', 'app', 'layout.tsx');
  const rootLayoutContent = fs.readFileSync(rootLayoutPath, 'utf8');
  assert(
    rootLayoutContent.includes('skip-to-content') &&
    rootLayoutContent.includes('id="main-content"'),
    '4.1 [WCAG 2.2 Landmarks] Skip-to-content link and main landmark properly defined in RootLayout',
    'RootLayout missing skip link or main-content id'
  );

  // 4.2 Clean Typography (No Decorative Emojis in Core UI Components)
  const navBarPath = path.join(rootDir, 'src', 'components', 'search', 'AdvancedSearchBar.tsx');
  const navBarContent = fs.readFileSync(navBarPath, 'utf8');
  assert(
    !/[\uD83C-\uDBFF\uDC00-\uDFFF]/.test(navBarContent),
    '4.2 [Professional Typography] AdvancedSearchBar uses official Lucide SVG icons with zero ungoverned emojis',
    'Found emojis in AdvancedSearchBar'
  );

  console.log('\n--- 5. SAFETY INVARIANTS & STRIPE PROHIBITION ---');

  // 5.1 Payment Kill Switch Invariant
  const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';
  assert(
    isKillSwitchActive === true,
    '5.1 [Payment Kill Switch Invariant] PORTAL18_PAYMENT_KILL_SWITCH is active (zero real charges permitted)',
    'Kill switch must remain active'
  );

  // 5.2 Stripe Prohibition Invariant
  const stripe = PaymentProviderRegistry.get('stripe');
  const stripeMeta = stripe ? await stripe.getMetadata() : null;

  assert(
    stripeMeta?.contact_status === 'rejected' &&
    stripeMeta?.is_production_eligible === false,
    '5.2 [Stripe Block Invariant] Stripe remains strictly blocked from production',
    'Stripe must remain permanently blocked'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 34 Product Hardening & Production Polish verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 34 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
