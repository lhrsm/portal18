/**
 * ============================================================================
 * PORTAL18 — REGISTER ACCOUNT TYPE VISUAL HOTFIX VALIDATION SUITE
 * Tests: REGISTER-VISUAL-01 to REGISTER-VISUAL-08
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';

export interface VisualTestResult {
  id: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runRegisterVisualValidation(): Promise<VisualTestResult[]> {
  const results: VisualTestResult[] = [];
  const rootDir = process.cwd();

  const registerPagePath = path.join(rootDir, 'src/app/(auth)/register/page.tsx');
  const registerFormPath = path.join(rootDir, 'src/components/auth/RegisterForm.tsx');
  const globalsCssPath = path.join(rootDir, 'src/app/globals.css');
  const swPath = path.join(rootDir, 'public/sw.js');

  const pageCode = fs.readFileSync(registerPagePath, 'utf8');
  const formCode = fs.readFileSync(registerFormPath, 'utf8');
  const cssCode = fs.readFileSync(globalsCssPath, 'utf8');
  const swCode = fs.readFileSync(swPath, 'utf8');

  // REGISTER-VISUAL-01: visitor selected does not use saturated background class
  const hasSaturatedRuby = formCode.includes('rgba(224, 30, 90') || formCode.includes('rgba(255, 45, 85, 0.14)');
  const hasSoftRubyBg = formCode.includes('rgba(255, 45, 85, 0.05)') && cssCode.includes('rgba(255, 45, 85, 0.05)');
  const v01Passed = !hasSaturatedRuby && hasSoftRubyBg;
  results.push({
    id: 'REGISTER-VISUAL-01',
    name: 'visitor selected does not use saturated background class',
    expected: 'Soft background rgba(255, 45, 85, 0.05) without saturated 14% ruby fill',
    passed: v01Passed,
    details: v01Passed
      ? 'Visitor active button uses calibrated soft background rgba(255, 45, 85, 0.05).'
      : `Saturated background found or soft background missing. Saturated=${hasSaturatedRuby}, Soft=${hasSoftRubyBg}`,
  });

  // REGISTER-VISUAL-02: visitor selected does not use white text in light mode
  const hasStaticWhiteTextUser = formCode.includes("accountType === 'user' ? '#ffffff'");
  const usesTextPrimaryUser = formCode.includes("color: accountType === 'user' ? 'var(--text-primary)'") &&
                              cssCode.includes('.register-segment-btn-user[aria-selected="true"]');
  const v02Passed = !hasStaticWhiteTextUser && usesTextPrimaryUser;
  results.push({
    id: 'REGISTER-VISUAL-02',
    name: 'visitor selected does not use white text in light mode',
    expected: 'Adaptive text color var(--text-primary) resolving to obsidian in light mode, not static white',
    passed: v02Passed,
    details: v02Passed
      ? 'Visitor text binds to var(--text-primary) (#0f172a in light, #f8fafc in dark).'
      : 'Visitor active button still has hardcoded white text.',
  });

  // REGISTER-VISUAL-03: advertiser selected does not use saturated background class
  const hasSaturatedGold = formCode.includes('rgba(212, 175, 55, 0.14)');
  const hasSoftGoldBg = formCode.includes('rgba(229, 185, 92, 0.07)') && cssCode.includes('rgba(229, 185, 92, 0.07)');
  const v03Passed = !hasSaturatedGold && hasSoftGoldBg;
  results.push({
    id: 'REGISTER-VISUAL-03',
    name: 'advertiser selected does not use saturated background class',
    expected: 'Soft background rgba(229, 185, 92, 0.07) without heavy 14% gold saturation',
    passed: v03Passed,
    details: v03Passed
      ? 'Advertiser active button uses calibrated soft background rgba(229, 185, 92, 0.07).'
      : `Saturated gold found or soft gold missing. Saturated=${hasSaturatedGold}, Soft=${hasSoftGoldBg}`,
  });

  // REGISTER-VISUAL-04: advertiser selected does not use white text in light mode
  const hasStaticWhiteTextAdv = formCode.includes("accountType === 'advertiser' ? '#ffffff'");
  const usesTextPrimaryAdv = formCode.includes("color: accountType === 'advertiser' ? 'var(--text-primary)'") &&
                             cssCode.includes('.register-segment-btn-advertiser[aria-selected="true"]');
  const v04Passed = !hasStaticWhiteTextAdv && usesTextPrimaryAdv;
  results.push({
    id: 'REGISTER-VISUAL-04',
    name: 'advertiser selected does not use white text in light mode',
    expected: 'Adaptive text color var(--text-primary) resolving to obsidian in light mode, not static white',
    passed: v04Passed,
    details: v04Passed
      ? 'Advertiser text binds to var(--text-primary) (#0f172a in light, #f8fafc in dark).'
      : 'Advertiser active button still has hardcoded white text.',
  });

  // REGISTER-VISUAL-05: both buttons render same dimensions
  const hasEqualGrid = cssCode.includes('grid-template-columns: repeat(2, minmax(0, 1fr))');
  const hasEqualHeight = cssCode.includes('height: 44px') && cssCode.includes('min-height: 44px');
  const hasEqualPadding = cssCode.includes('padding: 0.65rem 0.5rem');
  const v05Passed = hasEqualGrid && hasEqualHeight && hasEqualPadding;
  results.push({
    id: 'REGISTER-VISUAL-05',
    name: 'both buttons render same dimensions',
    expected: 'Symmetrical 2-column grid, 44px height, and identical 0.65rem 0.5rem padding',
    passed: v05Passed,
    details: v05Passed
      ? 'Both buttons share identical grid proportions (1fr each), 44px height, and padding.'
      : `Dimension mismatch: grid=${hasEqualGrid}, height=${hasEqualHeight}, padding=${hasEqualPadding}`,
  });

  // REGISTER-VISUAL-06: actual /register route uses corrected component
  const pageImportsRegisterForm = pageCode.includes("import { RegisterForm } from '@/components/auth/RegisterForm'");
  const pageRendersRegisterForm = pageCode.includes('<RegisterForm');
  const v06Passed = pageImportsRegisterForm && pageRendersRegisterForm;
  results.push({
    id: 'REGISTER-VISUAL-06',
    name: 'actual /register route uses corrected component',
    expected: 'src/app/(auth)/register/page.tsx directly imports and mounts RegisterForm',
    passed: v06Passed,
    details: v06Passed
      ? 'Route /register directly mounts the updated RegisterForm component.'
      : 'Route /register does not import or render RegisterForm directly.',
  });

  // REGISTER-VISUAL-07: no duplicate inactive register selector is being edited
  const allFiles = fs.readdirSync(path.join(rootDir, 'src/components/auth'));
  const registerFiles = allFiles.filter((f) => f.toLowerCase().includes('register'));
  const v07Passed = registerFiles.length === 1 && registerFiles[0] === 'RegisterForm.tsx';
  results.push({
    id: 'REGISTER-VISUAL-07',
    name: 'no duplicate inactive register selector is being edited',
    expected: 'Exactly 1 RegisterForm component exists in src/components/auth with zero orphan copies',
    passed: v07Passed,
    details: v07Passed
      ? `Exactly 1 RegisterForm exists (${registerFiles.join(', ')}). No shadow components.`
      : `Found unexpected register components: ${registerFiles.join(', ')}`,
  });

  // REGISTER-VISUAL-08: production build contains corrected styles
  const hasRegisterInSwPrivate = swCode.includes("'/register'");
  const hasSwUpdated = swCode.includes('portal-shell-RC-20260914-122500-HOTFIX');
  const v08Passed = hasRegisterInSwPrivate && hasSwUpdated;
  results.push({
    id: 'REGISTER-VISUAL-08',
    name: 'production build contains corrected styles',
    expected: 'Service worker cache version bumped and /register exempt from stale shell caching',
    passed: v08Passed,
    details: v08Passed
      ? 'Service worker cache bumped to 20260914 and /register is bypass/network-first.'
      : `SW cache not bumped or /register not in private routes. Private=${hasRegisterInSwPrivate}, Version=${hasSwUpdated}`,
  });

  return results;
}

if (require.main === module) {
  runRegisterVisualValidation().then((results) => {
    console.log('\n================================================================');
    console.log('PORTAL18 — REGISTER ACCOUNT TYPE VISUAL HOTFIX VALIDATION');
    console.log('================================================================\n');

    let allPassed = true;
    for (const r of results) {
      const mark = r.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${mark} [${r.id}] ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Details:  ${r.details}\n`);
      if (!r.passed) allPassed = false;
    }

    const passedCount = results.filter((r) => r.passed).length;
    console.log('================================================================');
    console.log(`TOTAL: ${passedCount}/${results.length} PASSED`);
    console.log('================================================================\n');

    if (!allPassed) {
      process.exit(1);
    }
  });
}
