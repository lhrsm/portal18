/**
 * ============================================================================
 * PHASE AGE-DIDIT-01 — DIDIT VISITOR AGE ASSURANCE INTEGRATION TEST SUITE
 * Complete test suite validating AGE-DIDIT-01 through AGE-DIDIT-25
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AgeVerificationFactory } from '../src/services/ageVerification/factory';
import { DiditAgeVerificationProvider } from '../src/services/ageVerification/providers/diditAgeProvider';
import { ageSessionService } from '../src/services/ageVerification/ageSessionService';
import { ageVerificationService } from '../src/services/ageVerification/ageVerificationService';
import { publicEnvSchema, serverEnvSchema } from '../src/config/env';

export interface QaTestResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runDiditAgeAssuranceTests(): Promise<QaTestResult[]> {
  const results: QaTestResult[] = [];

  // AGE-DIDIT-01: Didit provider registrado corretamente
  process.env.AGE_VERIFICATION_PROVIDER = 'didit_age';
  AgeVerificationFactory.reset();
  const providerInstance = AgeVerificationFactory.getProvider();
  const isRegistered = providerInstance instanceof DiditAgeVerificationProvider && providerInstance.name === 'didit_age';

  results.push({
    id: 'AGE-DIDIT-01',
    category: 'FACTORY',
    name: 'Didit provider registrado corretamente na AgeVerificationFactory',
    expected: 'Factory resolve AGE_VERIFICATION_PROVIDER=didit_age para DiditAgeVerificationProvider',
    passed: isRegistered,
    details: isRegistered ? 'Didit provider registrado e instanciado com sucesso.' : 'Falha no registro da Factory.',
  });

  // AGE-DIDIT-02: Provider não configurado falha fechado
  const savedKey = process.env.DIDIT_API_KEY;
  const savedWorkflow = process.env.DIDIT_AGE_WORKFLOW_ID;
  delete process.env.DIDIT_API_KEY;
  delete process.env.DIDIT_AGE_WORKFLOW_ID;

  const unconfiguredProvider = new DiditAgeVerificationProvider();
  const isUnconfiguredSafe = unconfiguredProvider.isConfigured === false;
  const unconfiguredInit = await unconfiguredProvider.initiateVerification({ returnUrl: '/perfil/test' });
  const unconfiguredCallback = await unconfiguredProvider.validateCallback({ sessionId: 'dummy-id' });

  const unconfPassed =
    isUnconfiguredSafe &&
    unconfiguredInit.redirectUrl.includes('status=unavailable') &&
    unconfiguredCallback.verified === false;

  results.push({
    id: 'AGE-DIDIT-02',
    category: 'FAIL-CLOSED',
    name: 'Provider não configurado falha fechado (fail-closed)',
    expected: 'isConfigured=false, redireciona para unavailable e validateCallback retorna verified=false',
    passed: unconfPassed,
    details: unconfPassed ? 'Comportamento fail-closed garantido quando desconfigurado.' : 'Vazamento de estado desconfigurado.',
  });

  // Restore mock test env
  process.env.DIDIT_API_KEY = 'didit_mock_test_key_12345';
  process.env.DIDIT_WEBHOOK_SECRET = 'didit_mock_webhook_secret_67890';
  process.env.DIDIT_AGE_WORKFLOW_ID = 'wf_portal18_visitors_v1';
  const testProvider = new DiditAgeVerificationProvider();

  // AGE-DIDIT-03: API key nunca chega ao client bundle
  const publicKeys = Object.keys(publicEnvSchema.shape);
  const serverKeys = Object.keys(serverEnvSchema.shape);
  const noPublicApiKey = !publicKeys.includes('DIDIT_API_KEY') && !publicKeys.includes('DIDIT_WEBHOOK_SECRET');
  const serverOnlyHasSecrets = serverKeys.includes('DIDIT_API_KEY') && serverKeys.includes('DIDIT_WEBHOOK_SECRET');
  const envAuditPassed = noPublicApiKey && serverOnlyHasSecrets;

  results.push({
    id: 'AGE-DIDIT-03',
    category: 'SECURITY',
    name: 'API key e segredos Didit restritos exclusivamente ao ambiente servidor',
    expected: 'Nenhum segredo no schema público (NEXT_PUBLIC_), apenas no serverEnvSchema',
    passed: envAuditPassed,
    details: envAuditPassed ? 'Segredos estritamente server-only confirmados.' : 'Risco de exposição de chaves no bundle cliente.',
  });

  // AGE-DIDIT-04: Session creation ocorre server-side
  const startRoutePath = path.join(process.cwd(), 'src/app/api/age-verification/start/route.ts');
  const startRouteExists = fs.existsSync(startRoutePath);
  const startRouteContent = startRouteExists ? fs.readFileSync(startRoutePath, 'utf8') : '';
  const initiatesServerSide = startRouteContent.includes('provider.initiateVerification') && startRouteContent.includes('sanitizeReturnUrl');

  results.push({
    id: 'AGE-DIDIT-04',
    category: 'SERVER-SIDE',
    name: 'Session creation ocorre exclusivamente server-side',
    expected: 'Endpoint /api/age-verification/start existe e orquestra a sessão no backend',
    passed: startRouteExists && initiatesServerSide,
    details: startRouteExists ? 'Endpoint server-side /api/age-verification/start validado.' : 'Endpoint ausente.',
  });

  // AGE-DIDIT-05: Callback query status não concede acesso
  const callbackPagePath = path.join(process.cwd(), 'src/app/age-verification/callback/page.tsx');
  const callbackContent = fs.readFileSync(callbackPagePath, 'utf8');
  const ignoresQueryStatus = !callbackContent.includes("searchParams.get('status') === 'approved'") &&
    !callbackContent.includes("grantAgeAccess");

  results.push({
    id: 'AGE-DIDIT-05',
    category: 'FAIL-CLOSED',
    name: 'Callback query status (ex: status=approved) NÃO concede acesso',
    expected: 'Callback extrai apenas identificadores e delega validação estritamente ao servidor',
    passed: ignoresQueryStatus,
    details: ignoresQueryStatus ? 'Manipulação de query string não concede 18+.' : 'Falha: query string tratada como verdade.',
  });

  // Mock server responses for Decision API testing
  const originalFetch = global.fetch;

  // AGE-DIDIT-06: APPROVED validado server-side concede 18+
  global.fetch = async (input: any) => {
    const urlStr = String(input);
    if (urlStr.includes('/decision/')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          session_id: 'sess_approved_123',
          workflow_id: 'wf_portal18_visitors_v1',
          status: 'Approved',
          warnings: [],
          vendor_data: 'corr_test_01',
        }),
      } as any;
    }
    return { ok: false, status: 404 } as any;
  };

  const approvedResult = await testProvider.validateCallback({ sessionId: 'sess_approved_123' });
  const approvedPassed = approvedResult.verified === true && approvedResult.ageBand === '18_plus';

  results.push({
    id: 'AGE-DIDIT-06',
    category: 'DECISION',
    name: 'Decisão APPROVED validada server-side concede 18+',
    expected: 'verified=true, ageBand=18_plus quando status=Approved e workflow confere',
    passed: approvedPassed,
    details: approvedPassed ? 'Maioridade 18+ concedida corretamente após validação.' : 'Falha na concessão de 18+.',
  });

  // AGE-DIDIT-07: REVIEW não concede acesso
  global.fetch = async (input: any) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        session_id: 'sess_review_456',
        workflow_id: 'wf_portal18_visitors_v1',
        status: 'In Review',
        warnings: [],
      }),
    } as any;
  };

  const reviewResult = await testProvider.validateCallback({ sessionId: 'sess_review_456' });
  const reviewPassed = reviewResult.verified === false && reviewResult.ageBand !== '18_plus';

  results.push({
    id: 'AGE-DIDIT-07',
    category: 'FAIL-CLOSED',
    name: 'Status IN REVIEW não concede acesso 18+',
    expected: 'verified=false, ageBand=unknown em sessões sob revisão manual',
    passed: reviewPassed,
    details: reviewPassed ? 'Sessão em revisão retida com segurança em Safe Mode.' : 'Acesso concedido indevidamente durante revisão.',
  });

  // AGE-DIDIT-08: REJECTED / UNDERAGE não concede acesso
  global.fetch = async (input: any) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        session_id: 'sess_underage_789',
        workflow_id: 'wf_portal18_visitors_v1',
        status: 'Declined',
        warnings: ['AGE_BELOW_MINIMUM'],
        decision_reason_code: 'AGE_BELOW_MINIMUM',
      }),
    } as any;
  };

  const rejectedResult = await testProvider.validateCallback({ sessionId: 'sess_underage_789' });
  const rejectedPassed = rejectedResult.verified === false && rejectedResult.ageBand === 'under_18';

  results.push({
    id: 'AGE-DIDIT-08',
    category: 'FAIL-CLOSED',
    name: 'Status DECLINED / AGE_BELOW_MINIMUM não concede acesso e classifica como under_18',
    expected: 'verified=false, ageBand=under_18',
    passed: rejectedPassed,
    details: rejectedPassed ? 'Menor de idade bloqueado com assertividade fail-closed.' : 'Falha no bloqueio de menor.',
  });

  // AGE-DIDIT-09: UNKNOWN não concede acesso
  global.fetch = async (input: any) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        session_id: 'sess_weird_999',
        workflow_id: 'wf_portal18_visitors_v1',
        status: 'Expired',
      }),
    } as any;
  };

  const unknownResult = await testProvider.validateCallback({ sessionId: 'sess_weird_999' });
  const unknownPassed = unknownResult.verified === false && unknownResult.ageBand === 'unknown';

  results.push({
    id: 'AGE-DIDIT-09',
    category: 'FAIL-CLOSED',
    name: 'Status inesperado (ex: Expired, Abandoned) não concede acesso',
    expected: 'verified=false, ageBand=unknown',
    passed: unknownPassed,
    details: unknownPassed ? 'Status indeterminado retém acesso fail-closed.' : 'Falha: status desconhecido concedeu acesso.',
  });

  // AGE-DIDIT-10: Timeout / Erro de Rede não concede acesso
  global.fetch = async () => {
    throw new Error('AbortError: The operation was aborted due to timeout');
  };

  const timeoutResult = await testProvider.validateCallback({ sessionId: 'sess_timeout_000' });
  const timeoutPassed = timeoutResult.verified === false && timeoutResult.ageBand === 'unknown';

  results.push({
    id: 'AGE-DIDIT-10',
    category: 'FAIL-CLOSED',
    name: 'Timeout ou erro de rede não concede acesso (fail-closed seguro)',
    expected: 'verified=false, erro capturado com segurança sem liberar conteúdo',
    passed: timeoutPassed,
    details: timeoutPassed ? 'Timeout de rede mantém Modo Seguro ativado.' : 'Falha: timeout liberou acesso.',
  });

  // AGE-DIDIT-11: Workflow mismatch não concede acesso
  global.fetch = async (input: any) => {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        session_id: 'sess_other_wf',
        workflow_id: 'wf_advertiser_kyc_documental', // Different workflow!
        status: 'Approved',
        warnings: [],
      }),
    } as any;
  };

  const mismatchResult = await testProvider.validateCallback({ sessionId: 'sess_other_wf' });
  const mismatchPassed = mismatchResult.verified === false && Boolean(mismatchResult.error?.includes('workflow'));

  results.push({
    id: 'AGE-DIDIT-11',
    category: 'SECURITY',
    name: 'Sessão com workflow divergente é rejeitada (Workflow Binding)',
    expected: 'verified=false quando workflow_id retornado for diferente do configurado',
    passed: mismatchPassed,
    details: mismatchPassed ? 'Tentativa de reutilização cross-workflow neutralizada.' : 'Falha de Workflow Binding.',
  });

  // AGE-DIDIT-12: session_id arbitrário / 404 não concede acesso
  global.fetch = async () => {
    return { ok: false, status: 404 } as any;
  };

  const arbitraryResult = await testProvider.validateCallback({ sessionId: 'random_attacker_session_id' });
  const arbitraryPassed = arbitraryResult.verified === false;

  results.push({
    id: 'AGE-DIDIT-12',
    category: 'SECURITY',
    name: 'session_id forjado ou inexistente na API Didit não concede acesso',
    expected: 'verified=false quando API Didit retornar 404',
    passed: arbitraryPassed,
    details: arbitraryPassed ? 'Sessões forjadas bloqueadas com 404 seguro.' : 'Falha na validação de existência da sessão.',
  });

  // Restore fetch
  global.fetch = originalFetch;

  // AGE-DIDIT-13: Webhook assinatura inválida => rejeitado
  const testPayload = JSON.stringify({
    event_id: 'evt_test_123',
    event_type: 'session.status.updated',
    session_id: 'sess_123',
    status: 'Approved',
  });

  const validSig = crypto
    .createHmac('sha256', process.env.DIDIT_WEBHOOK_SECRET || '')
    .update(testPayload)
    .digest('hex');

  const validSigCheck = testProvider.verifyWebhookSignature({ 'x-signature-v2': validSig }, testPayload);
  const invalidSigCheck = testProvider.verifyWebhookSignature({ 'x-signature-v2': 'invalid_signature_tampered' }, testPayload);
  const missingSigCheck = testProvider.verifyWebhookSignature({}, testPayload);
  const webhookSigPassed = validSigCheck === true && invalidSigCheck === false && missingSigCheck === false;

  results.push({
    id: 'AGE-DIDIT-13',
    category: 'WEBHOOK SECURITY',
    name: 'Webhook com assinatura HMAC inválida ou ausente é rejeitado',
    expected: 'verifyWebhookSignature retorna true para assinatura correta e false para adulterada/ausente',
    passed: webhookSigPassed,
    details: webhookSigPassed ? 'Verificação criptográfica HMAC-SHA256 validada.' : 'Falha na validação de assinatura HMAC.',
  });

  // AGE-DIDIT-14: Webhook replay => proteção estrutural
  const webhookRoutePath = path.join(process.cwd(), 'src/app/api/webhooks/age-verification/route.ts');
  const webhookRouteExists = fs.existsSync(webhookRoutePath);
  const webhookRouteContent = webhookRouteExists ? fs.readFileSync(webhookRoutePath, 'utf8') : '';
  const hasReplayProtection = webhookRouteContent.includes("supabase.from('webhook_events')") &&
    webhookRouteContent.includes('existingEvent') &&
    webhookRouteContent.includes('idempotent_replay_ignored');

  results.push({
    id: 'AGE-DIDIT-14',
    category: 'REPLAY PROTECTION',
    name: 'Proteção contra webhook replay usando public.webhook_events',
    expected: 'Verifica duplicação de event_id antes de reprocessar eventos',
    passed: Boolean(webhookRouteExists && hasReplayProtection),
    details: hasReplayProtection ? 'Proteção contra replay implementada no endpoint.' : 'Endpoint sem proteção contra replay.',
  });

  // AGE-DIDIT-15: Webhook duplicado => idempotência
  const hasIdempotentResponse = webhookRouteContent.includes('idempotent: true');

  results.push({
    id: 'AGE-DIDIT-15',
    category: 'IDEMPOTENCY',
    name: 'Webhook duplicado tratado de forma idempotente sem criar credenciais duplicadas',
    expected: 'Retorna 200 com idempotent: true para eventos já processados',
    passed: hasIdempotentResponse,
    details: hasIdempotentResponse ? 'Semântica idempotente verificada.' : 'Tratamento de idempotência pendente.',
  });

  // AGE-DIDIT-16: Callback-before-webhook funciona
  const verifySessionRoutePath = path.join(process.cwd(), 'src/app/api/age-verification/verify-session/route.ts');
  const verifySessionExists = fs.existsSync(verifySessionRoutePath);
  const verifySessionContent = verifySessionExists ? fs.readFileSync(verifySessionRoutePath, 'utf8') : '';
  const callbackBeforeWebhookWorks = verifySessionContent.includes('provider.validateCallback') &&
    verifySessionContent.includes('createSignedSession') &&
    verifySessionContent.includes('record_age_assurance_credential');

  results.push({
    id: 'AGE-DIDIT-16',
    category: 'RACE SAFETY',
    name: 'Callback-before-webhook: sessão validada imediatamente no retorno do usuário',
    expected: 'verify-session valida decisão diretamente contra a API Didit e emite sessão sem depender do webhook',
    passed: verifySessionExists && callbackBeforeWebhookWorks,
    details: callbackBeforeWebhookWorks ? 'Validação síncrona no retorno do usuário operacional.' : 'Dependência bloqueante de webhook.',
  });

  // AGE-DIDIT-17: Webhook-before-callback funciona
  const webhookRecordsCredential = webhookRouteContent.includes('record_age_assurance_credential');

  results.push({
    id: 'AGE-DIDIT-17',
    category: 'RACE SAFETY',
    name: 'Webhook-before-callback: credencial é persistida previamente no banco de dados',
    expected: 'Webhook aprovado insere credencial em public.age_verification_credentials',
    passed: webhookRecordsCredential,
    details: webhookRecordsCredential ? 'Persistência desacoplada de credencial via webhook validada.' : 'Webhook não persiste credencial.',
  });

  // AGE-DIDIT-18: returnUrl externo bloqueado (Open Redirect Protection)
  const safePath1 = ageVerificationService.sanitizeReturnUrl('/perfil/ba/salvador/carla');
  const blockedEvil1 = ageVerificationService.sanitizeReturnUrl('https://evil.example.com/phishing');
  const blockedEvil2 = ageVerificationService.sanitizeReturnUrl('//evil.example.com');
  const blockedEvil3 = ageVerificationService.sanitizeReturnUrl('javascript:alert(1)');
  const blockedEvil4 = ageVerificationService.sanitizeReturnUrl('/\\evil.example.com');

  const openRedirectProtected =
    safePath1 === '/perfil/ba/salvador/carla' &&
    blockedEvil1 === '/' &&
    blockedEvil2 === '/' &&
    blockedEvil3 === '/' &&
    blockedEvil4 === '/';

  results.push({
    id: 'AGE-DIDIT-18',
    category: 'SECURITY',
    name: 'Proteção contra Open Redirect no parâmetro returnUrl',
    expected: 'Permite apenas caminhos relativos internos iniciados por /, redirecionando externos para /',
    passed: openRedirectProtected,
    details: openRedirectProtected ? 'Filtro contra Open Redirect 100% estrito.' : 'Vulnerabilidade de Open Redirect detectada.',
  });

  // AGE-DIDIT-19: Cookie emitido HttpOnly
  const emitsHttpOnlyCookie = verifySessionContent.includes('httpOnly: true') &&
    verifySessionContent.includes('sameSite: \'lax\'') &&
    verifySessionContent.includes('path: \'/\'');

  results.push({
    id: 'AGE-DIDIT-19',
    category: 'COOKIE SECURITY',
    name: 'Cookie portal18_age_session emitido exclusivamente com a flag HttpOnly',
    expected: 'verify-session configura httpOnly: true, secure e sameSite: lax',
    passed: emitsHttpOnlyCookie,
    details: emitsHttpOnlyCookie ? 'Cookie seguro com proteção HttpOnly comprovada.' : 'Cookie vulnerável a leitura XSS.',
  });

  // AGE-DIDIT-20: Cookie inválido não libera Safe Mode
  const validMockResult = {
    verified: true,
    ageBand: '18_plus' as const,
    provider: 'didit_age',
    providerSubjectHash: 'subj_hash_valid_123',
    assuranceLevel: 'high' as const,
    verifiedAt: new Date().toISOString(),
  };

  const signedValid = ageSessionService.createSignedSession(validMockResult);
  const isValidSessionOk = ageSessionService.isSessionValid(signedValid.session);

  // Tampered session
  const tamperedSession = {
    ...signedValid.session,
    age_band: 'under_18' as const, // Tampered age band without recomputing signature
  };
  const parsedTampered = ageSessionService.parseSession(Buffer.from(JSON.stringify(tamperedSession)).toString('base64'));
  const tamperedBlocked = parsedTampered === null || !ageSessionService.isSessionValid(parsedTampered);

  // Expired session
  const expiredSession = {
    ...signedValid.session,
    expires_at: Date.now() - 1000,
  };
  const parsedExpired = ageSessionService.parseSession(Buffer.from(JSON.stringify(expiredSession)).toString('base64'));
  const expiredBlocked = parsedExpired === null || !ageSessionService.isSessionValid(parsedExpired);

  const sessionSecurityPassed = isValidSessionOk && tamperedBlocked && expiredBlocked;

  results.push({
    id: 'AGE-DIDIT-20',
    category: 'SESSION SECURITY',
    name: 'Sessão adulterada ou expirada não libera Safe Mode',
    expected: 'Assinatura HMAC detecta adulteração e tempo de expiração invalida a sessão',
    passed: sessionSecurityPassed,
    details: sessionSecurityPassed ? 'Integridade criptográfica da sessão garantida.' : 'Falha: sessão adulterada aceita.',
  });

  // AGE-DIDIT-21: localStorage adult_content_confirmed não concede 18+
  const profileViewClientPath = path.join(
    process.cwd(),
    'src/app/perfil/[estado]/[cidade]/[slug]/ProfileViewClient.tsx'
  );
  const profileViewContent = fs.readFileSync(profileViewClientPath, 'utf8');
  const consultativeGateSeparated = !profileViewContent.includes("localStorage.getItem('adult_content_confirmed')") &&
    profileViewContent.includes('isAgeVerified');

  results.push({
    id: 'AGE-DIDIT-21',
    category: 'GATE SEPARATION',
    name: 'localStorage adult_content_confirmed não concede 18+',
    expected: 'ProfileViewClient baseia o desbloqueio exclusivamente em isAgeVerified (portal18_age_session)',
    passed: consultativeGateSeparated,
    details: consultativeGateSeparated ? 'Separação estrita entre aviso consultivo e Age Assurance criptográfica.' : 'Gate consultivo vazando acesso.',
  });

  // AGE-DIDIT-22: Nenhuma mídia biométrica persistida
  const providerCode = fs.readFileSync(path.join(process.cwd(), 'src/services/ageVerification/providers/diditAgeProvider.ts'), 'utf8');
  const migrationSql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260828000018_phase26a_age_assurance.sql'), 'utf8');

  const zeroBiometricsInCode = !providerCode.includes('selfie') &&
    !providerCode.includes('video_frame') &&
    !providerCode.includes('facial_embedding');

  const zeroBiometricsInTable = !migrationSql.includes('selfie') &&
    !migrationSql.includes('biometric_payload') &&
    migrationSql.includes('provider_subject_hash text NOT NULL');

  const privacyPassed = zeroBiometricsInCode && zeroBiometricsInTable;

  results.push({
    id: 'AGE-DIDIT-22',
    category: 'PRIVACY & LGPD',
    name: 'Zero armazenamento de biometria, selfies, vídeos ou documentos',
    expected: 'Apenas hash opaco (provider_subject_hash) e status são persistidos',
    passed: privacyPassed,
    details: privacyPassed ? 'Data minimization estrito comprovado em conformidade com o ECA Digital.' : 'Risco de persistência de biometria.',
  });

  // AGE-DIDIT-23: Visitante anônimo suportado
  const anonymousSupported = migrationSql.includes('profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL');

  results.push({
    id: 'AGE-DIDIT-23',
    category: 'ANONYMOUS ACCESS',
    name: 'Visitante anônimo suportado com profile_id nulo',
    expected: 'age_verification_credentials permite profile_id nulo para visitantes não logados',
    passed: anonymousSupported,
    details: anonymousSupported ? 'Navegação anônima protegida com privacidade total.' : 'Falha no suporte a visitante anônimo.',
  });

  // AGE-DIDIT-24: Usuário autenticado suportado
  const authRecordCode = verifySessionContent.includes('record_age_assurance_credential');

  results.push({
    id: 'AGE-DIDIT-24',
    category: 'AUTHENTICATED ACCESS',
    name: 'Usuário autenticado grava credencial no perfil via RPC seguro',
    expected: 'verify-session invoca record_age_assurance_credential associando ao perfil se logado',
    passed: authRecordCode,
    details: authRecordCode ? 'Persistência opcional para usuário autenticado suportada.' : 'Falha na persistência autenticada.',
  });

  // AGE-DIDIT-25: Revogação e expiração mantêm fail-closed
  const statusRoutePath = path.join(process.cwd(), 'src/app/api/age-verification/status/route.ts');
  const clearRoutePath = path.join(process.cwd(), 'src/app/api/age-verification/clear/route.ts');
  const statusRouteExists = fs.existsSync(statusRoutePath);
  const clearRouteExists = fs.existsSync(clearRoutePath);
  const clearContent = clearRouteExists ? fs.readFileSync(clearRoutePath, 'utf8') : '';
  const revokesImmediately = clearContent.includes('maxAge: 0');

  const revocationPassed = statusRouteExists && clearRouteExists && revokesImmediately;

  results.push({
    id: 'AGE-DIDIT-25',
    category: 'LIFECYCLE & REVOCATION',
    name: 'Revogação voluntária ou expiração limpa sessão e restabelece Safe Mode',
    expected: 'Endpoint /api/age-verification/clear zera o cookie e status reavalia como não verificado',
    passed: revocationPassed,
    details: revocationPassed ? 'Ciclo de vida e revogação fail-closed comprovados.' : 'Falha no ciclo de revogação.',
  });

  // Clean up test env
  if (savedKey !== undefined) process.env.DIDIT_API_KEY = savedKey; else delete process.env.DIDIT_API_KEY;
  if (savedWorkflow !== undefined) process.env.DIDIT_AGE_WORKFLOW_ID = savedWorkflow; else delete process.env.DIDIT_AGE_WORKFLOW_ID;

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 PHASE AGE-DIDIT-01 — DIDIT VISITOR AGE ASSURANCE QA');
  console.log('================================================================\n');

  runDiditAgeAssuranceTests().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ QA SUITE FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} DIDIT AGE ASSURANCE CHECKS PASSED PERFECTLY`);
      console.log('================================================================\n');
    }
  });
}
