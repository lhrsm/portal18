'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/support/supportService';
import { SupportTicket, SupportTicketStatus } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Headphones, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';

export default function AdminSupportPage() {
  const router = useRouter();
  const { user, isStaff, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filters = selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const data = await supportService.getAdminTickets(filters);
      setTickets(data);
    } catch (err) {
      console.error('Error loading admin tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isStaff) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [isStaff, authLoading, selectedStatus]);

  const handleUpdateStatus = async (ticketId: string, nextStatus: SupportTicketStatus) => {
    const res = await supportService.updateTicketStatus(ticketId, nextStatus);
    if (res.success) {
      showToast({ type: 'success', title: 'Status Atualizado', message: `Chamado alterado para ${nextStatus}.` });
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao atualizar.' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="gold">Aberto</Badge>;
      case 'in_progress': return <Badge variant="neutral">Em Análise</Badge>;
      case 'waiting_user': return <Badge variant="ruby">Aguardando Usuário</Badge>;
      case 'resolved': return <Badge variant="neutral">Resolvido</Badge>;
      case 'closed': return <Badge variant="neutral">Fechado</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '1140px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Painel Geral
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Headphones size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Fila de Atendimento e Suporte</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Gestão de tickets, dúvidas de usuários e solicitações operacionais.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="input"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="all">Todos os Status</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em Análise</option>
            <option value="waiting_user">Aguardando Usuário</option>
            <option value="resolved">Resolvidos</option>
            <option value="closed">Fechados</option>
          </select>

          <Button variant="secondary" size="sm" onClick={loadData} leftIcon={<RefreshCw size={14} />}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
      ) : tickets.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <CheckCircle2 size={42} color="var(--color-success)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Fila limpa!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhum chamado pendente no filtro selecionado.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {tickets.map((t) => {
            const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={t.id} variant="glass" padding="md">
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        #{t.id.substring(0, 8).toUpperCase()}
                      </span>
                      {getStatusBadge(t.status)}
                      <Badge variant={t.priority === 'critical' || t.priority === 'high' ? 'ruby' : 'neutral'}>
                        {t.priority}
                      </Badge>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
                        {t.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.subject}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Aberto em {dateStr}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link href={`/support/${t.id}`}>
                      <Button variant="secondary" size="sm" leftIcon={<ExternalLink size={14} />}>
                        Ver Conversa
                      </Button>
                    </Link>

                    {t.status === 'open' && (
                      <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(t.id, 'in_progress')}>
                        Atender
                      </Button>
                    )}

                    {t.status !== 'resolved' && t.status !== 'closed' && (
                      <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(t.id, 'resolved')}>
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
