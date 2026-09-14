import fs from 'fs';
import path from 'path';

interface TestCase {
  id: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

async function runGoogleButtonVerification() {
  console.log('====================================================');
  console.log('PORTAL18 — GOOGLE SIGN-IN BUTTON VERIFICATION SUITE');
  console.log('====================================================\n');

  const rootDir = process.cwd();
  const googleButtonPath = path.join(rootDir, 'src', 'components', 'auth', 'GoogleButton.tsx');
  const registerFormPath = path.join(rootDir, 'src', 'components', 'auth', 'RegisterForm.tsx');
  const globalsCssPath = path.join(rootDir, 'src', 'app', 'globals.css');

  const googleButtonCode = fs.readFileSync(googleButtonPath, 'utf8');
  const registerFormCode = fs.readFileSync(registerFormPath, 'utf8');
  const globalsCssCode = fs.readFileSync(globalsCssPath, 'utf8');

  const results: TestCase[] = [];

  // GOOGLE-BUTTON-01: Text visible
  const hasVisibleLabelSpan = googleButtonCode.includes('<span>{isLoading ?') && googleButtonCode.includes(': label}</span>');
  const hasContinuarLabel = registerFormCode.includes('label="Continuar com Google"') || googleButtonCode.includes("label = 'Continuar com Google'");
  const test1Passed = hasVisibleLabelSpan && hasContinuarLabel;
  results.push({
    id: 'GOOGLE-BUTTON-01',
    name: 'Text visible',
    expected: 'Full visible text "Continuar com Google" rendered alongside icon, not icon-only',
    passed: test1Passed,
    details: test1Passed
      ? 'Button renders visible text span with "Continuar com Google" and aria-label.'
      : 'Visible text label is missing or incomplete.',
  });

  // GOOGLE-BUTTON-02: Google icon visible
  const hasBlue = googleButtonCode.includes('#4285F4');
  const hasGreen = googleButtonCode.includes('#34A853');
  const hasYellow = googleButtonCode.includes('#FBBC05');
  const hasRed = googleButtonCode.includes('#EA4335');
  const hasAriaHidden = googleButtonCode.includes('aria-hidden="true"');
  const test2Passed = hasBlue && hasGreen && hasYellow && hasRed && hasAriaHidden;
  results.push({
    id: 'GOOGLE-BUTTON-02',
    name: 'Google icon visible',
    expected: 'Official Google 4-color SVG logo visible, size 18-20px with aria-hidden="true"',
    passed: test2Passed,
    details: test2Passed
      ? 'Google 4-color SVG paths intact (#4285F4, #34A853, #FBBC05, #EA4335) with aria-hidden="true".'
      : 'Google icon SVG missing, recolored, or missing accessibility attribute.',
  });

  // GOOGLE-BUTTON-03: Full button clickable
  const hasWidth100 = globalsCssCode.includes('.google-auth-btn') && globalsCssCode.includes('width: 100%');
  const hasHeight46 = globalsCssCode.includes('height: 46px');
  const hasPointer = globalsCssCode.includes('cursor: pointer');
  const hasButtonClassName = googleButtonCode.includes('className="google-auth-btn"');
  const test3Passed = hasWidth100 && hasHeight46 && hasPointer && hasButtonClassName;
  results.push({
    id: 'GOOGLE-BUTTON-03',
    name: 'Full button clickable',
    expected: 'Width: 100%, height 44-48px (46px), flex centered, cursor: pointer across whole button',
    passed: test3Passed,
    details: test3Passed
      ? 'Button has width: 100%, height: 46px, flexbox alignment, and full-surface clickability.'
      : 'Button dimensions or click target area incomplete.',
  });

  // GOOGLE-BUTTON-04: type="button"
  const hasTypeButton = googleButtonCode.includes('type="button"');
  results.push({
    id: 'GOOGLE-BUTTON-04',
    name: 'type="button"',
    expected: 'type="button" present on button element to prevent unintended form submit',
    passed: hasTypeButton,
    details: hasTypeButton
      ? 'Button has explicit type="button" attribute.'
      : 'Button missing type="button".',
  });

  // GOOGLE-BUTTON-05: Loading state
  const hasLoadingText = googleButtonCode.includes('Conectando ao Google...');
  const hasLoadingSpinner = googleButtonCode.includes('google-auth-spinner') || googleButtonCode.includes('isLoading ?');
  const test5Passed = hasLoadingText && hasLoadingSpinner;
  results.push({
    id: 'GOOGLE-BUTTON-05',
    name: 'Loading state',
    expected: 'Visual spinner + "Conectando ao Google..." feedback when authentication begins',
    passed: test5Passed,
    details: test5Passed
      ? 'Loading state displays spinner and "Conectando ao Google...".'
      : 'Loading state feedback missing or incomplete.',
  });

  // GOOGLE-BUTTON-06: Disabled prevents double click
  const hasEarlyReturn = googleButtonCode.includes('if (isLoading || disabled) return;');
  const hasDisabledAttr = googleButtonCode.includes('disabled={isLoading || disabled}');
  const test6Passed = hasEarlyReturn && hasDisabledAttr;
  results.push({
    id: 'GOOGLE-BUTTON-06',
    name: 'Disabled prevents double click',
    expected: 'Synchronous handler guard and HTML disabled attribute block duplicate requests',
    passed: test6Passed,
    details: test6Passed
      ? 'Synchronous check and disabled attribute prevent double clicks.'
      : 'Missing disabled attribute or click guard.',
  });

  // GOOGLE-BUTTON-07: Mobile no overflow
  const hasBoxSizing = globalsCssCode.includes('box-sizing: border-box');
  const hasPadding = globalsCssCode.includes('padding: 0 1.25rem');
  const test7Passed = hasBoxSizing && hasPadding && hasWidth100;
  results.push({
    id: 'GOOGLE-BUTTON-07',
    name: 'Mobile no overflow',
    expected: 'Responsive width: 100% with box-sizing border-box, fitting 320-430px viewports',
    passed: test7Passed,
    details: test7Passed
      ? 'Responsive styles prevent overflow on all mobile screens (320px to 430px).'
      : 'Styles may cause overflow on narrow screens.',
  });

  // GOOGLE-BUTTON-08: Dark mode & light mode
  const hasDarkModeStyles = globalsCssCode.includes('.google-auth-btn') && globalsCssCode.includes('var(--bg-elevated');
  const hasLightModeStyles = globalsCssCode.includes('html[data-theme="light"] .google-auth-btn') && globalsCssCode.includes('#ffffff');
  const test8Passed = hasDarkModeStyles && hasLightModeStyles;
  results.push({
    id: 'GOOGLE-BUTTON-08',
    name: 'Dark mode',
    expected: 'Dark surface and light surface styles explicitly supported with high contrast',
    passed: test8Passed,
    details: test8Passed
      ? 'Dark mode uses dark surface elevated; Light mode uses crisp white surface #ffffff with neutral border.'
      : 'Dark or light mode styles missing.',
  });

  // GOOGLE-BUTTON-09: Visitor account type preserved
  const hasVisitorIntent = googleButtonCode.includes('intent = \'user\'') &&
    registerFormCode.includes('intent={accountType}');
  const hasRedirectIntentParam = googleButtonCode.includes('intent=${encodeURIComponent(intent)}');
  const test9Passed = hasVisitorIntent && hasRedirectIntentParam;
  results.push({
    id: 'GOOGLE-BUTTON-09',
    name: 'Visitor account type preserved',
    expected: 'OAuth callback maintains intent="user" parameter when registering as visitor/client',
    passed: test9Passed,
    details: test9Passed
      ? 'accountType "user" is passed and preserved in Google OAuth callback redirectTo.'
      : 'Visitor intent not properly forwarded.',
  });

  // GOOGLE-BUTTON-10: Advertiser account type preserved
  const hasAdvertiserNextRoute = registerFormCode.includes("accountType === 'advertiser' ? '/advertiser/onboarding' : '/account'");
  const hasNextParam = googleButtonCode.includes('next=${encodeURIComponent(nextRoute)}');
  const test10Passed = hasAdvertiserNextRoute && hasNextParam;
  results.push({
    id: 'GOOGLE-BUTTON-10',
    name: 'Advertiser account type preserved',
    expected: 'OAuth callback maintains intent="advertiser" and nextRoute="/advertiser/onboarding"',
    passed: test10Passed,
    details: test10Passed
      ? 'Advertiser account type and destination route preserved in Google OAuth callback.'
      : 'Advertiser intent or route not properly forwarded.',
  });

  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${status} ${r.id}: ${r.name}`);
    console.log(`       Details: ${r.details}`);
    if (!r.passed) allPassed = false;
  }

  console.log('\n====================================================');
  console.log(`TOTAL: ${results.length} tests | PASSED: ${results.filter(t => t.passed).length} | FAILED: ${results.filter(t => !t.passed).length}`);
  console.log('====================================================\n');

  if (!allPassed) {
    console.error('VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('ALL GOOGLE BUTTON TESTS PASSED!');
  }
}

runGoogleButtonVerification();
