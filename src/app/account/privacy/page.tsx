'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { preferencesService } from '@/services/account/preferencesService';
import { privacyService } from '@/services/account/privacyService';
import { dataLifecycleService } from '@/services/privacy/dataLifecycleService';
import { UserPreferences, AccountDeletionRequest, DataExportRequest } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  History,
  Sparkles,
  UserX,
  Download,
  Trash2,
  CheckCircle2,
  FileText,
  AlertTriangle,
  X,
  RotateCcw
} from 'lucide-react';

export default function PrivacyPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    profile_id: '',
    preferred_city_id: null,
    age_min: 18,
    age_max: 70,
    verified_only: false,
    recently_active_only: false,
    personalization_enabled: true,
    history_enabled: true,
    created_at: '',
    updated_at: '',
  });

  const [consents, setConsents] = useState<any[]>([]);
  const [blockedCount, setBlockedCount] = useState(0);
  const [activeDeletion, setActiveDeletion] = useState<AccountDeletionRequest | null>(null);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPrivacyData = async () => {
    if (!profile) return;
    try {
      const [prefs, userConsents, blocks, delReq, exports] = await Promise.all([
        preferencesService.getUserPreferences(profile.id),
        privacyService.getUserConsents(profile.id),
        privacyService.getUserBlocks(profile.id),
        dataLifecycleService.getActiveDeletionRequest(profile.id),
        dataLifecycleService.getUserExportRequests(profile.id),
      ]);

      if (prefs) setUserPrefs(prefs);
      setConsents(userConsents);
      setBlockedCount(blocks.length);
      setActiveDeletion(delReq);
      setExportRequests(exports);
    } catch (err) {
      console.error('Error loading privacy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadPrivacyData();
    }
  }, [profile, authLoading]);

  const handleToggleHistory = async () => {
    if (!profile) return;
    const newVal = !userPrefs.history_enabled;
    setUserPrefs({ ...userPrefs, history_enabled: newVal });

    const res = await preferencesService.updatePreferences(profile.id, { history_enabled: newVal });
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Histórico de Visualizações',
        message: newVal ? 'Gravação de histórico ativada.' : 'Gravação de histórico desativada.',
      });
    }
  };

  const handleTogglePersonalization = async () => {
    if (!profile) return;
    const newVal = !userPrefs.personalization_enabled;
    setUserPrefs({ ...userPrefs, personalization_enabled: newVal });

    const res = await preferencesService.updatePreferences(profile.id, { personalization_enabled: newVal });
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Personalização',
        message: newVal ? 'Recomendações personalizadas ativadas.' : 'Recomendações contextuais padrão.',
      });
    }
  };

  const handleRequestExport = async () => {
    setIsProcessingAction(true);
    const res = await dataLifecycleService.requestDataExport();
    setIsProcessingAction(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Exportação Solicitada (LGPD)',
        message: 'Seu pacote de dados foi enfileirado para geração assíncrona.',
      });
      loadPrivacyData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro na Exportação',
        message: res.error || 'Falha ao processar solicitação.',
      });
    }
  };

  const handleConfirmDeletion = async () => {
    setIsProcessingAction(true);
    const res = await dataLifecycleService.requestAccountDeletion(deletionReason);
    setIsProcessingAction(false);
    setIsDeleteModalOpen(false);

    if (res.success) {
      showToast({
        type: 'warning',
        title: 'Exclusão Agendada (7 dias)',
        message: 'Sua conta será permanentemente removida após o período de tolerância.',
      });
      loadPrivacyData();
    } else {
      showToast({
        type: 'error',
        title: 'Exclusão Bloqueada',
        message: res.error || 'Não foi possível agendar a exclusão.',
      });
    }
  };

  const handleCancelDeletion = async () => {
    setIsProcessingAction(true);
    const res = await dataLifecycleService.cancelAccountDeletion();
    setIsProcessingAction(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Exclusão Cancelada',
        message: 'Sua conta permanece ativa normalmente.',
      });
      loadPrivacyData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro ao Cancelar',
        message: res.error || 'Falha ao cancelar exclusão.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', maxWidth: '820px' }}>
        <Skeleton height="2rem" width="260px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="180px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="180px" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '820px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Central da Conta
        </Link>
      </div>

      {/* Scheduled Deletion Alert Banner (Section 94 & 96) */}
      {activeDeletion && (
        <Card variant="elevated" padding="md" style={{ background: 'rgba(163, 0, 33, 0.15)', border: '1px solid var(--accent-ruby)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-ruby)', fontWeight: 700, marginBottom: '0.2rem' }}>
                <AlertTriangle size={18} /> Exclusão de Conta Agendada
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Sua conta está em período de tolerância e será excluída em{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {new Date(activeDeletion.scheduled_for).toLocaleDateString('pt-BR')}
                </strong>.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCancelDeletion} isLoading={isProcessingAction} leftIcon={<RotateCcw size={14} />}>
              Cancelar Exclusão
            </Button>
          </div>
        </Card>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Lock size={28} color="var(--accent-gold)" />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Central de Privacidade & LGPD</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Controle de sigilo, gravação de histórico, trilha de consentimentos e gestão de dados.
        </p>
      </div>

      {/* Card 1: Data Controls */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Controles de Rastreamento e Sigilo</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* History Opt-out */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} color="var(--accent-gold)" /> Histórico Privado de Visualizações
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Se desativado, novas páginas de perfil que você visitar não serão registradas na sua conta.
              </div>
            </div>
            <input
              type="checkbox"
              checked={userPrefs.history_enabled}
              onChange={handleToggleHistory}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
          </div>

          {/* Personalization Opt-out */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--accent-gold)" /> Personalização da Home (&quot;Para Você&quot;)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Se desativado, a plataforma exibirá somente conteúdo contextual (cidade, destaques e ranking geral).
              </div>
            </div>
            <input
              type="checkbox"
              checked={userPrefs.personalization_enabled}
              onChange={handleTogglePersonalization}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
          </div>

          {/* Blocked Profiles Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserX size={16} color="var(--accent-ruby)" /> Perfis Bloqueados ({blockedCount})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '520px' }}>
                Anunciantes bloqueados não aparecem em suas recomendações e não recebem notificações sobre você.
              </div>
            </div>
            <Link href="/account/privacy/blocked">
              <Button variant="secondary" size="sm">
                Gerenciar Bloqueios
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Card 2: Consent Audit Trail */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Histórico de Consentimentos Registrados</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Registros formais de conformidade jurídica 18+ vinculados ao seu perfil.
        </p>

        {consents.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum registro de consentimento localizado.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {consents.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={16} color="var(--color-success)" />
                  <div>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {c.consent_type.replace('_', ' ')}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Fonte: {c.source} • {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                <Badge variant={c.granted ? 'gold' : 'neutral'}>
                  {c.granted ? 'Ativo' : 'Revogado'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Card 3: Data Management Actions (LGPD) */}
      <Card variant="elevated" padding="lg">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Gestão de Dados Pessoais (LGPD)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Exercício dos direitos de portabilidade e eliminação de dados previstos pela Lei Geral de Proteção de Dados.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <Button variant="secondary" size="md" onClick={handleRequestExport} isLoading={isProcessingAction} leftIcon={<Download size={16} />}>
            Exportar Meus Dados (JSON)
          </Button>
          <Button variant="ruby" size="md" onClick={() => setIsDeleteModalOpen(true)} leftIcon={<Trash2 size={16} />}>
            Excluir Minha Conta
          </Button>
        </div>

        {exportRequests.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Solicitações de Exportação Recentes:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {exportRequests.map((ex) => (
                <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Solicitado em {new Date(ex.requested_at).toLocaleDateString('pt-BR')}</span>
                  <Badge variant={ex.status === 'ready' ? 'gold' : 'neutral'}>{ex.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          onClick={() => setIsDeleteModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-ruby)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '480px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-ruby)' }}>
                <AlertTriangle size={22} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Excluir Minha Conta</h3>
              </div>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Ao confirmar, sua solicitação de exclusão entrará em período de tolerância de <strong>7 dias</strong>. Após este prazo, seus favoritos, histórico, listas e anúncios serão permanentemente removidos.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="del-reason" style={{ fontSize: '0.85rem' }}>Motivo da saída (opcional):</label>
              <textarea
                id="del-reason"
                className="input"
                rows={3}
                placeholder="Conte-nos por que está saindo..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="ruby" onClick={handleConfirmDeletion} isLoading={isProcessingAction}>
                Confirmar Solicitação de Exclusão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
