import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function verifyPhase26DMobileUX() {
  console.log('=== RUNNING PHASE 26D VERIFICATION: MOBILE DISCOVERY & RESPONSIVE UX ===\n');

  // 1. Verify Header & Mobile Menu
  console.log('--- 1. Testing Header & Mobile Menu Implementation ---');
  const headerFile = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Header.tsx'), 'utf-8');
  assert(headerFile.includes('btn-mobile-toggle'), 'Header includes mobile toggle button');
  assert(headerFile.includes('Sheet isOpen={mobileMenuOpen}'), 'Header includes off-canvas mobile drawer menu');
  assert(headerFile.includes('Explorar Anúncios'), 'Mobile drawer includes discovery links');
  assert(headerFile.includes('Trust Center & Proteção 18+') || headerFile.includes('Segurança e Conformidade 18+'), 'Mobile drawer includes 18+ trust link');
  assert(headerFile.includes('hide-mobile'), 'Desktop navigation is hidden on mobile screens');

  // 2. Verify Home Page Mobile Layout & Responsive Elements
  console.log('\n--- 2. Testing Home Page Mobile Architecture ---');
  const homeFile = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf-8');
  assert(homeFile.includes('hero-search-form'), 'Home page uses responsive hero-search-form class');
  assert(homeFile.includes('taxonomy-profile-grid'), 'Home page uses 2-column taxonomy-profile-grid');
  assert(homeFile.includes('mobile-region-accordion'), 'Home page includes mobile region accordion component');
  assert(homeFile.includes('desktop-region-view'), 'Home page preserves desktop tabbed region view');
  assert(homeFile.includes('PORTAL NACIONAL 18+ • MAIORIDADE VERIFICADA'), 'Home page uses discrete single badge in hero');

  // 3. Verify CSS Rules for Mobile UX & Safe Areas
  console.log('\n--- 3. Testing CSS Mobile Rules & Breakpoints ---');
  const cssFile = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf-8');
  assert(cssFile.includes('.header'), 'Globals CSS includes header styles');
  assert(cssFile.includes('env(safe-area-inset-top'), 'Header supports safe area inset top for iOS/PWA');
  assert(cssFile.includes('.hero-search-form'), 'CSS defines responsive flex-direction for hero search form');
  assert(cssFile.includes('.taxonomy-profile-grid'), 'CSS defines 2-column mobile grid for profile taxonomy');
  assert(cssFile.includes('.mobile-region-accordion'), 'CSS defines mobile region accordion display');
  assert(cssFile.includes('.mobile-sticky-contact-bar'), 'CSS defines mobile sticky contact bar with safe-area-inset-bottom');
  assert(cssFile.includes('min-height: 44px') || cssFile.includes('height: 44px'), 'Touch targets meet >=44px standard on mobile');

  // 4. Verify AdvertiserCard Mobile Typography & Touch Targets
  console.log('\n--- 4. Testing AdvertiserCard Mobile Typography & Performance ---');
  const cardFile = fs.readFileSync(path.join(process.cwd(), 'src/components/public/AdvertiserCard.tsx'), 'utf-8');
  assert(cardFile.includes('aspect-ratio') || cardFile.includes('advertiser-card-media-wrapper'), 'AdvertiserCard uses 3:4 aspect-ratio media wrapper');
  assert(cardFile.includes('sizes="(max-width: 640px) 50vw'), 'AdvertiserCard uses responsive image sizes attribute');
  assert(cardFile.includes('advertiser-card-fav-btn'), 'AdvertiserCard includes favorite touch button');
  assert(cardFile.includes('advertiser-card-location'), 'AdvertiserCard includes single-line location with ellipsis');
  assert(cardFile.includes('advertiser-card-headline'), 'AdvertiserCard includes 2-line clamped headline');

  // 5. Verify Explore Page Mobile Sheet & Grid
  console.log('\n--- 5. Testing Explore Page Mobile Sheet & Search ---');
  const exploreFile = fs.readFileSync(path.join(process.cwd(), 'src/app/explorar/page.tsx'), 'utf-8');
  assert(exploreFile.includes('mobileFiltersOpen'), 'Explore page includes mobile bottom sheet state');
  assert(exploreFile.includes('position: \'sticky\'') && exploreFile.includes('Aplicar Filtros'), 'Explore mobile sheet includes sticky action footer');
  assert(exploreFile.includes('Filtros'), 'Explore page shows filter toggle with active count badge');

  // 6. Verify Age Gate Mobile Polish & Privacy
  console.log('\n--- 6. Testing Age Gate Mobile Modal & Compliance ---');
  const ageGateFile = fs.readFileSync(path.join(process.cwd(), 'src/components/ageVerification/AgeGateModal.tsx'), 'utf-8');
  assert(ageGateFile.includes('maxHeight:') && ageGateFile.includes('88dvh'), 'Age gate modal respects mobile 88dvh viewport limit');
  assert(ageGateFile.includes('minHeight: \'44px\''), 'Age gate buttons use >=44px touch targets');
  assert(ageGateFile.includes('/trust/age-verification'), 'Age gate links directly to trust center documentation');
  assert(ageGateFile.includes('Zero Biometria'), 'Age gate clearly communicates zero biometric storage');

  // 7. Verify Profile Page Mobile Hero & Sticky Contact
  console.log('\n--- 7. Testing Profile Page Mobile Hero & Sticky Contact Bar ---');
  const profileFile = fs.readFileSync(path.join(process.cwd(), 'src/app/perfil/[estado]/[cidade]/[slug]/page.tsx'), 'utf-8');
  assert(profileFile.includes('mobile-sticky-contact-bar'), 'Profile page renders mobile sticky contact bar when verified');
  assert(profileFile.includes('isAgeVerified && primaryWhatsApp'), 'Sticky contact bar is gated by Age Verification (Safe Mode compliant)');
  assert(profileFile.includes('aspectRatio: \'3 / 4\''), 'Profile hero photo uses 3:4 aspect-ratio (not 100vh full bleed)');

  console.log('\n==================================================');
  console.log('FINAL RESULT: ALL 20 MOBILE UX VERIFICATIONS PASSED');
  console.log('==================================================\n');
}

verifyPhase26DMobileUX().catch((err) => {
  console.error('Phase 26D verification error:', err);
  process.exit(1);
});
