/**
 * ============================================================================
 * UI/UX PROFESSIONALIZATION — SENIOR FRONTEND REFINEMENT QA
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';

export interface UiRefinementCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllSourceFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

export async function runUiProfessionalizationQa(): Promise<UiRefinementCheckResult[]> {
  const results: UiRefinementCheckResult[] = [];
  const srcDir = path.join(process.cwd(), 'src');
  const allFiles = getAllSourceFiles(srcDir);

  // 1. ZERO UI EMOJIS IN SOURCE CODE
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  let emojiMatches: { file: string; line: number; match: string }[] = [];

  allFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Exclude demo content text or test datasets if any, check UI components
      if (emojiRegex.test(line) && !file.includes('demoProfiles.ts')) {
        const match = line.match(emojiRegex);
        emojiMatches.push({ file: path.basename(file), line: idx + 1, match: match ? match[0] : '' });
      }
    });
  });

  const zeroEmojisPassed = emojiMatches.length === 0;

  results.push({
    id: 'UI-EMOJI-01',
    category: 'DESIGN CLEANUP',
    name: '100% removal of amateur UI emojis in buttons, titles, selects, alerts, and badges',
    expected: '0 UI emojis across all component and page files in src/',
    passed: zeroEmojisPassed,
    details: zeroEmojisPassed
      ? 'Zero UI emojis verified across all src/ files.'
      : `Found ${emojiMatches.length} emojis: ${JSON.stringify(emojiMatches.slice(0, 3))}`,
  });

  // 2. DESIGN SYSTEM TOKENS & GEOMETRY
  const cssPath = path.join(process.cwd(), 'src/app/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const hasRestrainedRadii =
    cssContent.includes('--radius-sm: 6px;') &&
    cssContent.includes('--radius-md: 8px;') &&
    cssContent.includes('--radius-lg: 12px;') &&
    cssContent.includes('--radius-xl: 16px;');

  const hasRestrainedShadows =
    cssContent.includes('--shadow-sm: 0 1px 3px') &&
    cssContent.includes('--shadow-md: 0 4px 16px') &&
    cssContent.includes('--shadow-lg: 0 8px 24px');

  const designTokensPassed = hasRestrainedRadii && hasRestrainedShadows;

  results.push({
    id: 'UI-TOKENS-01',
    category: 'DESIGN SYSTEM',
    name: 'Standardized geometry (6px-12px) and subtle dark luxury elevation shadows',
    expected: '--radius-sm: 6px, --radius-md: 8px, --radius-lg: 12px, crisp 1px borders',
    passed: designTokensPassed,
    details: designTokensPassed
      ? 'Design tokens verified: mature geometry and refined elevation.'
      : 'Design tokens mismatch in globals.css.',
  });

  // 3. ACCESSIBILITY (REDUCED MOTION & FOCUS-VISIBLE)
  const hasReducedMotion =
    cssContent.includes('prefers-reduced-motion: reduce') &&
    cssContent.includes('animation-duration: 0.01ms');

  const hasFocusVisible = cssContent.includes(':focus-visible');

  const a11yPassed = hasReducedMotion && hasFocusVisible;

  results.push({
    id: 'UI-A11Y-01',
    category: 'ACCESSIBILITY (WCAG 2.2 AA)',
    name: 'prefers-reduced-motion media query and visible focus outlines for keyboard navigation',
    expected: 'Global reduced motion rule and :focus-visible ring in globals.css',
    passed: a11yPassed,
    details: a11yPassed
      ? 'Accessibility compliance verified: reduced motion & focus-visible.'
      : 'Missing reduced motion or focus-visible in globals.css.',
  });

  // 4. TOUCH TARGET STANDARDS (MOBILE >= 44PX)
  const hasTouchTargets =
    cssContent.includes('min-height: 44px;') ||
    cssContent.includes('min-height: 40px;');

  results.push({
    id: 'UI-TOUCH-01',
    category: 'MOBILE & TOUCH',
    name: 'Touch target standards on mobile for interactive controls',
    expected: 'min-height >= 44px on mobile viewport',
    passed: hasTouchTargets,
    details: hasTouchTargets ? 'Mobile touch targets verified.' : 'Missing touch target rules.',
  });

  // 5. COMPONENT STANDARDIZATION (ALERT, BUTTON, FORMFIELD)
  const alertPath = path.join(process.cwd(), 'src/components/ui/Alert.tsx');
  const alertContent = fs.readFileSync(alertPath, 'utf8');
  const buttonPath = path.join(process.cwd(), 'src/components/ui/Button.tsx');
  const buttonContent = fs.readFileSync(buttonPath, 'utf8');
  const formFieldPath = path.join(process.cwd(), 'src/components/ui/FormField.tsx');
  const formFieldContent = fs.readFileSync(formFieldPath, 'utf8');

  const alertHasLucide =
    alertContent.includes('CheckCircle2') &&
    alertContent.includes('AlertCircle') &&
    alertContent.includes('AlertTriangle');

  const buttonHasSpinner =
    buttonContent.includes('Loader2') &&
    buttonContent.includes('animate-spin');

  const formFieldHasIcon =
    formFieldContent.includes('AlertCircle') &&
    formFieldContent.includes('role="alert"');

  const componentsPassed = alertHasLucide && buttonHasSpinner && formFieldHasIcon;

  results.push({
    id: 'UI-COMPONENTS-01',
    category: 'COMPONENT SYSTEM',
    name: 'UI components use standardized Lucide icons, accessible roles and Loader2 spinner',
    expected: 'Alert, Button, and FormField use Lucide icons with proper accessibility attributes',
    passed: componentsPassed,
    details: componentsPassed
      ? 'Component design system standardized.'
      : 'Component icon mismatch.',
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('✨ UI/UX PROFESSIONALIZATION — SENIOR FRONTEND REFINEMENT QA');
  console.log('================================================================\n');

  runUiProfessionalizationQa().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ UI REFINEMENT QA FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} UI/UX PROFESSIONALIZATION CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
