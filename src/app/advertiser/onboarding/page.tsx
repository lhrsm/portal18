'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { advertisersService } from '@/services/advertisersService';
import { locationService } from '@/services/locationService';
import { contactsService } from '@/services/contactsService';
import { mediaService } from '@/services/mediaService';
import { mediaQuotaService } from '@/services/media/quotaService';
import { verificationService } from '@/services/verificationService';
import { completenessService } from '@/services/completenessService';
import { onboardingAnalytics } from '@/services/telemetry/onboardingAnalytics';
import { 
  BrazilState, 
  BrazilCity, 
  Category, 
  AdvertiserProfile, 
  AdvertiserContact, 
  AdvertiserMedia, 
  MediaQuota,
  CompletenessResult,
  ContactType 
} from '@/types/app.types';
import { OnboardingStepper, ONBOARDING_STEPS } from '@/components/advertiser/OnboardingStepper';
import { OnboardingPreviewCard } from '@/components/advertiser/OnboardingPreviewCard';
import { CompletenessCard } from '@/components/advertiser/CompletenessCard';
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
  ShieldCheck, 
  MapPin, 
  Tag, 
  FileText, 
  Phone, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Check,
  Lock,
  UploadCloud,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Plus,
  Info,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function AdvertiserOnboardingPage() {
  const router = useRouter();
  const { profile, user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<number>(1);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Form Fields State
  const [stageName, setStageName] = useState('');
  const [slug, setSlug] = useState('');
  const [gender, setGender] = useState('feminino');
  const [birthDate, setBirthDate] = useState('');
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [servicePlaces, setServicePlaces] = useState<string[]>(['local_proprio', 'hotel_motel']);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');

  // Contacts Form State
  const [contacts, setContacts] = useState<AdvertiserContact[]>([]);
  const [newContactType, setNewContactType] = useState<ContactType>('whatsapp');
  const [newContactValue, setNewContactValue] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(true);
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Media & Gallery State
  const [mediaList, setMediaList] = useState<AdvertiserMedia[]>([]);
  const [mediaQuota, setMediaQuota] = useState<MediaQuota | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Master Reference Data
  const [states, setStates] = useState<BrazilState[]>([]);
  const [cities, setCities] = useState<BrazilCity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completeness, setCompleteness] = useState<CompletenessResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAutoSavingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mask function for Brazilian phone/WhatsApp
  const formatPhoneMask = (val: string): string => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Helper to test WhatsApp link
  const getWhatsAppTestUrl = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const cleanNumber = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    return `https://wa.me/${cleanNumber}?text=Ol%C3%A1%2C%20vi%20seu%20perfil%20no%20Portal%2018%2B`;
  };

  // 1. Initial Data Loader & Resume Position Finder
  useEffect(() => {
    async function initData() {
      if (profile) {
        let adv = await advertisersService.getOwnAdvertiserProfile(profile.id);

        // If user is not yet an advertiser, attempt canonical creation
        if (!adv) {
          const res = await advertisersService.becomeAdvertiser(true, true);
          if (res.success) {
            adv = await advertisersService.getOwnAdvertiserProfile(profile.id);
          }
        }

        const [statesData, catsData] = await Promise.all([
          locationService.getStates(),
          locationService.getCategories(),
        ]);

        setStates(statesData);
        setCategories(catsData);

        if (adv) {
          setAdvertiser(adv);
          const resumedStep = Math.max(1, Math.min(adv.onboarding_step || 1, 8));
          setCurrentStep(resumedStep);
          setMaxUnlockedStep(Math.max(resumedStep, 1));

          setStageName(adv.stage_name && adv.stage_name !== 'Novo Anunciante' ? adv.stage_name : '');
          setSlug(adv.slug || '');
          setGender(adv.gender || 'feminino');
          setBirthDate(adv.birth_date || '');
          setStateId(adv.state_id || '');
          setCityId(adv.city_id || '');
          setNeighborhood(adv.neighborhood || '');
          setHeadline(adv.headline || '');
          setBio(adv.bio || '');

          // Load secondary datasets
          const [citiesData, advContacts, advMedia, catIds, quota] = await Promise.all([
            adv.state_id ? locationService.getCitiesByState(adv.state_id) : Promise.resolve([]),
            contactsService.getContactsByAdvertiser(adv.id),
            mediaService.getAdvertiserMedia(adv.id),
            advertisersService.getAdvertiserCategoryIds(adv.id),
            mediaQuotaService.getAdvertiserMediaQuota(adv.id),
          ]);

          setCities(citiesData);
          setContacts(advContacts);
          setMediaList(advMedia);
          setSelectedCategoryIds(catIds);
          setMediaQuota(quota);

          // Calculate completeness
          const comp = completenessService.calculateProfileCompleteness(
            adv,
            advMedia,
            advContacts,
            catIds.length
          );
          setCompleteness(comp);

          onboardingAnalytics.trackEvent('onboarding_resumed', {
            step: resumedStep,
            totalSteps: 8,
            hasMainPhoto: advMedia.length > 0,
            hasContacts: advContacts.length > 0,
          });
        }
      }
      setPageLoading(false);
    }

    if (!authLoading) {
      initData();
    }
  }, [profile, authLoading]);

  // Recalculate completeness whenever local attributes update
  useEffect(() => {
    if (advertiser) {
      const comp = completenessService.calculateProfileCompleteness(
        {
          ...advertiser,
          stage_name: stageName,
          headline,
          bio,
          birth_date: birthDate,
          state_id: stateId,
          city_id: cityId,
        } as AdvertiserProfile,
        mediaList,
        contacts,
        selectedCategoryIds.length
      );
      setCompleteness(comp);
    }
  }, [advertiser, stageName, headline, bio, birthDate, stateId, cityId, mediaList, contacts, selectedCategoryIds]);

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

  // Generate URL slug from stage name on blur
  const handleStageNameBlur = async () => {
    if (stageName.trim() && (!slug || slug.startsWith('anunciante-'))) {
      const generated = await advertisersService.generateAvailableSlug(stageName.trim());
      setSlug(generated);
    }
  };

  // Autosave current step data
  const saveCurrentStepData = useCallback(async (targetStep?: number): Promise<boolean> => {
    if (!advertiser || isAutoSavingRef.current) return false;
    isAutoSavingRef.current = true;
    setSaveStatus('saving');
    setFeedback(null);

    try {
      const stepToPersist = targetStep ?? currentStep;
      const partialUpdates: Partial<AdvertiserProfile> = {
        stage_name: stageName.trim() || 'Novo Anunciante',
        slug: slug.trim() || advertiser.slug,
        gender,
        birth_date: birthDate || advertiser.birth_date,
        state_id: stateId || null,
        city_id: cityId || null,
        neighborhood: neighborhood.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
      };

      const [saveRes, catRes] = await Promise.all([
        advertisersService.saveOnboardingProgress(advertiser.id, stepToPersist, partialUpdates),
        advertisersService.updateAdvertiserCategories(advertiser.id, selectedCategoryIds),
      ]);

      if (!saveRes.success) {
        setSaveStatus('error');
        setFeedback({ type: 'error', message: saveRes.error || 'Erro ao salvar progresso.' });
        return false;
      }

      setAdvertiser(saveRes.data || advertiser);
      setSaveStatus('saved');

      setTimeout(() => {
        setSaveStatus((curr) => (curr === 'saved' ? 'idle' : curr));
      }, 2000);

      return true;
    } catch (err) {
      console.error('Error in saveCurrentStepData:', err);
      setSaveStatus('error');
      setFeedback({ type: 'error', message: 'Erro inesperado ao salvar alterações.' });
      return false;
    } finally {
      isAutoSavingRef.current = false;
    }
  }, [advertiser, currentStep, stageName, slug, gender, birthDate, stateId, cityId, neighborhood, headline, bio, selectedCategoryIds]);

  // Handle Step Advance with Inline Validations
  const handleNextStep = async () => {
    setFeedback(null);

    // Step 1 Validation
    if (currentStep === 1) {
      if (!stageName.trim() || stageName.trim().length < 2) {
        setFeedback({ type: 'error', message: 'Por favor, informe seu nome artístico (mínimo 2 caracteres).' });
        return;
      }
    }

    // Step 2 Validation (18+ Verification)
    if (currentStep === 2) {
      if (!birthDate) {
        setFeedback({ type: 'error', message: 'Informe sua data de nascimento para confirmação de maioridade.' });
        return;
      }
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

      if (age < 18) {
        setFeedback({ type: 'error', message: 'Apenas maiores de 18 anos podem anunciar no Portal 18+.' });
        return;
      }
    }

    // Step 3 Validation
    if (currentStep === 3) {
      if (!stateId || !cityId) {
        setFeedback({ type: 'warning', message: 'Recomendamos selecionar Estado e Cidade para ser encontrado(a) nas buscas.' });
      }
    }

    // Step 4 Validation
    if (currentStep === 4) {
      if (selectedCategoryIds.length === 0) {
        setFeedback({ type: 'warning', message: 'Selecione pelo menos 1 categoria para definir seu anúncio.' });
      }
    }

    // Step 5 Validation
    if (currentStep === 5) {
      if (bio.trim().length > 0 && bio.trim().length < 20) {
        setFeedback({ type: 'error', message: 'Sua apresentação deve conter pelo menos 20 caracteres.' });
        return;
      }
    }

    // Step 6 Validation
    if (currentStep === 6) {
      if (contacts.length === 0) {
        setFeedback({ type: 'warning', message: 'Adicione pelo menos um canal de contato (WhatsApp recomendado).' });
      }
    }

    // Step 7 Validation
    if (currentStep === 7) {
      if (mediaList.length === 0) {
        setFeedback({ type: 'warning', message: 'Adicione sua foto principal de capa para prosseguir com a revisão.' });
      }
    }

    const next = Math.min(currentStep + 1, 8);
    const saved = await saveCurrentStepData(next);
    if (saved) {
      setCurrentStep(next);
      setMaxUnlockedStep((prev) => Math.max(prev, next));
      onboardingAnalytics.trackEvent('onboarding_step_completed', {
        step: currentStep,
        stepName: ONBOARDING_STEPS[currentStep - 1]?.title,
        totalSteps: 8,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = async () => {
    const prev = Math.max(currentStep - 1, 1);
    await saveCurrentStepData(prev);
    setCurrentStep(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToStep = async (stepNumber: number) => {
    if (stepNumber <= maxUnlockedStep && stepNumber !== currentStep) {
      await saveCurrentStepData(stepNumber);
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Contact Handlers
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advertiser || !newContactValue.trim() || isAddingContact) return;

    setIsAddingContact(true);
    setFeedback(null);

    try {
      const isFirst = contacts.length === 0;
      const res = await contactsService.addContact(
        advertiser.id,
        newContactType,
        newContactValue.trim(),
        newIsPrimary || isFirst,
        true
      );

      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Erro ao adicionar contato.' });
        return;
      }

      setNewContactValue('');
      setNewIsPrimary(false);
      showToast({ type: 'success', title: 'Canal Adicionado!', message: 'Contato salvo com sucesso.' });
      const updated = await contactsService.getContactsByAdvertiser(advertiser.id);
      setContacts(updated);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Erro ao cadastrar contato.' });
    } finally {
      setIsAddingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!advertiser) return;
    const res = await contactsService.deleteContact(contactId);
    if (res.success) {
      showToast({ type: 'info', title: 'Contato Removido' });
      const updated = await contactsService.getContactsByAdvertiser(advertiser.id);
      setContacts(updated);
    }
  };

  // Media Handlers
  const handleUploadMedia = async (files: FileList | File[]) => {
    if (!advertiser || !mediaQuota || isUploadingMedia) return;

    const filesArray = Array.from(files);
    if (filesArray.length === 0) return;

    setIsUploadingMedia(true);
    setFeedback(null);

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setUploadPercent(Math.round(((i + 1) / filesArray.length) * 100));

        const res = await mediaService.uploadMedia(advertiser.id, file, 'image');
        if (!res.success) {
          showToast({ type: 'error', title: 'Erro no Upload', message: res.error || 'Falha ao enviar foto.' });
        }
      }

      showToast({ type: 'success', title: 'Fotos Enviadas!', message: 'Fotos adicionadas à sua galeria.' });
      const [updatedMedia, updatedQuota] = await Promise.all([
        mediaService.getAdvertiserMedia(advertiser.id),
        mediaQuotaService.getAdvertiserMediaQuota(advertiser.id),
      ]);
      setMediaList(updatedMedia);
      setMediaQuota(updatedQuota);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Erro inesperado ao enviar arquivos.' });
    } finally {
      setIsUploadingMedia(false);
      setUploadPercent(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetMainPhoto = async (mediaId: string) => {
    if (!advertiser) return;
    const res = await mediaService.setMainPhoto(advertiser.id, mediaId);
    if (res.success) {
      showToast({ type: 'success', title: 'Capa Definida', message: 'Esta foto agora é a principal do seu anúncio.' });
      const updated = await mediaService.getAdvertiserMedia(advertiser.id);
      setMediaList(updated);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Deseja remover esta foto?')) return;
    if (!advertiser) return;
    const res = await mediaService.deleteMedia(mediaId);
    if (res.success) {
      showToast({ type: 'info', title: 'Foto Removida' });
      const [updatedMedia, updatedQuota] = await Promise.all([
        mediaService.getAdvertiserMedia(advertiser.id),
        mediaQuotaService.getAdvertiserMediaQuota(advertiser.id),
      ]);
      setMediaList(updatedMedia);
      setMediaQuota(updatedQuota);
    }
  };

  // Final Review & Submission Handler
  const handleSubmitForReview = async () => {
    if (!advertiser || isSubmittingReview) return;

    if (!completeness?.isReadyForSubmission) {
      setFeedback({
        type: 'error',
        message: 'Preencha todos os campos obrigatórios e adicione ao menos uma foto e um contato antes de enviar.',
      });
      return;
    }

    setIsSubmittingReview(true);
    setFeedback(null);

    try {
      await saveCurrentStepData(8);
      await advertisersService.completeOnboarding(advertiser.id);
      const res = await advertisersService.submitProfileForReview(advertiser.id);

      if (!res.success) {
        setFeedback({
          type: 'error',
          message: res.error || res.message || 'Não foi possível enviar o perfil para análise.',
        });
        return;
      }

      onboardingAnalytics.trackEvent('profile_submitted', {
        step: 8,
        hasMainPhoto: mediaList.length > 0,
        hasContacts: contacts.length > 0,
        categoriesCount: selectedCategoryIds.length,
      });

      showToast({
        type: 'success',
        title: 'Perfil Enviado para Moderação!',
        message: 'Seu anúncio está sob análise e será ativado em breve.',
      });

      router.push('/advertiser');
    } catch (err) {
      console.error('Error submitting profile for review:', err);
      setFeedback({ type: 'error', message: 'Erro de comunicação ao enviar perfil.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '820px' }}>
        <Skeleton height="3.5rem" width="320px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="70px" style={{ marginBottom: '1.5rem' }} />
        <Skeleton height="380px" />
      </div>
    );
  }

  const selectedState = states.find((s) => s.id === stateId);
  const selectedCity = cities.find((c) => c.id === cityId);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 6rem 1rem', maxWidth: '840px' }}>
      {/* 1. TOP HEADER WITH STATUS & AUTOSAVE INDICATOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Badge variant="gold">ETAPA {currentStep} DE 8</Badge>
            <Badge variant="ruby">PORTAL 18+ ONBOARDING</Badge>
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.3rem)', fontWeight: 800, margin: 0 }}>
            Configuração do Anúncio
          </h1>
        </div>

        {/* Autosave Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} className="spin" /> Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={14} /> Salvo automaticamente
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={14} /> Erro ao salvar
            </span>
          )}
        </div>
      </div>

      {/* 2. RESPONSIVE STEPPER */}
      <OnboardingStepper
        currentStep={currentStep}
        maxUnlockedStep={maxUnlockedStep}
        onSelectStep={handleJumpToStep}
      />

      {/* Global Alerts & Feedback */}
      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Sucesso' : feedback.type === 'error' ? 'Atenção' : 'Aviso'}
          style={{ marginBottom: '1.5rem' }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 3. STEP CONTENT CARD */}
      <Card variant="glass" padding="lg" style={{ marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
        {/* ========================================================
            ETAPA 1: NOME ARTÍSTICO & SLUG
        ======================================================== */}
        {currentStep === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <User size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 1 — Nome Artístico & Identidade</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Defina como você será reconhecido(a) no Portal 18+. O nome artístico é público e não precisa ser seu nome civil.
            </p>

            <FormField label="Nome Artístico / Profissional" required hint="Mínimo 2 e máximo 60 caracteres.">
              <Input
                type="text"
                placeholder="Ex: Gabriela Miller ou Lucas Mendes"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                onBlur={handleStageNameBlur}
                required
              />
            </FormField>

            <FormField label="Identidade / Gênero" required>
              <Select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="trans_travesti">Trans / Travesti</option>
                <option value="casal_dupla">Casal / Dupla</option>
              </Select>
            </FormField>

            <FormField label="Link Personalizado da Página (Slug)" hint="Gerado automaticamente a partir do seu nome artístico.">
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="ex: gabriela-miller"
              />
            </FormField>
          </div>
        )}

        {/* ========================================================
            ETAPA 2: DADOS BÁSICOS & MAIORIDADE 18+
        ======================================================== */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldCheck size={22} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 2 — Confirmação de Maioridade 18+</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              O Portal 18+ é estritamente restrito a pessoas maiores de 18 anos. Sua data de nascimento exata é protegida e não é exibida publicamente; apenas sua idade calculada será visível no anúncio.
            </p>

            <FormField label="Data de Nascimento (18+ Obrigatório)" required hint="Apenas maiores de 18 anos perante as leis brasileiras.">
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </FormField>

            <Card variant="glass" padding="md" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Lock size={18} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--accent-gold)' }}>Privacidade Garantida:</strong> Seus dados de cadastro estão protegidos sob sigilo e de acordo com a LGPD. A verificação civil com documento é realizada em etapa própria de segurança.
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================
            ETAPA 3: LOCALIZAÇÃO
        ======================================================== */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <MapPin size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 3 — Região de Atendimento</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Indique o estado e cidade principal onde você atende. Isso permitirá que clientes da sua região encontrem seu perfil nos filtros de busca.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <FormField label="Estado (UF)" required>
                <Select value={stateId} onChange={(e) => handleStateChange(e.target.value)} placeholderOption="Selecione o Estado">
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Cidade" required>
                <Select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  placeholderOption={stateId ? 'Selecione a Cidade' : 'Escolha o estado primeiro'}
                  disabled={!stateId}
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="Bairro ou Zona Principal (Opcional)" hint="Ex: Copacabana, Jardins, Aldeota, Batel, Centro.">
              <Input
                type="text"
                placeholder="Informe seu bairro de atendimento"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </FormField>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <Lock size={14} /> Nunca solicitamos seu endereço residencial completo.
            </div>
          </div>
        )}

        {/* ========================================================
            ETAPA 4: CATEGORIAS & MODALIDADES
        ======================================================== */}
        {currentStep === 4 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Tag size={22} color="var(--color-info)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 4 — Categorias do Anúncio</h2>
              </div>
              <Badge variant="neutral">{selectedCategoryIds.length}/5 selecionadas</Badge>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Selecione até 5 categorias que melhor descrevem seus serviços para aparecer nos filtros específicos.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                      } else {
                        if (selectedCategoryIds.length >= 5) {
                          showToast({ type: 'warning', title: 'Limite Atingido', message: 'Máximo de 5 categorias.' });
                          return;
                        }
                        setSelectedCategoryIds((prev) => [...prev, cat.id]);
                      }
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {cat.name}
                    </span>
                    {isSelected && <Check size={16} color="var(--accent-gold)" />}
                  </div>
                );
              })}
            </div>

            {/* Attendance Modes */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Locais de Atendimento</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {[
                { id: 'local_proprio', label: 'Local Próprio' },
                { id: 'hotel_motel', label: 'Hotéis / Motéis' },
                { id: 'domicilio', label: 'A Domicílio' },
                { id: 'viagem', label: 'Disponível para Viagem' },
              ].map((place) => {
                const isChecked = servicePlaces.includes(place.id);
                return (
                  <label
                    key={place.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 0.85rem',
                      background: isChecked ? 'rgba(255,255,255,0.05)' : 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setServicePlaces((prev) =>
                          isChecked ? prev.filter((p) => p !== place.id) : [...prev, place.id]
                        );
                      }}
                      style={{ accentColor: 'var(--accent-gold)' }}
                    />
                    <span>{place.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            ETAPA 5: APRESENTAÇÃO & BIO
        ======================================================== */}
        {currentStep === 5 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <FileText size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 5 — Apresentação & Biografia</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Descreva seu estilo, diferenciais de atendimento, idiomas e preferências.
            </p>

            <FormField
              label="Slogan / Chamada Principal de Destaque"
              hint={`${headline.length}/120 caracteres — Frase curta de impacto visível nos cards de busca.`}
            >
              <Input
                type="text"
                placeholder="Ex: Atendimento sofisticado, carinhoso e discreto em Salvador"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
              />
            </FormField>

            <FormField
              label="Biografia Detalhada"
              required
              hint={`${bio.length}/2000 caracteres (mínimo 20 caracteres) — Fale sobre você, sua personalidade e como é a experiência.`}
            >
              <textarea
                className="input"
                rows={7}
                placeholder="Escreva uma apresentação atraente..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={2000}
                required
              />
            </FormField>
          </div>
        )}

        {/* ========================================================
            ETAPA 6: CANAIS DE CONTATO
        ======================================================== */}
        {currentStep === 6 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Phone size={22} color="var(--color-success)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 6 — Canais de Contato</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Adicione formas diretas para os clientes entrarem em contato com você. O WhatsApp é o canal mais utilizado.
            </p>

            {/* New Contact Form Box */}
            <form
              onSubmit={handleAddContact}
              style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.75rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Adicionar Novo Canal</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <FormField label="Tipo de Contato" required>
                  <Select value={newContactType} onChange={(e) => setNewContactType(e.target.value as ContactType)}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="phone">Telefone Ligação</option>
                    <option value="website">Website / Link</option>
                  </Select>
                </FormField>

                <FormField
                  label={newContactType === 'telegram' ? 'Usuário (@seunome)' : newContactType === 'website' ? 'URL do Site' : 'Número (com DDD)'}
                  required
                >
                  <Input
                    type="text"
                    placeholder={newContactType === 'telegram' ? '@seunome' : newContactType === 'website' ? 'https://...' : '(11) 99999-9999'}
                    value={newContactValue}
                    onChange={(e) => {
                      if (newContactType === 'whatsapp' || newContactType === 'phone') {
                        setNewContactValue(formatPhoneMask(e.target.value));
                      } else {
                        setNewContactValue(e.target.value);
                      }
                    }}
                    required
                  />
                </FormField>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={newIsPrimary}
                    onChange={(e) => setNewIsPrimary(e.target.checked)}
                    style={{ accentColor: 'var(--accent-gold)' }}
                  />
                  <span>Definir como canal principal de atendimento</span>
                </label>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {newContactType === 'whatsapp' && newContactValue.replace(/\D/g, '').length >= 10 && (
                    <a
                      href={getWhatsAppTestUrl(newContactValue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Button type="button" variant="secondary" size="sm" leftIcon={<ExternalLink size={14} />}>
                        Testar Contato
                      </Button>
                    </a>
                  )}

                  <Button type="submit" variant="primary" size="sm" isLoading={isAddingContact} leftIcon={<Plus size={16} />}>
                    Adicionar Canal
                  </Button>
                </div>
              </div>
            </form>

            {/* Contacts List */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Contatos Cadastrados ({contacts.length})</h3>
            {contacts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                Nenhum canal cadastrado ainda. Adicione seu WhatsApp para receber contatos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <strong style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{c.contact_type}:</strong>
                      <span style={{ fontFamily: 'monospace' }}>{c.contact_value}</span>
                      {c.is_primary && <Badge variant="gold">Principal</Badge>}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(c.id)}
                      style={{ color: 'var(--accent-ruby)', padding: '0.35rem' }}
                      aria-label="Excluir canal de contato"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ETAPA 7: GALERIA & CAPA
        ======================================================== */}
        {currentStep === 7 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Camera size={22} color="var(--accent-ruby)" />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 7 — Galeria & Foto Principal</h2>
              </div>
              <Badge variant="gold">
                {mediaList.length}/{mediaQuota?.maxImages || 10} Fotos
              </Badge>
            </div>

            {/* Photo Guidelines Accordion / Box */}
            <Card variant="glass" padding="md" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={16} /> Diretrizes de Publicação de Imagens:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>Apenas pessoas maiores de 18 anos de idade.</li>
                <li>Não são permitidas fotos com menores ou terceiros sem autorização expressa.</li>
                <li>Sem documentos civis, dados bancários ou cartões de crédito visíveis nas imagens.</li>
                <li>Metadados EXIF e dados de geolocalização GPS são removidos automaticamente para seu sigilo.</li>
              </ul>
            </Card>

            {/* Upload Area */}
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                marginBottom: '1.75rem',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleUploadMedia(e.target.files)}
              />

              <UploadCloud size={40} color="var(--accent-gold)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {isUploadingMedia ? `Enviando fotos... (${uploadPercent}%)` : 'Clique ou arraste suas fotos aqui'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Formatos: JPG, PNG, WEBP (máx. 15MB por foto).
              </p>
            </div>

            {/* Photo List & Cover Setting */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Suas Fotos ({mediaList.length})</h3>
            {mediaList.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                Nenhuma foto enviada. A primeira foto adicionada será definida automaticamente como capa do anúncio.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {mediaList.map((media, idx) => {
                  const isCover = idx === 0;
                  return (
                    <div
                      key={media.id}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: isCover ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ height: '170px', width: '100%', position: 'relative' }}>
                        <img
                          src={media.thumbnail_path || media.storage_path || ''}
                          alt="Foto do anúncio"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {isCover && (
                          <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                            <Badge variant="gold">
                              <Star size={10} fill="var(--accent-gold)" /> Foto de Capa
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                        {!isCover ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetMainPhoto(media.id)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          >
                            Tornar Capa
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>Principal</span>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMedia(media.id)}
                          style={{ color: 'var(--accent-ruby)', padding: '0.25rem' }}
                          aria-label="Remover foto"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ETAPA 8: REVISÃO, KYC, LIVE PREVIEW & ENVIO
        ======================================================== */}
        {currentStep === 8 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={22} color="var(--accent-gold)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Etapa 8 — Revisão Geral & Envio para Moderação</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Confira os detalhes do seu anúncio antes de enviar para nossa equipe de moderação.
            </p>

            {/* 1. Completeness Score Card */}
            {completeness && <CompletenessCard completeness={completeness} />}

            {/* 2. Verification (KYC) Notice */}
            <Card variant="glass" padding="md" style={{ border: '1px solid var(--accent-gold)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={28} color="var(--accent-gold)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Selo de Verificação Oficial 18+
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {advertiser?.verification_status === 'verified'
                        ? 'Sua identidade foi verificada com sucesso.'
                        : 'A verificação biométrica e documental é realizada de forma sigilosa no menu Verificação.'}
                    </div>
                  </div>
                </div>

                <Link href="/advertiser/verification" target="_blank">
                  <Button variant="secondary" size="sm">
                    Ver Detalhes KYC
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 3. Live Preview Card */}
            <div style={{ marginBottom: '2rem' }}>
              <OnboardingPreviewCard
                advertiser={{
                  ...advertiser,
                  stage_name: stageName,
                  headline,
                  bio,
                  gender,
                  birth_date: birthDate,
                  neighborhood,
                }}
                mediaList={mediaList}
                contacts={contacts}
                categories={categories}
                selectedCategoryIds={selectedCategoryIds}
                stateName={selectedState?.name}
                cityName={selectedCity?.name}
                onEditSection={handleJumpToStep}
              />
            </div>

            {/* 4. Final Submit Action Button */}
            <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: 'rgba(212, 175, 55, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Tudo Pronto para Enviar?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                Ao enviar para moderação, nossa equipe validará as informações do perfil. Assim que aprovado, seu anúncio ficará disponível nas buscas públicas.
              </p>

              <Button
                type="button"
                variant="ruby"
                size="lg"
                fullWidth
                isLoading={isSubmittingReview}
                disabled={isSubmittingReview || !completeness?.isReadyForSubmission}
                onClick={handleSubmitForReview}
                rightIcon={<ArrowRight size={18} />}
              >
                Concluir & Enviar para Análise
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. BOTTOM ACTION BAR (RESPONSIVE & TOUCH >=44px) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 0',
        }}
      >
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handlePrevStep}
            leftIcon={<ArrowLeft size={16} />}
            style={{ minHeight: '44px', minWidth: '110px' }}
          >
            Voltar
          </Button>
        ) : (
          <Link href="/advertiser">
            <Button variant="ghost" size="md" style={{ minHeight: '44px' }}>
              Sair para o Painel
            </Button>
          </Link>
        )}

        {currentStep < 8 && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNextStep}
            rightIcon={<ArrowRight size={16} />}
            style={{ minHeight: '44px', minWidth: '130px' }}
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
