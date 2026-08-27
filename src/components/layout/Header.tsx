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
  Home,
  Flame,
  HelpCircle,
  Lock
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, profile, isAdvertiser, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/explorar', label: 'Explorar', icon: <Search size={16} /> },
    { href: '/explorar?categoria=acompanhantes', label: 'Categorias', icon: <Tag size={16} /> },
    { href: '/acompanhantes/bahia/salvador', label: 'Salvador', icon: <MapPin size={16} /> },
    { href: '/trust', label: 'Segurança 18+', icon: <ShieldCheck size={16} /> },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="container header-container">
          {/* Brand Logo */}
          <Link href="/" className="logo-brand" aria-label="Portal18 - Página Inicial">
            <span className="logo-accent">PORTAL</span>
            <span className="logo-highlight">18+</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop" aria-label="Navegação Principal">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href.startsWith('/explorar') && pathname === '/explorar' && !link.href.includes('?'));
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

          {/* Header Action Controls */}
          <div className="header-actions">
            {!user ? (
              <>
                <Link href="/login" className="hide-mobile">
                  <Button variant="ghost" size="sm">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" className="hide-mobile">
                  <Button variant="secondary" size="sm">
                    Criar conta
                  </Button>
                </Link>
                <Link href="/advertiser/start">
                  <Button variant="ruby" size="sm" leftIcon={<Megaphone size={14} />} style={{ fontWeight: 700, boxShadow: 'var(--shadow-glow-ruby)' }}>
                    Anunciar
                  </Button>
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {isAdvertiser ? (
                  <Link href="/advertiser">
                    <Button variant="primary" size="sm" leftIcon={<Megaphone size={14} />}>
                      Painel
                    </Button>
                  </Link>
                ) : (
                  <Link href="/advertiser/start">
                    <Button variant="ruby" size="sm" leftIcon={<Megaphone size={14} />}>
                      Anunciar
                    </Button>
                  </Link>
                )}

                <Link href="/account" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Minha Conta">
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
                  className="hide-mobile"
                  style={{ color: 'var(--text-muted)', padding: '0.4rem' }}
                >
                  <LogOut size={16} />
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className="btn-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Sheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu Principal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
          <Link href="/" className="mobile-nav-link" onClick={handleLinkClick}>
            <Home size={18} color="var(--accent-gold)" /> Início
          </Link>
          <Link href="/explorar" className="mobile-nav-link" onClick={handleLinkClick}>
            <Search size={18} color="var(--accent-gold)" /> Explorar Todos os Anúncios
          </Link>
          <Link href="/acompanhantes/bahia/salvador" className="mobile-nav-link" onClick={handleLinkClick}>
            <MapPin size={18} color="var(--accent-gold)" /> Salvador / BA
          </Link>
          <Link href="/acompanhantes/sao-paulo/sao-paulo" className="mobile-nav-link" onClick={handleLinkClick}>
            <MapPin size={18} color="var(--text-muted)" /> São Paulo / SP
          </Link>
          <Link href="/acompanhantes/rio-de-janeiro/rio-de-janeiro" className="mobile-nav-link" onClick={handleLinkClick}>
            <MapPin size={18} color="var(--text-muted)" /> Rio de Janeiro / RJ
          </Link>
          <Link href="/trust" className="mobile-nav-link" onClick={handleLinkClick}>
            <ShieldCheck size={18} color="var(--color-success)" /> Trust Center & Proteção 18+
          </Link>
          <Link href="/help" className="mobile-nav-link" onClick={handleLinkClick}>
            <HelpCircle size={18} color="var(--text-secondary)" /> Central de Ajuda
          </Link>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1rem 0' }} />

          {/* User Authentication in Drawer */}
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/advertiser/start" onClick={handleLinkClick}>
                <Button variant="ruby" fullWidth size="lg" leftIcon={<Megaphone size={16} />}>
                  Criar Anúncio Profissional
                </Button>
              </Link>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Link href="/login" onClick={handleLinkClick}>
                  <Button variant="secondary" fullWidth size="md">
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={handleLinkClick}>
                  <Button variant="ghost" fullWidth size="md">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/account" className="mobile-nav-link" onClick={handleLinkClick}>
                <User size={18} color="var(--accent-gold)" /> Minha Conta ({profile?.display_name || user.email})
              </Link>
              <Link href="/account/favorites" className="mobile-nav-link" onClick={handleLinkClick}>
                <Heart size={18} color="var(--accent-ruby)" /> Meus Favoritos
              </Link>
              {isAdvertiser ? (
                <Link href="/advertiser" onClick={handleLinkClick}>
                  <Button variant="primary" fullWidth size="lg" leftIcon={<Megaphone size={16} />}>
                    Painel do Anunciante
                  </Button>
                </Link>
              ) : (
                <Link href="/advertiser/start" onClick={handleLinkClick}>
                  <Button variant="ruby" fullWidth size="lg" leftIcon={<Megaphone size={16} />}>
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
                Sair da Conta
              </Button>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}
