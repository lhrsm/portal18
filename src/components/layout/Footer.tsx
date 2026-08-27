'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        {/* Brand & 18+ Warning */}
        <div className="footer-brand">
          <Link href="/" className="logo-brand">
            <span className="logo-accent">PORTAL</span>
            <span className="logo-highlight">18+</span>
          </Link>
          <p className="footer-tagline">
            Plataforma nacional de entretenimento adulto e divulgação de profissionais independentes.
          </p>
          <div className="footer-compliance-badge">
            <ShieldCheck size={16} color="var(--accent-gold)" />
            <span>Conformidade com a legislação brasileira • Proteção de dados e maioridade estrita.</span>
          </div>
        </div>

        {/* 5 Columns (Requirement 19) */}
        <div className="footer-links-grid">
          {/* Column 1: Portal */}
          <div className="footer-column">
            <h4 className="footer-heading">Portal</h4>
            <ul className="footer-list">
              <li><Link href="/explorar" className="footer-link">Explorar</Link></li>
              <li><Link href="/explorar" className="footer-link">Categorias</Link></li>
              <li><Link href="/explorar" className="footer-link">Cidades</Link></li>
              <li><Link href="/advertiser/start" className="footer-link">Anunciar</Link></li>
            </ul>
          </div>

          {/* Column 2: Conta */}
          <div className="footer-column">
            <h4 className="footer-heading">Conta</h4>
            <ul className="footer-list">
              <li><Link href="/login" className="footer-link">Entrar</Link></li>
              <li><Link href="/register" className="footer-link">Criar conta</Link></li>
              <li><Link href="/account" className="footer-link">Minha conta</Link></li>
              <li><Link href="/account/favorites" className="footer-link">Favoritos</Link></li>
            </ul>
          </div>

          {/* Column 3: Segurança */}
          <div className="footer-column">
            <h4 className="footer-heading">Segurança</h4>
            <ul className="footer-list">
              <li><Link href="/trust" className="footer-link">Trust Center</Link></li>
              <li><Link href="/trust/minors" className="footer-link">Proteção 18+</Link></li>
              <li><Link href="/trust/moderation" className="footer-link">Moderação</Link></li>
              <li><Link href="/trust/content-removal" className="footer-link">Remoção de Conteúdo</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal & Privacidade */}
          <div className="footer-column">
            <h4 className="footer-heading">Legal & Privacidade</h4>
            <ul className="footer-list">
              <li><Link href="/trust/privacy" className="footer-link">Política de Privacidade</Link></li>
              <li><Link href="/trust/lgpd" className="footer-link">Direitos LGPD</Link></li>
              <li><Link href="/trust/security" className="footer-link">Segurança da Informação</Link></li>
              <li><Link href="/status" className="footer-link">Status da Plataforma</Link></li>
            </ul>
          </div>

          {/* Column 5: Suporte */}
          <div className="footer-column">
            <h4 className="footer-heading">Suporte</h4>
            <ul className="footer-list">
              <li><Link href="/help" className="footer-link">Central de Ajuda</Link></li>
              <li><Link href="/help/faq" className="footer-link">Perguntas Frequentes</Link></li>
              <li><Link href="/support/novo" className="footer-link">Abrir Chamado</Link></li>
              <li><Link href="/advertiser/start" className="footer-link">Quero Anunciar</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar with 18+ Notice */}
      <div className="footer-bottom">
        <div className="container footer-bottom-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-ruby)', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>Conteúdo destinado exclusivamente a maiores de 18 anos. Proibida a entrada de menores.</span>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Portal Nacional de Entretenimento Adulto. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}
