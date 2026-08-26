import React from 'react';
import Link from 'next/link';
import { Shield, Lock, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '3rem 0 2rem 0',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
                PORTAL<span style={{ color: 'var(--accent-gold)' }}>NACIONAL</span>
              </span>
              <Badge variant="ruby">18+</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Plataforma tecnológica brasileira destinada exclusivamente à divulgação de anúncios e perfis de profissionais adultos independentes.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Navegação</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <Link href="/" style={{ color: 'var(--text-secondary)' }}>Início / Feed</Link>
              <Link href="/advertiser" style={{ color: 'var(--text-secondary)' }}>Quero Anunciar</Link>
              <Link href="/account" style={{ color: 'var(--text-secondary)' }}>Área do Usuário</Link>
              <Link href="/login" style={{ color: 'var(--text-secondary)' }}>Acessar Conta</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Segurança & Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Termos de Serviço</span>
              <span style={{ color: 'var(--text-secondary)' }}>Política de Privacidade</span>
              <span style={{ color: 'var(--text-secondary)' }}>Canal de Denúncias 24h</span>
              <span style={{ color: 'var(--text-secondary)' }}>Conformidade Legal 18+</span>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Blindagem Técnica</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} color="var(--accent-gold)" />
                <span>Supabase PostgreSQL + RLS Ativo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={16} color="var(--color-success)" />
                <span>Criptografia de Ponta a Ponta</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <EyeOff size={16} color="var(--accent-ruby)" />
                <span>Storage Privado de Documentos</span>
              </div>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-subtle)', margin: '1.5rem 0' }} />

        {/* Legal Warning Notice */}
        <div
          style={{
            background: 'rgba(255, 45, 85, 0.05)',
            border: '1px solid rgba(255, 45, 85, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <strong>AVISO DE MAIORIDADE E RESPONSABILIDADE:</strong> O acesso a este portal é estritamente proibido a menores de 18 anos. Todos os anunciantes são profissionais independentes com confirmação de maioridade e termos legais. Tolerância zero contra exploração ou abusos.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', gap: '1rem' }}>
          <div>© {new Date().getFullYear()} Portal Nacional 18+. Todos os direitos reservados.</div>
          <div>Tecnologia: Next.js + React + Supabase Engine</div>
        </div>
      </div>
    </footer>
  );
}
