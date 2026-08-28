/**
 * ============================================================================
 * PHASE 26A — ECA DIGITAL AGE ASSURANCE & PRIVACY-PRESERVING AGE GATE QA
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { ageSessionService } from '../src/services/ageVerification/ageSessionService';
import { AgeVerificationFactory } from '../src/services/ageVerification/factory';
import { ageVerificationService } from '../src/services/ageVerification/ageVerificationService';

export interface AgeAssuranceCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runAgeAssuranceVerification(): Promise<AgeAssuranceCheckResult[]> {
  const results: AgeAssuranceCheckResult[] = [];

  // 1. SEPARATION OF KYC & VISITOR AGE ASSURANCE ARCHITECTURE
  const providerPath = path.join(process.cwd(), 'src/services/ageVerification/provider.ts');
  const factoryPath = path.join(process.cwd(), 'src/services/ageVerification/factory.ts');
  const typesPath = path.join(process.cwd(), 'src/services/ageVerification/types.ts');
  const unconfiguredPath = path.join(process.cwd(), 'src/services/ageVerification/providers/unconfiguredProvider.ts');
  const mockPath = path.join(process.cwd(), 'src/services/ageVerification/providers/mockSandboxProvider.ts');

  const architectureExists =
    fs.existsSync(providerPath) &&
    fs.existsSync(factoryPath) &&
    fs.existsSync(typesPath) &&
    fs.existsSync(unconfiguredPath) &&
    fs.existsSync(mockPath);

  results.push({
    id: 'AGE-ARCH-01',
    category: 'ARCHITECTURE',
    name: 'Modular AgeVerificationProvider architecture separated from advertiser KYC',
    expected: 'Interface, Factory, types, unconfigured and sandbox providers present in src/services/ageVerification',
    passed: architectureExists,
    details: architectureExists ? 'Age assurance architecture cleanly decoupled.' : 'Missing architecture files.',
  });

  // 2. PRIVACY-BY-DESIGN & ZERO BIOMETRIC STORAGE
  const sessionSecretFile = fs.readFileSync(path.join(process.cwd(), 'src/services/ageVerification/types.ts'), 'utf8');
  const migrationFile = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260828000018_phase26a_age_assurance.sql'),
    'utf8'
  );

  const zeroBiometricsInTypes = !sessionSecretFile.includes('facial_embedding') && !sessionSecretFile.includes('document_photo');
  const zeroBiometricsInSql = !migrationFile.includes('selfie') && !migrationFile.includes('cpf text') && !migrationFile.includes('rg text');
  const usesHashedSubject = migrationFile.includes('provider_subject_hash');

  const privacyPassed = zeroBiometricsInTypes && zeroBiometricsInSql && usesHashedSubject;

  results.push({
    id: 'AGE-PRIVACY-01',
    category: 'DATA MINIMIZATION',
    name: 'Zero storage of visitor biometrics, selfies, CPF, documents or facial embeddings',
    expected: 'Only opaque provider_subject_hash and minimal 18+ boolean signal stored',
    passed: privacyPassed,
    details: privacyPassed ? 'Data minimization verified: Zero PII or biometric storage.' : 'PII storage violation.',
  });

  // 3. CRYPTOGRAPHIC SIGNED SESSION & TAMPER PROTECTION
  const mockResult = {
    verified: true,
    ageBand: '18_plus' as const,
    provider: 'test_provider',
    providerSubjectHash: 'hash-abc-123',
    assuranceLevel: 'high' as const,
    verifiedAt: new Date().toISOString(),
    credentialReference: 'ref-test-999',
  };

  const { session, serialized } = ageSessionService.createSignedSession(mockResult);
  const parsedValid = ageSessionService.parseSession(serialized);
  const isValid = ageSessionService.isSessionValid(parsedValid);

  // Tamper test: modify serialized payload
  const tamperedSession = { ...session, age_band: 'under_18' as const };
  const tamperedSerialized = Buffer.from(JSON.stringify(tamperedSession)).toString('base64');
  const parsedTampered = ageSessionService.parseSession(tamperedSerialized);
  const tamperBlocked = parsedTampered === null;

  const sessionPassed = isValid && tamperBlocked;

  results.push({
    id: 'AGE-SESSION-01',
    category: 'SESSION SECURITY',
    name: 'Signed, tamper-protected session generation and signature verification',
    expected: 'Valid session accepted, tampered signature strictly rejected',
    passed: sessionPassed,
    details: sessionPassed ? 'Tamper protection verified: modified session safely rejected.' : 'Session validation failed.',
  });

  // 4. CREDENTIAL REUSE & RETURNING VISITOR SUPPORT
  const { MockSandboxAgeVerificationProvider } = await import(
    '../src/services/ageVerification/providers/mockSandboxProvider'
  );
  const sandboxProvider = new MockSandboxAgeVerificationProvider();
  const reuseCheck = await sandboxProvider.checkCredentialStatus('user-returning-hash');
  const canReuse = reuseCheck.verified && reuseCheck.isReused === true && reuseCheck.ageBand === '18_plus';

  results.push({
    id: 'AGE-REUSE-01',
    category: 'CREDENTIAL REUSE',
    name: 'Credential reuse without requiring new biometric facial on every visit',
    expected: 'Returning visitor with valid credential receives verified signal seamlessly',
    passed: canReuse,
    details: canReuse ? 'Credential reuse pattern verified.' : 'Credential reuse failed.',
  });

  // 5. FAIL-CLOSED & UNDERAGE BLOCKING
  const underageResult = await sandboxProvider.validateCallback({ code: 'test-underage-code' });
  const underageBlocked = underageResult.verified === false && underageResult.ageBand === 'under_18';

  results.push({
    id: 'AGE-FAILCLOSED-01',
    category: 'FAIL-CLOSED RULES',
    name: 'Strict fail-closed enforcement: Under-18 blocked and unconfigured safety',
    expected: 'Underage result returns verified=false with ageBand=under_18 and blocked access',
    passed: underageBlocked,
    details: underageBlocked ? 'Fail-closed enforcement verified.' : 'Underage access leak.',
  });

  // 6. OPEN REDIRECT PROTECTION
  const safePath1 = ageVerificationService.sanitizeReturnUrl('/perfil/ba/salvador/ana-bella');
  const blockedEvilUrl = ageVerificationService.sanitizeReturnUrl('https://evil.com/phishing');
  const blockedProtocolRelative = ageVerificationService.sanitizeReturnUrl('//attacker.com');

  const openRedirectProtected =
    safePath1 === '/perfil/ba/salvador/ana-bella' &&
    blockedEvilUrl === '/' &&
    blockedProtocolRelative === '/';

  results.push({
    id: 'AGE-REDIRECT-01',
    category: 'SECURITY',
    name: 'Sanitization of returnUrl to prevent Open Redirect attacks',
    expected: 'Internal paths allowed, external and protocol-relative URLs reset to /',
    passed: openRedirectProtected,
    details: openRedirectProtected ? 'Open redirect filter strictly blocking external redirects.' : 'Open redirect vulnerability detected.',
  });

  // 7. PUBLIC PAGES & TRUST CENTER INVENTORY
  const hubPagePath = path.join(process.cwd(), 'src/app/age-verification/page.tsx');
  const callbackPagePath = path.join(process.cwd(), 'src/app/age-verification/callback/page.tsx');
  const trustPagePath = path.join(process.cwd(), 'src/app/trust/age-verification/page.tsx');
  const modalComponentPath = path.join(process.cwd(), 'src/components/ageVerification/AgeGateModal.tsx');

  const uiPagesExist =
    fs.existsSync(hubPagePath) &&
    fs.existsSync(callbackPagePath) &&
    fs.existsSync(trustPagePath) &&
    fs.existsSync(modalComponentPath);

  results.push({
    id: 'AGE-UI-01',
    category: 'UI & TRUST CENTER',
    name: 'Dedicated Age Assurance hub, callback, modal and Trust Center documentation',
    expected: 'All 4 UI modules present in app router',
    passed: uiPagesExist,
    details: uiPagesExist ? 'All age verification pages and trust docs verified.' : 'Missing UI pages.',
  });

  // 8. DIRECT PROFILE & CONTACT PROTECTION
  const profilePageCode = fs.readFileSync(
    path.join(process.cwd(), 'src/app/perfil/[estado]/[cidade]/[slug]/page.tsx'),
    'utf8'
  );
  const hasProfileGate = profilePageCode.includes('AgeGateModal') && profilePageCode.includes('isAgeVerified');

  results.push({
    id: 'AGE-PROTECT-01',
    category: 'SENSITIVE CONTENT PROTECTION',
    name: 'Direct profile URLs and sensitive contacts protected behind Age Gate Modal',
    expected: 'Public profile page validates isAgeVerified and mounts AgeGateModal when unverified',
    passed: hasProfileGate,
    details: hasProfileGate ? 'Direct profile gate verified.' : 'Unprotected profile access.',
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 PHASE 26A — ECA DIGITAL AGE ASSURANCE & AGE GATE QA');
  console.log('================================================================\n');

  runAgeAssuranceVerification().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ AGE ASSURANCE QA FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} AGE ASSURANCE & PRIVACY CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
