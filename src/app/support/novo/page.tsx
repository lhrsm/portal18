'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supportService } from '@/services/support/supportService';
import { SupportCategory } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, Send, ShieldCheck, HelpCircle } from 'lucide-react';

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<SupportCategory>('account');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!subject.trim() || !description.trim()) {
      showToast({ type: 'error', title: 'Campos Obrigatórios', message: 'Preencha o assunto e a mensagem.' });
      return;
    }

    setIsSubmitting(true);
    const res = await supportService.createTicket(profile.id, {
      category,
      subject,
      description,
    });

    setIsSubmitting(false);

    if (res.success && res.ticketId) {
      showToast({ type: 'success', title: 'Chamado Aberto', message: 'Sua solicitação foi registrada.' });
      router.push(`/support/${res.ticketId}`);
    } else {
      showToast({ type: 'error', title: 'Erro ao Abrir Chamado', message: res.error || 'Tente novamente.' });
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '720px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/support" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Meus Chamados
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Abrir Novo Chamado
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Descreva sua dúvida ou problema. Nossa equipe responderá no prazo médio de 2 horas.
        </p>
      </div>

      <Card variant="glass" padding="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Category Select */}
          <div>
            <label className="label" htmlFor="ticket-category">Categoria do Atendimento</label>
            <select
              id="ticket-category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCategory)}
              style={{ width: '100%' }}
            >
              <option value="account">Conta e Acesso</option>
              <option value="security">Segurança e Autenticação</option>
              <option value="verification">Verificação de Identidade (KYC)</option>
              <option value="profile">Perfil e Anúncio</option>
              <option value="media">Fotos, Vídeos e Galeria</option>
              <option value="billing">Planos, Assinaturas e Pagamentos</option>
              <option value="privacy">Privacidade e LGPD</option>
              <option value="report">Denúncia ou Reclamação</option>
              <option value="other">Outros Assuntos</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="label" htmlFor="ticket-subject">Assunto Resumido</label>
            <input
              id="ticket-subject"
              type="text"
              className="input"
              placeholder="Ex: Dúvida sobre aprovação de fotos"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              required
              style={{ width: '100%' }}
            />
          </div>

          {/* Message Description */}
          <div>
            <label className="label" htmlFor="ticket-desc">Descrição Detalhada</label>
            <textarea
              id="ticket-desc"
              className="input"
              rows={6}
              placeholder="Explique o que aconteceu, fornecendo detalhes relevantes para podermos ajudar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="var(--accent-gold)" />
            <span>Suas informações de suporte são estritamente confidenciais e protegidas por criptografia.</span>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} leftIcon={<Send size={18} />}>
            Enviar Chamado
          </Button>
        </form>
      </Card>
    </div>
  );
}
