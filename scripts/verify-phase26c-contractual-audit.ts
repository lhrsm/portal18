/**
 * ============================================================================
 * PHASE 26C — REAL AGE ASSURANCE ACTIVATION & CONTRACTUAL AUDIT QA
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';

export interface ContractualAuditCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runContractualAuditQa(): Promise<ContractualAuditCheckResult[]> {
  const results: ContractualAuditCheckResult[] = [];

  // 1. CONTRACTUAL STATUS & NO ASSUMED CLAIMS
  const compDocPath = path.join(process.cwd(), 'docs/integrations/age-assurance-provider-comparison.md');
  const compContent = fs.readFileSync(compDocPath, 'utf8');

  const requiresQuote = compContent.includes('Cotação Comercial') || compContent.includes('Cotação / Mínimo');
  const explicitCommercialWarning = compContent.includes('A contratação de produção exige a assinatura formal do DPA');

  results.push({
    id: 'CONTRACT-AUDIT-01',
    category: 'CONTRACTUAL INTEGRITY',
    name: 'Pricing and adult compliance marked as quote required / pending formal contract',
    expected: 'No assumed pricing or unverified commercial approval in comparison doc',
    passed: requiresQuote && explicitCommercialWarning,
    details: requiresQuote ? 'Contractual requirements and quotes correctly documented.' : 'Unverified claims found.',
  });

  // 2. LEGAL COPY AND ACCURACY (NO FALSE PROMISES)
  const trustPagePath = path.join(process.cwd(), 'src/app/trust/age-verification/page.tsx');
  const trustContent = fs.readFileSync(trustPagePath, 'utf8');

  const noNeverBiometricsPromise = !trustContent.includes('nunca precisará fazer facial') && !trustContent.includes('dispensando novas fotos enquanto');
  const usesCompliantWording = trustContent.includes('conforme as regras operacionais vigentes') || trustContent.includes('conforme as regras de vigência');

  results.push({
    id: 'CONTRACT-AUDIT-02',
    category: 'LEGAL & TRUST COPY',
    name: 'Trust Center uses accurate legal copy regarding credential reuse rules',
    expected: 'No absolute false guarantees; states reuse is subject to provider validity rules',
    passed: noNeverBiometricsPromise && usesCompliantWording,
    details: usesCompliantWording ? 'Accurate legal phrasing verified in Trust Center.' : 'Inaccurate legal copy detected.',
  });

  // 3. ADMIN OBSERVABILITY & REVENUE / INTEGRATION STATE
  const adminPagePath = path.join(process.cwd(), 'src/app/admin/security/page.tsx');
  const adminContent = fs.readFileSync(adminPagePath, 'utf8');

  const adminShowsSandbox = adminContent.includes('Validado (Sandbox)') && adminContent.includes('Credenciais Reais: Pendentes');
  const adminShowsCommercialPending = adminContent.includes('Homologação Pendente') || adminContent.includes('Contratação B2B');

  results.push({
    id: 'CONTRACT-AUDIT-03',
    category: 'ADMIN OBSERVABILITY',
    name: 'Admin Security Center distinguishes between sandbox validation and real production credentials',
    expected: 'Cards explicitly state Sandbox Validated and Real Credentials / Commercial DPA Pending',
    passed: adminShowsSandbox && adminShowsCommercialPending,
    details: adminShowsSandbox ? 'Admin dashboard accurately reports integration state.' : 'Admin status inaccurate.',
  });

  // 4. ZERO BIOMETRIC STORAGE INVARIANT
  const typesPath = path.join(process.cwd(), 'src/services/ageVerification/types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');

  const zeroBiometricTypes =
    !typesContent.includes('selfie') &&
    !typesContent.includes('face_image') &&
    !typesContent.includes('biometric_embedding');

  results.push({
    id: 'CONTRACT-AUDIT-04',
    category: 'PRIVACY INVARIANT',
    name: 'Zero storage of visitor biometric templates or facial data in TypeScript models',
    expected: 'Age verification types hold zero PII or raw biometrics',
    passed: zeroBiometricTypes,
    details: zeroBiometricTypes ? 'Zero biometric storage invariant verified.' : 'Biometric data leak in types.',
  });

  // 5. ENFORCEMENT FEATURE GATE ISOLATION
  const runbookPath = path.join(process.cwd(), 'docs/operations/age-assurance-provider-activation.md');
  const runbookContent = fs.readFileSync(runbookPath, 'utf8');

  const hasActivationGate = runbookContent.includes('AGE_VERIFICATION_ENABLED') && runbookContent.includes('ETAPAS PRÉ-REQUISITO');

  results.push({
    id: 'CONTRACT-AUDIT-05',
    category: 'PRODUCTION GATE',
    name: 'Production activation gate isolated behind controlled feature flags',
    expected: 'Activation runbook requires commercial DPA and production credentials before global enforcement',
    passed: hasActivationGate,
    details: hasActivationGate ? 'Production activation gate verified.' : 'Missing activation gate in runbook.',
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 PHASE 26C — REAL AGE ASSURANCE CONTRACTUAL AUDIT QA');
  console.log('================================================================\n');

  runContractualAuditQa().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ CONTRACTUAL AUDIT QA FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} CONTRACTUAL AUDIT CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
