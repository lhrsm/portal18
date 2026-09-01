'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { sanctionsService } from '@/services/trust-safety/sanctionsService';
import { appealsService } from '@/services/trust-safety/appealsService';
import { Sanction, Appeal } from '@/services/trust-safety/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowLeft,
  Send,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function AdvertiserSecurityPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Appeal Modal
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    const [san, app] = await Promise.all([
      sanctionsService.getActiveSanctions('profile', profile.id),
      appealsService.getAppealsForUser(profile.id),
    ]);
    setSanctions(san);
    setAppeals(app);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const handleOpenAppeal = (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setShowAppealModal(true);
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedSanction || !appealReason) return;
    setSubmittingAppeal(true);
    const res = await appealsService.submitAppeal({
      sanctionId: selectedSanction.id,
      profileId: profile.id,
      subjectType: 'profile',
      subjectId: profile.id,
      reason: appealReason,
    });

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Recurso Enviado',
        message: 'Seu recurso foi encaminhado para análise independente por outro moderador.',
      });
      setShowAppealModal(false);
      setAppealReason('');
      await loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro ao Enviar Recurso',
        message: res.error || 'Falha ao registrar recurso.',
      });
    }
    setSubmittingAppeal(false);
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem', maxWidth: '960px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/advertiser" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Voltar para o Painel
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
          Segurança & Integridade da Conta
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Status de conformidade, penalidades ativas, recursos e proteção de autenticidade
        </p>
      </div>

      {/* Security Status Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={24} color="var(--color-success)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Status de Autenticidade</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '0 0 0.5rem 0' }}>
            Vídeo de verificação de autenticidade validado e selo 18+ ativo.
          </p>
          <Badge variant="success">CONFORME</Badge>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {sanctions.length === 0 ? (
              <CheckCircle2 size={24} color="var(--color-success)" />
            ) : (
              <AlertTriangle size={24} color="var(--accent-ruby)" />
            )}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Restrições de Conta</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '0 0 0.5rem 0' }}>
            {sanctions.length === 0 ? 'Nenhuma restrição ou sanção ativa.' : `${sanctions.length} restrição(ões) ativa(s).`}
          </p>
          <Badge variant={sanctions.length === 0 ? 'success' : 'ruby'}>
            {sanctions.length === 0 ? 'SEM PENALIDADES' : 'PENALIZADO'}
          </Badge>
        </Card>
      </div>

      {/* Active Sanctions */}
      {sanctions.length > 0 && (
        <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem', border: '1px solid var(--accent-ruby)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-ruby)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> Penalidades em Vigor
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sanctions.map((san) => (
              <div key={san.id} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{san.reason_public}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Tipo: {san.sanction_type} | Expira em: {san.ends_at ? new Date(san.ends_at).toLocaleDateString('pt-BR') : 'Permanente'}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleOpenAppeal(san)}>
                  Recorrer da Decisão
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Appeals History */}
      <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck2 size={18} /> Histórico de Recursos
        </h3>
        {appeals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Nenhum recurso submetido anteriormente.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {appeals.map((app) => (
              <div key={app.id} style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{app.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Submetido em: {new Date(app.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <Badge variant={app.status === 'submitted' ? 'gold' : app.status === 'overturned' ? 'success' : 'ruby'}>
                  {app.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Appeal Modal */}
      {showAppealModal && (
        <Modal
          isOpen={showAppealModal}
          onClose={() => setShowAppealModal(false)}
          title="Recurso Administrativo de Penalidade"
          maxWidth="500px"
        >
          <form onSubmit={handleSubmitAppeal}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <strong>Penalidade Recorrida:</strong> {selectedSanction?.reason_public}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Justificativa e Argumentação
                </label>
                <textarea
                  required
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="input"
                  placeholder="Explique por que esta penalidade deve ser revista ou revertida..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAppealModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Send size={14} />} isLoading={submittingAppeal}>
                Enviar Recurso
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
