'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Sheet } from '@/components/ui/Sheet';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  Menu, 
  User, 
  Megaphone, 
  LogOut, 
  Search, 
  ShieldCheck, 
  Heart, 
  MapPin, 
  Tag, 
  Home,
  HelpCircle,
  Users,
  Compass,
  Sparkles
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, profile, isAdvertiser, signOut } = useAuth();
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

          {/* Desktop Navigation (Hidden on Mobile) */}
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
                <Link href="/login" className="hide-mobile header-btn-ghost">
                  Entrar
                </Link>
                <Link href="/register" className="hide-mobile header-btn-secondary">
                  Criar conta
                </Link>
                <Link href="/advertiser/start" style={{ textDecoration: 'none' }}>
                  <Button variant="ruby" size="sm" leftIcon={<Megaphone size={14} />} style={{ fontWeight: 700, minHeight: '36px' }}>
                    Anunciar
                  </Button>
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isAdvertiser ? (
                  <Link href="/advertiser">
                    <Button variant="primary" size="sm" leftIcon={<Megaphone size={14} />} style={{ minHeight: '36px' }}>
                      Painel
                    </Button>
                  </Link>
                ) : (
                  <Link href="/advertiser/start">
                    <Button variant="ruby" size="sm" leftIcon={<Megaphone size={14} />} style={{ minHeight: '36px' }}>
                      Anunciar
                    </Button>
                  </Link>
                )}

                <Link href="/account" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', padding: '0.2rem' }} aria-label="Minha Conta">
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

            {/* Desktop Theme Toggle */}
            <div className="hide-mobile">
              <ThemeToggle variant="dropdown" />
            </div>

            {/* Mobile Hamburger Toggle Button (>=44px touch area) */}
            <button
              type="button"
              className="btn-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Sheet 
        id="mobile-nav-drawer"
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        title="Menu Principal"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem 0' }}>
          {/* Main Discovery Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link href="/" className="mobile-nav-link" onClick={handleLinkClick}>
              <Home size={18} color="var(--accent-gold)" /> <span>Início</span>
            </Link>
            <Link href="/explorar" className="mobile-nav-link" onClick={handleLinkClick}>
              <Search size={18} color="var(--accent-gold)" /> <span>Explorar Anúncios</span>
            </Link>
            <Link href="/explorar?categoria=acompanhantes" className="mobile-nav-link" onClick={handleLinkClick}>
              <Tag size={18} color="var(--accent-gold)" /> <span>Categorias de Atendimento</span>
            </Link>
            <Link href="/acompanhantes/bahia/salvador" className="mobile-nav-link" onClick={handleLinkClick}>
              <MapPin size={18} color="var(--accent-gold)" /> <span>Salvador / BA</span>
            </Link>
            <Link href="/acompanhantes/sao-paulo/sao-paulo" className="mobile-nav-link" onClick={handleLinkClick}>
              <MapPin size={18} color="var(--text-muted)" /> <span>São Paulo / SP</span>
            </Link>
            <Link href="/acompanhantes/rio-de-janeiro/rio-de-janeiro" className="mobile-nav-link" onClick={handleLinkClick}>
              <MapPin size={18} color="var(--text-muted)" /> <span>Rio de Janeiro / RJ</span>
            </Link>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

          {/* Trust & Safety */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Link href="/trust" className="mobile-nav-link" onClick={handleLinkClick}>
              <ShieldCheck size={18} color="var(--color-success)" /> <span>Segurança e Conformidade 18+</span>
            </Link>
            <Link href="/help" className="mobile-nav-link" onClick={handleLinkClick}>
              <HelpCircle size={18} color="var(--text-secondary)" /> <span>Central de Ajuda & Suporte</span>
            </Link>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

          {/* User Authentication in Drawer */}
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
              <Link href="/advertiser/start" onClick={handleLinkClick} style={{ textDecoration: 'none' }}>
                <Button variant="ruby" fullWidth size="lg" leftIcon={<Megaphone size={16} />} style={{ minHeight: '44px', fontWeight: 700 }}>
                  Criar Anúncio Profissional
                </Button>
              </Link>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Link href="/login" onClick={handleLinkClick} style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" fullWidth size="md" style={{ minHeight: '44px' }}>
                    Entrar
                  </Button>
                </Link>
                <Link href="/register" onClick={handleLinkClick} style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" fullWidth size="md" style={{ minHeight: '44px' }}>
                    Cadastrar
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <Link href="/account" className="mobile-nav-link" onClick={handleLinkClick}>
                <User size={18} color="var(--accent-gold)" /> <span>Minha Conta ({profile?.display_name || user.email?.split('@')[0]})</span>
              </Link>
              <Link href="/account/favorites" className="mobile-nav-link" onClick={handleLinkClick}>
                <Heart size={18} color="var(--accent-ruby)" /> <span>Meus Favoritos</span>
              </Link>
              <Link href="/account/following" className="mobile-nav-link" onClick={handleLinkClick}>
                <Users size={18} color="var(--accent-gold)" /> <span>Anunciantes Seguidos</span>
              </Link>
              <div style={{ marginTop: '0.5rem' }}>
                {isAdvertiser ? (
                  <Link href="/advertiser" onClick={handleLinkClick} style={{ textDecoration: 'none' }}>
                    <Button variant="primary" fullWidth size="lg" leftIcon={<Megaphone size={16} />} style={{ minHeight: '44px', fontWeight: 700 }}>
                      Painel do Anunciante
                    </Button>
                  </Link>
                ) : (
                  <Link href="/advertiser/start" onClick={handleLinkClick} style={{ textDecoration: 'none' }}>
                    <Button variant="ruby" fullWidth size="lg" leftIcon={<Megaphone size={16} />} style={{ minHeight: '44px', fontWeight: 700 }}>
                      Quero Anunciar
                    </Button>
                  </Link>
                )}
              </div>
              <Button
                variant="ghost"
                fullWidth
                size="md"
                onClick={() => {
                  signOut();
                  handleLinkClick();
                }}
                leftIcon={<LogOut size={16} />}
                style={{ color: 'var(--accent-ruby)', marginTop: '0.5rem', minHeight: '44px' }}
              >
                Sair da Conta
              </Button>
            </div>
          )}

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

          {/* Mobile Theme Selector */}
          <div style={{ padding: '0.25rem 0' }}>
            <ThemeToggle variant="inline" />
          </div>
        </div>
      </Sheet>
    </>
  );
}
