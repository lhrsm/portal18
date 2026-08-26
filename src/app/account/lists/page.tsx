'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { userListsService } from '@/services/account/userListsService';
import { UserList } from '@/types/app.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import { 
  ListFilter, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  FolderPlus, 
  ExternalLink, 
  X, 
  Users 
} from 'lucide-react';

interface UserListWithCount extends UserList {
  items_count: number;
}

export default function UserListsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [lists, setLists] = useState<UserListWithCount[]>([]);
  const [selectedList, setSelectedList] = useState<UserListWithCount | null>(null);
  const [listItems, setListItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadLists = async () => {
    if (profile) {
      const data = await userListsService.getUserLists(profile.id);
      setLists(data as UserListWithCount[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadLists();
    }
  }, [profile, authLoading]);

  const handleOpenList = async (list: UserListWithCount) => {
    setSelectedList(list);
    setItemsLoading(true);
    const items = await userListsService.getListItems(list.id);
    setListItems(items);
    setItemsLoading(false);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newListName.trim()) return;

    setIsCreating(true);
    const res = await userListsService.createList(profile.id, newListName, newListDesc);
    if (res.success && res.data) {
      setLists([{ ...res.data, items_count: 0 }, ...lists]);
      setNewListName('');
      setNewListDesc('');
      setIsModalOpen(false);
      showToast({ type: 'success', title: 'Lista Criada', message: `A lista "${res.data.name}" foi criada com sucesso.` });
    } else {
      showToast({ type: 'error', title: 'Erro ao criar', message: res.error });
    }
    setIsCreating(false);
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Deseja realmente excluir esta lista? Os itens serão desvinculados.')) return;

    const res = await userListsService.deleteList(listId);
    if (res.success) {
      setLists(lists.filter((l) => l.id !== listId));
      if (selectedList?.id === listId) {
        setSelectedList(null);
        setListItems([]);
      }
      showToast({ type: 'info', title: 'Lista Excluída', message: 'A lista foi removida.' });
    } else {
      showToast({ type: 'error', title: 'Erro ao excluir', message: res.error });
    }
  };

  const handleRemoveFromList = async (advertiserId: string) => {
    if (!selectedList) return;
    const res = await userListsService.removeFromList(selectedList.id, advertiserId);
    if (res.success) {
      setListItems(listItems.filter((i) => i.advertiser_id !== advertiserId));
      setLists(lists.map((l) => l.id === selectedList.id ? { ...l, items_count: Math.max(0, l.items_count - 1) } : l));
      showToast({ type: 'info', title: 'Removido', message: 'Item removido da lista.' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="280px" style={{ marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <Skeleton height="160px" />
          <Skeleton height="160px" />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Minha Conta
        </Link>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <ListFilter size={28} color="var(--accent-gold)" />
            <h1 style={{ fontSize: '2.2rem' }}>Minhas Listas</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Organize perfis em coleções particulares personalizadas ({lists.length}/20)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus size={16} />}
        >
          Criar Nova Lista
        </Button>
      </div>

      {/* Lists Grid */}
      {lists.length === 0 ? (
        <Card variant="glass" padding="lg" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <FolderPlus size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Crie listas para organizar seus anúncios</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            Separe perfis por cidades de viagem, preferências específicas ou categorias para acessá-los em grupos.
          </p>
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            Criar Minha Primeira Lista
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {lists.map((list) => {
            const isCurrent = selectedList?.id === list.id;

            return (
              <Card
                key={list.id}
                variant={isCurrent ? 'elevated' : 'glass'}
                padding="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isCurrent ? '1px solid var(--accent-gold)' : undefined,
                }}
                onClick={() => handleOpenList(list)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{list.name}</h3>
                    <Badge variant="neutral">{list.items_count} perfis</Badge>
                  </div>
                  {list.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                      {list.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                    {isCurrent ? 'Visualizando itens abaixo' : 'Clique para ver itens'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                    style={{ color: 'var(--accent-ruby)' }}
                    title="Excluir lista"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected List Detail View */}
      {selectedList && (
        <section style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Itens de &quot;{selectedList.name}&quot;</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{listItems.length} perfis nesta coleção</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedList(null)}>
              Fechar Coleção
            </Button>
          </div>

          {itemsLoading ? (
            <Skeleton height="150px" />
          ) : listItems.length === 0 ? (
            <Card variant="glass" padding="md" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Esta lista ainda não possui perfis. Navegue pelo catálogo e clique em &quot;Salvar em lista&quot; no card do anunciante.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {listItems.map((item) => (
                <Card key={item.advertiser_id} variant="glass" padding="none" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '140px', background: 'var(--bg-card)', position: 'relative' }}>
                    {item.primary_photo_url ? (
                      <img src={item.primary_photo_url} alt={item.stage_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sem foto</div>
                    )}
                  </div>
                  <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>{item.stage_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{item.city_name}, {item.state_code}</span>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                      <Link href={`/perfil/sp/sao-paulo/${item.slug}`} style={{ flex: 1 }}>
                        <Button variant="secondary" size="sm" fullWidth>Ver Perfil</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFromList(item.advertiser_id)} style={{ color: 'var(--accent-ruby)' }}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modal: Create List */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <Card variant="elevated" padding="lg" style={{ maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Criar Nova Lista</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateList}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Nome da Lista *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Favoritos Salvador, Quero rever..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Descrição (Opcional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Anotações particulares sobre esta coleção"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isCreating}>
                  Salvar Lista
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
