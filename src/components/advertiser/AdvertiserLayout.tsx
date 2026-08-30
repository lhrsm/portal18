'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdvertiserProfile } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { 
  LayoutDashboard, 
  User, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  Eye, 
  Menu, 
  X, 
  Sparkles, 
  ArrowLeft,
  Gift
} from 'lucide-react';

export interface AdvertiserLayoutProps {
  children: React.ReactNode;
  advertiser?: AdvertiserProfile | null;
  completenessScore?: number;
}

export function AdvertiserLayout({ children, advertiser = null, completenessScore }: AdvertiserLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { href: '/advertiser', label: 'Visão geral', icon: <LayoutDashboard size={18} /> },
    { href: '/advertiser/profile', label: 'Meu perfil', icon: <User size={18} /> },
    { href: '/advertiser/gallery', label: 'Central de Mídia', icon: <ImageIcon size={18} /> },
    { href: '/advertiser/location', label: 'Localização', icon: <MapPin size={18} /> },
    { href: '/advertiser/contacts', label: 'Contatos', icon: <Phone size={18} /> },
    { href: '/advertiser/referrals', label: 'Indique e Ganhe', icon: <Gift size={18} /> },
    { href: '/advertiser/verification', label: 'Verificação 18+', icon: <ShieldCheck size={18} /> },
    { href: '/advertiser/statistics', label: 'Estatísticas', icon: <BarChart3 size={18} /> },
    { href: '/advertiser/settings', label: 'Configurações', icon: <Settings size={18} /> },
    { href: '/advertiser/profile/preview', label: 'Pré-visualização', icon: <Eye size={18} /> },
  ];

  const getFriendlyStatus = (status?: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return { label: 'Publicado', variant: 'success' as const };
      case 'pending_review':
        return { label: 'Em análise', variant: 'warning' as const };
      case 'rejected':
        return { label: 'Revisão necessária', variant: 'ruby' as const };
      case 'suspended':
        return { label: 'Suspenso', variant: 'ruby' as const };
      case 'archived':
        return { label: 'Arquivado', variant: 'neutral' as const };
      default:
        return { label: 'Rascunho', variant: 'neutral' as const };
    }
  };

  const statusInfo = getFriendlyStatus(advertiser?.profile_status);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Badge variant="gold">PAINEL DO ANUNCIANTE</Badge>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {advertiser?.visibility && (
              <Badge variant="neutral">Visibilidade: {advertiser.visibility}</Badge>
            )}
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
            {advertiser && advertiser.stage_name !== 'Novo Anunciante' ? advertiser.stage_name : 'Meu Anúncio'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Mobile Menu Toggle Button */}
          <Button
            variant="secondary"
            className="mobile-filter-btn"
            onClick={() => setMobileNavOpen(true)}
            leftIcon={<Menu size={16} />}
          >
            Menu do Painel
          </Button>

          <Link href="/advertiser/profile/preview">
            <Button variant="ghost" size="sm" leftIcon={<Eye size={16} />}>
              Ver Prévia
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Sidebar Desktop + Content */}
      <div className="advertiser-panel-layout">
        {/* Desktop Sidebar */}
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

        {/* Dynamic Page Content */}
        <main className="advertiser-main-content">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} title="Menu do Anunciante">
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
