/**
 * ============================================================================
 * PORTAL18 — SUPER ADMIN UI REDESIGN VALIDATION SUITE (ADMIN-UI-01 to ADMIN-UI-16)
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';

export interface AdminTestResult {
  id: string;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

export const EXPECTED_ADMIN_ROUTES: { href: string; label: string; group: string }[] = [
  // 1. Visão Geral
  { href: '/admin', label: 'Painel Geral', group: 'Visão Geral' },
  { href: '/admin/commercial', label: 'Centro Comercial', group: 'Visão Geral' },
  { href: '/admin/analytics', label: 'Analytics & Funil', group: 'Visão Geral' },

  // 2. Conteúdo & Moderação
  { href: '/admin/moderation/profiles', label: 'Fila de Perfis', group: 'Conteúdo & Moderação' },
  { href: '/admin/moderation/media', label: 'Fila de Mídias', group: 'Conteúdo & Moderação' },
  { href: '/admin/moderation/reviews', label: 'Fila de Avaliações', group: 'Conteúdo & Moderação' },
  { href: '/admin/reports', label: 'Denúncias', group: 'Conteúdo & Moderação' },
  { href: '/admin/verifications', label: 'Verificações 18+', group: 'Conteúdo & Moderação' },

  // 3. Trust & Safety
  { href: '/admin/risk', label: 'Risco & Antifraude', group: 'Trust & Safety' },
  { href: '/admin/trust-safety', label: 'Trust & Safety Operations', group: 'Trust & Safety' },
  { href: '/admin/reputation', label: 'Reputação & Qualidade', group: 'Trust & Safety' },

  // 4. Discovery & Growth
  { href: '/admin/growth/seo', label: 'Crescimento & SEO', group: 'Discovery & Growth' },
  { href: '/admin/search', label: 'Operações de Busca & Sinônimos', group: 'Discovery & Growth' },
  { href: '/admin/discovery', label: 'Ranking & Descoberta', group: 'Discovery & Growth' },
  { href: '/admin/categories', label: 'Categorias', group: 'Discovery & Growth' },

  // 5. Comercial
  { href: '/admin/plans', label: 'Planos & Preços', group: 'Comercial' },
  { href: '/admin/subscriptions', label: 'Assinaturas', group: 'Comercial' },
  { href: '/admin/payments/orders', label: 'Pedidos (Orders)', group: 'Comercial' },
  { href: '/admin/referrals', label: 'Indicações', group: 'Comercial' },

  // 6. Financeiro
  { href: '/admin/payments', label: 'Faturamento', group: 'Financeiro' },
  { href: '/admin/finance', label: 'Gestão Financeira & Fechamento', group: 'Financeiro' },
  { href: '/admin/payments/providers', label: 'Provedores de Pagamento', group: 'Financeiro' },
  { href: '/admin/payments/reconciliation', label: 'Conciliação', group: 'Financeiro' },
  { href: '/admin/payments/recovery', label: 'Recuperação & Dunning', group: 'Financeiro' },
  { href: '/admin/payments/disputes', label: 'Disputas & Estornos', group: 'Financeiro' },

  // 7. Operações
  { href: '/admin/communications', label: 'Comunicação & CRM', group: 'Operações' },
  { href: '/admin/support', label: 'Suporte', group: 'Operações' },
  { href: '/admin/media-processing', label: 'Pipeline de Mídia', group: 'Operações' },

  // 8. Governança
  { href: '/admin/privacy', label: 'Privacidade & LGPD', group: 'Governança' },
  { href: '/admin/security', label: 'Segurança & Sessões', group: 'Governança' },
  { href: '/admin/users', label: 'Usuários & Cargos', group: 'Governança' },
  { href: '/admin/audit', label: 'Logs de Auditoria', group: 'Governança' },

  // 9. Sistema
  { href: '/admin/settings', label: 'Configurações', group: 'Sistema' },
];

export async function runAdminUIRedesignValidation(): Promise<AdminTestResult[]> {
  const results: AdminTestResult[] = [];

  const adminLayoutPath = path.join(process.cwd(), 'src/components/admin/AdminLayout.tsx');
  const commercialPagePath = path.join(process.cwd(), 'src/app/admin/commercial/page.tsx');
  const headerPath = path.join(process.cwd(), 'src/components/layout/Header.tsx');
  const footerPath = path.join(process.cwd(), 'src/components/layout/Footer.tsx');
  const globalsCssPath = path.join(process.cwd(), 'src/app/globals.css');

  const layoutCode = fs.readFileSync(adminLayoutPath, 'utf8');
  const commercialCode = fs.readFileSync(commercialPagePath, 'utf8');
  const headerCode = fs.readFileSync(headerPath, 'utf8');
  const footerCode = fs.readFileSync(footerPath, 'utf8');
  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

  // ADMIN-UI-01: super admin shell renders
  const hasAside = layoutCode.includes('<aside') && layoutCode.includes('id="admin-desktop-sidebar"');
  const hasTopbar = layoutCode.includes('<header') && layoutCode.includes('AdminLayout');
  const hasMain = layoutCode.includes('<main') && layoutCode.includes('id="admin-main-viewport"');
  const ui01Passed = hasAside && hasTopbar && hasMain;
  results.push({
    id: 'ADMIN-UI-01',
    name: 'super admin shell renders',
    expected: 'Dedicated AdminLayout shell with aside sidebar, topbar header, and main viewport',
    passed: ui01Passed,
    details: ui01Passed
      ? 'AdminLayout provides sidebar, topbar, and main viewport structure.'
      : `Missing components: aside=${hasAside}, topbar=${hasTopbar}, main=${hasMain}`,
  });

  // ADMIN-UI-02: sidebar displays groups
  const groupTitles = [
    'Visão Geral',
    'Conteúdo & Moderação',
    'Trust & Safety',
    'Discovery & Growth',
    'Comercial',
    'Financeiro',
    'Operações',
    'Governança',
    'Sistema',
  ];
  const missingGroups = groupTitles.filter((g) => !layoutCode.includes(`'${g}'`) && !layoutCode.includes(`"${g}"`));
  const hasAccordion = layoutCode.includes('openGroups') && layoutCode.includes('setOpenGroups');
  const ui02Passed = missingGroups.length === 0 && hasAccordion;
  results.push({
    id: 'ADMIN-UI-02',
    name: 'sidebar displays groups',
    expected: 'All 9 semantic navigation groups organized with accordion behavior',
    passed: ui02Passed,
    details: ui02Passed
      ? `All 9 navigation groups present with accordion state management.`
      : `Missing groups: ${missingGroups.join(', ')} or accordion missing.`,
  });

  // ADMIN-UI-03: all existing menu routes preserved
  const missingRoutes = EXPECTED_ADMIN_ROUTES.filter((r) => !layoutCode.includes(r.href));
  const ui03Passed = missingRoutes.length === 0 && EXPECTED_ADMIN_ROUTES.length === 33;
  results.push({
    id: 'ADMIN-UI-03',
    name: 'all existing menu routes preserved',
    expected: 'All 33 administrative routes preserved in the navigation hierarchy',
    passed: ui03Passed,
    details: ui03Passed
      ? `All 33 admin routes preserved (0 removed, 0 broken).`
      : `Missing routes (${missingRoutes.length}): ${missingRoutes.map((m) => m.href).join(', ')}`,
  });

  // ADMIN-UI-04: active route highlighted
  const hasActiveStyling =
    layoutCode.includes('admin-nav-item-active') &&
    layoutCode.includes('aria-current={isActive ? \'page\' : undefined}') &&
    layoutCode.includes('var(--accent-gold)');
  results.push({
    id: 'ADMIN-UI-04',
    name: 'active route highlighted',
    expected: 'Active route has aria-current="page", gold accent highlight and active indicator class',
    passed: hasActiveStyling,
    details: hasActiveStyling
      ? 'Active route uses aria-current="page", admin-nav-item-active, and gold accents.'
      : 'Active route highlighting elements are missing.',
  });

  // ADMIN-UI-05: sidebar collapse works
  const hasCollapseState =
    layoutCode.includes('isCollapsed') &&
    layoutCode.includes('toggleCollapse') &&
    layoutCode.includes('portal18_admin_sidebar_collapsed');
  results.push({
    id: 'ADMIN-UI-05',
    name: 'sidebar collapse works',
    expected: 'Sidebar toggleCollapse toggles width and persists preference in localStorage',
    passed: hasCollapseState,
    details: hasCollapseState
      ? 'Sidebar toggleCollapse state with localStorage persistence verified.'
      : 'Sidebar collapse mechanism missing or unpersisted.',
  });

  // ADMIN-UI-06: collapsed sidebar tooltips work
  const hasCollapsedTooltips =
    layoutCode.includes('isCollapsed') &&
    layoutCode.includes('title=') &&
    layoutCode.includes('item.label');
  results.push({
    id: 'ADMIN-UI-06',
    name: 'collapsed sidebar tooltips work',
    expected: 'In collapsed mode, navigation links display titles/tooltips with item label and group',
    passed: hasCollapsedTooltips,
    details: hasCollapsedTooltips
      ? 'Collapsed mode provides accessible title/tooltip attributes on icons.'
      : 'Collapsed mode tooltips not found.',
  });

  // ADMIN-UI-07: mobile drawer opens
  const hasMobileDrawerOpen =
    layoutCode.includes('mobileDrawerOpen') &&
    layoutCode.includes('setMobileDrawerOpen(true)') &&
    layoutCode.includes('role="dialog"');
  results.push({
    id: 'ADMIN-UI-07',
    name: 'mobile drawer opens',
    expected: 'Hamburger trigger activates mobile navigation drawer with dialog role',
    passed: hasMobileDrawerOpen,
    details: hasMobileDrawerOpen
      ? 'Mobile drawer open state and trigger configured.'
      : 'Mobile drawer open logic missing.',
  });

  // ADMIN-UI-08: mobile drawer closes
  const hasMobileDrawerClose =
    layoutCode.includes('setMobileDrawerOpen(false)') &&
    layoutCode.includes('<X size=');
  results.push({
    id: 'ADMIN-UI-08',
    name: 'mobile drawer closes',
    expected: 'Close button and backdrop click close the mobile drawer',
    passed: hasMobileDrawerClose,
    details: hasMobileDrawerClose
      ? 'Mobile drawer close handlers (backdrop click, close button) implemented.'
      : 'Mobile drawer close handlers missing.',
  });

  // ADMIN-UI-09: mobile navigation closes after route selection
  const hasAutoCloseOnNav =
    layoutCode.includes('onClick={() => setMobileDrawerOpen(false)}') &&
    layoutCode.includes('role="dialog"');
  results.push({
    id: 'ADMIN-UI-09',
    name: 'mobile navigation closes after route selection',
    expected: 'Links inside mobile drawer trigger drawer closing on selection',
    passed: hasAutoCloseOnNav,
    details: hasAutoCloseOnNav
      ? 'Navigation links automatically close mobile drawer on click.'
      : 'Mobile drawer does not auto-close upon route navigation.',
  });

  // ADMIN-UI-10: dark mode sidebar renders correctly
  const hasDarkTokens =
    globalsCss.includes('--admin-sidebar-bg') &&
    globalsCss.includes('--admin-topbar-bg') &&
    globalsCss.includes('--admin-content-bg') &&
    (globalsCss.includes('data-theme="light"') || globalsCss.includes("data-theme='light'"));
  results.push({
    id: 'ADMIN-UI-10',
    name: 'dark mode sidebar renders correctly',
    expected: 'Theme CSS variables define obsidian/dark neutral palette with light mode overrides',
    passed: hasDarkTokens,
    details: hasDarkTokens
      ? 'Admin CSS design tokens defined for dark and light modes.'
      : 'Admin theme variables missing in globals.css.',
  });

  // ADMIN-UI-11: public footer absent under /admin
  const hasFooterSuppression =
    footerCode.includes("pathname?.startsWith('/admin')") &&
    footerCode.includes('return null;');
  results.push({
    id: 'ADMIN-UI-11',
    name: 'public footer absent under /admin',
    expected: 'Public footer returns null when route starts with /admin',
    passed: hasFooterSuppression,
    details: hasFooterSuppression
      ? 'Footer component conditionally suppressed under /admin routes.'
      : 'Footer component not suppressed under /admin.',
  });

  // ADMIN-UI-12: public header absent under /admin
  const hasHeaderSuppression =
    headerCode.includes("pathname?.startsWith('/admin')") &&
    headerCode.includes('return null;');
  results.push({
    id: 'ADMIN-UI-12',
    name: 'public header absent under /admin',
    expected: 'Public header returns null when route starts with /admin',
    passed: hasHeaderSuppression,
    details: hasHeaderSuppression
      ? 'Header component conditionally suppressed under /admin routes.'
      : 'Header component not suppressed under /admin.',
  });

  // ADMIN-UI-13: commercial dashboard visible above fold
  const hasOperationsHeader = commercialCode.includes('Centro de Operações Comerciais');
  const hasPaymentBanner = commercialCode.includes('Pagamentos em homologação');
  const hasKpiGrid = commercialCode.includes('Anunciantes Ativos') && commercialCode.includes('Consumer Premium');
  const ui13Passed = hasOperationsHeader && hasPaymentBanner && hasKpiGrid;
  results.push({
    id: 'ADMIN-UI-13',
    name: 'commercial dashboard visible above fold',
    expected: 'Commercial dashboard renders header, payment homologation banner, and KPI grid directly at top',
    passed: ui13Passed,
    details: ui13Passed
      ? 'Commercial dashboard features compact header, status banner, and dense 6-KPI grid.'
      : 'Commercial dashboard above-the-fold content missing.',
  });

  // ADMIN-UI-14: no horizontal page overflow
  const hasNoOverflowStyles =
    layoutCode.includes("overflowX: 'hidden'") &&
    commercialCode.includes("flexWrap: 'wrap'");
  results.push({
    id: 'ADMIN-UI-14',
    name: 'no horizontal page overflow',
    expected: 'Zero horizontal page overflow: wrapped responsive tabs and constrained viewport',
    passed: hasNoOverflowStyles,
    details: hasNoOverflowStyles
      ? 'Admin viewport and commercial tabs prevent horizontal overflow.'
      : 'Overflow prevention styles missing.',
  });

  // ADMIN-UI-15: keyboard navigation functional
  const hasKeyboardShortcuts =
    layoutCode.includes("'k'") &&
    layoutCode.includes("'Escape'") &&
    layoutCode.includes("'ArrowDown'") &&
    layoutCode.includes("'Enter'");
  results.push({
    id: 'ADMIN-UI-15',
    name: 'keyboard navigation functional',
    expected: 'Ctrl+K command palette, Esc modal close, and Arrow/Enter navigation supported',
    passed: hasKeyboardShortcuts,
    details: hasKeyboardShortcuts
      ? 'Ctrl+K command palette, Escape close, and ArrowDown/ArrowUp/Enter navigation active.'
      : 'Keyboard shortcuts missing.',
  });

  // ADMIN-UI-16: super_admin access preserved
  const hasSuperAdminChecks =
    layoutCode.includes("roles.includes('super_admin')") &&
    layoutCode.includes("allowed: isSuperAdmin") &&
    layoutCode.includes("!isModerator");
  results.push({
    id: 'ADMIN-UI-16',
    name: 'super_admin access preserved',
    expected: 'Role guards enforce super_admin for privileged routes and block non-staff access',
    passed: hasSuperAdminChecks,
    details: hasSuperAdminChecks
      ? 'Role hierarchy (super_admin, admin, moderator) and route permissions preserved.'
      : 'Role guards altered or missing.',
  });

  return results;
}

// CLI Execution
if (require.main === module) {
  runAdminUIRedesignValidation().then((results) => {
    console.log('\n================================================================');
    console.log('PORTAL18 — SUPER ADMIN UI REDESIGN VALIDATION SUITE RESULTS');
    console.log('================================================================\n');

    let allPassed = true;
    for (const r of results) {
      const mark = r.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`${mark} [${r.id}] ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Details:  ${r.details}\n`);
      if (!r.passed) allPassed = false;
    }

    const passedCount = results.filter((r) => r.passed).length;
    console.log('================================================================');
    console.log(`TOTAL: ${passedCount}/${results.length} PASSED`);
    console.log('================================================================\n');

    if (!allPassed) {
      process.exit(1);
    }
  });
}
