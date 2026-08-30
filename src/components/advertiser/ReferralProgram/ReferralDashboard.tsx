'use client';

import React, { useState, useEffect } from 'react';
import { referralService } from '@/services/referralService';
import { ReferralStats, Referral } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Users, 
  Copy, 
  Share2, 
  Gift, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle, 
  Sparkles,
  Info,
  Check
} from 'lucide-react';

interface ReferralDashboardProps {
  advertiserId: string;
}

export function ReferralDashboard({ advertiserId }: ReferralDashboardProps) {
  const { showToast } = useToast();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [advertiserId]);

  const loadData = async () => {
    setLoading(true);
    const [statsRes, historyRes] = await Promise.all([
      referralService.getAdvertiserReferralStats(advertiserId),
      referralService.getReferralHistory(advertiserId),
    ]);
    setStats(statsRes);
    setHistory(historyRes);
    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (!stats?.referral_url) return;
    try {
      await navigator.clipboard.writeText(stats.referral_url);
      setCopied(true);
      showToast({
        type: 'success',
        title: 'Link Copiado',
        message: 'O link de indicação foi copiado para a sua área de transferência.',
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível copiar o link automaticamente.',
      });
    }
  };

  const handleShare = async () => {
    if (!stats?.referral_url) return;
    const shareData = {
      title: 'Portal18 — Indicação para Anunciantes',
      text: 'Anuncie no Portal18, a principal plataforma independente de divulgação!',
      url: stats.referral_url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Skeleton height="180px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Skeleton height="90px" />
          <Skeleton height="90px" />
          <Skeleton height="90px" />
          <Skeleton height="90px" />
        </div>
        <Skeleton height="200px" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero / Invite Box */}
      <Card variant="elevated" padding="lg" style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(18, 22, 31, 0.95) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Badge variant="gold">PROGRAMA DE INDICAÇÃO</Badge>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700 }}>+7 Dias por Anunciante</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
              Indique Anunciantes e Ganhe Benefícios Comerciais
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
              Compartilhe seu link exclusivo com outros profissionais independentes. Quando a indicação for aprovada e qualificada, você ganha <strong>7 dias adicionais de recursos comerciais</strong> em seu perfil.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRulesModalOpen(true)}
            style={{ fontSize: '0.825rem', gap: '0.4rem' }}
          >
            <HelpCircle size={15} /> Regras do Programa
          </Button>
        </div>

        {/* Share Link Row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '0.6rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          alignItems: 'center',
        }}>
          <div style={{
            flex: 1,
            minWidth: '220px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            color: 'var(--accent-gold)',
            padding: '0.4rem 0.6rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {stats?.referral_url}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            >
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleShare}
              leftIcon={<Share2 size={14} />}
            >
              Compartilhar
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total de Indicações</span>
            <Users size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats?.total_referrals || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cadastros originados</span>
        </Card>

        <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Em Análise / Maturação</span>
            <Clock size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-warning)' }}>{stats?.pending_count || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aguardando qualificação</span>
        </Card>

        <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-success)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Qualificadas</span>
            <CheckCircle2 size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-success)' }}>{stats?.qualified_count || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Critérios validados</span>
        </Card>

        <Card variant="glass" padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--accent-gold)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Bônus Conquistados</span>
            <Gift size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            +{stats?.total_bonus_days_earned || 0} dias
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats?.active_bonus_days ? `${stats.active_bonus_days} dias ativos agora` : 'Registrados no ledger'}
          </span>
        </Card>
      </div>

      {/* Referral History Section */}
      <Card variant="glass" padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Histórico de Indicações</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '0.2rem 0 0 0' }}>
              Acompanhe o status e a concessão de bônus das suas indicações (dados anonimizados por privacidade)
            </p>
          </div>
          <Badge variant="neutral">{history.length} registros</Badge>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Nenhuma indicação registrada ainda</div>
            <p style={{ fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
              Compartilhe seu link exclusivo para começar a acumular dias de benefícios.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {history.map((item, idx) => {
              const stageName = item.referred_advertiser?.stage_name || `Anunciante #${idx + 1}`;
              const isQualified = item.status === 'qualified' || item.status === 'rewarded';
              const isPending = item.status === 'registered' || item.status === 'pending_qualification';

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isQualified ? 'rgba(37, 211, 102, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'grid',
                      placeItems: 'center',
                      color: isQualified ? 'var(--color-success)' : 'var(--text-secondary)',
                    }}>
                      {isQualified ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stageName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Iniciado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.status === 'rewarded' && (
                      <Badge variant="gold">+7 Dias Concedidos</Badge>
                    )}
                    {item.status === 'qualified' && (
                      <Badge variant="success">Qualificada</Badge>
                    )}
                    {item.status === 'pending_qualification' && (
                      <Badge variant="warning">Em Maturação (48h)</Badge>
                    )}
                    {item.status === 'registered' && (
                      <Badge variant="neutral">Cadastro em Andamento</Badge>
                    )}
                    {item.status === 'revoked' && (
                      <Badge variant="ruby">Revogado</Badge>
                    )}
                    {item.status === 'rejected' && (
                      <Badge variant="ruby">Não Qualificado</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Rules Modal */}
      {isRulesModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
          onClick={() => setIsRulesModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Regras do Programa de Indicação
              </h3>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>1. Elegibilidade e Recompensas:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>
                  Cada indicação qualificada concede <strong>7 dias adicionais de recursos comerciais</strong> no seu perfil anunciante. O benefício é de natureza promocional e <strong>não possui valor monetário, não gera saldo sacável e não é conversível em dinheiro</strong>.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>2. Critérios de Qualificação:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>
                  A indicação torna-se qualificada somente quando o anunciante indicado completar o cadastro, tiver seu perfil aprovado pela moderação, publicado com sucesso e cumprir o período de maturação de 48 horas.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>3. Proibição de Autoindicação e Abuso:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>
                  É estritamente proibido criar contas falsas, autoindicações ou utilizar robôs. Indicações que violarem as diretrizes serão bloqueadas e quaisquer bônus indevidos serão revogados.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>4. Privacidade de Dados:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>
                  Em conformidade com a LGPD e as políticas de sigilo do Portal18, dados pessoais ou civis dos indicados nunca são revelados ao anunciante indicador.
                </p>
              </div>
            </div>

            <Button variant="primary" onClick={() => setIsRulesModalOpen(false)} style={{ marginTop: '0.5rem' }}>
              Entendi as Regras
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
