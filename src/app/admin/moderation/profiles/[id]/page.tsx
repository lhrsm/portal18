'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminService, SectionReviewFeedback } from '@/services/adminService';
import { locationService } from '@/services/locationService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ActionConfirmModal } from '@/components/admin/ActionConfirmModal';
import { OnboardingPreviewCard } from '@/components/advertiser/OnboardingPreviewCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
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
  Clock,
  Sparkles,
  ShieldAlert,
  User,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function AdminProfileReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const profileId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Section feedback notes
  const [sectionNotes, setSectionNotes] = useState<SectionReviewFeedback>({
    photo: '',
    bio: '',
    contact: '',
    category: '',
    location: '',
  });

  // Action Modals State
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    if (!profileId) return;
    const [reviewData, catsData] = await Promise.all([
      adminService.getProfileForReview(profileId),
      locationService.getCategories(),
    ]);
    setData(reviewData);
    setCategories(catsData);
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
        setErrorMsg(res.error || 'Não foi possível aprovar o perfil. Verifique os critérios de publicação.');
        setIsApproveOpen(false);
        return;
      }

      showToast({
        type: 'success',
        title: 'Perfil Aprovado e Publicado',
        message: 'O anúncio foi publicado com sucesso nas buscas públicas.',
      });
      router.push('/admin/moderation/profiles');
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado na aprovação.');
    } finally {
      setIsProcessing(false);
      setIsApproveOpen(false);
    }
  };

  const handleRequestChanges = async (generalFeedback: string) => {
    setIsProcessing(true);
    const res = await adminService.requestChangesProfile(data.advertiser.id, generalFeedback, sectionNotes);
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Ajustes Solicitados',
        message: 'O anunciante foi notificado das pendências para correção.',
      });
      router.push('/admin/moderation/profiles');
    } else {
      setErrorMsg(res.error || 'Falha ao enviar solicitação de ajustes.');
    }
    setIsProcessing(false);
    setIsRequestChangesOpen(false);
  };

  const handleReject = async (reason: string) => {
    setIsProcessing(true);
    const res = await adminService.rejectProfile(data.advertiser.id, reason);
    if (res.success) {
      showToast({ type: 'ruby', title: 'Perfil Rejeitado Definitivamente' });
      router.push('/admin/moderation/profiles');
    }
    setIsProcessing(false);
    setIsRejectOpen(false);
  };

  const handleSuspend = async (reason: string) => {
    setIsProcessing(true);
    const res = await adminService.suspendProfile(data.advertiser.id, reason);
    if (res.success) {
      showToast({ type: 'ruby', title: 'Perfil Suspenso' });
      router.push('/admin/moderation/profiles');
    }
    setIsProcessing(false);
    setIsSuspendOpen(false);
  };

  const handleApproveMediaItem = async (mediaId: string) => {
    const res = await adminService.approveMedia(mediaId);
    if (res.success) {
      showToast({ type: 'success', title: 'Foto Aprovada!' });
      await loadData();
    }
  };

  const handleRejectMediaItem = async (mediaId: string) => {
    const res = await adminService.rejectMedia(mediaId, 'policy');
    if (res.success) {
      showToast({ type: 'info', title: 'Foto Rejeitada' });
      await loadData();
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
        <Skeleton height="3.5rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="500px" />
      </AdminLayout>
    );
  }

  if (!data || !data.advertiser) {
    return (
      <AdminLayout>
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2>Perfil não encontrado.</h2>
          <Link href="/admin/moderation/profiles">
            <Button variant="secondary" style={{ marginTop: '1rem' }}>Voltar para a Fila</Button>
          </Link>
        </Card>
      </AdminLayout>
    );
  }

  const adv = data.advertiser;
  const mediaList = data.media;
  const contacts = data.contacts;
  const reports = data.reports || [];
  const verification = data.verification;
  const criticalReports = reports.filter((r: any) => r.severity === 'critical' && r.status === 'open');

  const coverPhoto = mediaList.find((m: any) => m.position === 0) || mediaList[0];
  const approvedMediaCount = mediaList.filter((m: any) => m.moderation_status === 'approved').length;
  const isCoverApproved = coverPhoto && coverPhoto.moderation_status === 'approved';

  const selectedCategoryIds = data.categories.map((c: any) => c.category_id);

  return (
    <AdminLayout>
      {/* Top Header & Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
        }}
      >
        <Link
          href="/admin/moderation/profiles"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Voltar para a Fila de Perfis
        </Link>

        {/* Action Buttons Bar */}
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
            onClick={() => setIsApproveOpen(true)}
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

      {/* Critical Reports Warning Banner */}
      {criticalReports.length > 0 && (
        <Alert
          type="error"
          title="ATENÇÃO: Denúncias Críticas Abertas contra este Anunciante"
          style={{ marginBottom: '1.5rem' }}
        >
          Existem {criticalReports.length} denúncia(s) crítica(s) em aberto. A aprovação está bloqueada até que as denúncias sejam resolvidas pela equipe de Trust & Safety.
        </Alert>
      )}

      {/* 2-Column Split Review Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Visual Parity Live Preview Card */}
        <div>
          <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Prévia Real do Perfil</h3>
            <Badge variant="gold">Visualização Pública Oficial</Badge>
          </div>

          <OnboardingPreviewCard
            advertiser={adv}
            mediaList={mediaList}
            contacts={contacts}
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            stateName={adv.brazil_states?.name}
            cityName={adv.brazil_cities?.name}
          />
        </div>

        {/* RIGHT COLUMN: Review Checklist, KYC, Section Notes, Internal Staff Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Review Checklist Card */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
              Checklist de Moderação
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              {/* Item 1: Nome Artístico & Slug */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Nome artístico & URL slug</span>
                <Badge variant={adv.stage_name && adv.slug ? 'success' : 'ruby'}>
                  {adv.stage_name && adv.slug ? 'Conforme' : 'Pendente'}
                </Badge>
              </div>

              {/* Item 2: Maioridade 18+ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Maioridade 18+ ({adv.birth_date})</span>
                <Badge variant="success">18+ Confirmado</Badge>
              </div>

              {/* Item 3: Foto de Capa (Position 0) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Foto de Capa Principal (Posição 0)</span>
                <Badge variant={isCoverApproved ? 'success' : 'warning'}>
                  {isCoverApproved ? 'Aprovada' : 'Pendente de Aprovação'}
                </Badge>
              </div>

              {/* Item 4: Mídias Elegíveis */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Mídias Aprovadas na Galeria</span>
                <Badge variant={approvedMediaCount > 0 ? 'success' : 'ruby'}>
                  {approvedMediaCount}/{mediaList.length} aprovadas
                </Badge>
              </div>

              {/* Item 5: Contatos Ativos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Canais de Contato (WhatsApp/Telefone)</span>
                <Badge variant={contacts.some((c: any) => c.is_visible) ? 'success' : 'warning'}>
                  {contacts.length} canal(is)
                </Badge>
              </div>

              {/* Item 6: Verificação KYC */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Status de Verificação de Identidade</span>
                <Badge variant={adv.verification_status === 'verified' ? 'success' : 'neutral'}>
                  {adv.verification_status || 'Não verificado'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* 2. Section Feedback Inputs (Changes Requested Notes) */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Observações por Seção (Caso solicite ajustes)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FormField label="Fotos / Imagens">
                <Input
                  type="text"
                  placeholder="Ex: Foto 2 possui baixa resolução ou expõe terceiros"
                  value={sectionNotes.photo || ''}
                  onChange={(e) => setSectionNotes({ ...sectionNotes, photo: e.target.value })}
                />
              </FormField>

              <FormField label="Biografia / Apresentação">
                <Input
                  type="text"
                  placeholder="Ex: Remover contato externo da descrição"
                  value={sectionNotes.bio || ''}
                  onChange={(e) => setSectionNotes({ ...sectionNotes, bio: e.target.value })}
                />
              </FormField>

              <FormField label="Canais de Contato">
                <Input
                  type="text"
                  placeholder="Ex: Número do WhatsApp inválido"
                  value={sectionNotes.contact || ''}
                  onChange={(e) => setSectionNotes({ ...sectionNotes, contact: e.target.value })}
                />
              </FormField>
            </div>
          </Card>

          {/* 3. Media Quick Decision Gallery */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Moderação Individual de Fotos ({mediaList.length})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.65rem' }}>
              {mediaList.map((m: any) => (
                <div key={m.id} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                  <img src={m.storage_path} alt="Foto" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                  <div style={{ padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <Badge variant={m.moderation_status === 'approved' ? 'success' : 'warning'} style={{ fontSize: '0.65rem' }}>
                      {m.moderation_status}
                    </Badge>
                    {m.moderation_status !== 'approved' && (
                      <Button variant="primary" size="sm" onClick={() => handleApproveMediaItem(m.id)} style={{ fontSize: '0.7rem', padding: '0.2rem' }}>
                        Aprovar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Internal Staff Notes */}
          <Card variant="glass" padding="md" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Notas Internas do Staff (Sigiloso)
            </h3>

            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <Input
                type="text"
                placeholder="Registrar nota interna..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="sm" isLoading={isAddingNote}>Salvar</Button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {data.notes.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma nota registrada.</div>
              ) : (
                data.notes.map((n: any) => (
                  <div key={n.id} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-gold)', marginBottom: '0.2rem' }}>
                      <span>{n.profiles?.display_name || 'Staff'}</span>
                      <span>{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div>{n.note}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ActionConfirmModal
        isOpen={isApproveOpen}
        title="Confirmar Aprovação e Publicação do Perfil"
        description="O perfil será publicado imediatamente nas buscas públicas da cidade e estado. O anunciante receberá uma notificação de aprovação."
        confirmLabel="Aprovar e Publicar"
        variant="primary"
        requireReason={false}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
      />

      <ActionConfirmModal
        isOpen={isRequestChangesOpen}
        title="Solicitar Ajustes ao Anunciante"
        description="Informe o motivo geral e as instruções para que o anunciante corrija o perfil."
        confirmLabel="Enviar Solicitação"
        variant="secondary"
        requireReason={true}
        onClose={() => setIsRequestChangesOpen(false)}
        onConfirm={handleRequestChanges}
      />

      <ActionConfirmModal
        isOpen={isRejectOpen}
        title="Rejeitar Perfil Definitivamente"
        description="O anúncio será recusado e o anunciante será notificado sobre a recusa."
        confirmLabel="Rejeitar Perfil"
        variant="ruby"
        requireReason={true}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
      />

      <ActionConfirmModal
        isOpen={isSuspendOpen}
        title="Suspender Perfil"
        description="O perfil será despublicado imediatamente de todas as buscas públicas."
        confirmLabel="Suspender Anúncio"
        variant="ruby"
        requireReason={true}
        onClose={() => setIsSuspendOpen(false)}
        onConfirm={handleSuspend}
      />
    </AdminLayout>
  );
}
