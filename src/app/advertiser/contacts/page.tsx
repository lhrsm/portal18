'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { contactsService } from '@/services/contactsService';
import { AdvertiserProfile, AdvertiserContact, ContactType } from '@/types/app.types';
import { AdvertiserLayout } from '@/components/advertiser/AdvertiserLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  Phone,
  MessageCircle,
  Send,
  Globe,
  Plus,
  Trash2,
  Star,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export default function AdvertiserContactsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);
  const [loading, setLoading] = useState(true);

  // New Contact Form State
  const [newType, setNewType] = useState<ContactType>('whatsapp');
  const [newValue, setNewValue] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadContacts = async () => {
    if (profile) {
      const adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
      if (adv) {
        setAdvertiser(adv);
        const list = await contactsService.getContactsByAdvertiser(adv.id);
        setContacts(list);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      loadContacts();
    }
  }, [profile, authLoading]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advertiser || !newValue.trim()) return;

    setErrorMsg(null);
    setIsAdding(true);

    try {
      const isFirst = contacts.length === 0;
      const res = await contactsService.addContact(
        advertiser.id,
        newType,
        newValue.trim(),
        newIsPrimary || isFirst,
        true
      );

      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível adicionar o contato.');
        return;
      }

      setNewValue('');
      setNewIsPrimary(false);
      showToast({ type: 'success', title: 'Contato Adicionado', message: 'Canal de atendimento cadastrado.' });
      await loadContacts();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    if (!advertiser) return;
    const res = await contactsService.setPrimaryContact(advertiser.id, contactId);
    if (res.success) {
      showToast({ type: 'success', title: 'Contato Principal Definido' });
      await loadContacts();
    }
  };

  const handleToggleVisibility = async (contact: AdvertiserContact) => {
    const res = await contactsService.updateContact(contact.id, { is_visible: !contact.is_visible });
    if (res.success) {
      showToast({
        type: 'info',
        title: 'Visibilidade Alterada',
        message: `Contato ${!contact.is_visible ? 'visível publicamente' : 'ocultado'}.`,
      });
      await loadContacts();
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Deseja remover este contato?')) return;
    const res = await contactsService.deleteContact(contactId);
    if (res.success) {
      showToast({ type: 'info', title: 'Contato Removido' });
      await loadContacts();
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageCircle size={18} color="var(--color-success)" />;
      case 'telegram':
        return <Send size={18} color="var(--color-info)" />;
      case 'phone':
        return <Phone size={18} color="var(--accent-gold)" />;
      case 'website':
        return <Globe size={18} color="var(--accent-gold)" />;
      default:
        return <Phone size={18} />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <AdvertiserLayout advertiser={advertiser}>
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Canais de Contato</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Defina as formas de atendimento direto para seus clientes (WhatsApp, Telegram, Telefone)
        </p>
      </div>

      {/* Add Contact Card */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Adicionar Novo Canal</h3>

        {errorMsg && (
          <Alert type="error" title="Atenção" style={{ marginBottom: '1rem' }}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <FormField label="Tipo de Contato" required>
              <Select value={newType} onChange={(e) => setNewType(e.target.value as ContactType)}>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="phone">Telefone Ligação</option>
                <option value="website">Website / Link</option>
              </Select>
            </FormField>

            <FormField
              label={newType === 'telegram' ? 'Usuário do Telegram' : newType === 'website' ? 'URL do Website' : 'Número (com DDD)'}
              required
              hint={newType === 'whatsapp' ? 'Ex: (11) 99999-8888 (normalizado automaticamente)' : undefined}
            >
              <Input
                type="text"
                placeholder={newType === 'telegram' ? '@seunome' : newType === 'website' ? 'https://seusite.com' : '(11) 99999-9999'}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="checkbox-field" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="checkbox-input"
                checked={newIsPrimary}
                onChange={(e) => setNewIsPrimary(e.target.checked)}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Definir como contato principal
              </span>
            </label>

            <Button type="submit" variant="ruby" size="md" isLoading={isAdding} leftIcon={<Plus size={16} />}>
              Adicionar Contato
            </Button>
          </div>
        </form>
      </Card>

      {/* Existing Contacts List */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Contatos Cadastrados</h3>

        {contacts.length === 0 ? (
          <Card variant="glass" padding="md" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Phone size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
              Nenhum canal de contato cadastrado. Adicione pelo menos um para publicar seu perfil.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contacts.map((contact) => (
              <Card key={contact.id} variant="glass" padding="md" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'grid', placeItems: 'center' }}>
                    {getContactIcon(contact.contact_type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>
                        {contact.contact_type}
                      </span>
                      {contact.is_primary && (
                        <Badge variant="gold">
                          <Star size={10} fill="var(--accent-gold)" /> Principal
                        </Badge>
                      )}
                      <Badge variant={contact.is_visible ? 'success' : 'neutral'}>
                        {contact.is_visible ? 'Visível' : 'Oculto'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {contact.contact_value}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {!contact.is_primary && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetPrimary(contact.id)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Tornar Principal
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleVisibility(contact)}
                    aria-label="Alternar visibilidade"
                  >
                    {contact.is_visible ? <Eye size={16} /> : <EyeOff size={16} color="var(--text-muted)" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(contact.id)}
                    aria-label="Excluir contato"
                    style={{ color: 'var(--accent-ruby)' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdvertiserLayout>
  );
}
