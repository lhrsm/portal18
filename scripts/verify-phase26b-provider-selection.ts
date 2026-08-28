/**
 * ============================================================================
 * PHASE 26B — AGE ASSURANCE PROVIDER SELECTION, SANDBOX INTEGRATION & REUSE QA
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { MockSandboxAgeVerificationProvider } from '../src/services/ageVerification/providers/mockSandboxProvider';
import { VerificaIdAgeVerificationProvider } from '../src/services/ageVerification/providers/verificaIdProvider';
import { SumsubAgeVerificationProvider } from '../src/services/ageVerification/providers/sumsubAgeProvider';
import { AgeVerificationFactory } from '../src/services/ageVerification/factory';
import { ageSessionService } from '../src/services/ageVerification/ageSessionService';

export interface ProviderQaCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runProviderSelectionQa(): Promise<ProviderQaCheckResult[]> {
  const results: ProviderQaCheckResult[] = [];

  // 1. COMPARATIVE MATRIX DOCUMENTATION
  const compDocPath = path.join(process.cwd(), 'docs/integrations/age-assurance-provider-comparison.md');
  const compExists = fs.existsSync(compDocPath);
  const compContent = compExists ? fs.readFileSync(compDocPath, 'utf8') : '';

  const covers7Providers =
    compContent.includes('Verifica ID') &&
    compContent.includes('Sumsub Age') &&
    compContent.includes('Veriff') &&
    compContent.includes('idwall') &&
    compContent.includes('CAF') &&
    compContent.includes('Yoti') &&
    compContent.includes('Persona');

  const hasWeightedScore = compContent.includes('NOTA FINAL') && compContent.includes('MATRIZ DE PONTUAÇÃO');

  results.push({
    id: 'PROV-COMP-01',
    category: 'COMPARATIVE ANALYSIS',
    name: 'In-depth comparison matrix covering 7 providers with weighted scoring',
    expected: 'Comparison doc present, covering Verifica ID, Sumsub, Veriff, idwall, CAF, Yoti, Persona',
    passed: compExists && covers7Providers && hasWeightedScore,
    details: covers7Providers ? 'Comprehensive 7-provider matrix verified.' : 'Missing comparison details.',
  });

  // 2. PRIMARY & FALLBACK PROVIDER SELECTION
  const selectsVerificaIdPrimary = compContent.includes('Provedor Primário Selecionado:') && compContent.includes('Verifica ID');
  const selectsSumsubFallback = compContent.includes('Provedor Secundário / Fallback:') && compContent.includes('Sumsub Age');

  results.push({
    id: 'PROV-SELECT-01',
    category: 'PROVIDER SELECTION',
    name: 'Formal selection of Primary (Verifica ID) and Fallback (Sumsub Age)',
    expected: 'Primary & Fallback providers justified based on Brazil ECA Digital and adult-content policy',
    passed: selectsVerificaIdPrimary && selectsSumsubFallback,
    details: selectsVerificaIdPrimary ? 'Verifica ID primary and Sumsub Age fallback verified.' : 'Missing formal selection.',
  });

  // 3. ACTIVATION RUNBOOK
  const runbookPath = path.join(process.cwd(), 'docs/operations/age-assurance-provider-activation.md');
  const runbookExists = fs.existsSync(runbookPath);
  const runbookContent = runbookExists ? fs.readFileSync(runbookPath, 'utf8') : '';

  const hasEnvVars = runbookContent.includes('AGE_VERIFICATION_PROVIDER') && runbookContent.includes('AGE_VERIFICATION_CLIENT_ID');
  const hasWebhookSteps = runbookContent.includes('/api/webhooks/age-verification') && runbookContent.includes('HMAC-SHA256');

  results.push({
    id: 'PROV-RUNBOOK-01',
    category: 'OPERATIONS',
    name: 'Operational runbook for sandbox migration and production activation',
    expected: 'Runbook contains environment variables, webhook endpoints and smoke test procedures',
    passed: runbookExists && hasEnvVars && hasWebhookSteps,
    details: runbookExists ? 'Operational activation runbook verified.' : 'Missing activation runbook.',
  });

  // 4. SUBPROCESSORS COMPLIANCE
  const subprocPath = path.join(process.cwd(), 'docs/privacy/subprocessors.md');
  const subprocExists = fs.existsSync(subprocPath);
  const subprocContent = subprocExists ? fs.readFileSync(subprocPath, 'utf8') : '';

  const subprocUpdated = subprocContent.includes('Verifica ID') && subprocContent.includes('ECA Digital');

  results.push({
    id: 'PROV-SUBPROCESSOR-01',
    category: 'PRIVACY & LGPD',
    name: 'Subprocessors list updated with Verifica ID and strict data minimization',
    expected: 'Subprocessors list documents Verifica ID as authorized visitor age assurance subprocessor',
    passed: subprocExists && subprocUpdated,
    details: subprocUpdated ? 'Subprocessors documentation verified.' : 'Missing subprocessor entry.',
  });

  // 5. PROVIDER ADAPTERS & FACTORY INTEGRATION
  const sandbox = new MockSandboxAgeVerificationProvider();
  const verificaId = new VerificaIdAgeVerificationProvider();
  const sumsub = new SumsubAgeVerificationProvider();

  process.env.AGE_VERIFICATION_PROVIDER = 'mock_sandbox';
  AgeVerificationFactory.reset();
  const resolvedMock = AgeVerificationFactory.getProvider();

  process.env.AGE_VERIFICATION_PROVIDER = 'verifica_id';
  AgeVerificationFactory.reset();
  const resolvedVid = AgeVerificationFactory.getProvider();

  process.env.AGE_VERIFICATION_PROVIDER = 'sumsub_age';
  AgeVerificationFactory.reset();
  const resolvedSumsub = AgeVerificationFactory.getProvider();

  const factoryWorking =
    resolvedMock.name === 'mock_sandbox' &&
    resolvedVid.name === 'verifica_id' &&
    resolvedSumsub.name === 'sumsub_age';

  results.push({
    id: 'PROV-ADAPTERS-01',
    category: 'ARCHITECTURE',
    name: 'Adapters for mock_sandbox, verifica_id, and sumsub_age integrated in factory',
    expected: 'Factory resolves all configured providers correctly',
    passed: factoryWorking,
    details: factoryWorking ? 'Provider factory resolution verified.' : 'Factory resolution failed.',
  });

  // 6. SANDBOX FIRST-TIME VERIFICATION (18+)
  const firstInit = await sandbox.initiateVerification({ returnUrl: '/perfil/ba/salvador/carla' });
  const firstCallback = await sandbox.validateCallback({ code: firstInit.sessionId });
  const firstSession = ageSessionService.createSignedSession(firstCallback);
  const firstValid = ageSessionService.isSessionValid(firstSession.session);

  results.push({
    id: 'PROV-SANDBOX-FIRST-01',
    category: 'SANDBOX VALIDATION',
    name: 'First-time verification flow returns 18+ and creates valid signed session',
    expected: 'verified=true, ageBand=18_plus, valid HMAC signature',
    passed: firstCallback.verified && firstCallback.ageBand === '18_plus' && firstValid,
    details: firstValid ? 'First-time verification simulation passed.' : 'First-time verification failed.',
  });

  // 7. SANDBOX CREDENTIAL REUSE (RETURNING VISITOR)
  const reuseInit = await sandbox.initiateVerification({ returnUrl: '/perfil/ba/salvador/carla', isReturningVisitor: true });
  const reuseCallback = await sandbox.validateCallback({ code: `${reuseInit.sessionId}-returning` });
  const reuseCheck = await sandbox.checkCredentialStatus(reuseCallback.providerSubjectHash);

  const reuseWorking =
    reuseCallback.verified &&
    reuseCallback.isReused === true &&
    reuseCheck.verified &&
    reuseCheck.isReused === true;

  results.push({
    id: 'PROV-SANDBOX-REUSE-01',
    category: 'CREDENTIAL REUSE',
    name: 'Returning visitor credential reuse recognized without repeating facial capture',
    expected: 'isReused=true on callback and checkCredentialStatus',
    passed: reuseWorking,
    details: reuseWorking ? 'Returning visitor credential reuse verified.' : 'Credential reuse failed.',
  });

  // 8. SANDBOX UNDERAGE ACCESS BLOCKING (FAIL-CLOSED)
  const underageCallback = await sandbox.validateCallback({ code: 'test-underage-code' });
  const underageBlocked = underageCallback.verified === false && underageCallback.ageBand === 'under_18';

  results.push({
    id: 'PROV-SANDBOX-UNDERAGE-01',
    category: 'SECURITY & FAIL-CLOSED',
    name: 'Underage visitor attempt returns under_18 and blocks access',
    expected: 'verified=false, ageBand=under_18, zero sensitive access granted',
    passed: underageBlocked,
    details: underageBlocked ? 'Underage blocking verified.' : 'Underage access leak.',
  });

  // 9. SANDBOX EXPIRED CREDENTIAL
  const expiredCallback = await sandbox.validateCallback({ code: 'test-expired-code' });
  const expiredBlocked = expiredCallback.verified === false && expiredCallback.error?.includes('expirada');

  results.push({
    id: 'PROV-SANDBOX-EXPIRED-01',
    category: 'LIFECYCLE',
    name: 'Expired credential identified and blocked, prompting revalidation',
    expected: 'verified=false on expired credential',
    passed: Boolean(expiredBlocked),
    details: expiredBlocked ? 'Expired credential handling verified.' : 'Expired credential leak.',
  });

  // 10. SANDBOX REVOCATION
  const subjectToRevoke = 'subject-test-revocation-hash';
  await sandbox.revokeCredential(subjectToRevoke);
  const revokedStatus = await sandbox.checkCredentialStatus(subjectToRevoke);
  const revocationPassed = revokedStatus.verified === false;

  results.push({
    id: 'PROV-SANDBOX-REVOCATION-01',
    category: 'REVOCATION & LGPD',
    name: 'User or provider credential revocation immediately invalidates access',
    expected: 'checkCredentialStatus returns verified=false after revocation',
    passed: revocationPassed,
    details: revocationPassed ? 'Credential revocation verified.' : 'Revocation failed.',
  });

  // 11. PROVIDER OUTAGE & FAIL-CLOSED SAFETY
  let outageSafelyCaught = false;
  try {
    await sandbox.validateCallback({ code: 'test-down-network' });
  } catch (err: any) {
    outageSafelyCaught = err.message.includes('503 Service Unavailable');
  }

  results.push({
    id: 'PROV-SANDBOX-OUTAGE-01',
    category: 'FAIL-CLOSED SAFETY',
    name: 'Provider network outage or 503 triggers fail-closed response',
    expected: 'Outage safely throws error, preventing fallback access bypass',
    passed: outageSafelyCaught,
    details: outageSafelyCaught ? 'Provider outage fail-closed verified.' : 'Outage error handling failed.',
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 PHASE 26B — AGE ASSURANCE PROVIDER SELECTION & SANDBOX QA');
  console.log('================================================================\n');

  runProviderSelectionQa().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ PROVIDER SELECTION QA FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} PROVIDER SELECTION & SANDBOX CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
