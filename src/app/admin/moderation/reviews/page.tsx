'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { reviewService } from '@/services/reviewService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Clock,
  Trash2
} from 'lucide-react';

export default function AdminReviewModerationPage() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await reviewService.getAdminReviewQueue();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleModerate = async (reviewId: string, status: 'approved' | 'rejected' | 'removed', reason?: string) => {
    const res = await reviewService.moderateReview(reviewId, status, reason);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Status Atualizado',
        message: `Avaliação ${status === 'approved' ? 'aprovada' : status === 'rejected' ? 'rejeitada' : 'removida'} com sucesso.`,
      });
      loadData();
    } else {
      showToast({
        type: 'error',
        title: 'Erro',
        message: res.error || 'Não foi possível moderar a avaliação.',
      });
    }
  };

  const filteredReviews = filterStatus === 'all'
    ? reviews
    : reviews.filter((r) => r.status === filterStatus);

  const pendingCount = reviews.filter((r) => r.status === 'submitted' || r.status === 'pending_review').length;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">TRUST & SAFETY</Badge>
            <Badge variant="neutral">Review Moderation</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Moderação de Avaliações</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Fila de moderação de avaliações estruturadas da comunidade
          </p>
        </div>
        <Badge variant={pendingCount > 0 ? 'ruby' : 'success'}>
          {pendingCount} pendente(s) de moderação
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'submitted', 'approved', 'rejected', 'removed'].map((st) => (
          <Button
            key={st}
            variant={filterStatus === st ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilterStatus(st)}
            style={{ textTransform: 'capitalize' }}
          >
            {st === 'all' ? 'Todas' : st === 'submitted' ? 'Pendentes' : st === 'approved' ? 'Aprovadas' : st === 'rejected' ? 'Rejeitadas' : 'Removidas'}
          </Button>
        ))}
      </div>

      {/* Reviews Queue */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="140px" />
          <Skeleton height="140px" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3rem' }}>
          <ShieldCheck size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>Nenhuma avaliação nesta fila</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Todas as avaliações deste filtro foram processadas.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReviews.map((rev) => (
            <Card key={rev.id} variant="glass" padding="md">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Badge variant={rev.status === 'approved' ? 'success' : rev.status === 'submitted' ? 'warning' : 'ruby'}>
                      {rev.status === 'submitted' ? 'Pendente' : rev.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                    </Badge>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Anúncio: <strong>{rev.advertiser_profiles?.stage_name || 'Anunciante'}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {new Date(rev.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    <span>Comunicação: <strong>{rev.rating_communication}/5</strong></span>
                    <span>Precisão: <strong>{rev.rating_accuracy}/5</strong></span>
                    <span>Profissionalismo: <strong>{rev.rating_professionalism}/5</strong></span>
                    <span style={{ color: 'var(--accent-gold)' }}>Média: <strong>{rev.rating_overall}/5.0</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {rev.status !== 'approved' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleModerate(rev.id, 'approved')}
                      leftIcon={<CheckCircle2 size={14} />}
                    >
                      Aprovar
                    </Button>
                  )}
                  {rev.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModerate(rev.id, 'rejected', 'Violação às regras')}
                      leftIcon={<XCircle size={14} />}
                    >
                      Rejeitar
                    </Button>
                  )}
                  {rev.status === 'approved' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleModerate(rev.id, 'removed', 'Removido por moderação')}
                      style={{ color: 'var(--accent-ruby)' }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>

              {rev.comment && (
                <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  &ldquo;{rev.comment}&rdquo;
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
