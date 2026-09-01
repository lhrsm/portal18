'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
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
  RotateCcw
} from 'lucide-react';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { profile, roles, isLoading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  const isModerator = roles.includes('moderator') || isAdmin;

  const navItems = [
    { href: '/admin', label: 'Painel Geral', icon: <LayoutDashboard size={18} />, allowed: isModerator },
    { href: '/admin/commercial', label: 'Centro Comercial', icon: <Crown size={18} />, allowed: isAdmin },
    { href: '/admin/analytics', label: 'Analytics & Funil', icon: <BarChart3 size={18} />, allowed: isAdmin },
    { href: '/admin/moderation/profiles', label: 'Fila de Perfis', icon: <UserCheck size={18} />, allowed: isModerator },
    { href: '/admin/moderation/media', label: 'Fila de Mídias', icon: <ImageIcon size={18} />, allowed: isModerator },
    { href: '/admin/moderation/reviews', label: 'Fila de Avaliações', icon: <Sparkles size={18} />, allowed: isModerator },
    { href: '/admin/reports', label: 'Denúncias', icon: <AlertTriangle size={18} />, allowed: isModerator },
    { href: '/admin/verifications', label: 'Verificações 18+', icon: <FileCheck2 size={18} />, allowed: isModerator },
    { href: '/admin/risk', label: 'Risco & Antifraude', icon: <Activity size={18} />, allowed: isAdmin },
    { href: '/admin/trust-safety', label: 'Trust & Safety Operations', icon: <ShieldAlert size={18} />, allowed: isModerator },
    { href: '/admin/plans', label: 'Planos & Preços', icon: <Crown size={18} />, allowed: isAdmin },
    { href: '/admin/payments', label: 'Faturamento', icon: <CreditCard size={18} />, allowed: isAdmin },
    { href: '/admin/finance', label: 'Gestão Financeira & Fechamento', icon: <Scale size={18} />, allowed: isAdmin },
    { href: '/admin/payments/orders', label: 'Pedidos (Orders)', icon: <Layers size={18} />, allowed: isAdmin },
    { href: '/admin/payments/providers', label: 'Provedores de Pagamento', icon: <CreditCard size={18} />, allowed: isAdmin },
    { href: '/admin/payments/reconciliation', label: 'Conciliação', icon: <Scale size={18} />, allowed: isAdmin },
    { href: '/admin/payments/recovery', label: 'Recuperação & Dunning', icon: <RotateCcw size={18} />, allowed: isAdmin },
    { href: '/admin/payments/disputes', label: 'Disputas & Estornos', icon: <RotateCcw size={18} />, allowed: isAdmin },
    { href: '/admin/subscriptions', label: 'Assinaturas', icon: <FileCheck2 size={18} />, allowed: isAdmin },
    { href: '/admin/referrals', label: 'Indicações', icon: <Gift size={18} />, allowed: isAdmin },
    { href: '/admin/support', label: 'Suporte', icon: <LifeBuoy size={18} />, allowed: isModerator },
    { href: '/admin/privacy', label: 'Privacidade & LGPD', icon: <Scale size={18} />, allowed: isAdmin },
    { href: '/admin/security', label: 'Segurança & Sessões', icon: <Shield size={18} />, allowed: isAdmin },
    { href: '/admin/media-processing', label: 'Pipeline de Mídia', icon: <Sparkles size={18} />, allowed: isAdmin },
    { href: '/admin/discovery', label: 'Ranking & Descoberta', icon: <Compass size={18} />, allowed: isSuperAdmin },
    { href: '/admin/users', label: 'Usuários & Cargos', icon: <Users size={18} />, allowed: isSuperAdmin },
    { href: '/admin/audit', label: 'Logs de Auditoria', icon: <FileSpreadsheet size={18} />, allowed: isAdmin },
    { href: '/admin/categories', label: 'Categorias', icon: <Tag size={18} />, allowed: isAdmin },
    { href: '/admin/settings', label: 'Configurações', icon: <Settings size={18} />, allowed: isSuperAdmin },
  ].filter((item) => item.allowed);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="spin" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Validando credenciais administrativas...</p>
      </div>
    );
  }

  // Access Denial Guard (Requirement 3 & 4)
  if (!isModerator) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <Card variant="glass" padding="lg" style={{ maxWidth: '500px', margin: '0 auto', border: '1px solid var(--accent-ruby)', padding: '3rem 1.5rem' }}>
          <Lock size={48} color="var(--accent-ruby)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Acesso Restrito ao Staff</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Esta área é exclusiva para a equipe de moderação e administração. Suas credenciais atuais não possuem os privilégios necessários.
          </p>
          <Link href="/">
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

  return (
    <div className="container" style={{ padding: '2rem 1rem 5rem 1rem' }}>
      {/* Admin Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Badge variant={roleVariant as any}>
              <ShieldAlert size={12} /> {roleLabel.toUpperCase()}
            </Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Operador: {profile?.display_name || profile?.username || 'Staff'}
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Central de Moderação & Gestão</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            className="mobile-filter-btn"
            onClick={() => setMobileNavOpen(true)}
            leftIcon={<Menu size={16} />}
          >
            Menu Staff
          </Button>

          <Link href="/advertiser">
            <Button variant="ghost" size="sm">
              Painel Anunciante
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid: Admin Sidebar Desktop + Main Content */}
      <div className="advertiser-panel-layout">
        {/* Sidebar Desktop */}
        <aside className="advertiser-sidebar">
          <Card variant="glass" padding="sm">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'rgba(229, 185, 92, 0.12)' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Dynamic Admin Main Content */}
        <main className="advertiser-main-content">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Menu Administrativo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 0' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-tertiary)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}
