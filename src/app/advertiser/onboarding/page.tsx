'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { locationService } from '@/services/locationService';
import { contactsService } from '@/services/contactsService';
import { BrazilState, BrazilCity, Category, AdvertiserProfile, AdvertiserContact } from '@/types/app.types';
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
  User, 
  Sparkles, 
  MapPin, 
  Tag, 
  FileText, 
  Camera, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Save,
  Clock
} from 'lucide-react';

export default function AdvertiserOnboardingPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [stageName, setStageName] = useState('');
  const [slug, setSlug] = useState('');
  const [gender, setGender] = useState('feminino');
  const [birthDate, setBirthDate] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [contactType, setContactType] = useState<'whatsapp' | 'telegram' | 'phone' | 'website'>('whatsapp');
  const [contactValue, setContactValue] = useState('');
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);

  // Master data
  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const isAutoSavingRef = useRef(false);

  useEffect(() => {
    async function initData() {
      if (profile) {
        const [advData, statesData, catsData] = await Promise.all([
          advertisersService.getOwnAdvertiserProfile(profile.id),
          locationService.getStates(),
          locationService.getCategories(),
        ]);

        setStates(statesData);
        setCategories(catsData);

        if (advData) {
          setAdvertiser(advData);
          setCurrentStep(advData.onboarding_step || 1);
          setStageName(advData.stage_name !== 'Novo Anunciante' ? advData.stage_name : '');
          setSlug(advData.slug || '');
          setGender(advData.gender || 'feminino');
          setBirthDate(advData.birth_date || '');
          setStateId(advData.state_id || '');
          setCityId(advData.city_id || '');
          setNeighborhood(advData.neighborhood || '');
          setBio(advData.bio || '');
          setHeadline(advData.headline || '');

          if (advData.state_id) {
            const citiesData = await locationService.getCitiesByState(advData.state_id);
            setCities(citiesData);
          }

          const advContacts = await contactsService.getContactsByAdvertiser(advData.id);
          setContacts(advContacts);
        }
      }
      setPageLoading(false);
    }

    if (!authLoading) {
      initData();
    }
  }, [profile, authLoading]);

  // Handle State Change
  const handleStateChange = async (selectedStateId: string) => {
    setStateId(selectedStateId);
    setCityId('');
    if (selectedStateId) {
      const citiesData = await locationService.getCitiesByState(selectedStateId);
      setCities(citiesData);
    } else {
      setCities([]);
    }
  };

  // Generate Slug from Stage Name
  const handleStageNameBlur = async () => {
    if (stageName && (!slug || slug.startsWith('anunciante-'))) {
      const generated = await advertisersService.generateAvailableSlug(stageName);
      setSlug(generated);
    }
  };

  // Autosave current step data
  const saveCurrentStepData = async (nextStep?: number): Promise<boolean> => {
    if (!advertiser || isAutoSavingRef.current) return false;
    isAutoSavingRef.current = true;
    setIsSaving(true);
    setFeedback(null);

    try {
      const stepToSave = nextStep ?? currentStep;
      const partialUpdates: Partial<AdvertiserProfile> = {
        stage_name: stageName || 'Novo Anunciante',
        slug: slug || advertiser.slug,
        gender,
        birth_date: birthDate || advertiser.birth_date,
        state_id: stateId || null,
        city_id: cityId || null,
        neighborhood: neighborhood || null,
        bio: bio || null,
        headline: headline || null,
      };

      const res = await advertisersService.saveOnboardingProgress(advertiser.id, stepToSave, partialUpdates);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao salvar progresso do onboarding.' });
        return false;
      }

      setAdvertiser(res.data || advertiser);
      return true;
    } catch (err) {
      console.error('Error saving onboarding step:', err);
      setFeedback({ type: 'error', message: 'Erro inesperado ao salvar alterações.' });
      return false;
    } finally {
      isAutoSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleNextStep = async () => {
    // Basic step validations
    if (currentStep === 1 && !stageName.trim()) {
      setFeedback({ type: 'error', message: 'Informe seu nome artístico de atendimento.' });
      return;
    }
    if (currentStep === 2 && !birthDate) {
      setFeedback({ type: 'error', message: 'Informe sua data de nascimento (18+ obrigatório).' });
      return;
    }

    const next = Math.min(currentStep + 1, 9);
    const saved = await saveCurrentStepData(next);
    if (saved) {
      setCurrentStep(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = async () => {
    const prev = Math.max(currentStep - 1, 1);
    await saveCurrentStepData(prev);
    setCurrentStep(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddContact = async () => {
    if (!advertiser || !contactValue.trim()) return;
    const res = await contactsService.addContact(advertiser.id, contactType, contactValue.trim(), contacts.length === 0, true);
    if (res.success && res.data) {
      setContacts((prev) => [...prev, res.data!]);
      setContactValue('');
      showToast({ type: 'success', title: 'Contato Adicionado', message: 'Canal de atendimento salvo.' });
    }
  };

  const handleFinishOnboarding = async () => {
    if (!advertiser) return;
    setIsSaving(true);
    try {
      const res = await advertisersService.completeOnboarding(advertiser.id);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Onboarding Concluído!',
          message: 'Seu perfil foi enviado para revisão.',
        });
        router.push('/advertiser');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <Skeleton height="3rem" width="300px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="350px" />
      </div>
    );
  }

  const stepsHeader = [
    { num: 1, title: 'Nome' },
    { num: 2, title: 'Básico' },
    { num: 3, title: 'Local' },
    { num: 4, title: 'Categorias' },
    { num: 5, title: 'Bio' },
    { num: 6, title: 'Foto' },
    { num: 7, title: 'Contatos' },
    { num: 8, title: 'Revisão' },
    { num: 9, title: 'Conclusão' },
  ];

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '780px' }}>
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <Badge variant="gold">ETAPA {currentStep} DE 9</Badge>
          <Badge variant="neutral">AUTOSAVE ATIVO</Badge>
        </div>
        <h1 style={{ fontSize: '2.2rem' }}>Configuração do Perfil</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Preencha as informações do seu anúncio passo a passo</p>
      </div>

      {/* Progress Steps Indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.3rem',
          overflowX: 'auto',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        {stepsHeader.map((s) => (
          <div
            key={s.num}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '60px',
              cursor: s.num <= (advertiser?.onboarding_step || 1) ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (s.num <= (advertiser?.onboarding_step || 1)) {
                saveCurrentStepData(s.num);
                setCurrentStep(s.num);
              }
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                backgroundColor: currentStep === s.num ? 'var(--accent-gold)' : s.num < currentStep ? 'var(--color-success)' : 'var(--bg-tertiary)',
                color: currentStep === s.num ? '#000' : '#fff',
                marginBottom: '0.3rem',
                transition: 'all var(--transition-fast)',
              }}
            >
              {s.num < currentStep ? '✓' : s.num}
            </div>
            <span style={{ fontSize: '0.7rem', color: currentStep === s.num ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {feedback && (
        <Alert type={feedback.type} title={feedback.type === 'success' ? 'Salvo' : 'Atenção'}>
          {feedback.message}
        </Alert>
      )}

      {/* Step Content */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem' }}>
        {/* ETAPA 1: Nome Artístico & Slug */}
        {currentStep === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <User size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 1 — Nome Artístico</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Este é o nome principal com o qual você será reconhecido(a) na plataforma.
            </p>

            <FormField label="Nome Artístico / Profissional" required>
              <Input
                type="text"
                placeholder="Ex: Gabriela Miller ou Lucas Mendes"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                onBlur={handleStageNameBlur}
                required
              />
            </FormField>

            <FormField label="Slug da URL (Link público do anúncio)" hint="Gerado automaticamente e verificado contra duplicidades.">
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="ex: gabriela-miller"
              />
            </FormField>
          </div>
        )}

        {/* ETAPA 2: Informações Básicas (18+ & Gênero) */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <ShieldCheck size={22} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 2 — Informações Básicas</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Confirmação de maioridade e identidade profissional.
            </p>

            <FormField label="Identidade / Gênero">
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="trans_travesti">Trans / Travesti</option>
                <option value="casal_dupla">Casal / Dupla</option>
              </Select>
            </FormField>

            <FormField label="Data de Nascimento (18+ Obrigatório)" required hint="Restrição no banco de dados: apenas maiores de 18 anos.">
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </FormField>
          </div>
        )}

        {/* ETAPA 3: Localização */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <MapPin size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 3 — Localização</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Indique a região principal onde você realiza atendimentos.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="Estado (UF)">
                <Select value={stateId} onChange={(e) => handleStateChange(e.target.value)} placeholderOption="Selecione o Estado">
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Cidade">
                <Select value={cityId} onChange={(e) => setCityId(e.target.value)} placeholderOption={stateId ? 'Selecione a Cidade' : 'Escolha o estado primeiro'} disabled={!stateId}>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Bairro ou Região de Atendimento">
              <Input
                type="text"
                placeholder="Ex: Copacabana, Jardins, Aldeota, Batel"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </FormField>
          </div>
        )}

        {/* ETAPA 4: Categorias */}
        {currentStep === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Tag size={22} color="var(--color-info)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 4 — Categorias do Anúncio</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Selecione as categorias correspondentes aos seus serviços.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategories((prev) =>
                        isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                      );
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(229, 185, 92, 0.15)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ETAPA 5: Descrição & Bio */}
        {currentStep === 5 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <FileText size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 5 — Descrição & Bio</h2>
            </div>

            <FormField label="Slogan / Chamada Principal (máx. 120 caracteres)">
              <Input
                type="text"
                placeholder="Ex: Atendimento exclusivo e refinado com discrição total"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
              />
            </FormField>

            <FormField label="Apresentação Detalhada" hint="Fale sobre sua experiência, especialidades, formas de atendimento e idiomas.">
              <textarea
                className="input"
                rows={6}
                placeholder="Escreva uma descrição atraente sobre seus serviços..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </FormField>
          </div>
        )}

        {/* ETAPA 6: Foto Principal */}
        {currentStep === 6 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Camera size={22} color="var(--accent-ruby)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 6 — Foto de Perfil</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Sua foto principal será exibida nos cards de busca. A galeria completa poderá ser gerenciada na próxima etapa.
            </p>

            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <Camera size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Utilize a foto de perfil da sua conta ou faça upload no menu do perfil
              </div>
              <Badge variant="neutral">Formatos aceitos: JPG, PNG, WEBP</Badge>
            </div>
          </div>
        )}

        {/* ETAPA 7: Contato Público */}
        {currentStep === 7 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Phone size={22} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 7 — Canais de Contato</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Adicione formas diretas para os clientes entrarem em contato com você.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Select value={contactType} onChange={(e) => setContactType(e.target.value as any)} style={{ width: '160px' }}>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="phone">Telefone</option>
                <option value="website">Website</option>
              </Select>
              <Input
                type="text"
                placeholder="Ex: (11) 99999-9999 ou @seunome"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
              />
              <Button type="button" variant="primary" onClick={handleAddContact}>
                Adicionar
              </Button>
            </div>

            {contacts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contacts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <span><strong>{c.contact_type.toUpperCase()}:</strong> {c.contact_value}</span>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ETAPA 8: Revisão Geral */}
        {currentStep === 8 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem' }}>Etapa 8 — Revisão do Anúncio</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nome Artístico:</span>
                <strong>{stageName || 'Não informado'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Slug da URL:</span>
                <code>{slug}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gênero:</span>
                <span>{gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bairro / Cidade:</span>
                <span>{neighborhood || 'Centro'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ETAPA 9: Verificação & Conclusão */}
        {currentStep === 9 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <Sparkles size={44} color="var(--accent-gold)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Tudo Pronto para Concluir!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
              Seu cadastro inicial de anunciante foi configurado com sucesso. Ao finalizar, seu perfil entrará no painel de moderação para liberação pública.
            </p>

            <Button
              type="button"
              variant="ruby"
              size="lg"
              fullWidth
              isLoading={isSaving}
              onClick={handleFinishOnboarding}
            >
              Concluir Onboarding & Ir ao Painel
            </Button>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {currentStep > 1 ? (
          <Button type="button" variant="secondary" onClick={handlePrevStep} leftIcon={<ArrowLeft size={16} />}>
            Voltar
          </Button>
        ) : (
          <Link href="/advertiser">
            <Button variant="ghost" size="sm">
              Sair para o Painel
            </Button>
          </Link>
        )}

        {currentStep < 9 && (
          <Button type="button" variant="primary" onClick={handleNextStep} isLoading={isSaving} rightIcon={<ArrowRight size={16} />}>
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
