'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminService, PendingProfileQueueItem } from '@/services/adminService';
import { locationService } from '@/services/locationService';
import { BrazilState } from '@/types/app.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  UserCheck,
  Clock,
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Camera,
  UserPlus,
  UserMinus,
  Filter,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function AdminProfilesQueuePage() {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<PendingProfileQueueItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [states, setStates] = useState<BrazilState[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'assigned_to_me' | 'unassigned' | 'kyc_review' | 'critical'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'oldest' | 'newest'>('oldest');
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const res = await adminService.getPendingProfilesQueue({
      search,
      stateId: selectedState || undefined,
      filterType,
      sort,
    });
    setProfiles(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  }, [search, selectedState, filterType, sort]);

  useEffect(() => {
    async function loadMeta() {
      const statesData = await locationService.getStates();
      setStates(statesData);
    }
    loadMeta();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQueue();
  };

  const handleAssign = async (advertiserId: string) => {
    setAssigningId(advertiserId);
    const res = await adminService.assignCase(advertiserId);
    if (res.success) {
      showToast({ type: 'success', title: 'Caso Assumido!', message: 'Você assumiu a moderação deste anúncio.' });
      await loadQueue();
    } else {
      showToast({ type: 'error', title: 'Erro ao assumir caso', message: res.error });
    }
    setAssigningId(null);
  };

  const handleUnassign = async (advertiserId: string) => {
    setAssigningId(advertiserId);
    const res = await adminService.unassignCase(advertiserId);
    if (res.success) {
      showToast({ type: 'info', title: 'Caso Liberado', message: 'O caso voltou para a fila geral de moderação.' });
      await loadQueue();
    } else {
      showToast({ type: 'error', title: 'Erro ao liberar caso' });
    }
    setAssigningId(null);
  };

  const getSlaBadge = (status?: string, hours?: number) => {
    if (status === 'critical') {
      return (
        <Badge variant="ruby" style={{ fontSize: '0.75rem' }}>
          <Clock size={10} /> SLA Crítico (+{hours}h na fila)
        </Badge>
      );
    }
    if (status === 'warning') {
      return (
        <Badge variant="gold" style={{ fontSize: '0.75rem' }}>
          <Clock size={10} /> SLA Atenção (+{hours}h na fila)
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" style={{ fontSize: '0.75rem' }}>
        <Clock size={10} /> {hours || 0}h na fila
      </Badge>
    );
  };

  return (
    <AdminLayout>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">MODERAÇÃO DE CONTEÚDO</Badge>
            <Badge variant="ruby">{totalCount} em fila</Badge>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0 }}>Fila de Moderação de Perfis</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Triagem operacional de anúncios submetidos para publicação pública
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={loadQueue}>
          Atualizar Fila
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card variant="glass" padding="md" style={{ marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <Input
                type="text"
                placeholder="Buscar por nome artístico ou slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ width: '180px' }}>
              <Select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                <option value="">Todos os Estados</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ width: '160px' }}>
              <Select value={sort} onChange={(e) => setSort(e.target.value as any)}>
                <option value="oldest">Mais antigos (SLA)</option>
                <option value="newest">Mais recentes</option>
              </Select>
            </div>

            <Button type="submit" variant="primary" size="md" leftIcon={<Search size={16} />}>
              Filtrar
            </Button>
          </div>

          {/* Quick Segment Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Button
              type="button"
              variant={filterType === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Todos Pendentes ({totalCount})
            </Button>
            <Button
              type="button"
              variant={filterType === 'assigned_to_me' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('assigned_to_me')}
            >
              Atribuídos a Mim
            </Button>
            <Button
              type="button"
              variant={filterType === 'unassigned' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('unassigned')}
            >
              Sem Atribuição
            </Button>
            <Button
              type="button"
              variant={filterType === 'kyc_review' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('kyc_review')}
            >
              Com KYC Pendente
            </Button>
          </div>
        </form>
      </Card>

      {/* Queue Items */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
      ) : profiles.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <UserCheck size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>Fila Limpa!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
            Nenhum perfil aguardando análise com os filtros selecionados no momento.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {profiles.map((adv) => (
            <Card
              key={adv.id}
              variant="glass"
              padding="md"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.25rem',
                border: adv.has_critical_report
                  ? '1px solid var(--accent-ruby)'
                  : adv.sla_status === 'critical'
                  ? '1px solid rgba(231, 76, 60, 0.4)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              {/* Left: Thumbnail & Core Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}
                >
                  {adv.main_photo_url ? (
                    <img
                      src={adv.main_photo_url}
                      alt={adv.stage_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      <Camera size={20} />
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{adv.stage_name}</span>
                    {getSlaBadge(adv.sla_status, adv.time_in_queue_hours)}
                    {adv.verification_status === 'verified' && (
                      <Badge variant="success">
                        <ShieldCheck size={10} /> KYC 18+ OK
                      </Badge>
                    )}
                    {adv.has_critical_report && (
                      <Badge variant="ruby">
                        <AlertTriangle size={10} /> Denúncia Crítica Aberta
                      </Badge>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={13} color="var(--accent-gold)" />
                      {adv.brazil_cities?.name ? `${adv.brazil_cities.name}, ${adv.brazil_states?.code || ''}` : 'Local não definido'}
                    </span>
                    <span>•</span>
                    <span>Fotos: <strong>{adv.approved_media_count}/{adv.total_media_count} aprovadas</strong></span>
                    <span>•</span>
                    <span>
                      Atribuído: {adv.assigned_profile ? <strong style={{ color: 'var(--accent-gold)' }}>{adv.assigned_profile.display_name}</strong> : <span style={{ color: 'var(--text-muted)' }}>Ninguém</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                {!adv.assigned_to ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAssign(adv.id)}
                    isLoading={assigningId === adv.id}
                    leftIcon={<UserPlus size={14} />}
                  >
                    Assumir
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(adv.id)}
                    isLoading={assigningId === adv.id}
                    leftIcon={<UserMinus size={14} />}
                  >
                    Liberar
                  </Button>
                )}

                <Link href={`/admin/moderation/profiles/${adv.id}`}>
                  <Button variant="ruby" size="sm" rightIcon={<ArrowRight size={14} />}>
                    Revisar Perfil
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
