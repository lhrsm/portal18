'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mfaService, MfaSetupResult } from '@/services/security/mfaService';
import { sessionService } from '@/services/security/sessionService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/hooks/useToast';
import { 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  ArrowLeft, 
  KeyRound, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  RefreshCw, 
  X 
} from 'lucide-react';

export default function AccountSecurityPage() {
  const { user, profile, roles, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // MFA state
  const [mfaStatus, setMfaStatus] = useState<{ enabled: boolean; factorType?: string; verifiedAt?: string }>({ enabled: false });
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupResult | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  const isRoleMfaMandatory = mfaService.isMfaRequiredForRole(roles);

  const loadMfaStatus = async () => {
    if (!profile) return;
    const status = await mfaService.getMfaStatus(profile.id);
    setMfaStatus(status);
  };

  useEffect(() => {
    if (!authLoading) {
      loadMfaStatus();
    }
  }, [profile, authLoading]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'A nova senha deve conter pelo menos 8 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'As senhas informadas não conferem.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordFeedback({ type: 'error', message: error.message });
        return;
      }

      if (revokeOthers) {
        await sessionService.revokeAllOtherSessions();
      }

      showToast({
        type: 'success',
        title: 'Senha alterada!',
        message: 'Sua senha foi atualizada com sucesso.' + (revokeOthers ? ' Outras sessões foram encerradas.' : ''),
      });
      setPasswordFeedback({ type: 'success', message: 'Senha atualizada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Erro ao alterar a senha.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleStartMfaSetup = async () => {
    if (!profile || !user) return;
    setIsEnrollingMfa(true);
    const res = await mfaService.initiateTotpSetup(profile.id, user.email || '');
    if (res.success && res.data) {
      setMfaSetupData(res.data);
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao iniciar MFA' });
      setIsEnrollingMfa(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !mfaSetupData) return;

    setIsVerifyingMfa(true);
    const res = await mfaService.verifyTotpSetup(profile.id, totpCode, mfaSetupData.recoveryCodes);
    setIsVerifyingMfa(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'MFA Ativado!',
        message: 'A autenticação em duas etapas foi configurada com sucesso.',
      });
      setIsEnrollingMfa(false);
      setMfaSetupData(null);
      setTotpCode('');
      loadMfaStatus();
    } else {
      showToast({ type: 'error', title: 'Código Inválido', message: res.error || 'Verifique o código de 6 dígitos.' });
    }
  };

  const handleDisableMfa = async () => {
    if (!profile) return;
    if (!confirm('Deseja realmente desativar a autenticação em duas etapas?')) return;

    setIsDisablingMfa(true);
    const res = await mfaService.disableMfa(profile.id);
    setIsDisablingMfa(false);

    if (res.success) {
      showToast({ type: 'info', title: 'MFA Desativado', message: 'A autenticação em duas etapas foi desativada.' });
      loadMfaStatus();
    } else {
      showToast({ type: 'error', title: 'Erro', message: res.error || 'Falha ao desativar MFA' });
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem', maxWidth: '780px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Voltar para Minha Conta
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <ShieldCheck size={28} color="var(--accent-gold)" />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Segurança e Autenticação</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gerencie suas credenciais de acesso, autenticação em duas etapas (MFA) e sessões ativas.
        </p>
      </div>

      {/* Quick Nav Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/account/security/sessions" style={{ textDecoration: 'none' }}>
          <Card variant="glass" padding="md" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Smartphone size={22} color="var(--accent-gold)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Sessões & Dispositivos</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gerenciar acessos ativos</div>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/account/security/activity" style={{ textDecoration: 'none' }}>
          <Card variant="glass" padding="md" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity size={22} color="var(--accent-gold)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Histórico de Atividades</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log de segurança da conta</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* MFA Section (Sections 4-10) */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <KeyRound size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Autenticação em Duas Etapas (MFA / 2FA)</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '520px', lineHeight: 1.5 }}>
              Adiciona uma camada extra de proteção ao exigir um código de 6 dígitos gerado pelo seu aplicativo autenticador (Google Authenticator, Authy, etc.).
            </p>
          </div>

          <div>
            {mfaStatus.enabled ? (
              <Badge variant="gold">Configurada</Badge>
            ) : isRoleMfaMandatory ? (
              <Badge variant="ruby">Obrigatória para sua função</Badge>
            ) : (
              <Badge variant="neutral">Não configurada</Badge>
            )}
          </div>
        </div>

        {mfaStatus.enabled ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={20} color="var(--color-success)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Aplicativo Autenticador Ativo (TOTP)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Ativado em {mfaStatus.verifiedAt ? new Date(mfaStatus.verifiedAt).toLocaleDateString('pt-BR') : 'recente'}
                </div>
              </div>
            </div>

            {!isRoleMfaMandatory && (
              <Button variant="secondary" size="sm" onClick={handleDisableMfa} isLoading={isDisablingMfa}>
                Desativar MFA
              </Button>
            )}
          </div>
        ) : (
          <div>
            {!isEnrollingMfa ? (
              <Button variant="primary" size="md" onClick={handleStartMfaSetup} leftIcon={<KeyRound size={16} />}>
                Configurar Aplicativo Autenticador
              </Button>
            ) : (
              <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>1. Escaneie o QR Code no seu App</h3>
                  <button type="button" onClick={() => setIsEnrollingMfa(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                    {/* Visual QR mock representation */}
                    <div style={{ width: '130px', height: '130px', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem' }}>
                      QR Code Seguro TOTP
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label className="label" style={{ fontSize: '0.8rem' }}>Ou insira a chave manualmente:</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        readOnly
                        className="input"
                        value={mfaSetupData?.secret || ''}
                        style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(mfaSetupData?.secret || '');
                          showToast({ type: 'info', title: 'Copiado', message: 'Chave copiada para a área de transferência.' });
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Compatível com Google Authenticator, Microsoft Authenticator, 1Password e Authy.
                    </p>
                  </div>
                </div>

                {/* Recovery Codes (Section 8) */}
                {mfaSetupData?.recoveryCodes && (
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(218, 165, 32, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(218, 165, 32, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <AlertTriangle size={16} /> Códigos de Recuperação de Uso Único
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Guarde estes códigos em local seguro. Cada um permite acessar sua conta caso perca seu celular.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {mfaSetupData.recoveryCodes.map((code, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', padding: '0.35rem 0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code Confirmation Form */}
                <form onSubmit={handleVerifyMfa} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label" htmlFor="totp-input" style={{ fontSize: '0.85rem' }}>
                      2. Insira o código de 6 dígitos gerado no aplicativo:
                    </label>
                    <Input
                      id="totp-input"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ fontSize: '1.2rem', letterSpacing: '0.2rem', textAlign: 'center', maxWidth: '200px' }}
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" size="lg" isLoading={isVerifyingMfa}>
                    Verificar e Ativar
                  </Button>
                </form>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Password Change Card (Section 16) */}
      <Card variant="glass" padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Lock size={20} color="var(--accent-gold)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Alterar Senha de Acesso</h2>
        </div>

        {passwordFeedback && (
          <Alert type={passwordFeedback.type} title={passwordFeedback.type === 'success' ? 'Sucesso' : 'Erro'}>
            {passwordFeedback.message}
          </Alert>
        )}

        <form onSubmit={handlePasswordUpdate}>
          <FormField label="Nova Senha" required hint="Mínimo 8 caracteres com letras e números.">
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Confirmar Nova Senha" required>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FormField>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <input
              type="checkbox"
              id="revoke-sessions-check"
              checked={revokeOthers}
              onChange={(e) => setRevokeOthers(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-gold)', cursor: 'pointer' }}
            />
            <label htmlFor="revoke-sessions-check" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Encerrar todas as outras sessões ativas em outros dispositivos (Recomendado)
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isUpdatingPassword}>
            Atualizar Senha
          </Button>
        </form>
      </Card>
    </div>
  );
}
