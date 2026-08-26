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
              <li><Link href="/account/privacy" className="footer-link">Central de Segurança</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Denunciar</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Privacidade</Link></li>
              <li><Link href="/account/privacy" className="footer-link">LGPD</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="footer-column">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-list">
              <li><Link href="/account/privacy" className="footer-link">Termos de Uso</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Política de Privacidade</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Cookies</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Diretrizes da Comunidade</Link></li>
            </ul>
          </div>

          {/* Column 5: Institucional */}
          <div className="footer-column">
            <h4 className="footer-heading">Institucional</h4>
            <ul className="footer-list">
              <li><Link href="/explorar" className="footer-link">Sobre o Portal</Link></li>
              <li><Link href="/account/privacy" className="footer-link">Ajuda & Suporte</Link></li>
              <li><Link href="/advertiser/start" className="footer-link">Contato</Link></li>
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
