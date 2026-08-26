'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  UserCheck, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  X, 
  Ban, 
  MapPin, 
  Phone, 
  Tag, 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export default function AdminProfileReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const profileId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Modals state
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    if (!profileId) return;
    const reviewData = await adminService.getProfileForReview(profileId);
    setData(reviewData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [profileId]);

  const handleApprove = async () => {
    if (!data) return;
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const res = await adminService.approveProfile(data.advertiser.id);
      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível aprovar o perfil.');
        return;
      }

      showToast({
        type: 'success',
        title: 'Perfil Aprovado!',
        message: 'O perfil foi publicado com sucesso nas buscas públicas.',
      });
      router.push('/admin/moderation/profiles');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado na aprovação.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestChanges = async (feedback: string) => {
    const res = await adminService.requestChangesProfile(data.advertiser.id, feedback);
    if (res.success) {
      showToast({ type: 'info', title: 'Ajustes Solicitados', message: 'Notificação enviada ao anunciante.' });
      router.push('/admin/moderation/profiles');
    }
  };

  const handleReject = async (reason: string) => {
    const res = await adminService.rejectProfile(data.advertiser.id, reason);
    if (res.success) {
      showToast({ type: 'ruby', title: 'Perfil Rejeitado' });
      router.push('/admin/moderation/profiles');
    }
  };

  const handleSuspend = async (reason: string) => {
    const res = await adminService.suspendProfile(data.advertiser.id, reason);
    if (res.success) {
      showToast({ type: 'ruby', title: 'Perfil Suspenso' });
      router.push('/admin/moderation/profiles');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    const res = await adminService.addModerationNote('advertiser', data.advertiser.id, newNote);
    if (res.success) {
      setNewNote('');
      showToast({ type: 'success', title: 'Nota Interna Adicionada' });
      await loadData();
    }
    setIsAddingNote(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="400px" />
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <Card variant="glass" padding="lg" style={{ textAlign: 'center' }}>
          <h2>Perfil não encontrado.</h2>
          <Link href="/admin/moderation/profiles">
            <Button variant="secondary" style={{ marginTop: '1rem' }}>Voltar para a Fila</Button>
          </Link>
        </Card>
      </AdminLayout>
    );
  }

  const adv = data.advertiser;
  const approvedMediaCount = data.media.filter((m: any) => m.moderation_status === 'approved').length;

  return (
    <AdminLayout>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <Link href="/admin/moderation/profiles" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para a Fila
        </Link>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={() => setIsSuspendOpen(true)} style={{ color: 'var(--accent-ruby)' }}>
            Suspender
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsRejectOpen(true)}>
            Rejeitar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsRequestChangesOpen(true)}>
            Solicitar Ajustes
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleApprove}
            isLoading={isProcessing}
            leftIcon={<Check size={16} />}
          >
            Aprovar Perfil
          </Button>
        </div>
      </div>

      {errorMsg && (
        <Alert type="error" title="Bloqueio de Moderação" style={{ marginBottom: '1.5rem' }}>
          {errorMsg}
        </Alert>
      )}

      {/* Main Review Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Info, Location, Bio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Badge variant="warning">{adv.profile_status}</Badge>
                  <Badge variant={adv.verification_status === 'verified' ? 'success' : 'neutral'}>
                    {adv.verification_status}
                  </Badge>
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{adv.stage_name}</h2>
                {adv.headline && (
                  <p style={{ color: 'var(--accent-gold)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                    {adv.headline}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <div><strong>Gênero:</strong> {adv.gender || 'Não especificado'}</div>
              <div><strong>Nascimento:</strong> {adv.birth_date} (18+ Confirmado)</div>
              <div><strong>Localização:</strong> {adv.brazil_cities?.name}, {adv.brazil_states?.name} ({adv.brazil_states?.code})</div>
              {adv.neighborhood && <div><strong>Bairro:</strong> {adv.neighborhood}</div>}
              <div><strong>Submetido em:</strong> {adv.submitted_at ? new Date(adv.submitted_at).toLocaleString('pt-BR') : 'Recente'}</div>
            </div>
          </Card>

          {/* Bio */}
          <Card variant="glass" padding="lg">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Biografia / Apresentação</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
              {adv.bio || 'Nenhuma biografia informada.'}
            </p>
          </Card>

          {/* Categories & Contacts */}
          <Card variant="glass" padding="lg">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Categorias & Contatos</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {data.categories.map((c: any) => (
                <Badge key={c.category_id} variant="gold">{c.categories?.name}</Badge>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.contacts.map((contact: any) => (
                <div key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <span><strong>{contact.contact_type.toUpperCase()}:</strong> {contact.contact_value}</span>
                  <Badge variant={contact.is_visible ? 'success' : 'neutral'}>
                    {contact.is_visible ? 'Visível' : 'Oculto'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Media Gallery, Internal Notes, Reports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Gallery */}
          <Card variant="glass" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Fotos da Galeria ({data.media.length})</h3>
              <Badge variant={approvedMediaCount > 0 ? 'success' : 'ruby'}>
                {approvedMediaCount} aprovada(s)
              </Badge>
            </div>

            {data.media.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma foto enviada.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {data.media.map((media: any, idx: number) => (
                  <div key={media.id} style={{ position: 'relative', height: '140px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)' }}>
                    <img src={media.storage_path} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '4px', left: '4px' }}>
                      <Badge variant={media.moderation_status === 'approved' ? 'success' : 'warning'}>
                        {media.moderation_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Internal Staff Notes (Requirement 37) */}
          <Card variant="glass" padding="lg">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>Notas Internas da Moderação (Sigiloso)</h3>
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Adicionar nota interna para o staff..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" size="sm" isLoading={isAddingNote}>Salvar</Button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.notes.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma nota interna registrada.</div>
              ) : (
                data.notes.map((n: any) => (
                  <div key={n.id} style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: '0.2rem' }}>
                      <span>{n.profiles?.display_name || 'Staff'}</span>
                      <span>{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)' }}>{n.note}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ActionConfirmModal
        isOpen={isRequestChangesOpen}
        title="Solicitar Ajustes no Perfil"
        description="Informe detalhadamente quais campos ou fotos precisam ser alterados pelo anunciante."
        confirmLabel="Enviar Solicitação de Ajustes"
        variant="secondary"
        onClose={() => setIsRequestChangesOpen(false)}
        onConfirm={handleRequestChanges}
      />

      <ActionConfirmModal
        isOpen={isRejectOpen}
        title="Rejeitar Perfil"
        description="A rejeição impedirá a publicação e notificará o anunciante sobre a recusa."
        confirmLabel="Rejeitar Perfil"
        variant="ruby"
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
      />

      <ActionConfirmModal
        isOpen={isSuspendOpen}
        title="Suspender Perfil Ativo"
        description="O perfil será imediatamente despublicado e removido de todas as buscas públicas."
        confirmLabel="Suspender Anúncio"
        variant="ruby"
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleSuspend}
      />
    </AdminLayout>
  );
}
