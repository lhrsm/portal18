'use client';

import React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  FileCheck2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function FiscalReadinessPage() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/finance" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar para Gestão Financeira
        </Link>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
          Prontidão Fiscal & Emissão de Documentos
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Status da infraestrutura fiscal, enquadramento de serviços e integração NFS-e
        </p>
      </div>

      {/* Review Flags Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Provedor Fiscal</span>
            <Badge variant="ruby">NOT CONFIGURED</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Nenhum emissor de NFS-e externo configurado em ambiente produtivo.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Emissão de NFS-e</span>
            <Badge variant="ruby">NOT ACTIVATED</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Emissão automática desativada até validação contábil e tributária.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Revisão Contábil</span>
            <Badge variant="gold">ACCOUNTING_REVIEW_REQUIRED</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Enquadramento tributário (Simples/Lucro Presumido) pendente de parecer contábil.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Revisão Jurídica</span>
            <Badge variant="gold">LEGAL_REVIEW_REQUIRED</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Natureza da prestação de serviços de publicidade digital em revisão jurídica.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Classificação CNAE</span>
            <Badge variant="gold">UNVERIFIED</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Atividades de publicidade na internet a serem ratificadas pelo contador responsável.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Documentos Fiscais Reais</span>
            <Badge variant="neutral">0 EMITIDOS</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Zero documentos fiscais emitidos em produção (ambiente sob Kill Switch).
          </p>
        </Card>
      </div>

      {/* Distinction between Receipt and Invoice */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <Scale size={28} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Distinção Regulatória: Comprovante de Pagamento vs. Documento Fiscal (NFS-e)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 0.75rem 0' }}>
              Em estrito cumprimento às normas de governança financeira e transparência fiscal, o Portal18 mantém uma separação técnica absoluta entre os recibos eletrônicos emitidos aos usuários e a emissão de documentos fiscais oficiais:
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6, margin: 0, paddingLeft: '1.25rem' }}>
              <li><strong>Comprovante Eletrônico (ReceiptModal):</strong> Trata-se de um extrato de transação privada e controle de acesso a serviços digitais emitido internamente pela plataforma.</li>
              <li><strong>Nota Fiscal de Serviços Eletrônica (NFS-e):</strong> Documento tributário emitido em conformidade com a prefeitura competente, a ser integrado via provedor fiscal homologado após deliberação contábil.</li>
            </ul>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
}
