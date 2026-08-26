'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TrustModerationPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/trust" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Trust Center
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">INTEGRIDADE E QUALIDADE</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Diretrizes e Fluxo de Moderação
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Como garantimos que todo o conteúdo publicado seja legal, consensual, autêntico e de alta qualidade.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Revisão Prévia e Pré-Publicação</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Nenhuma foto ou vídeo é disponibilizado publicamente sem aprovação explícita de nossa equipe humana de moderação ou aprovação automática em conformidade estrita com nossas regras.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sanitização de Metadados (EXIF)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Todas as imagens enviadas passam por pipeline que remove automaticamente coordenadas de GPS, modelo do aparelho e metadados pessoais antes de gerar as miniaturas públicas.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Direito de Recurso do Anunciante</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Em caso de recusa de foto ou reprovação de cadastro, o anunciante recebe o motivo claro no painel e pode reenviar o material corrigido ou solicitar reavaliação via suporte.
          </p>
        </Card>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/help/categoria/denuncias">
          <Button variant="secondary">Consultar Dúvidas sobre Moderação</Button>
        </Link>
      </div>
    </div>
  );
}
