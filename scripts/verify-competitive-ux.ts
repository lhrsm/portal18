/**
 * ============================================================================
 * PHASE 24 — COMPETITIVE UX/UI REFINEMENT VERIFICATION SUITE
 * ============================================================================
 */

import { publicProfilesService } from '../src/services/publicProfilesService';
import { locationService } from '../src/services/locationService';
import { searchService } from '../src/services/discovery/searchService';
import { recommendationService } from '../src/services/discovery/recommendationService';

export interface UXCheckResult {
  id: string;
  category: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export async function runCompetitiveUXVerification(): Promise<UXCheckResult[]> {
  const results: UXCheckResult[] = [];

  // 1. HOME DATA FEEDS (Density & Discoverability)
  const [recs, recents, cats, cities, activeAdv] = await Promise.all([
    publicProfilesService.getRecommendedAdvertisers(10),
    publicProfilesService.getRecentAdvertisers(10),
    publicProfilesService.getCategoriesWithCount(),
    publicProfilesService.getCitiesWithActiveProfiles(),
    publicProfilesService.getPublicAdvertisers({ limit: 10, sort: 'active' }),
  ]);

  const homeFeedsPass =
    recs.length > 0 &&
    recents.length > 0 &&
    cats.length >= 6 &&
    cities.length >= 8 &&
    activeAdv.data.length > 0;

  results.push({
    id: 'UX-HOME-01',
    category: 'HOME PAGE DENSITY',
    name: 'Multi-section discovery feed population (Recs, Recents, Active, Categories, Cities)',
    expected: 'All home feeds populated with real non-zero counts',
    passed: homeFeedsPass,
    details: `Recs: ${recs.length}, Recents: ${recents.length}, Cats: ${cats.length}, Cities: ${cities.length}, Active: ${activeAdv.data.length}`,
  });

  // 2. SALVADOR VITRINE (24 Profiles + Bairros)
  const ssaRes = await publicProfilesService.getPublicAdvertisers({ city: 'salvador', limit: 30 });
  const ssaProfiles = ssaRes.data;
  const ssaBairros = Array.from(new Set(ssaProfiles.map((p) => p.neighborhood).filter(Boolean)));

  const ssaPass = ssaProfiles.length === 24 && ssaBairros.length >= 8;

  results.push({
    id: 'UX-SALVADOR-01',
    category: 'SALVADOR VITRINE',
    name: 'Salvador showcase volume and neighborhood diversity',
    expected: '24 profiles in Salvador distributed across >= 8 distinct neighborhoods',
    passed: ssaPass,
    details: `Profiles: ${ssaProfiles.length}, Distinct Bairros: ${ssaBairros.length} (${ssaBairros.slice(0, 4).join(', ')}...)`,
  });

  // 3. EXPLORE ENGINE & SEARCH RPC FALLBACK
  const exploreRes = await searchService.searchProfiles({ limit: 24, page: 1 });
  const explorePage2 = await searchService.searchProfiles({ limit: 24, page: 2 });

  const explorePass = exploreRes.profiles.length === 24 && explorePage2.profiles.length === 24 && exploreRes.hasMore;

  results.push({
    id: 'UX-EXPLORE-01',
    category: 'EXPLORE & SEARCH',
    name: 'Search discovery service pagination and card formatting',
    expected: 'Explore returns 24 formatted DiscoveryProfileCards per page with hasMore=true',
    passed: explorePass,
    details: `P1 count: ${exploreRes.profiles.length}, P2 count: ${explorePage2.profiles.length}, hasMore: ${exploreRes.hasMore}`,
  });

  // 4. SIMILAR PROFILES RECOMMENDATIONS
  const targetAdv = ssaProfiles[0];
  const similar = await recommendationService.getSimilarProfiles(targetAdv.advertiser_id, 4);
  const excludesSelf = similar.every((p) => p.advertiser_id !== targetAdv.advertiser_id);

  results.push({
    id: 'UX-SIMILAR-01',
    category: 'RECOMMENDATIONS',
    name: 'Similar profiles recommendation excluding self',
    expected: 'Returns 4 similar profiles without current advertiser ID',
    passed: similar.length === 4 && excludesSelf,
    details: `Similar count: ${similar.length}, Excludes self: ${excludesSelf ? 'YES' : 'NO'}`,
  });

  // 5. PROFILE RESOLUTION & CONTACT READY
  const marina = await publicProfilesService.getPublicProfileBySlug('bahia', 'salvador', 'demo-marina-alves-salvador');
  const marinaResolved = Boolean(marina && marina.stage_name === 'Marina Alves' && marina.age === 26);

  results.push({
    id: 'UX-PROFILE-01',
    category: 'PROFILE PAGE',
    name: 'Public profile resolution with full attributes (Marina Alves)',
    expected: 'Marina Alves resolved with age 26 in Salvador/Barra',
    passed: marinaResolved,
    details: `Resolved: ${marina?.stage_name}, Age: ${marina?.age}, Location: ${marina?.city_name}/${marina?.neighborhood}`,
  });

  // 6. ISABELA MARTINS RESOLUTION (Phase 24B Target)
  const isabela = await publicProfilesService.getPublicProfileBySlug('bahia', 'salvador', 'demo-isabela-martins-salvador');
  const isabelaResolved = Boolean(isabela && isabela.stage_name === 'Isabela Martins' && isabela.age === 25 && isabela.neighborhood === 'Graça');

  results.push({
    id: 'UX-PROFILE-02',
    category: 'PROFILE PAGE 24B',
    name: 'Target profile resolution (Isabela Martins in Graça)',
    expected: 'Isabela Martins resolved with age 25 in Salvador/Graça',
    passed: isabelaResolved,
    details: `Resolved: ${isabela?.stage_name}, Age: ${isabela?.age}, Location: ${isabela?.city_name}/${isabela?.neighborhood}`,
  });

  // 7. SIMILAR PROFILES APPROVED MEDIA INTEGRITY
  const isabelaSimilar = await recommendationService.getSimilarProfiles(isabela?.advertiser_id || 'demo-isabela', 4, 'salvador', 'bahia');
  const allSimilarHavePhotos = isabelaSimilar.length === 4 && isabelaSimilar.every((p) => Boolean(p.thumbnail_url));

  results.push({
    id: 'UX-SIMILAR-02',
    category: 'SIMILAR MEDIA INTEGRITY',
    name: 'Zero moderation placeholders in similar recommendations',
    expected: '4 similar profiles returned with valid non-null approved thumbnail URLs',
    passed: allSimilarHavePhotos,
    details: `Count: ${isabelaSimilar.length}, All photos valid: ${allSimilarHavePhotos ? 'YES' : 'NO'}`,
  });

  return results;
}

if (require.main === module) {
  console.log('\n================================================================');
  console.log('🎨 PHASE 24 — COMPETITIVE UX/UI REFINEMENT AUDIT');
  console.log('================================================================\n');

  runCompetitiveUXVerification().then((checks) => {
    let failedCount = 0;
    checks.forEach((c) => {
      console.log(`[${c.id}] ${c.category}: ${c.name}`);
      console.log(`  Expected: ${c.expected}`);
      console.log(`  Result:   ${c.passed ? '✅ PASS' : '❌ FAIL'} (${c.details})`);
      if (!c.passed) failedCount++;
    });

    console.log('\n================================================================');
    if (failedCount > 0) {
      console.error(`❌ COMPETITIVE UX AUDIT FAILED: ${failedCount} checks failed.`);
      process.exit(1);
    } else {
      console.log(`✅ ALL ${checks.length} COMPETITIVE UX CHECKS PASSED`);
      console.log('================================================================\n');
    }
  });
}
