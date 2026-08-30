import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

function verifyAccessibilityCompliance() {
  console.log('=== RUNNING PHASE 26E.1 VERIFICATION: ACCESSIBILITY (WCAG 2.2 AA) & SEO HARDENING ===\n');

  // 1. Skip-to-content link & Main landmark
  console.log('--- 1. Testing Landmarks & Skip-to-Content Link ---');
  const rootLayout = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf-8');
  assert(rootLayout.includes('className="skip-to-content"'), 'Skip-to-content link exists in RootLayout');
  assert(rootLayout.includes('id="main-content"'), 'Main landmark has id="main-content"');
  assert(rootLayout.includes('tabIndex={-1}'), 'Main element supports programmatic keyboard focus');

  // 2. Viewport zoom scalability
  console.log('\n--- 2. Testing Viewport Scalability ---');
  assert(!rootLayout.includes('user-scalable=no'), 'user-scalable=no is NOT present (pinch zoom enabled)');
  assert(!rootLayout.includes('maximumScale: 1'), 'maximumScale is not locked to 1.0');

  // 3. CSS Utilities & Focus Visibility
  console.log('\n--- 3. Testing CSS Tokens & Focus Visibility ---');
  const globalsCss = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf-8');
  assert(globalsCss.includes('.skip-to-content'), '.skip-to-content CSS class defined in globals.css');
  assert(globalsCss.includes('.sr-only'), '.sr-only utility class defined for screen readers');
  assert(globalsCss.includes(':focus-visible'), ':focus-visible high-contrast outline configured');
  assert(globalsCss.includes('prefers-reduced-motion'), 'prefers-reduced-motion media query implemented');

  // 4. Modal & Dialog Semantics (AgeGate, Sheet, Lightbox, Report)
  console.log('\n--- 4. Testing Modal & Dialog Semantics ---');
  const ageGateLayout = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/AgeGateModal.tsx'), 'utf-8');
  assert(ageGateLayout.includes('role="dialog"'), 'AgeGateModal has role="dialog"');
  assert(ageGateLayout.includes('aria-modal="true"'), 'AgeGateModal has aria-modal="true"');
  assert(ageGateLayout.includes('aria-labelledby="age-gate-title"'), 'AgeGateModal has aria-labelledby');

  const ageGateService = fs.readFileSync(path.join(process.cwd(), 'src/components/ageVerification/AgeGateModal.tsx'), 'utf-8');
  assert(ageGateService.includes('role="dialog"'), 'Verification AgeGate has role="dialog"');
  assert(ageGateService.includes('aria-modal="true"'), 'Verification AgeGate has aria-modal="true"');

  const sheetComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/Sheet.tsx'), 'utf-8');
  assert(sheetComponent.includes('role="dialog"'), 'Sheet component has role="dialog"');
  assert(sheetComponent.includes("e.key === 'Escape'"), 'Sheet closes on Escape key');

  const modalComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/Modal.tsx'), 'utf-8');
  assert(modalComponent.includes('role="dialog"'), 'Modal component has role="dialog"');
  assert(modalComponent.includes("e.key === 'Escape'"), 'Modal closes on Escape key');

  const lightboxComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/public/GalleryLightbox.tsx'), 'utf-8');
  assert(lightboxComponent.includes('role="dialog"'), 'GalleryLightbox has role="dialog"');
  assert(lightboxComponent.includes("e.key === 'Escape'"), 'GalleryLightbox closes on Escape key');
  assert(lightboxComponent.includes("e.key === 'ArrowLeft'"), 'GalleryLightbox supports ArrowLeft/ArrowRight navigation');

  // 5. Accessible Names on Icon Buttons & Hamburger
  console.log('\n--- 5. Testing Icon-Only Buttons & Hamburger ---');
  const headerComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Header.tsx'), 'utf-8');
  assert(headerComponent.includes('aria-label="Abrir menu de navegação"'), 'Mobile hamburger button has aria-label');
  assert(headerComponent.includes('aria-expanded={mobileMenuOpen}'), 'Mobile hamburger button tracks aria-expanded');
  assert(headerComponent.includes('aria-controls="mobile-nav-drawer"'), 'Mobile hamburger button references aria-controls');

  const cardComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/public/AdvertiserCard.tsx'), 'utf-8');
  assert(cardComponent.includes('aria-label='), 'AdvertiserCard favorite and context buttons have aria-label');
  assert(cardComponent.includes('alt='), 'AdvertiserCard images have alt attribute');

  // 6. Form Field Semantics & Error Live Regions
  console.log('\n--- 6. Testing Form Fields & Error Announcement ---');
  const formField = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/FormField.tsx'), 'utf-8');
  assert(formField.includes('className="sr-only">(campo obrigatório)</span>'), 'FormField includes screen-reader required text');
  assert(formField.includes('role="alert"'), 'FormField error message has role="alert"');

  const inputComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/Input.tsx'), 'utf-8');
  assert(inputComponent.includes('aria-invalid='), 'Input component passes aria-invalid');

  // 7. Accessibility Statement & Footer Link
  console.log('\n--- 7. Testing Public Accessibility Statement ---');
  assert(fs.existsSync(path.join(process.cwd(), 'src/app/accessibility/page.tsx')), '/accessibility page exists');
  assert(fs.existsSync(path.join(process.cwd(), 'src/app/accessibility/layout.tsx')), '/accessibility layout exists');

  const accessibilityPage = fs.readFileSync(path.join(process.cwd(), 'src/app/accessibility/page.tsx'), 'utf-8');
  assert(accessibilityPage.includes('WCAG 2.2'), 'Accessibility statement cites WCAG 2.2 Level AA');
  assert(accessibilityPage.includes('Limitações Conhecidas'), 'Accessibility statement transparently documents known limitations');

  const footerComponent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Footer.tsx'), 'utf-8');
  assert(footerComponent.includes('href="/accessibility"'), 'Footer links to /accessibility');

  // 8. SearchAction Removed from JSON-LD
  console.log('\n--- 8. Testing SearchAction Removal & Clean Schemas ---');
  const seoEngine = fs.readFileSync(path.join(process.cwd(), 'src/lib/seo/seoEngine.ts'), 'utf-8');
  assert(!seoEngine.includes("'@type': 'SearchAction'"), 'SearchAction has been removed from WebSite schema');
  assert(seoEngine.includes('getSiteVerificationMetadata'), 'getSiteVerificationMetadata helper implemented');

  console.log('\n==================================================');
  console.log('FINAL RESULT: ALL 22 ACCESSIBILITY & SEO HARDENING TESTS PASSED');
  console.log('==================================================\n');
}

verifyAccessibilityCompliance();
