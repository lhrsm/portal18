'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { sessionService } from '@/services/security/sessionService';
import { UserSessionRecord, TrustedDevice } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Smartphone,
  Laptop,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AccountSessionsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<UserSessionRecord[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadData = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const [sessList, devList] = await Promise.all([
        sessionService.getUserSessions(profile.id),
        sessionService.getTrustedDevices(profile.id),
      ]);
      setSessions(sessList);
      setTrustedDevices(devList);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [profile, authLoading]);

  const handleRevokeSingle = async (sessionId: string) => {
    setIsRevoking(true);
    const res = await sessionService.revokeSession(sessionId);
    setIsRevoking(false);

    if (res.success) {
      showToast({ type: 'success', title: 'Sessão Encerrada', message: 'O acesso do dispositivo foi revogado.' });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao encerrar sessão' });
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm('Deseja encerrar todas as outras sessões ativas?')) return;
    setIsRevoking(true);
    const res = await sessionService.revokeAllOtherSessions();
    setIsRevoking(false);

    if (res.success) {
      showToast({ type: 'success', title: 'Sessões Encerradas', message: 'Todas as outras sessões foram desconectadas.' });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao desconectar outras sessões' });
    }
  };

  const getDeviceIcon = (ua: string) => {
    const isMobile = /mobile|android|iphone/i.test(ua);
    return isMobile ? <Smartphone size={22} color="var(--accent-gold)" /> : <Laptop size={22} color="var(--accent-gold)" />;
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '820px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/account/security" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Segurança
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Smartphone size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Sessões e Dispositivos</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Monitore onde sua conta está conectada e encerre acessos não reconhecidos.
          </p>
        </div>

        {sessions.length > 1 && (
          <Button variant="secondary" size="sm" onClick={handleRevokeAllOthers} isLoading={isRevoking} leftIcon={<LogOut size={14} />}>
            Encerrar Outras Sessões
          </Button>
        )}
      </div>

      {/* Active Sessions List */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Sessões Ativas ({sessions.length})</h2>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Skeleton height="90px" />
            <Skeleton height="90px" />
          </div>
        ) : sessions.length === 0 ? (
          <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Sessão Segura</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Apenas este navegador possui sessão autenticada no momento.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map((s) => {
              const lastSeenDate = new Date(s.last_seen_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card key={s.id} variant="glass" padding="md">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                        {getDeviceIcon(s.user_agent_summary)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.user_agent_summary || 'Navegador Web'}</span>
                          {s.is_current && <Badge variant="gold">Esta Sessão</Badge>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={13} /> {s.region || 'Brasil'}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} /> Visto em {lastSeenDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!s.is_current && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRevokeSingle(s.id)}
                        isLoading={isRevoking}
                        leftIcon={<LogOut size={14} />}
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Trusted Devices Section (Section 14) */}
      <div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Dispositivos Confiáveis ({trustedDevices.length})</h2>
        {trustedDevices.length === 0 ? (
          <Card variant="glass" padding="md" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum dispositivo salvo como confiável permanentemente.
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trustedDevices.map((dev) => (
              <Card key={dev.id} variant="glass" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={20} color="var(--color-success)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dev.device_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Adicionado em {new Date(dev.trusted_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">Confiável</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
