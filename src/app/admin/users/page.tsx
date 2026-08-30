'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { Users, Search, ShieldCheck, ShieldAlert, Plus, Trash2, Lock, X } from 'lucide-react';

export default function AdminUsersPage() {
  const { roles } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = roles.includes('super_admin');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Role grant dialog state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roleToGrant, setRoleToGrant] = useState('moderator');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const res = await adminService.getUsersList({ search });
    setUsers(res.data);
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGrantRole = async () => {
    if (!selectedUser) return;
    setIsProcessing(true);
    const res = await adminService.grantRole(selectedUser.id, roleToGrant);
    if (res.success) {
      showToast({ type: 'success', title: 'Cargo Concedido!', message: res.message || `Cargo ${roleToGrant} atribuído.` });
      setSelectedUser(null);
      await loadUsers();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Não foi possível conceder o cargo.' });
    }
    setIsProcessing(false);
  };

  const handleRevokeRole = async (profileId: string, role: string) => {
    if (!confirm(`Deseja revogar o cargo de ${role} deste usuário?`)) return;
    const res = await adminService.revokeRole(profileId, role);
    if (res.success) {
      showToast({ type: 'info', title: 'Cargo Revogado' });
      await loadUsers();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Operação negada.' });
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Gestão de Usuários & Cargos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Controle de perfis, administradores e moderadores da plataforma
          </p>
        </div>
        <Badge variant="gold">{totalCount} usuários</Badge>
      </div>

      {/* Search Bar */}
      <Card variant="glass" padding="sm" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); loadUsers(); }} style={{ display: 'flex', gap: '0.5rem' }}>
          <Input
            type="text"
            placeholder="Buscar por nome ou username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="md" leftIcon={<Search size={16} />}>
            Buscar
          </Button>
        </form>
      </Card>

      {/* Users Table / Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Skeleton height="70px" />
          <Skeleton height="70px" />
          <Skeleton height="70px" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {users.map((u) => {
            const userRoles = (u.user_roles || []).map((r: any) => r.role);
            return (
              <Card key={u.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{u.display_name || u.username || 'Usuário Sem Nome'}</span>
                    <Badge variant={u.status === 'active' ? 'success' : 'ruby'}>{u.status}</Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span>Tipo: {u.account_type}</span>
                    <span>•</span>
                    <span>Criado em: {new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {/* Assigned Roles */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {userRoles.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum cargo especial</span>
                    ) : (
                      userRoles.map((roleName: string) => (
                        <div key={roleName} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Badge variant={roleName === 'super_admin' ? 'ruby' : roleName === 'admin' ? 'gold' : 'info'}>
                            {roleName}
                          </Badge>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRevokeRole(u.id, roleName)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-ruby)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '2px' }}
                              title="Revogar cargo"
                              aria-label={`Revogar cargo ${roleName}`}
                            >
                              <X size={12} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Role Grant Action (Super Admin Only) */}
                {isSuperAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedUser(u)}
                    leftIcon={<Plus size={14} />}
                  >
                    Atribuir Cargo
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Grant Role Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Conceder Cargo Administrativo
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Usuário: <strong>{selectedUser.display_name || selectedUser.username}</strong>
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Selecione o Cargo:
              </label>
              <Select value={roleToGrant} onChange={(e) => setRoleToGrant(e.target.value)}>
                <option value="moderator">Moderador (Filas e denúncias)</option>
                <option value="admin">Administrador (Gestão geral)</option>
                <option value="super_admin">Super Admin (Acesso irrestrito)</option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Cancelar</Button>
              <Button variant="ruby" size="md" onClick={handleGrantRole} isLoading={isProcessing}>
                Conceder Permissão
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
