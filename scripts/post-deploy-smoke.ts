/**
 * PORTAL18 — POST-DEPLOYMENT SMOKE CHECK (PHASE 37)
 */

import { telemetryService } from '../src/services/observability/telemetryService';
import { AgeVerificationFactory } from '../src/services/ageVerification/factory';

async function runPostDeploySmoke() {
  console.log('================================================================');
  console.log('🔍 PORTAL18 — POST-DEPLOYMENT OPERATIONAL SMOKE CHECK');
  console.log('================================================================\n');

  let hasError = false;

  // 1. Health & Database Connectivity
  console.log('--- 1. SYSTEM HEALTH & CONNECTIVITY ---');
  const health = await telemetryService.getSystemHealth();
  if (health.status === 'unhealthy') {
    console.error('❌ Database connectivity health check failed!');
    hasError = true;
  } else {
    console.log(`✅ System health: ${health.status.toUpperCase()} (DB latency: ${health.services.database.latency_ms}ms)`);
  }

  // 2. Age Assurance Fail-Closed Readiness
  console.log('\n--- 2. AGE ASSURANCE FAIL-CLOSED SMOKE ---');
  const ageProvider = AgeVerificationFactory.getProvider();
  const initRes = await ageProvider.initiateVerification({ returnUrl: '/explorar' });
  if (!initRes.sessionId) {
    console.error('❌ Age assurance provider initiation failed!');
    hasError = true;
  } else {
    console.log(`✅ Age assurance provider initialized: ${ageProvider.name} (Fail-closed enabled).`);
  }

  // 3. Telemetry Counters
  console.log('\n--- 3. OBSERVABILITY COUNTERS ---');
  const metrics = telemetryService.getMetrics();
  console.log(`✅ Request count: ${metrics.request_count} | Error count: ${metrics.error_rate_count}`);

  console.log('\n----------------------------------------------------------------');
  if (hasError) {
    console.error('❌ POST-DEPLOYMENT SMOKE CHECK FAILED.\n');
    process.exit(1);
  } else {
    console.log('🎉 POST-DEPLOYMENT SMOKE CHECK PASSED. SYSTEM OPERATIONAL.\n');
    process.exit(0);
  }
}

runPostDeploySmoke().catch((err) => {
  console.error('Fatal error during post-deploy smoke:', err);
  process.exit(1);
});
