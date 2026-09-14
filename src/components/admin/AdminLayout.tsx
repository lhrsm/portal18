'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  LayoutDashboard,
  UserCheck,
  Image as ImageIcon,
  AlertTriangle,
  FileCheck2,
  Users,
  FileSpreadsheet,
  Tag,
  Settings,
  Menu,
  X,
  Lock,
  Crown,
  CreditCard,
  Sparkles,
  Compass,
  LifeBuoy,
  Scale,
  Shield,
  BarChart3,
  Activity,
  Gift,
  Layers,
  RotateCcw,
  Bell,
  Award,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  LogOut,
  User,
  Home,
  Check,
  Command
} from 'lucide-react';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export interface NavItemConfig {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  allowed: boolean;
}

export interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, roles, isLoading, signOut } = useAuth();


  // Permissions
  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  const isModerator = roles.includes('moderator') || isAdmin;

  // Sidebar & Drawer States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(0);

  // Group Accordions: openGroups[groupId] = boolean
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    moderation: true,
    trust_safety: true,
    discovery: false,
    commercial: true,
    finance: false,
    operations: false,
    governance: false,
    system: false,
  });

  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load sidebar collapse preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portal18_admin_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('portal18_admin_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K for search, Escape to close modals)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setMobileDrawerOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when search modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setSearchQuery('');
      setSearchSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Define 9 Semantic Groups and 33 Routes (Preserving all routes)
  const navGroups: NavGroupConfig[] = useMemo(() => [
    {
      id: 'overview',
      title: 'Visão Geral',
      items: [
        { href: '/admin', label: 'Painel Geral', icon: LayoutDashboard, allowed: isModerator },
        { href: '/admin/commercial', label: 'Centro Comercial', icon: Crown, allowed: isAdmin },
        { href: '/admin/analytics', label: 'Analytics & Funil', icon: BarChart3, allowed: isAdmin },
      ],
    },
    {
      id: 'moderation',
      title: 'Conteúdo & Moderação',
      items: [
        { href: '/admin/moderation/profiles', label: 'Fila de Perfis', icon: UserCheck, allowed: isModerator },
        { href: '/admin/moderation/media', label: 'Fila de Mídias', icon: ImageIcon, allowed: isModerator },
        { href: '/admin/moderation/reviews', label: 'Fila de Avaliações', icon: Sparkles, allowed: isModerator },
        { href: '/admin/reports', label: 'Denúncias', icon: AlertTriangle, allowed: isModerator },
        { href: '/admin/verifications', label: 'Verificações 18+', icon: FileCheck2, allowed: isModerator },
      ],
    },
    {
      id: 'trust_safety',
      title: 'Trust & Safety',
      items: [
        { href: '/admin/risk', label: 'Risco & Antifraude', icon: Activity, allowed: isAdmin },
        { href: '/admin/trust-safety', label: 'Trust & Safety Operations', icon: ShieldAlert, allowed: isModerator },
        { href: '/admin/reputation', label: 'Reputação & Qualidade', icon: Award, allowed: isAdmin },
      ],
    },
    {
      id: 'discovery',
      title: 'Discovery & Growth',
      items: [
        { href: '/admin/growth/seo', label: 'Crescimento & SEO', icon: Compass, allowed: isAdmin },
        { href: '/admin/search', label: 'Operações de Busca & Sinônimos', icon: Search, allowed: isAdmin },
        { href: '/admin/discovery', label: 'Ranking & Descoberta', icon: Compass, allowed: isSuperAdmin },
        { href: '/admin/categories', label: 'Categorias', icon: Tag, allowed: isAdmin },
      ],
    },
    {
      id: 'commercial',
      title: 'Comercial',
      items: [
        { href: '/admin/plans', label: 'Planos & Preços', icon: Crown, allowed: isAdmin },
        { href: '/admin/subscriptions', label: 'Assinaturas', icon: FileCheck2, allowed: isAdmin },
        { href: '/admin/payments/orders', label: 'Pedidos (Orders)', icon: Layers, allowed: isAdmin },
        { href: '/admin/referrals', label: 'Indicações', icon: Gift, allowed: isAdmin },
      ],
    },
    {
      id: 'finance',
      title: 'Financeiro',
      items: [
        { href: '/admin/payments', label: 'Faturamento', icon: CreditCard, allowed: isAdmin },
        { href: '/admin/finance', label: 'Gestão Financeira & Fechamento', icon: Scale, allowed: isAdmin },
        { href: '/admin/payments/providers', label: 'Provedores de Pagamento', icon: CreditCard, allowed: isAdmin },
        { href: '/admin/payments/reconciliation', label: 'Conciliação', icon: Scale, allowed: isAdmin },
        { href: '/admin/payments/recovery', label: 'Recuperação & Dunning', icon: RotateCcw, allowed: isAdmin },
        { href: '/admin/payments/disputes', label: 'Disputas & Estornos', icon: RotateCcw, allowed: isAdmin },
      ],
    },
    {
      id: 'operations',
      title: 'Operações',
      items: [
        { href: '/admin/communications', label: 'Comunicação & CRM', icon: Bell, allowed: isAdmin },
        { href: '/admin/support', label: 'Suporte', icon: LifeBuoy, allowed: isModerator },
        { href: '/admin/media-processing', label: 'Pipeline de Mídia', icon: Sparkles, allowed: isAdmin },
      ],
    },
    {
      id: 'governance',
      title: 'Governança',
      items: [
        { href: '/admin/privacy', label: 'Privacidade & LGPD', icon: Scale, allowed: isAdmin },
        { href: '/admin/security', label: 'Segurança & Sessões', icon: Shield, allowed: isAdmin },
        { href: '/admin/users', label: 'Usuários & Cargos', icon: Users, allowed: isSuperAdmin },
        { href: '/admin/audit', label: 'Logs de Auditoria', icon: FileSpreadsheet, allowed: isAdmin },
      ],
    },
    {
      id: 'system',
      title: 'Sistema',
      items: [
        { href: '/admin/settings', label: 'Configurações', icon: Settings, allowed: isSuperAdmin },
      ],
    },
  ], [isAdmin, isModerator, isSuperAdmin]);

  // Flattened allowed items for search and breadcrumbs
  const allAllowedItems = useMemo(() => {
    return navGroups.flatMap((group) =>
      group.items.filter((item) => item.allowed).map((item) => ({ ...item, groupTitle: group.title }))
    );
  }, [navGroups]);

  // Auto-expand group corresponding to active route
  useEffect(() => {
    navGroups.forEach((group) => {
      const hasActive = group.items.some((i) => i.href === pathname || (pathname.startsWith(i.href) && i.href !== '/admin'));
      if (hasActive) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname, navGroups]);

  // Find active breadcrumb
  const currentBreadcrumb = useMemo(() => {
    const activeItem = allAllowedItems.find((i) => i.href === pathname) ||
      allAllowedItems.find((i) => pathname.startsWith(i.href) && i.href !== '/admin');
    if (activeItem) {
      return { group: activeItem.groupTitle, label: activeItem.label };
    }
    return { group: 'Administração', label: 'Console' };
  }, [pathname, allAllowedItems]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allAllowedItems.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return allAllowedItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.groupTitle.toLowerCase().includes(q) || item.href.toLowerCase().includes(q)
    );
  }, [searchQuery, allAllowedItems]);

  // Handle Loading Guard
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--admin-content-bg, #06080c)',
          color: 'var(--text-secondary)',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--accent-gold)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '0.9rem' }}>Validando credenciais administrativas...</p>
      </div>
    );
  }

  // Access Denial Guard
  if (!isModerator) {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          background: 'var(--admin-content-bg, #06080c)',
          padding: '1.5rem',
        }}
      >
        <Card
          variant="glass"
          padding="lg"
          style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid var(--accent-ruby)',
            padding: '3rem 2rem',
          }}
        >
          <Lock size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1.25rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Acesso Restrito ao Staff</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Esta área é exclusiva para a equipe de moderação e administração. Suas credenciais atuais não possuem os privilégios necessários.
          </p>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="md">
              Voltar ao Portal
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : 'Moderador';
  const roleVariant = isSuperAdmin ? 'ruby' : isAdmin ? 'gold' : 'info';
  const operatorName = profile?.display_name || profile?.username || 'Louis Menezes';
  const operatorInitials = operatorName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'SA';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        background: 'var(--admin-content-bg, #06080c)',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ==================================================================== */}
      {/* 1. DESKTOP FIXED/STICKY SIDEBAR (Hidden on <1024px)                  */}
      {/* ==================================================================== */}
      <aside
        id="admin-desktop-sidebar"
        className="admin-sidebar-scroll hide-mobile"
        style={{
          width: isCollapsed ? '72px' : '260px',
          minWidth: isCollapsed ? '72px' : '260px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--admin-sidebar-bg, #090c12)',
          borderRight: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.08))',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          transition: 'width var(--transition-normal), min-width var(--transition-normal)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        aria-label="Navegação administrativa"
      >
        {/* Sidebar Brand Header */}
        <div
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0' : '0 1.25rem',
            borderBottom: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.08))',
            flexShrink: 0,
          }}
        >
          {!isCollapsed ? (
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: '1.05rem', color: '#ffffff' }}>
                PORTAL<span style={{ color: 'var(--accent-gold)' }}>18+</span>
              </span>
              <Badge variant="ruby" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
                ADMIN
              </Badge>
            </Link>
          ) : (
            <Link href="/admin" aria-label="Ir para Painel Administrativo" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(229, 185, 92, 0.15)',
                  border: '1px solid var(--accent-gold)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  color: 'var(--accent-gold)',
                }}
              >
                18+
              </div>
            </Link>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Recolher barra lateral"
              title="Recolher menu"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color var(--transition-fast)',
              }}
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Sidebar Navigation Body (9 Accordion Groups) */}
        <nav style={{ flex: 1, padding: '0.85rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navGroups.map((group) => {
            const allowedItems = group.items.filter((item) => item.allowed);
            if (allowedItems.length === 0) return null;

            const isOpen = openGroups[group.id] ?? false;
            const hasActiveRoute = allowedItems.some((i) => i.href === pathname);

            if (isCollapsed) {
              // Collapsed mode: render items directly as icon pills with hover titles
              return (
                <div
                  key={group.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {allowedItems.map((item) => {
                    const isActive = pathname === item.href;
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={`${group.title}: ${item.label}`}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                          width: '40px',
                          height: '40px',
                          margin: '0 auto',
                          borderRadius: 'var(--radius-md)',
                          display: 'grid',
                          placeItems: 'center',
                          textDecoration: 'none',
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          backgroundColor: isActive ? 'rgba(229, 185, 92, 0.14)' : 'transparent',
                          border: isActive ? '1px solid var(--accent-gold)' : '1px solid transparent',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <IconComponent size={18} />
                      </Link>
                    );
                  })}
                </div>
              );
            }

            // Expanded Mode: Accordion with Header and Subitems
            return (
              <div key={group.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Group Accordion Header */}
                <button
                  type="button"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                  aria-expanded={isOpen}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    background: 'transparent',
                    border: 'none',
                    color: hasActiveRoute ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  <span>{group.title}</span>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Submenu links */}
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', paddingLeft: '0.25rem' }}>
                    {allowedItems.map((item) => {
                      const isActive = pathname === item.href;
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          className={isActive ? 'admin-nav-item-active' : ''}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'rgba(229, 185, 92, 0.12)' : 'transparent',
                            fontWeight: isActive ? 700 : 500,
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <IconComponent
                            size={16}
                            color={isActive ? 'var(--accent-gold)' : 'currentColor'}
                            style={{ flexShrink: 0 }}
                          />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer (Collapse button when collapsed) */}
        {isCollapsed && (
          <div
            style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={toggleCollapse}
              title="Expandir barra lateral"
              aria-label="Expandir barra lateral"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* ==================================================================== */}
      {/* 2. MAIN APPLICATION CONTENT WRAPPER                                  */}
      {/* ==================================================================== */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* ================================================================== */}
        {/* TOPBAR ADMIN                                                       */}
        {/* ================================================================== */}
        <header
          style={{
            height: '56px',
            position: 'sticky',
            top: 0,
            background: 'var(--admin-topbar-bg, rgba(10, 12, 16, 0.9))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(0.75rem, 2vw, 1.5rem)',
            zIndex: 30,
            boxSizing: 'border-box',
          }}
        >
          {/* Topbar Left: Mobile Hamburger + Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Abrir menu de navegação administrativa"
              className="show-mobile-flex"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Menu size={22} />
            </button>

            {/* Breadcrumb Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              <Link href="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
                Admin
              </Link>
              <span style={{ color: 'var(--border-medium)' }}>/</span>
              <span style={{ color: 'var(--text-muted)' }}>{currentBreadcrumb.group}</span>
              <span style={{ color: 'var(--border-medium)' }}>/</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{currentBreadcrumb.label}</span>
            </div>
          </div>

          {/* Topbar Right: Search (Ctrl+K), Ver Portal, Theme, Profile Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Quick Search Button / Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Buscar no painel administrativo"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.35rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.1))',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Search size={14} />
              <span className="hide-mobile">Buscar no painel...</span>
              <kbd
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  fontSize: '0.675rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Ver Portal Link */}
            <Link
              href="/"
              target="_blank"
              title="Abrir página pública do Portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid transparent',
              }}
            >
              <ExternalLink size={14} />
              <span className="hide-mobile">Ver portal</span>
            </Link>

            {/* Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ThemeToggle variant="dropdown" />
            </div>

            {/* Super Admin User Dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-label="Menu de perfil do operador"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'transparent',
                  border: '1px solid transparent',
                  padding: '0.25rem 0.4rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-ruby), #a30021)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {operatorInitials}
                </div>

                <div className="hide-mobile" style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{operatorName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 600 }}>{roleLabel.toUpperCase()}</div>
                </div>

                <ChevronDown size={14} color="var(--text-muted)" className="hide-mobile" />
              </button>

              {/* Profile Menu Popover */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    background: 'var(--bg-elevated, #161b26)',
                    border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
                    padding: '0.5rem',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{operatorName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email || 'superadmin@portal18.com.br'}</div>
                    <Badge variant={roleVariant as any} style={{ marginTop: '0.4rem', display: 'inline-flex' }}>
                      {roleLabel}
                    </Badge>
                  </div>

                  <Link
                    href="/account"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      fontSize: '0.825rem',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <User size={15} /> Minha Conta
                  </Link>

                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      fontSize: '0.825rem',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <Home size={15} /> Ver Portal Público
                  </Link>

                  {isSuperAdmin && (
                    <Link
                      href="/admin/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.6rem',
                        fontSize: '0.825rem',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Settings size={15} /> Configurações Gerais
                    </Link>
                  )}

                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      fontSize: '0.825rem',
                      color: 'var(--accent-ruby)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <LogOut size={15} /> Sair da Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================================================================== */}
        {/* MAIN OPERATION CONTENT (No giant empty space, begins right at top)  */}
        {/* ================================================================== */}
        <main
          id="admin-main-viewport"
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            padding: 'clamp(1rem, 2vw, 1.75rem)',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 3. MOBILE FULL NAVIGATION DRAWER (Slide-in on <1024px)               */}
      {/* ==================================================================== */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação móvel"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Drawer Slide-in Panel */}
          <div
            className="admin-sidebar-scroll"
            style={{
              position: 'relative',
              width: '85%',
              maxWidth: '320px',
              height: '100%',
              background: 'var(--admin-sidebar-bg, #090c12)',
              borderRight: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 70,
              overflowY: 'auto',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.25rem',
                borderBottom: '1px solid var(--admin-sidebar-border, rgba(255, 255, 255, 0.08))',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                PORTAL<span style={{ color: 'var(--accent-gold)' }}>18+</span> <span style={{ fontSize: '0.75rem', color: 'var(--accent-ruby)' }}>STAFF</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Fechar menu de navegação"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Groups */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {navGroups.map((group) => {
                const allowedItems = group.items.filter((item) => item.allowed);
                if (allowedItems.length === 0) return null;
                return (
                  <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-muted)',
                        padding: '0.2rem 0.5rem',
                      }}
                    >
                      {group.title}
                    </div>
                    {allowedItems.map((item) => {
                      const isActive = pathname === item.href;
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                          className={isActive ? 'admin-nav-item-active' : ''}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.65rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            backgroundColor: isActive ? 'rgba(229, 185, 92, 0.12)' : 'transparent',
                            fontWeight: isActive ? 700 : 500,
                          }}
                        >
                          <IconComponent size={18} color={isActive ? 'var(--accent-gold)' : 'currentColor'} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. FAST SEARCH / COMMAND PALETTE DIALOG (Ctrl + K)                   */}
      {/* ==================================================================== */}
      {searchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Busca no painel administrativo"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'grid',
            placeItems: 'start center',
            paddingTop: '10vh',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setSearchModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal Dialog Content */}
          <div
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '540px',
              background: 'var(--bg-elevated, #121620)',
              border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              zIndex: 110,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search Input Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <Search size={18} color="var(--accent-gold)" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSearchSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSearchSelectedIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    if (searchResults[searchSelectedIndex]) {
                      router.push(searchResults[searchSelectedIndex].href);
                      setSearchModalOpen(false);
                    }
                  }
                }}
                placeholder="Navegar para módulo administrativo..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  color: '#ffffff',
                }}
              />
              <kbd
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Search Results List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
              {searchResults.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Nenhum módulo encontrado para &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const isSelected = idx === searchSelectedIndex;
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setSearchModalOpen(false);
                      }}
                      onMouseEnter={() => setSearchSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'rgba(229, 185, 92, 0.15)' : 'transparent',
                        color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <IconComponent size={16} color={isSelected ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 700 : 500 }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.groupTitle}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
