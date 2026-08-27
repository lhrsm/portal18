'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, ChevronDown, Lock, ShieldAlert, Sparkles, Heart, FileText, HelpCircle, User, Compass } from 'lucide-react';

interface FooterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  id: string;
}

function MobileFooterAccordion({ title, icon, children, id }: FooterSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="footer-accordion-item">
      <button
        type="button"
        className="footer-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`footer-section-${id}`}
      >
        <span className="footer-accordion-title">
          {icon}
          <span>{title}</span>
        </span>
        <ChevronDown
          size={16}
          className={`footer-accordion-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>
      <div
        id={`footer-section-${id}`}
        className={`footer-accordion-content ${isOpen ? 'open' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Desktop 6-Column Grid Layout */}
        <div className="footer-grid-desktop">
          {/* Column 1: Brand & Compliance */}
          <div className="footer-brand-col">
            <Link href="/" className="logo-brand" style={{ marginBottom: '0.75rem' }}>
              <span className="logo-accent">PORTAL</span>
              <span className="logo-highlight">18+</span>
            </Link>
            <p className="footer-tagline">
              A plataforma nacional mais confiável de divulgação de acompanhantes e profissionais independentes.
            </p>
            <div className="footer-compliance-badge">
              <ShieldCheck size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Conformidade Legal 18+</strong>
                <span>Plataforma restrita a maiores de idade em estrita observância à legislação brasileira e LGPD.</span>
              </div>
            </div>
          </div>

          {/* Column 2: Explorar */}
          <div className="footer-links-col">
            <h4 className="footer-heading">
              <Compass size={14} color="var(--accent-gold)" /> Explorar
            </h4>
            <ul className="footer-list">
              <li><Link href="/explorar" className="footer-link">Todos os Anúncios</Link></li>
              <li><Link href="/explorar?sort=recent" className="footer-link">Novos Perfis</Link></li>
              <li><Link href="/explorar?sort=active" className="footer-link">Perfis em Destaque</Link></li>
              <li><Link href="/acompanhantes/bahia/salvador" className="footer-link">Salvador / BA</Link></li>
              <li><Link href="/acompanhantes/sao-paulo/sao-paulo" className="footer-link">São Paulo / SP</Link></li>
              <li><Link href="/acompanhantes/rio-de-janeiro/rio-de-janeiro" className="footer-link">Rio de Janeiro / RJ</Link></li>
            </ul>
          </div>

          {/* Column 3: Conta */}
          <div className="footer-links-col">
            <h4 className="footer-heading">
              <User size={14} color="var(--accent-gold)" /> Conta
            </h4>
            <ul className="footer-list">
              <li><Link href="/login" className="footer-link">Entrar na Conta</Link></li>
              <li><Link href="/register" className="footer-link">Criar Cadastro</Link></li>
              <li><Link href="/advertiser/start" className="footer-link" style={{ color: 'var(--accent-ruby)', fontWeight: 600 }}>Quero Anunciar</Link></li>
              <li><Link href="/account" className="footer-link">Minha Conta</Link></li>
              <li><Link href="/account/favorites" className="footer-link">Meus Favoritos</Link></li>
              <li><Link href="/account/following" className="footer-link">Perfis Seguidos</Link></li>
            </ul>
          </div>

          {/* Column 4: Segurança */}
          <div className="footer-links-col">
            <h4 className="footer-heading">
              <Lock size={14} color="var(--accent-gold)" /> Segurança
            </h4>
            <ul className="footer-list">
              <li><Link href="/trust" className="footer-link">Trust Center</Link></li>
              <li><Link href="/trust/minors" className="footer-link">Proteção 18+</Link></li>
              <li><Link href="/trust/moderation" className="footer-link">Moderação de Fotos</Link></li>
              <li><Link href="/trust/content-removal" className="footer-link">Remoção de Conteúdo</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Canal de Denúncias</Link></li>
            </ul>
          </div>

          {/* Column 5: Legal & LGPD */}
          <div className="footer-links-col">
            <h4 className="footer-heading">
              <FileText size={14} color="var(--accent-gold)" /> Legal
            </h4>
            <ul className="footer-list">
              <li><Link href="/trust/privacy" className="footer-link">Política de Privacidade</Link></li>
              <li><Link href="/trust/lgpd" className="footer-link">Direitos dos Titulares (LGPD)</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Termos de Uso</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Diretrizes da Comunidade</Link></li>
              <li><Link href="/trust/security" className="footer-link">Segurança da Informação</Link></li>
            </ul>
          </div>

          {/* Column 6: Suporte */}
          <div className="footer-links-col">
            <h4 className="footer-heading">
              <HelpCircle size={14} color="var(--accent-gold)" /> Suporte
            </h4>
            <ul className="footer-list">
              <li><Link href="/help" className="footer-link">Central de Ajuda</Link></li>
              <li><Link href="/help/faq" className="footer-link">Dúvidas Frequentes (FAQ)</Link></li>
              <li><Link href="/support/novo" className="footer-link">Abrir Chamado</Link></li>
              <li><Link href="/status" className="footer-link">Status da Plataforma</Link></li>
            </ul>
          </div>
        </div>

        {/* Mobile Accordion Groups */}
        <div className="footer-accordions-mobile">
          <div className="footer-brand-col" style={{ marginBottom: '1.5rem' }}>
            <Link href="/" className="logo-brand" style={{ marginBottom: '0.5rem' }}>
              <span className="logo-accent">PORTAL</span>
              <span className="logo-highlight">18+</span>
            </Link>
            <p className="footer-tagline">
              Plataforma nacional de divulgação segura para acompanhantes e profissionais independentes.
            </p>
          </div>

          <MobileFooterAccordion id="explore" title="Explorar" icon={<Compass size={16} color="var(--accent-gold)" />}>
            <ul className="footer-list">
              <li><Link href="/explorar" className="footer-link">Todos os Anúncios</Link></li>
              <li><Link href="/explorar?sort=recent" className="footer-link">Novos Perfis</Link></li>
              <li><Link href="/explorar?sort=active" className="footer-link">Perfis em Destaque</Link></li>
              <li><Link href="/acompanhantes/bahia/salvador" className="footer-link">Salvador / BA</Link></li>
              <li><Link href="/acompanhantes/sao-paulo/sao-paulo" className="footer-link">São Paulo / SP</Link></li>
              <li><Link href="/acompanhantes/rio-de-janeiro/rio-de-janeiro" className="footer-link">Rio de Janeiro / RJ</Link></li>
            </ul>
          </MobileFooterAccordion>

          <MobileFooterAccordion id="account" title="Conta & Anúncios" icon={<User size={16} color="var(--accent-gold)" />}>
            <ul className="footer-list">
              <li><Link href="/login" className="footer-link">Entrar na Conta</Link></li>
              <li><Link href="/register" className="footer-link">Criar Cadastro</Link></li>
              <li><Link href="/advertiser/start" className="footer-link" style={{ color: 'var(--accent-ruby)', fontWeight: 600 }}>Quero Anunciar</Link></li>
              <li><Link href="/account" className="footer-link">Minha Conta</Link></li>
              <li><Link href="/account/favorites" className="footer-link">Favoritos</Link></li>
            </ul>
          </MobileFooterAccordion>

          <MobileFooterAccordion id="security" title="Segurança & Trust" icon={<Lock size={16} color="var(--accent-gold)" />}>
            <ul className="footer-list">
              <li><Link href="/trust" className="footer-link">Trust Center</Link></li>
              <li><Link href="/trust/minors" className="footer-link">Proteção 18+</Link></li>
              <li><Link href="/trust/moderation" className="footer-link">Moderação de Fotos</Link></li>
              <li><Link href="/trust/content-removal" className="footer-link">Remoção de Conteúdo</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Canal de Denúncias</Link></li>
            </ul>
          </MobileFooterAccordion>

          <MobileFooterAccordion id="legal" title="Legal & LGPD" icon={<FileText size={16} color="var(--accent-gold)" />}>
            <ul className="footer-list">
              <li><Link href="/trust/privacy" className="footer-link">Política de Privacidade</Link></li>
              <li><Link href="/trust/lgpd" className="footer-link">Direitos LGPD</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Termos de Uso</Link></li>
              <li><Link href="/trust/security" className="footer-link">Segurança da Informação</Link></li>
            </ul>
          </MobileFooterAccordion>

          <MobileFooterAccordion id="support" title="Ajuda & Suporte" icon={<HelpCircle size={16} color="var(--accent-gold)" />}>
            <ul className="footer-list">
              <li><Link href="/help" className="footer-link">Central de Ajuda</Link></li>
              <li><Link href="/help/faq" className="footer-link">Dúvidas Frequentes (FAQ)</Link></li>
              <li><Link href="/support/novo" className="footer-link">Abrir Chamado</Link></li>
              <li><Link href="/status" className="footer-link">Status da Plataforma</Link></li>
            </ul>
          </MobileFooterAccordion>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <div className="footer-18-notice">
            <AlertCircle size={16} color="var(--accent-ruby)" style={{ flexShrink: 0 }} />
            <span>Conteúdo destinado exclusivamente a maiores de 18 anos. Proibido o acesso de menores.</span>
          </div>

          <div className="footer-bottom-links">
            <Link href="/trust/privacy">Privacidade</Link>
            <span>•</span>
            <Link href="/account/privacy">Termos</Link>
            <span>•</span>
            <Link href="/trust/lgpd">LGPD</Link>
            <span>•</span>
            <Link href="/status">Status</Link>
          </div>

          <div className="footer-copyright">
            © {new Date().getFullYear()} Portal18. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
