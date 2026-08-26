'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Sheet } from '@/components/ui/Sheet';
import { 
  Sparkles, 
  Menu, 
  X, 
  User, 
  Megaphone, 
  LogOut, 
  Search, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  Tag, 
  Home 
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, profile, isAdvertiser, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/explorar', label: 'Explorar', icon: <Search size={18} /> },
    { href: '/explorar?categoria=acompanhantes', label: 'Categorias', icon: <Tag size={18} /> },
    { href: '/explorar', label: 'Cidades', icon: <MapPin size={18} /> },
    { href: '/account/privacy', label: 'Segurança', icon: <ShieldCheck size={18} /> },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="container header-container">
          {/* Brand Logo */}
          <Link href="/" className="logo-brand">
            <span className="logo-accent">PORTAL</span>
            <span className="logo-highlight">18+</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-desktop">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions">
            {!user ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm">
                    Criar conta
                  </Button>
                </Link>
                <Link href="/advertiser/start">
                  <Button variant="ruby" size="sm" leftIcon={<Megaphone size={14} />}>
                    Anunciar
                  </Button>
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isAdvertiser ? (
                  <Link href="/advertiser">
                    <Button variant="primary" size="sm" leftIcon={<Megaphone size={14} />}>
                      Painel do Anunciante
                    </Button>
                  </Link>
                ) : (
                  <Link href="/advertiser/start">
                    <Button variant="ruby" size="sm" leftIcon={<Megaphone size={14} />}>
                      Quero Anunciar
                    </Button>
                  </Link>
                )}

                <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                  <Avatar
                    src={profile?.avatar_path}
                    fallback={profile?.display_name || user.email || 'U'}
                    size="sm"
                  />
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  aria-label="Sair da conta"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <LogOut size={16} />
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="btn-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu principal"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <Sheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu do Portal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <Link href="/" className="mobile-nav-item" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
            <Home size={18} color="var(--accent-gold)" /> Início
          </Link>
          <Link href="/explorar" className="mobile-nav-item" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
            <Search size={18} color="var(--accent-gold)" /> Explorar Perfis
          </Link>
          <Link href="/explorar" className="mobile-nav-item" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
            <Tag size={18} color="var(--accent-gold)" /> Categorias
          </Link>
          <Link href="/explorar" className="mobile-nav-item" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
            <MapPin size={18} color="var(--accent-gold)" /> Cidades
          </Link>
          <Link href="/account/favorites" className="mobile-nav-item" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
            <Heart size={18} color="var(--accent-ruby)" /> Favoritos
          </Link>
          <Link href="/account/privacy" className="mobile-nav-item" onClick={handleLinkClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)' }}>
            <ShieldCheck size={18} color="var(--color-success)" /> Segurança & Privacidade
          </Link>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!user ? (
              <>
                <Link href="/login" onClick={handleLinkClick}>
                  <Button variant="secondary" fullWidth size="md">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={handleLinkClick}>
                  <Button variant="primary" fullWidth size="md">
                    Criar Conta
                  </Button>
                </Link>
                <Link href="/advertiser/start" onClick={handleLinkClick}>
                  <Button variant="ruby" fullWidth size="md" leftIcon={<Megaphone size={16} />}>
                    Quero Anunciar
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/account" onClick={handleLinkClick}>
                  <Button variant="secondary" fullWidth size="md" leftIcon={<User size={16} />}>
                    Minha Conta
                  </Button>
                </Link>
                {isAdvertiser ? (
                  <Link href="/advertiser" onClick={handleLinkClick}>
                    <Button variant="primary" fullWidth size="md" leftIcon={<Megaphone size={16} />}>
                      Painel do Anunciante
                    </Button>
                  </Link>
                ) : (
                  <Link href="/advertiser/start" onClick={handleLinkClick}>
                    <Button variant="ruby" fullWidth size="md" leftIcon={<Megaphone size={16} />}>
                      Quero Anunciar
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  fullWidth
                  size="md"
                  onClick={() => {
                    signOut();
                    handleLinkClick();
                  }}
                  leftIcon={<LogOut size={16} />}
                  style={{ color: 'var(--accent-ruby)', marginTop: '0.5rem' }}
                >
                  Encerrar Sessão
                </Button>
              </>
            )}
          </div>
        </div>
      </Sheet>
    </>
  );
}
