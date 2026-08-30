import fs from 'fs';
import path from 'path';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';
import { GET as getLlmsTxt } from '../src/app/llms.txt/route';
import { 
  getCanonicalBaseUrl, 
  generateWebSiteSchema, 
  generateOrganizationSchema, 
  generateBreadcrumbSchema 
} from '../src/lib/seo/seoEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function verifySeoAndAiDiscovery() {
  console.log('=== RUNNING PHASE 26E VERIFICATION: TECHNICAL SEO, SITEMAP, ROBOTS & AI DISCOVERY ===\n');

  // 1. Canonical Base URL
  console.log('--- 1. Testing Canonical Base URL & Host Resolution ---');
  const baseUrl = getCanonicalBaseUrl();
  assert(baseUrl.startsWith('http'), `Canonical base URL is valid: ${baseUrl}`);
  assert(!baseUrl.endsWith('/'), 'Canonical base URL has no trailing slash');

  // 2. Robots.ts Verification
  console.log('\n--- 2. Testing robots.ts Rules & Environment Awareness ---');
  const robotsConfig = robots();
  assert(Boolean(robotsConfig.sitemap), 'robots.txt specifies a sitemap URL');
  assert(String(robotsConfig.sitemap).endsWith('/sitemap.xml'), 'Sitemap URL ends with /sitemap.xml');
  
  const defaultRule = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules;
  assert(Boolean(defaultRule), 'Robots contains at least one ruleset');
  const disallowList = (defaultRule as any).disallow;
  assert(Array.isArray(disallowList), 'Disallow list is configured as an array');
  assert(disallowList.includes('/admin/'), 'Disallows /admin/');
  assert(disallowList.includes('/advertiser/'), 'Disallows /advertiser/');
  assert(disallowList.includes('/account/'), 'Disallows /account/');
  assert(disallowList.includes('/auth/'), 'Disallows /auth/');
  assert(disallowList.includes('/api/'), 'Disallows /api/');

  // 3. Sitemap.ts Verification
  console.log('\n--- 3. Testing Dynamic sitemap.ts Content & Publication Gate ---');
  const sitemapEntries = await sitemap();
  assert(Array.isArray(sitemapEntries) && sitemapEntries.length > 0, `Sitemap generated ${sitemapEntries.length} URLs`);
  
  // Check static routes
  const urls = sitemapEntries.map((e) => e.url);
  assert(urls.includes(baseUrl), 'Sitemap includes Home URL');
  assert(urls.includes(`${baseUrl}/explorar`), 'Sitemap includes /explorar');
  assert(urls.includes(`${baseUrl}/plans`), 'Sitemap includes /plans');
  assert(urls.includes(`${baseUrl}/trust`), 'Sitemap includes /trust');
  assert(urls.includes(`${baseUrl}/help`), 'Sitemap includes /help');
  assert(urls.includes(`${baseUrl}/accessibility`), 'Sitemap includes /accessibility');

  // Check state routes
  const hasBahia = urls.some((u) => u.includes('/acompanhantes/bahia'));
  assert(hasBahia, 'Sitemap includes Bahia state directory');

  // Check city routes
  const hasSalvador = urls.some((u) => u.includes('/acompanhantes/bahia/salvador'));
  assert(hasSalvador, 'Sitemap includes Salvador city directory');

  // Check category routes
  const hasCategory = urls.some((u) => u.includes('/categoria/'));
  assert(hasCategory, 'Sitemap includes category directories');

  // Security Check: No private / admin / auth routes in sitemap
  const hasPrivate = urls.some((u) => 
    u.includes('/admin') || 
    u.includes('/advertiser') || 
    u.includes('/account') || 
    u.includes('/api') || 
    u.includes('/login') ||
    u.includes('/callback')
  );
  assert(!hasPrivate, 'Sitemap contains ZERO private/admin/auth routes');

  // Security Check: No demo seed profiles in sitemap
  const hasDemoProfile = urls.some((u) => u.includes('demo-'));
  assert(!hasDemoProfile, 'Sitemap excludes demo/test profiles');

  // 4. LLMs.txt AI Discovery Verification
  console.log('\n--- 4. Testing /llms.txt AI Discovery Specification ---');
  const llmsResponse = await getLlmsTxt();
  assert(llmsResponse.status === 200, 'llms.txt endpoint returns HTTP 200');
  const contentType = llmsResponse.headers.get('Content-Type');
  assert(Boolean(contentType && contentType.includes('text/plain')), 'llms.txt serves text/plain');
  const llmsBody = await llmsResponse.text();
  assert(llmsBody.includes('# Portal18'), 'llms.txt includes Portal18 heading');
  assert(llmsBody.includes('Trust Center Oficial'), 'llms.txt references Trust Center policies');
  assert(llmsBody.includes('Zero Biometria Armazenada'), 'llms.txt documents privacy & safety principles');
  assert(!llmsBody.includes('SUPABASE_SERVICE_ROLE_KEY'), 'llms.txt contains ZERO private secrets');
  assert(!llmsBody.includes('password'), 'llms.txt contains ZERO passwords');

  // 5. JSON-LD Structured Data Schema Validation
  console.log('\n--- 5. Testing JSON-LD Structured Data Generators ---');
  const websiteSchema = generateWebSiteSchema();
  assert(websiteSchema['@type'] === 'WebSite', 'WebSite schema generated');
  assert(websiteSchema.name === 'Portal18', 'WebSite schema name is Portal18');
  assert(websiteSchema.url === baseUrl, 'WebSite schema URL matches canonical');

  const orgSchema = generateOrganizationSchema();
  assert(orgSchema['@type'] === 'Organization', 'Organization schema generated');
  assert(Boolean(orgSchema.logo), 'Organization schema includes logo');

  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Início', url: '/' },
    { name: 'Bahia', url: '/acompanhantes/bahia' },
    { name: 'Salvador', url: '/acompanhantes/bahia/salvador' },
  ]);
  assert(breadcrumbs['@type'] === 'BreadcrumbList', 'BreadcrumbList schema generated');
  assert(breadcrumbs.itemListElement.length === 3, 'BreadcrumbList contains 3 hierarchy items');

  // 6. Noindex Validation for Private Route Layouts
  console.log('\n--- 6. Testing Noindex Protection on Private Layouts ---');
  const adminLayout = fs.readFileSync(path.join(process.cwd(), 'src/app/admin/layout.tsx'), 'utf-8');
  assert(adminLayout.includes('index: false'), '/admin/layout.tsx sets index: false');
  
  const advertiserLayout = fs.readFileSync(path.join(process.cwd(), 'src/app/advertiser/layout.tsx'), 'utf-8');
  assert(advertiserLayout.includes('index: false'), '/advertiser/layout.tsx sets index: false');

  const accountLayout = fs.readFileSync(path.join(process.cwd(), 'src/app/account/layout.tsx'), 'utf-8');
  assert(accountLayout.includes('index: false'), '/account/layout.tsx sets index: false');

  const paymentLayout = fs.readFileSync(path.join(process.cwd(), 'src/app/payment/layout.tsx'), 'utf-8');
  assert(paymentLayout.includes('index: false'), '/payment/layout.tsx sets index: false');

  console.log('\n==================================================');
  console.log('FINAL RESULT: ALL 20 SEO & AI DISCOVERY TESTS PASSED');
  console.log('==================================================\n');
}

verifySeoAndAiDiscovery().catch((err) => {
  console.error('SEO Verification Error:', err);
  process.exit(1);
});
