'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, ShieldAlert, Send, CheckCircle2 } from 'lucide-react';

export default function ContentRemovalPage() {
  const { showToast } = useToast();

  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [reason, setReason] = useState('unauthorized_image');
  const [profileUrl, setProfileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterEmail || !profileUrl || !description) {
      showToast({ type: 'error', title: 'Campos Obrigatórios', message: 'Preencha todos os campos requeridos.' });
      return;
    }

    setIsSubmitting(true);
    // Simulating urgent takedown submission
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSuccess(true);
    showToast({
      type: 'success',
      title: 'Solicitação Registrada',
      message: 'Nossa equipe de plantão iniciou a análise prioritária.',
    });
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/trust" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Trust Center
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="ruby">CANAL PRIORITÁRIO 24/7</Badge>
        </div>
        <h1 style={{ fontSize: '2.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Solicitação de Remoção Urgente de Conteúdo
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          Utilize este formulário para relatar uso indevido de imagem, suspeita de menor de idade, falsidade ideológica ou violação de direitos.
        </p>
      </div>

      {isSuccess ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle2 size={54} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Solicitação Recebida com Sucesso</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Seu relato foi encaminhado para a mesa de compliance e moderação de emergência. O conteúdo indicado passará por bloqueio preventivo para averiguação imediata.
          </p>
          <Link href="/trust">
            <Button variant="primary">Voltar para Trust Center</Button>
          </Link>
        </Card>
      ) : (
        <Card variant="glass" padding="lg">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label" htmlFor="req-name">Seu Nome / Identificação</label>
                <input
                  id="req-name"
                  type="text"
                  className="input"
                  placeholder="Nome completo ou representante legal"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="label" htmlFor="req-email">E-mail para Resposta *</label>
                <input
                  id="req-email"
                  type="email"
                  className="input"
                  placeholder="seuemail@exemplo.com"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="takedown-reason">Motivo da Solicitação *</label>
              <select
                id="takedown-reason"
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="unauthorized_image">Uso não autorizado da minha imagem / fotos</option>
                <option value="minor_suspicion">Suspeita de envolvimento de menores de 18 anos</option>
                <option value="impersonation">Perfil falso / Usurpando identidade de terceiro</option>
                <option value="non_consensual">Conteúdo não consensual / Vazamento</option>
                <option value="copyright">Violação de direitos autorais ou marca</option>
                <option value="other">Outra violação legal grave</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="profile-url">Link do Perfil ou Foto no Portal *</label>
              <input
                id="profile-url"
                type="text"
                className="input"
                placeholder="https://portalnacional18.com.br/perfil/..."
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="label" htmlFor="takedown-desc">Detalhes da Violação *</label>
              <textarea
                id="takedown-desc"
                className="input"
                rows={5}
                placeholder="Explique o motivo da solicitação, fornecendo links, evidências ou contexto que comprovem a irregularidade..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-ruby)', fontSize: '0.85rem' }}>
              <ShieldAlert size={18} />
              <span>Solicitações com indício de risco grave são processadas com prioridade absoluta.</span>
            </div>

            <Button type="submit" variant="ruby" size="lg" isLoading={isSubmitting} leftIcon={<Send size={18} />}>
              Enviar Solicitação de Remoção
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
