'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, ShieldCheck, Lock, Key, Server, EyeOff, CheckCircle2 } from 'lucide-react';

export default function TrustSecurityPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/trust" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Trust Center
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">ARQUITETURA & PROTEÇÃO</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Segurança da Informação e Infraestrutura
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Nossos protocolos de engenharia foram desenhados sob o princípio de defesa em profundidade (Defense in Depth).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Key size={24} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Criptografia Ponta a Ponta & Repouso</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Todo o tráfego é protegido por TLS 1.3 com Perfect Forward Secrecy. Dados persistidos em banco de dados utilizam criptografia AES-256 em repouso.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Lock size={24} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Isolamento Granular por Row-Level Security (RLS)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                100% das tabelas do banco de dados contam com políticas RLS ativas. Nenhuma consulta do frontend pode cruzar registros entre usuários ou expor identidades privadas de anunciantes e visitantes.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <EyeOff size={24} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Armazenamento Blindado de Documentos (KYC)</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Documentos de verificação de identidade são armazenados em buckets privados com acesso temporário exclusivamente auditado para analistas autorizados.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Server size={24} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Proteção DDoS, WAF e Limite de Taxa</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Mitigação ativa de tráfego malicioso em nível de borda (Cloudflare CDN / Edge Workers) com rate limiting preventivo em todos os endpoints públicos.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/trust">
          <Button variant="secondary">Voltar ao Índice do Trust Center</Button>
        </Link>
      </div>
    </div>
  );
}
