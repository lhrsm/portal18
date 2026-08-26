'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { incidentService } from '@/services/incidents/incidentService';
import { Incident } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  ShieldCheck, 
  Image as ImageIcon, 
  CreditCard, 
  Bell 
} from 'lucide-react';

export default function PlatformStatusPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      try {
        const incList = await incidentService.getPublicIncidents();
        setIncidents(incList);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const pastIncidents = incidents.filter((i) => i.status === 'resolved');

  const services = [
    { name: 'Plataforma & Navegação', status: 'Operacional', icon: <Server size={18} color="var(--color-success)" /> },
    { name: 'Autenticação, Login & MFA', status: 'Operacional', icon: <ShieldCheck size={18} color="var(--color-success)" /> },
    { name: 'Upload & Processamento de Mídia', status: 'Operacional', icon: <ImageIcon size={18} color="var(--color-success)" /> },
    { name: 'Processamento de Pagamentos', status: 'Operacional', icon: <CreditCard size={18} color="var(--color-success)" /> },
    { name: 'E-mails, Push & Notificações', status: 'Operacional', icon: <Bell size={18} color="var(--color-success)" /> },
  ];

  return (
    <div className="container" style={{ padding: '3.5rem 1rem 5rem 1rem', maxWidth: '820px' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: activeIncidents.length === 0 ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.12)', padding: '0.5rem 1.25rem', borderRadius: '50px', marginBottom: '1.25rem' }}>
          {activeIncidents.length === 0 ? (
            <>
              <CheckCircle2 size={18} color="var(--color-success)" />
              <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.9rem' }}>Todos os sistemas operando normalmente</span>
            </>
          ) : (
            <>
              <AlertTriangle size={18} color="var(--accent-ruby)" />
              <span style={{ color: 'var(--accent-ruby)', fontWeight: 700, fontSize: '0.9rem' }}>Incidente em andamento detectado</span>
            </>
          )}
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Status dos Serviços
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Transparência em tempo real sobre a disponibilidade e infraestrutura da plataforma.
        </p>
      </div>

      {/* Services Grid */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Componentes do Sistema</h2>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {services.map((svc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0.5rem',
                  borderBottom: i < services.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {svc.icon}
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{svc.name}</span>
                </div>
                <Badge variant="gold">{svc.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-ruby)', marginBottom: '1rem' }}>Incidentes em Andamento</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeIncidents.map((inc) => (
              <Card key={inc.id} variant="elevated" padding="lg" style={{ border: '1px solid var(--accent-ruby)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{inc.title}</h3>
                  <Badge variant="ruby">{inc.status.toUpperCase()}</Badge>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {inc.public_message}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Iniciado em: {new Date(inc.started_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past Incidents */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Histórico de Incidentes</h2>
        {isLoading ? (
          <Skeleton height="100px" />
        ) : pastIncidents.length === 0 ? (
          <Card variant="glass" padding="md" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 1rem' }}>
            Nenhum incidente registrado nos últimos 90 dias.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pastIncidents.map((inc) => (
              <Card key={inc.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{inc.title}</h4>
                  <Badge variant="neutral">Resolvido</Badge>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {inc.public_message}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Resolvido em {new Date(inc.resolved_at || inc.updated_at).toLocaleDateString('pt-BR')}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
