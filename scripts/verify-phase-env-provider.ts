/**
 * ============================================================================
 * PHASE ENV-PROVIDER: PRODUCTION AGE PROVIDER RESOLUTION VERIFICATION SUITE
 * Validates ENV-PROVIDER-01 to ENV-PROVIDER-10
 * ============================================================================
 */

import { AgeVerificationFactory } from '../src/services/ageVerification/factory';
import { DiditAgeVerificationProvider } from '../src/services/ageVerification/providers/diditAgeProvider';
import { UnconfiguredAgeVerificationProvider } from '../src/services/ageVerification/providers/unconfiguredProvider';
import { serverEnvSchema, publicEnvSchema, serverEnv, getServerEnv, env } from '../src/config/env';

export interface TestResult {
  id: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runEnvProviderTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const originalEnv = { ...process.env };

  try {
    // ========================================================================
    // ENV-PROVIDER-01: process.env AGE_VERIFICATION_PROVIDER=didit_age resolves Didit provider
    // ========================================================================
    process.env.AGE_VERIFICATION_PROVIDER = 'didit_age';
    AgeVerificationFactory.reset();
    const provider01 = AgeVerificationFactory.getProvider();
    const p01Passed = provider01 instanceof DiditAgeVerificationProvider && provider01.name === 'didit_age';
    results.push({
      id: 'ENV-PROVIDER-01',
      name: 'process.env AGE_VERIFICATION_PROVIDER=didit_age resolves Didit provider',
      expected: 'AgeVerificationFactory instantiates DiditAgeVerificationProvider with name "didit_age"',
      passed: p01Passed,
      details: p01Passed
        ? 'Successfully resolved DiditAgeVerificationProvider from process.env.'
        : `Failed: got ${provider01?.name} (${provider01?.constructor.name})`,
    });

    // ========================================================================
    // ENV-PROVIDER-02: validated server env exposes AGE_VERIFICATION_PROVIDER
    // ========================================================================
    process.env.AGE_VERIFICATION_PROVIDER = 'didit_age';
    const parsedServerEnv = getServerEnv();
    const schemaShapeHasKey = 'AGE_VERIFICATION_PROVIDER' in serverEnvSchema.shape;
    const serverEnvExposed = serverEnv.AGE_VERIFICATION_PROVIDER === 'didit_age';
    const parsedExposed = parsedServerEnv.AGE_VERIFICATION_PROVIDER === 'didit_age';
    const envHelperExposed = env.ageVerificationProvider === 'didit_age';
    const p02Passed = schemaShapeHasKey && serverEnvExposed && parsedExposed && envHelperExposed;
    results.push({
      id: 'ENV-PROVIDER-02',
      name: 'validated server env exposes AGE_VERIFICATION_PROVIDER',
      expected: 'serverEnvSchema, serverEnv proxy, getServerEnv(), and env.ageVerificationProvider expose AGE_VERIFICATION_PROVIDER',
      passed: p02Passed,
      details: p02Passed
        ? 'Validated server env exposes AGE_VERIFICATION_PROVIDER across all server configuration layers.'
        : `Failed: schema=${schemaShapeHasKey}, serverEnv=${serverEnvExposed}, parsed=${parsedExposed}, helper=${envHelperExposed}`,
    });

    // ========================================================================
    // ENV-PROVIDER-03: quoted "didit_age" resolves Didit provider
    // ========================================================================
    process.env.AGE_VERIFICATION_PROVIDER = '"didit_age"';
    AgeVerificationFactory.reset();
    const provider03Double = AgeVerificationFactory.getProvider();
    process.env.AGE_VERIFICATION_PROVIDER = "'didit_age'";
    AgeVerificationFactory.reset();
    const provider03Single = AgeVerificationFactory.getProvider();
    const p03Passed =
      provider03Double instanceof DiditAgeVerificationProvider &&
      provider03Single instanceof DiditAgeVerificationProvider;
    results.push({
      id: 'ENV-PROVIDER-03',
      name: 'quoted "didit_age" resolves Didit provider',
      expected: 'Accidental double or single quotes are sanitized and resolve to DiditAgeVerificationProvider',
      passed: p03Passed,
      details: p03Passed
        ? 'Successfully resolved Didit provider with both double and single quotes.'
        : 'Failed to sanitize surrounding quotes.',
    });

    // ========================================================================
    // ENV-PROVIDER-04: whitespace around didit_age resolves Didit provider
    // ========================================================================
    process.env.AGE_VERIFICATION_PROVIDER = '  didit_age  \n';
    AgeVerificationFactory.reset();
    const provider04 = AgeVerificationFactory.getProvider();
    const p04Passed = provider04 instanceof DiditAgeVerificationProvider && provider04.name === 'didit_age';
    results.push({
      id: 'ENV-PROVIDER-04',
      name: 'whitespace around didit_age resolves Didit provider',
      expected: 'Leading/trailing whitespace and newlines are sanitized and resolve to DiditAgeVerificationProvider',
      passed: p04Passed,
      details: p04Passed
        ? 'Successfully trimmed whitespace and resolved DiditAgeVerificationProvider.'
        : 'Failed to resolve with whitespace padding.',
    });

    // ========================================================================
    // ENV-PROVIDER-05: missing provider resolves unconfigured fail closed
    // ========================================================================
    delete process.env.AGE_VERIFICATION_PROVIDER;
    AgeVerificationFactory.reset();
    const provider05 = AgeVerificationFactory.getProvider();
    const p05Passed = provider05 instanceof UnconfiguredAgeVerificationProvider && provider05.name === 'unconfigured';
    results.push({
      id: 'ENV-PROVIDER-05',
      name: 'missing provider resolves unconfigured fail closed',
      expected: 'Missing/undefined AGE_VERIFICATION_PROVIDER resolves to UnconfiguredAgeVerificationProvider (fail closed)',
      passed: p05Passed,
      details: p05Passed
        ? 'Successfully failed closed to UnconfiguredAgeVerificationProvider when env is missing.'
        : `Failed: got ${provider05?.name}`,
    });

    // ========================================================================
    // ENV-PROVIDER-06: unknown provider resolves unconfigured fail closed
    // ========================================================================
    process.env.AGE_VERIFICATION_PROVIDER = 'unknown_random_vendor_xyz';
    AgeVerificationFactory.reset();
    const provider06 = AgeVerificationFactory.getProvider();
    const p06Passed = provider06 instanceof UnconfiguredAgeVerificationProvider && provider06.name === 'unconfigured';
    results.push({
      id: 'ENV-PROVIDER-06',
      name: 'unknown provider resolves unconfigured fail closed',
      expected: 'Unknown provider names resolve to UnconfiguredAgeVerificationProvider (fail closed)',
      passed: p06Passed,
      details: p06Passed
        ? 'Successfully failed closed to UnconfiguredAgeVerificationProvider for unrecognized vendor.'
        : `Failed: got ${provider06?.name}`,
    });

    // ========================================================================
    // ENV-PROVIDER-07: unconfigured provider cannot emit category SUCCESS
    // ========================================================================
    delete process.env.AGE_VERIFICATION_PROVIDER;
    AgeVerificationFactory.reset();
    const provider07 = AgeVerificationFactory.getProvider();
    const response07 = await provider07.initiateVerification({ returnUrl: '/perfil/test' });
    const p07CategorySafe = response07.diagnosticCategory !== 'SUCCESS' && response07.diagnosticCategory === 'AGE_PROVIDER_NOT_CONFIGURED';
    const p07RedirectSafe = response07.redirectUrl.includes('status=unavailable');
    const p07Passed = p07CategorySafe && p07RedirectSafe;
    results.push({
      id: 'ENV-PROVIDER-07',
      name: 'unconfigured provider cannot emit category SUCCESS',
      expected: 'diagnosticCategory is "AGE_PROVIDER_NOT_CONFIGURED" (never SUCCESS) and status=unavailable',
      passed: p07Passed,
      details: p07Passed
        ? `Unconfigured provider safely emits category=${response07.diagnosticCategory}.`
        : `Failed: diagnosticCategory=${response07.diagnosticCategory}`,
    });

    // ========================================================================
    // ENV-PROVIDER-08: Didit secrets remain server-only
    // ========================================================================
    const publicKeys = Object.keys(publicEnvSchema.shape);
    const serverKeys = Object.keys(serverEnvSchema.shape);
    const secretsInPublic = publicKeys.filter((k) =>
      ['DIDIT_API_KEY', 'DIDIT_AGE_WORKFLOW_ID', 'DIDIT_WEBHOOK_SECRET', 'AGE_VERIFICATION_PROVIDER'].includes(k)
    );
    const secretsInServer = ['DIDIT_API_KEY', 'DIDIT_AGE_WORKFLOW_ID', 'DIDIT_WEBHOOK_SECRET', 'AGE_VERIFICATION_PROVIDER'].every((k) =>
      serverKeys.includes(k)
    );
    const p08Passed = secretsInPublic.length === 0 && secretsInServer;
    results.push({
      id: 'ENV-PROVIDER-08',
      name: 'Didit secrets remain server-only',
      expected: 'No Didit secrets or provider selector in publicEnvSchema; all preserved in serverEnvSchema',
      passed: p08Passed,
      details: p08Passed
        ? 'All secrets strictly isolated in serverEnvSchema. Zero leak in publicEnvSchema.'
        : `Failed: leaks in public=${secretsInPublic.join(', ')}`,
    });

    // ========================================================================
    // ENV-PROVIDER-09: production does not require NEXT_PUBLIC_AGE_VERIFICATION_PROVIDER
    // ========================================================================
    const publicHasAge = 'NEXT_PUBLIC_AGE_VERIFICATION_PROVIDER' in publicEnvSchema.shape;
    const p09Passed = !publicHasAge;
    results.push({
      id: 'ENV-PROVIDER-09',
      name: 'production does not require NEXT_PUBLIC_AGE_VERIFICATION_PROVIDER',
      expected: 'NEXT_PUBLIC_AGE_VERIFICATION_PROVIDER is NOT required; provider selection is strictly server-side',
      passed: p09Passed,
      details: p09Passed
        ? 'Verified: public schema does not require NEXT_PUBLIC_AGE_VERIFICATION_PROVIDER.'
        : 'Failed: public schema exposes age verification provider.',
    });

    // ========================================================================
    // ENV-PROVIDER-10: production APP_ENV/NODE_ENV guards do not override configured didit_age
    // ========================================================================
    (process.env as any).NODE_ENV = 'production';
    process.env.APP_ENV = 'production';
    process.env.AGE_VERIFICATION_PROVIDER = 'didit_age';
    AgeVerificationFactory.reset();
    const provider10 = AgeVerificationFactory.getProvider();
    const p10DiditPassed = provider10 instanceof DiditAgeVerificationProvider && provider10.name === 'didit_age';

    // Verify mock_sandbox is blocked in production
    process.env.AGE_VERIFICATION_PROVIDER = 'mock_sandbox';
    AgeVerificationFactory.reset();
    const provider10Mock = AgeVerificationFactory.getProvider();
    const p10MockBlocked = provider10Mock instanceof UnconfiguredAgeVerificationProvider;

    const p10Passed = p10DiditPassed && p10MockBlocked;
    results.push({
      id: 'ENV-PROVIDER-10',
      name: 'production APP_ENV/NODE_ENV guards do not override configured didit_age',
      expected: 'didit_age resolves in production; mock_sandbox is blocked in production (fails closed)',
      passed: p10Passed,
      details: p10Passed
        ? 'Production allows didit_age and blocks mock_sandbox fail-closed.'
        : `Failed: didit=${p10DiditPassed}, mockBlocked=${p10MockBlocked}`,
    });

  } finally {
    // Restore original process.env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    AgeVerificationFactory.reset();
  }

  return results;
}

// Direct CLI Execution
if (require.main === module) {
  runEnvProviderTests()
    .then((results) => {
      console.log('\n==================================================');
      console.log('PORTAL18 - AGE PROVIDER ENV RESOLUTION TEST SUITE');
      console.log('==================================================\n');

      let passedCount = 0;
      for (const r of results) {
        const icon = r.passed ? '✓' : '✗';
        console.log(`${icon} [${r.id}] ${r.name}`);
        console.log(`   Details: ${r.details}`);
        if (r.passed) passedCount++;
      }

      console.log('\n--------------------------------------------------');
      console.log(`Results: ${passedCount}/${results.length} passed`);
      console.log('--------------------------------------------------\n');

      if (passedCount !== results.length) {
        console.error('FAILED: Not all tests passed.');
        process.exit(1);
      } else {
        console.log('SUCCESS: All 10 environment provider resolution tests passed.');
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Fatal test execution error:', err);
      process.exit(1);
    });
}
