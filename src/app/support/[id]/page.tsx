'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/support/supportService';
import { SupportTicket, SupportTicketMessage } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, Send, ShieldCheck, User, Headphones, Clock } from 'lucide-react';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (params.id as string) || '';
  const { user, profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [t, msgs] = await Promise.all([
        supportService.getTicketById(ticketId),
        supportService.getTicketMessages(ticketId),
      ]);
      setTicket(t);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading ticket:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(`/login?redirect_to=/support/${ticketId}`);
      } else if (ticketId) {
        loadData();
      }
    }
  }, [ticketId, user, authLoading]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !replyMessage.trim()) return;

    setIsSending(true);
    const res = await supportService.addMessage(ticketId, profile.id, 'user', replyMessage.trim());
    setIsSending(false);

    if (res.success) {
      setReplyMessage('');
      loadData();
    } else {
      showToast({ type: 'error', title: 'Erro ao Enviar', message: res.error || 'Tente novamente.' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="gold">Aberto</Badge>;
      case 'in_progress': return <Badge variant="neutral">Em Análise</Badge>;
      case 'waiting_user': return <Badge variant="ruby">Aguardando Você</Badge>;
      case 'resolved': return <Badge variant="neutral">Resolvido</Badge>;
      case 'closed': return <Badge variant="neutral">Fechado</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '780px' }}>
        <Skeleton height="2rem" width="280px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="160px" style={{ marginBottom: '1rem' }} />
        <Skeleton height="160px" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', maxWidth: '540px' }}>
        <Card variant="glass" padding="lg">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Chamado não encontrado</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Este ticket não existe ou você não possui permissão para acessá-lo.
          </p>
          <Link href="/support">
            <Button variant="primary">Voltar para Central de Suporte</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '780px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/support" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Meus Chamados
        </Link>
      </div>

      {/* Ticket Header Card */}
      <Card variant="glass" padding="md" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                #{ticket.id.substring(0, 8).toUpperCase()}
              </span>
              {getStatusBadge(ticket.status)}
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {ticket.subject}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Categoria: <strong style={{ color: 'var(--accent-gold)' }}>{ticket.category}</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Messages Thread */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {messages.map((m) => {
          const isStaff = m.author_type === 'staff';
          const isSystem = m.author_type === 'system';
          const timeStr = new Date(m.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short',
          });

          return (
            <Card
              key={m.id}
              variant={isStaff ? 'elevated' : 'glass'}
              padding="md"
              style={{
                borderLeft: isStaff ? '3px solid var(--accent-gold)' : undefined,
                background: isStaff ? 'rgba(218, 165, 32, 0.04)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isStaff ? (
                    <>
                      <Headphones size={16} color="var(--accent-gold)" />
                      <strong style={{ color: 'var(--accent-gold)', fontSize: '0.9rem' }}>Equipe de Suporte</strong>
                    </>
                  ) : (
                    <>
                      <User size={16} color="var(--text-secondary)" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Você</strong>
                    </>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeStr}</span>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                {m.message}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Reply Input Form */}
      {ticket.status !== 'closed' ? (
        <Card variant="glass" padding="md">
          <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Responder ao chamado</h4>
            <textarea
              className="input"
              rows={4}
              placeholder="Digite sua resposta aqui..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="md" isLoading={isSending} leftIcon={<Send size={16} />}>
                Enviar Resposta
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card variant="glass" padding="md" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Este chamado foi encerrado. Caso necessite de nova assistência, abra um novo ticket.
        </Card>
      )}
    </div>
  );
}
