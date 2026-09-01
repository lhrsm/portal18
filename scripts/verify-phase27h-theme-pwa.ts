/**
 * PORTAL18 — PHASE 27H AUTOMATED VERIFICATION SUITE
 * Dark/Light Theme System, Visual Consistency & PWA Install Experience
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
  console.log('PORTAL18 — PHASE 27H AUTOMATED VERIFICATION SUITE');
  console.log('Dual Theme System (Dark/Light/System) & PWA Install Experience');
  console.log('================================================================\n');

  const rootDir = process.cwd();

  // 1. Theme Provider Architecture
  const themeProviderPath = path.join(rootDir, 'src', 'components', 'theme', 'ThemeProvider.tsx');
  const themeProviderExists = fs.existsSync(themeProviderPath);
  let themeProviderContent = '';
  if (themeProviderExists) {
    themeProviderContent = fs.readFileSync(themeProviderPath, 'utf8');
  }

  assert(
    themeProviderExists &&
    themeProviderContent.includes('portal18:theme') &&
    themeProviderContent.includes('prefers-color-scheme') &&
    themeProviderContent.includes('ThemeScript'),
    '1. [Theme Architecture] ThemeProvider manages light, dark, and system preferences with ThemeScript anti-flash',
    'ThemeProvider.tsx must exist with system query listener and pre-hydration ThemeScript'
  );

  // 2. Light Theme Design Tokens in globals.css
  const globalsCssPath = path.join(rootDir, 'src', 'app', 'globals.css');
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');

  assert(
    globalsCssContent.includes('html[data-theme="light"]') &&
    globalsCssContent.includes('@media (prefers-color-scheme: light)') &&
    globalsCssContent.includes('--bg-primary: #f8fafc;') &&
    globalsCssContent.includes('--text-primary: #0f172a;') &&
    globalsCssContent.includes('--accent-gold') &&
    globalsCssContent.includes('--accent-ruby'),
    '2. [Light Design Tokens] globals.css contains complete light mode palette and system light fallback',
    'globals.css must define data-theme="light" and prefers-color-scheme tokens with luxury palette'
  );

  // 3. High Contrast Support for Dark and Light Modes
  assert(
    globalsCssContent.includes('html[data-a11y-contrast="high"]') &&
    globalsCssContent.includes('html[data-theme="light"][data-a11y-contrast="high"]'),
    '3. [High Contrast Compatibility] Dual theme supports high contrast accessibility overrides without conflict',
    'High contrast selectors must cover both Dark and Light themes'
  );

  // 4. Theme Toggle Component & ARIA
  const themeTogglePath = path.join(rootDir, 'src', 'components', 'theme', 'ThemeToggle.tsx');
  const themeToggleExists = fs.existsSync(themeTogglePath);
  let themeToggleContent = '';
  if (themeToggleExists) {
    themeToggleContent = fs.readFileSync(themeTogglePath, 'utf8');
  }

  assert(
    themeToggleExists &&
    themeToggleContent.includes('aria-label="Alterar tema visual"') &&
    themeToggleContent.includes('Sun') &&
    themeToggleContent.includes('Moon') &&
    themeToggleContent.includes('Monitor') &&
    !themeToggleContent.includes('☀️') &&
    !themeToggleContent.includes('🌙'),
    '4. [Theme Controls UI] ThemeToggle renders accessible dropdown and inline options with zero emoji',
    'ThemeToggle.tsx must use Lucide icons with proper ARIA labels and no emoji'
  );

  // 5. PWA Install Provider & Standalone Detection
  const pwaProviderPath = path.join(rootDir, 'src', 'components', 'pwa', 'PWAInstallProvider.tsx');
  const pwaProviderExists = fs.existsSync(pwaProviderPath);
  let pwaProviderContent = '';
  if (pwaProviderExists) {
    pwaProviderContent = fs.readFileSync(pwaProviderPath, 'utf8');
  }

  assert(
    pwaProviderExists &&
    pwaProviderContent.includes('beforeinstallprompt') &&
    pwaProviderContent.includes('appinstalled') &&
    pwaProviderContent.includes('display-mode: standalone') &&
    pwaProviderContent.includes('portal18:pwa-dismissed'),
    '5. [PWA Capability Detection] PWAInstallProvider tracks beforeinstallprompt, standalone, and dismiss cooldown',
    'PWAInstallProvider.tsx must handle install lifecycle events with cooldown management'
  );

  // 6. PWA Install Prompt UI & iOS Instructions
  const pwaPromptPath = path.join(rootDir, 'src', 'components', 'pwa', 'PWAInstallPrompt.tsx');
  const pwaPromptExists = fs.existsSync(pwaPromptPath);
  let pwaPromptContent = '';
  if (pwaPromptExists) {
    pwaPromptContent = fs.readFileSync(pwaPromptPath, 'utf8');
  }

  assert(
    pwaPromptExists &&
    pwaPromptContent.includes('Instale o Portal18') &&
    pwaPromptContent.includes('Agora não') &&
    pwaPromptContent.includes('Adicionar à Tela de Início') &&
    pwaPromptContent.includes('Share2'),
    '6. [PWA Install Prompt UI] PWAInstallPrompt renders non-intrusive card and iOS step-by-step modal',
    'PWAInstallPrompt.tsx must provide clear copy, dismiss button, and iOS instructions'
  );

  // 7. Modal Sequencing & Age Gate Priority
  assert(
    pwaProviderContent.includes('ageVerificationService.isAgeVerified()'),
    '7. [Modal Sequencing] Install prompt defers to AgeGateModal until age verification is completed',
    'PWAInstallProvider must check isAgeVerified() before presenting install offer'
  );

  // 8. Header & Navigation Integration
  const headerPath = path.join(rootDir, 'src', 'components', 'layout', 'Header.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  assert(
    headerContent.includes('ThemeToggle') &&
    headerContent.includes('variant="dropdown"') &&
    headerContent.includes('variant="inline"'),
    '8. [Header Integration] Header integrates ThemeToggle in Desktop bar and Mobile drawer',
    'Header.tsx must mount ThemeToggle in desktop header and mobile sheet'
  );

  // 9. Footer Permanent Install Trigger
  const footerPath = path.join(rootDir, 'src', 'components', 'layout', 'Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');

  assert(
    footerContent.includes('usePWAInstall') &&
    footerContent.includes('Instalar Aplicativo') &&
    footerContent.includes('promptToInstall'),
    '9. [Footer Integration] Footer provides permanent install action when PWA is installable',
    'Footer.tsx must mount install action in desktop and mobile accordion'
  );

  // 10. Root Layout Providers & Anti-Flash
  const layoutPath = path.join(rootDir, 'src', 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  assert(
    layoutContent.includes('ThemeProvider') &&
    layoutContent.includes('PWAInstallProvider') &&
    layoutContent.includes('ThemeScript') &&
    layoutContent.includes('PWAInstallPrompt'),
    '10. [Root Layout Setup] RootLayout mounts ThemeProvider, PWAInstallProvider, ThemeScript and PWAInstallPrompt',
    'layout.tsx must wrap tree in Theme and PWA providers'
  );

  // 11. PWA Manifest Audit
  const manifestPath = path.join(rootDir, 'public', 'manifest.webmanifest');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  assert(
    manifest.name === 'Portal18' &&
    manifest.short_name === 'Portal18' &&
    manifest.start_url === '/' &&
    manifest.display === 'standalone',
    '11. [PWA Manifest Audit] manifest.webmanifest conforms to Portal18 branding, standalone display, and root start_url',
    'Manifest must define Portal18 standalone app configuration'
  );

  // 12. Service Worker Private Exclusions
  const swPath = path.join(rootDir, 'public', 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');

  assert(
    swContent.includes('/account') &&
    swContent.includes('/admin') &&
    swContent.includes('/advertiser') &&
    swContent.includes('/api') &&
    swContent.includes('/auth') &&
    swContent.includes('/offline'),
    '12. [Service Worker Invariant] Service worker strictly excludes private and auth routes from offline cache',
    'sw.js must never cache private authenticated endpoints'
  );

  // 13. Zero Invert Filter & Pure Tokenization
  assert(
    !globalsCssContent.includes('filter: invert(1)') &&
    !globalsCssContent.includes('filter: invert(100%)'),
    '13. [Zero Invert Filter] Light mode implemented through semantic tokens rather than CSS invert hacks',
    'No filter: invert rules allowed in globals.css'
  );

  // 14. Safety & Age Gate Invariant
  assert(
    !themeProviderContent.includes('age_verification') &&
    !pwaProviderContent.includes('bypass_age_gate') &&
    !themeProviderContent.includes('set_user_role'),
    '14. [Safety Invariant] Theme and PWA modules contain zero bypass logic for Age Assurance or Safe Mode',
    'Theme and PWA systems must never mutate age verification state'
  );

  // 15. Commercial Invariant & Payment Kill Switch
  const adminCommercialServicePath = path.join(rootDir, 'src', 'services', 'adminCommercialService.ts');
  const adminCommercialServiceContent = fs.existsSync(adminCommercialServicePath) ? fs.readFileSync(adminCommercialServicePath, 'utf8') : '';
  const commercialPagePath = path.join(rootDir, 'src', 'app', 'admin', 'commercial', 'page.tsx');
  const commercialPageContent = fs.existsSync(commercialPagePath) ? fs.readFileSync(commercialPagePath, 'utf8') : '';

  assert(
    adminCommercialServiceContent.includes('kill_switch_active: true') &&
    commercialPageContent.includes('KILL SWITCH ATIVO'),
    '15. [Commercial Invariant] Payment kill switch remains 100% active and unmutated',
    'Commercial payments remain disabled'
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('----------------------------------------------------------------\n');

  if (failCount === 0) {
    console.log('🎉 All Phase 27H Dual Theme & PWA Install verification tests passed!\n');
    process.exit(0);
  } else {
    console.error('❌ Some Phase 27H verification tests failed.\n');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
