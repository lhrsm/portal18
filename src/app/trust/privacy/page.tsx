'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Lock, EyeOff, UserCheck, ShieldCheck } from 'lucide-react';

export default function TrustPrivacyPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/trust" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Trust Center
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">PRIVACIDADE E SIGILO</Badge>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Compromisso com a Privacidade e Zero-Tracking
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Não vendemos seus dados, não realizamos rastreamento entre sites e tratamos suas preferências com discrição absoluta.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Zero Desanonimização de Visitantes</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Nenhum anunciante consegue saber quem favoritou seu perfil, quem o visitou, quem o adicionou a listas ou quem o segue. O anunciante recebe estritamente contadores numéricos agregados.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Histórico Privado com Controle Total</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Seu histórico de navegação existe apenas para sua própria conveniência. Você pode desativar a gravação ou limpar todos os registros com 1 clique a qualquer momento na Central de Privacidade.
          </p>
        </Card>

        <Card variant="glass" padding="md">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Notificações Discretas</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Nossos e-mails e notificações push utilizam assuntos e previews neutros, garantindo que nada de natureza íntima ou explícita seja exposto na tela de bloqueio do seu dispositivo.
          </p>
        </Card>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/account/privacy">
          <Button variant="primary">Acessar Minha Central de Privacidade</Button>
        </Link>
      </div>
    </div>
  );
}
