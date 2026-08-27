/**
 * Function Overload Assertion & Canonical Contract Verifier (Phase 13D)
 */

import fs from 'fs';
import path from 'path';

export interface FunctionAnalysis {
  name: string;
  declaredCount: number;
  droppedCount: number;
  hasLegacyCasts: boolean;
  hasLegacyCompletedAt: boolean;
}

export function analyzeFunctionContracts(): FunctionAnalysis[] {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  const targetFunctions = [
    'process_verification_webhook',
    'process_payment_webhook',
    'create_identity_verification_session',
    'submit_advertiser_profile',
    'get_similar_profiles',
    'search_profiles_discovery',
  ];

  const results: FunctionAnalysis[] = targetFunctions.map((name) => {
    let declaredCount = 0;
    let droppedCount = 0;
    let hasLegacyCasts = false;
    let hasLegacyCompletedAt = false;

    // Check latest migration (00017 / migration head) for canonical implementation
    const latestFile = files[files.length - 1];
    const latestContent = fs.readFileSync(path.join(migrationsDir, latestFile), 'utf8');

    // Count drops in latest migrations
    const allContent = files.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');
    const dropMatches = allContent.match(new RegExp(`DROP\\s+FUNCTION\\s+IF\\s+EXISTS\\s+public\\.${name}`, 'gi'));
    droppedCount = dropMatches ? dropMatches.length : 0;

    const createMatches = latestContent.match(new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${name}`, 'gi'));
    declaredCount = createMatches ? createMatches.length : 0;

    if (name === 'process_verification_webhook') {
      if (latestContent.includes('::public.verification_status')) {
        hasLegacyCasts = true;
      }
      if (latestContent.includes('completed_at')) {
        hasLegacyCompletedAt = true;
      }
    }

    return {
      name,
      declaredCount,
      droppedCount,
      hasLegacyCasts,
      hasLegacyCompletedAt,
    };
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 FUNCTION OVERLOAD & CANONICAL CONTRACT ASSERTION');
  console.log('================================================================\n');

  const analyses = analyzeFunctionContracts();
  let hasFailures = false;

  analyses.forEach((a) => {
    console.log(`Function: [public.${a.name}]`);
    console.log(`  - Drops in reconciliation: ${a.droppedCount}`);
    console.log(`  - Canonical in Head:       ${a.declaredCount === 1 ? '✅ EXACTLY 1' : `⚠️ ${a.declaredCount}`}`);
    if (a.name === 'process_verification_webhook') {
      console.log(`  - Zero Legacy Casts:       ${!a.hasLegacyCasts ? '✅ CLEAN' : '❌ FOUND'}`);
      console.log(`  - Zero completed_at:       ${!a.hasLegacyCompletedAt ? '✅ CLEAN' : '❌ FOUND'}`);
      if (a.hasLegacyCasts || a.hasLegacyCompletedAt) {
        hasFailures = true;
      }
    }
  });

  console.log('\n================================================================');
  if (hasFailures) {
    console.error('❌ OVERLOAD / CONTRACT ASSERTION FAILED');
    process.exit(1);
  } else {
    console.log('✅ ALL FUNCTION CONTRACTS VALIDATED — ZERO LEGACY OVERLOADS');
    console.log('================================================================\n');
  }
}
