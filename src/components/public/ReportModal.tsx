'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { ShieldAlert, Send } from 'lucide-react';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  advertiserId: string;
  stageName: string;
}

export function ReportModal({ isOpen, onClose, advertiserId, stageName }: ReportModalProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState('suspected_minor');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      showToast({
        type: 'warning',
        title: 'Login Necessário',
        message: 'Entre em sua conta para enviar uma denúncia fundamentada.',
      });
      router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('reports') as any)
        .insert({
          reporter_profile_id: profile.id,
          target_type: 'advertiser',
          target_id: advertiserId,
          reason,
          description: description || null,
          severity: reason === 'suspected_minor' ? 'critical' : 'medium',
          status: 'open',
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      showToast({
        type: 'success',
        title: 'Denúncia Enviada',
        message: 'Nossa equipe de moderação e conformidade 18+ analisará o perfil imediatamente.',
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Não foi possível registrar a denúncia. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Denunciar Perfil" maxWidth="500px">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--accent-ruby)' }}>
          <ShieldAlert size={20} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Perfil: {stageName}</span>
        </div>

        {error && (
          <Alert type="error" title="Atenção">
            {error}
          </Alert>
        )}

        <FormField label="Motivo da Denúncia" required>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="suspected_minor">🚨 Suspeita de Menor de Idade (Prioridade Crítica)</option>
            <option value="fake_profile">Perfil Falso / Golpista</option>
            <option value="unauthorized_images">Uso de Fotos / Mídias sem Autorização</option>
            <option value="fraud">Tentativa de Fraude Financeira</option>
            <option value="prohibited_content">Conteúdo Proibido ou Ilegal</option>
            <option value="incorrect_info">Informações / Localização Incorretas</option>
            <option value="other">Outro Motivo</option>
          </Select>
        </FormField>

        <FormField label="Detalhes Adicionais (Opcional)" hint="Forneça detalhes que auxiliem a equipe de conformidade a apurar o caso.">
          <textarea
            className="input"
            rows={4}
            placeholder="Descreva o que ocorreu ou forneça links de evidência..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="ruby" isLoading={isLoading} leftIcon={<Send size={16} />}>
            Enviar Denúncia
          </Button>
        </div>
      </form>
    </Modal>
  );
}
