/**
 * PORTAL18 — PHASE 27H.1 AUTOMATED VERIFICATION SUITE
 * Header & Footer Theme Contrast Refinement & Brand Dark Surfaces
 */

import fs from 'fs';
import path from 'path';

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
  console.log('PORTAL18 — PHASE 27H.1 AUTOMATED VERIFICATION SUITE');
  console.log('Header & Footer Theme Contrast Refinement');
  console.log('================================================================\n');

  const rootDir = process.cwd();
  const globalsCssPath = path.join(rootDir, 'src', 'app', 'globals.css');
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');

  // 1. Brand Dark Surface Tokens in :root
  assert(
    globalsCssContent.includes('--brand-surface: #0a0c10;') &&
    globalsCssContent.includes('--brand-surface-glass: rgba(10, 12, 16, 0.92);') &&
    globalsCssContent.includes('--brand-text-primary: #f8fafc;') &&
    globalsCssContent.includes('--brand-text-secondary: #cbd5e1;') &&
    globalsCssContent.includes('--brand-text-muted: #94a3b8;') &&
    globalsCssContent.includes('--brand-link: #e2e8f0;') &&
    globalsCssContent.includes('--brand-link-hover: #ffffff;'),
    '1. [Brand Surface Tokens] globals.css defines dedicated Brand Dark Surface tokens in :root',
    'Missing brand surface token definitions in :root'
  );

  // 2. Header Surface & Navigation Link Contrast
  assert(
    globalsCssContent.includes('background: var(--brand-surface-glass);') &&
    globalsCssContent.includes('color: var(--brand-link);') &&
    globalsCssContent.includes('color: var(--brand-link-hover);'),
    '2. [Header Link Contrast] .header and .nav-link use brand tokens with bright hover states',
    '.header and .nav-link must use --brand-surface-glass and --brand-link tokens'
  );

  // 3. Header Action Buttons
  assert(
    globalsCssContent.includes('.header-btn-ghost') &&
    globalsCssContent.includes('.header-btn-secondary'),
    '3. [Header Action Buttons] Header defines dedicated high-contrast action buttons (.header-btn-*)',
    'Missing .header-btn-ghost and .header-btn-secondary in globals.css'
  );

  // 4. Header Component Implementation
  const headerPath = path.join(rootDir, 'src', 'components', 'layout', 'Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  assert(
    headerContent.includes('header-btn-ghost') &&
    headerContent.includes('header-btn-secondary') &&
    headerContent.includes('btn-mobile-toggle') &&
    headerContent.includes('ThemeToggle'),
    '4. [Header Component] Header.tsx implements header-btn classes and accessible theme toggle',
    'Header.tsx must mount header-btn classes and ThemeToggle'
  );

  // 5. Footer Surface & Column Heading Contrast
  assert(
    globalsCssContent.includes('.footer {') &&
    globalsCssContent.includes('.footer-heading {') &&
    globalsCssContent.includes('color: var(--brand-text-primary);'),
    '5. [Footer Heading Contrast] Footer column headings use --brand-text-primary for high contrast',
    '.footer-heading must use --brand-text-primary'
  );

  // 6. Footer Navigation Links Contrast & Hover
  assert(
    globalsCssContent.includes('.footer-link {') &&
    globalsCssContent.includes('color: var(--brand-link);') &&
    globalsCssContent.includes('color: var(--brand-link-hover);') &&
    globalsCssContent.includes('transform: translateX(2px);'),
    '6. [Footer Link Contrast] Footer links use --brand-link with translateX hover animation',
    '.footer-link must use --brand-link and --brand-link-hover'
  );

  // 7. Footer Tagline and Compliance Badge
  assert(
    globalsCssContent.includes('.footer-tagline {') &&
    globalsCssContent.includes('.footer-compliance-badge {') &&
    globalsCssContent.includes('color: var(--brand-text-secondary);'),
    '7. [Footer Secondary Text] Tagline and compliance badge use --brand-text-secondary',
    'Footer secondary text must use --brand-text-secondary'
  );

  // 8. Footer Bottom Bar & Mobile Accordions
  assert(
    globalsCssContent.includes('.footer-bottom-links a {') &&
    globalsCssContent.includes('.footer-accordion-header {') &&
    globalsCssContent.includes('color: var(--brand-text-primary);'),
    '8. [Footer Bottom & Accordion] Bottom bar and mobile accordion headers use brand surface tokens',
    'Footer bottom and accordions must use brand surface tokens'
  );

  // 9. High Contrast Overrides for Brand Surfaces
  assert(
    globalsCssContent.includes('--brand-text-primary: #ffffff !important;') &&
    globalsCssContent.includes('--brand-link-hover: #fbbf24 !important;') &&
    globalsCssContent.includes('--brand-border: #94a3b8 !important;'),
    '9. [High Contrast Compatibility] Accessibility high contrast mode overrides brand tokens to maximum contrast',
    'High contrast selectors must boost brand surface tokens'
  );

  // 10. Reduced Motion Respect
  assert(
    globalsCssContent.includes('@media (prefers-reduced-motion: reduce)') &&
    globalsCssContent.includes('html[data-a11y-motion="reduced"] .footer-link:hover {') &&
    globalsCssContent.includes('transform: none !important;'),
    '10. [Reduced Motion Support] Footer link hover transform is disabled when reduced motion is preferred',
    'Reduced motion rules must disable footer link translate'
  );

  // 11. Focus Visibility
  assert(
    globalsCssContent.includes('.nav-link:focus-visible {') &&
    globalsCssContent.includes('.footer-link:focus-visible {') &&
    globalsCssContent.includes('outline: 2px solid var(--accent-gold);'),
    '11. [Focus Visible Support] Keyboard navigation shows visible gold outline on header and footer links',
    'Focus visible rules must be present for nav and footer links'
  );

  // 12. ThemeToggle Brand Contrast
  const themeTogglePath = path.join(rootDir, 'src', 'components', 'theme', 'ThemeToggle.tsx');
  const themeToggleContent = fs.readFileSync(themeTogglePath, 'utf8');

  assert(
    themeToggleContent.includes('var(--brand-text-primary)') &&
    themeToggleContent.includes('var(--brand-border-subtle)'),
    '12. [Theme Toggle Contrast] ThemeToggle uses brand surface tokens for crystal-clear icon rendering',
    'ThemeToggle button must use brand surface tokens'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 27H.1 Header & Footer Contrast verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 27H.1 verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
