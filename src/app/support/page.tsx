'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/support/supportService';
import { SupportTicket } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function SupportHubPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      if (!profile) return;
      try {
        const data = await supportService.getUserTickets(profile.id);
        setTickets(data);
      } catch (err) {
        console.error('Error loading tickets:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect_to=/support');
      } else {
        loadTickets();
      }
    }
  }, [user, profile, authLoading, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="gold">Aberto</Badge>;
      case 'in_progress':
        return <Badge variant="neutral">Em Análise</Badge>;
      case 'waiting_user':
        return <Badge variant="ruby">Aguardando Você</Badge>;
      case 'resolved':
        return <Badge variant="neutral">Resolvido</Badge>;
      case 'closed':
        return <Badge variant="neutral">Fechado</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'account': return 'Conta e Acesso';
      case 'security': return 'Segurança';
      case 'verification': return 'Verificação (KYC)';
      case 'profile': return 'Perfil e Anúncio';
      case 'media': return 'Fotos e Mídia';
      case 'billing': return 'Pagamentos e Planos';
      case 'privacy': return 'Privacidade e LGPD';
      case 'report': return 'Denúncia';
      default: return 'Suporte Geral';
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <MessageSquare size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Central de Suporte</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Atendimento privado e seguro para resolução de dúvidas e solicitações.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/help">
            <Button variant="secondary" leftIcon={<HelpCircle size={16} />}>
              Base de Conhecimento
            </Button>
          </Link>
          <Link href="/support/novo">
            <Button variant="primary" leftIcon={<Plus size={16} />}>
              Novo Chamado
            </Button>
          </Link>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="90px" />
          <Skeleton height="90px" />
          <Skeleton height="90px" />
        </div>
      ) : tickets.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Nenhum chamado aberto</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            Se você precisar de auxílio com verificação, pagamentos, denúncias ou configurações, abra um chamado.
          </p>
          <Link href="/support/novo">
            <Button variant="primary" leftIcon={<Plus size={16} />}>
              Abrir Primeiro Chamado
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map((t) => {
            const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Link key={t.id} href={`/support/${t.id}`} style={{ textDecoration: 'none' }}>
                <Card variant="glass" padding="md" style={{ transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          #{t.id.substring(0, 8).toUpperCase()}
                        </span>
                        {getStatusBadge(t.status)}
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                          {getCategoryLabel(t.category)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {t.subject}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        <Clock size={13} /> Aberto em {dateStr}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.9rem' }}>
                      Ver conversa <ArrowRight size={16} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
