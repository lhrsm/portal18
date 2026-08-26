'use client';

import React, { useState, useEffect } from 'react';
import { mediaService } from '@/services/mediaService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  Sparkles, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  HardDrive 
} from 'lucide-react';

export default function AdminMediaProcessingPage() {
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await mediaService.getAdminProcessingJobs(30);
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReprocess = async (mediaId: string) => {
    setReprocessingId(mediaId);
    const res = await mediaService.adminReprocessMedia(mediaId);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Reprocessamento Enfileirado',
        message: 'O job de mídia foi re-adicionado à fila de execução com sucesso.',
      });
      await loadData();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao reprocessar mídia.' });
    }
    setReprocessingId(null);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Pipeline de Processamento de Mídia</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitoramento de jobs assíncronos, conversão de variantes, transcodificação de vídeos e CDN
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadData} leftIcon={<RefreshCw size={14} />}>
          Atualizar Fila
        </Button>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jobs na Fila</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length}
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Concluídos com Sucesso</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            {jobs.filter((j) => j.status === 'completed').length}
          </div>
        </Card>

        <Card variant="glass" padding="md">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Falhas de Processamento</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-ruby)' }}>
            {jobs.filter((j) => j.status === 'failed' || j.status === 'failed_permanent').length}
          </div>
        </Card>
      </div>

      {/* Jobs Table/List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : jobs.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <CheckCircle2 size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Fila de Processamento Vazia</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Todos os arquivos de imagens e vídeos foram processados com sucesso.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {jobs.map((job) => (
            <Card key={job.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  {job.job_type.includes('video') ? <VideoIcon size={16} color="var(--accent-ruby)" /> : <ImageIcon size={16} color="var(--accent-gold)" />}
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{job.job_type.toUpperCase()}</span>
                  <Badge variant={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'ruby' : 'warning'}>
                    {job.status.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tentativas: {job.attempts}/{job.max_attempts}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>ID: <code>{job.id.substring(0, 8)}</code></span>
                  <span>•</span>
                  <span>Data: {new Date(job.created_at).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              {job.status === 'failed' && job.media_id && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReprocess(job.media_id)}
                  isLoading={reprocessingId === job.media_id}
                  leftIcon={<RefreshCw size={14} />}
                >
                  Reprocessar
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
