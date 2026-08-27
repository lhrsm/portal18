/**
 * ============================================================================
 * PHASE 23 — DEMO DATASET & VISUAL CONTENT VERIFICATION SUITE
 * ============================================================================
 */

import { DEMO_PUBLIC_ADVERTISERS, DEMO_CATEGORIES, DEMO_CITIES, DEMO_STATES } from '../src/data/demoProfiles';
import { publicProfilesService } from '../src/services/publicProfilesService';
import { locationService } from '../src/services/locationService';

export interface DemoCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runDemoDatasetVerification(): Promise<DemoCheckResult[]> {
  const results: DemoCheckResult[] = [];

  // 1. VOLUME & DISTRIBUTION
  const totalCount = DEMO_PUBLIC_ADVERTISERS.length;
  const salvadorCount = DEMO_PUBLIC_ADVERTISERS.filter((p) => p.city_slug === 'salvador').length;
  const spCount = DEMO_PUBLIC_ADVERTISERS.filter((p) => p.city_slug === 'sao-paulo').length;
  const rjCount = DEMO_PUBLIC_ADVERTISERS.filter((p) => p.city_slug === 'rio-de-janeiro').length;
  const bhCount = DEMO_PUBLIC_ADVERTISERS.filter((p) => p.city_slug === 'belo-horizonte').length;

  const distributionMatch =
    totalCount === 60 &&
    salvadorCount === 24 &&
    spCount === 10 &&
    rjCount === 8 &&
    bhCount === 5;

  results.push({
    id: 'DEMO-VOL-01',
    category: 'VOLUME & DISTRIBUTION',
    name: 'Total profile count and regional quota adherence',
    expected: '60 profiles total (Salvador: 24, SP: 10, RJ: 8, BH: 5, others: 13)',
    passed: distributionMatch,
    details: `Total: ${totalCount}, Salvador: ${salvadorCount}, SP: ${spCount}, RJ: ${rjCount}, BH: ${bhCount}`,
  });

  // 2. AGE SAFETY & FICTITIOUS DATA
  const allAdults = DEMO_PUBLIC_ADVERTISERS.every((p) => (p.age || 0) >= 18);
  const allPrefixed = DEMO_PUBLIC_ADVERTISERS.every((p) => p.slug.startsWith('demo-'));

  results.push({
    id: 'DEMO-SAFETY-01',
    category: 'SAFETY & COMPLIANCE',
    name: 'Age validation (18+) and deterministic demo identifier tagging',
    expected: '100% profiles age >= 18 and slug prefix "demo-"',
    passed: allAdults && allPrefixed,
    details: `All >= 18: ${allAdults ? 'YES' : 'NO'}, All demo-prefixed: ${allPrefixed ? 'YES' : 'NO'}`,
  });

  // 3. EXPLORE PAGINATION (3 PAGES)
  const page1 = await publicProfilesService.getPublicAdvertisers({ limit: 24, page: 1 });
  const page2 = await publicProfilesService.getPublicAdvertisers({ limit: 24, page: 2 });
  const page3 = await publicProfilesService.getPublicAdvertisers({ limit: 24, page: 3 });

  const paginationValid =
    page1.data.length === 24 &&
    page2.data.length === 24 &&
    page3.data.length === 12 &&
    page1.totalCount === 60;

  results.push({
    id: 'DEMO-PAGINATION-01',
    category: 'EXPLORE & PAGINATION',
    name: '3-page server pagination test (24 per page)',
    expected: 'Page 1: 24, Page 2: 24, Page 3: 12, Total: 60',
    passed: paginationValid,
    details: `P1: ${page1.data.length}, P2: ${page2.data.length}, P3: ${page3.data.length}, Total: ${page1.totalCount}`,
  });

  // 4. SALVADOR FILTER & DETAIL LOOKUP
  const ssaRes = await publicProfilesService.getPublicAdvertisers({ city: 'salvador', limit: 30 });
  const marinaProfile = await publicProfilesService.getPublicProfileBySlug(
    'bahia',
    'salvador',
    'demo-marina-alves-salvador'
  );

  results.push({
    id: 'DEMO-SALVADOR-01',
    category: 'PUBLIC SURFACES',
    name: 'Salvador filter query and individual profile resolution',
    expected: '24 profiles for Salvador, profile Marina Alves resolved with full bio and photo',
    passed: ssaRes.data.length === 24 && Boolean(marinaProfile?.stage_name === 'Marina Alves'),
    details: `Salvador count: ${ssaRes.data.length}, Profile resolved: ${marinaProfile?.stage_name} (${marinaProfile?.neighborhood})`,
  });

  // 5. CATEGORIES AGGREGATION
  const catsWithCount = await publicProfilesService.getCategoriesWithCount();
  const totalCatAssigned = catsWithCount.reduce((acc, c) => acc + c.profileCount, 0);

  results.push({
    id: 'DEMO-CATEGORIES-01',
    category: 'CATEGORIES',
    name: 'Category distribution and dynamic profile counts aggregation',
    expected: '6 active categories populated with positive profile counts',
    passed: catsWithCount.length === 6 && totalCatAssigned > 60,
    details: `Categories: ${catsWithCount.length}, Total Assigned: ${totalCatAssigned}`,
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🔍 PHASE 23 — DEMO DATASET & VISUAL CONTENT AUDIT');
  console.log('================================================================\n');

  runDemoDatasetVerification().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ DEMO AUDIT FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} DEMO CONTENT CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
