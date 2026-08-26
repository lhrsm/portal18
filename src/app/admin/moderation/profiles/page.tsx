'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserCheck, Clock, Search, MapPin, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminProfilesQueuePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    const res = await adminService.getPendingProfilesQueue({ search });
    setProfiles(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadQueue();
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Fila de Moderação de Perfis</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Anúncios enviados para análise aguardando aprovação para publicação
          </p>
        </div>
        <Badge variant="gold">{totalCount} perfis pendentes</Badge>
      </div>

      {/* Search Bar */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <Input
            type="text"
            placeholder="Buscar por nome artístico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="md" leftIcon={<Search size={16} />}>
            Filtrar
          </Button>
        </form>
      </Card>

      {/* Queue List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="80px" />
          <Skeleton height="80px" />
          <Skeleton height="80px" />
        </div>
      ) : profiles.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <UserCheck size={40} color="var(--color-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Fila Limpa!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Não há nenhum perfil pendente de moderação no momento.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {profiles.map((adv) => (
            <Card key={adv.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{adv.stage_name}</span>
                  <Badge variant="warning">
                    <Clock size={10} /> Em análise
                  </Badge>
                  {adv.verification_status === 'verified' && (
                    <Badge variant="success">
                      <ShieldCheck size={10} /> Verificado
                    </Badge>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={13} color="var(--accent-gold)" />
                    {adv.brazil_cities?.name ? `${adv.brazil_cities.name}, ${adv.brazil_states?.code || ''}` : 'Localização não definida'}
                  </span>
                  <span>
                    Submetido em: {adv.submitted_at ? new Date(adv.submitted_at).toLocaleString('pt-BR') : 'Data recente'}
                  </span>
                </div>
              </div>

              <Link href={`/admin/moderation/profiles/${adv.id}`}>
                <Button variant="ruby" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Revisar Perfil
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
