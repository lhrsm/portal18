'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Shield, Sparkles, User, LogOut, LayoutDashboard, Megaphone, Menu } from 'lucide-react';

export function Header() {
  const { user, profile, isAdvertiser, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userMenuItems = [
    {
      label: 'Minha Conta',
      icon: <User size={16} />,
      onClick: () => {
        window.location.href = '/account';
      },
    },
    ...(isAdvertiser || isAdmin
      ? [
          {
            label: 'Painel do Anunciante',
            icon: <Megaphone size={16} />,
            onClick: () => {
              window.location.href = '/advertiser';
            },
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: 'Administração',
            icon: <LayoutDashboard size={16} />,
            onClick: () => {
              window.location.href = '/admin';
            },
          },
        ]
      : []),
    {
      label: 'Sair da Conta',
      icon: <LogOut size={16} />,
      variant: 'danger' as const,
      onClick: () => signOut(),
    },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 12, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-ruby) 100%)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: '1.2rem',
              color: '#fff',
              boxShadow: 'var(--shadow-glow-gold)',
            }}
          >
            P18
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#fff' }}>
                PORTAL<span style={{ color: 'var(--accent-gold)' }}>NACIONAL</span>
              </span>
              <Badge variant="ruby">18+</Badge>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Anúncios Independentes
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          <Link href="/" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>
            Explorar
          </Link>
          <Link href="/account/profile" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>
            Cidades
          </Link>
          <Link href="/advertiser" style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>
            Anunciar
          </Link>
        </nav>

        {/* Auth / CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <Dropdown
              trigger={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <Avatar fallback={profile?.display_name || user.email || 'U'} size="sm" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, paddingRight: '0.5rem', color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                </div>
              }
              items={userMenuItems}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" leftIcon={<Sparkles size={14} />}>
                  Cadastrar
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="btn btn-ghost btn-sm mobile-menu-btn"
            style={{ padding: '0.5rem' }}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Sheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu Principal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Início / Explorar
          </Link>
          <Link href="/advertiser" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
            Área do Anunciante
          </Link>
          <Link href="/account" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Minha Conta
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-ruby)' }}>
              Painel Administrativo
            </Link>
          )}

          <hr style={{ borderColor: 'var(--border-subtle)', margin: '1rem 0' }} />

          {user ? (
            <Button
              variant="ruby"
              fullWidth
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
            >
              Encerrar Sessão
            </Button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" fullWidth>
                  Entrar
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" fullWidth>
                  Criar Conta 18+
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Sheet>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
