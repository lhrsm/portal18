'use client';

import React from 'react';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Tag, 
  FileText, 
  Phone, 
  Camera, 
  CheckCircle2,
  Check
} from 'lucide-react';

export interface StepItem {
  num: number;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
}

export const ONBOARDING_STEPS: StepItem[] = [
  { num: 1, title: 'Nome Artístico', shortTitle: 'Nome', icon: <User size={16} /> },
  { num: 2, title: 'Dados Básicos', shortTitle: '18+', icon: <ShieldCheck size={16} /> },
  { num: 3, title: 'Localização', shortTitle: 'Local', icon: <MapPin size={16} /> },
  { num: 4, title: 'Categorias', shortTitle: 'Categorias', icon: <Tag size={16} /> },
  { num: 5, title: 'Bio & Slogan', shortTitle: 'Bio', icon: <FileText size={16} /> },
  { num: 6, title: 'Canais de Contato', shortTitle: 'Contatos', icon: <Phone size={16} /> },
  { num: 7, title: 'Galeria & Capa', shortTitle: 'Fotos', icon: <Camera size={16} /> },
  { num: 8, title: 'Revisão & Envio', shortTitle: 'Preview', icon: <CheckCircle2 size={16} /> },
];

export interface OnboardingStepperProps {
  currentStep: number;
  maxUnlockedStep: number;
  onSelectStep: (step: number) => void;
}

export function OnboardingStepper({
  currentStep,
  maxUnlockedStep,
  onSelectStep,
}: OnboardingStepperProps) {
  const currentStepItem = ONBOARDING_STEPS.find((s) => s.num === currentStep) || ONBOARDING_STEPS[0];
  const progressPercent = Math.round(((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100);

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* 1. DESKTOP STEPPER (Visible on md and larger) */}
      <div className="desktop-stepper" style={{ display: 'none' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            padding: '0.5rem 0',
          }}
        >
          {/* Progress Connecting Line */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '24px',
              right: '24px',
              height: '2px',
              backgroundColor: 'var(--border-subtle)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--accent-gold)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Steps */}
          {ONBOARDING_STEPS.map((step) => {
            const isCompleted = step.num < currentStep;
            const isActive = step.num === currentStep;
            const isUnlocked = step.num <= maxUnlockedStep;

            return (
              <button
                key={step.num}
                type="button"
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectStep(step.num)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  zIndex: 2,
                  outline: 'none',
                  minWidth: '54px',
                  transition: 'transform var(--transition-fast)',
                }}
                aria-label={`Ir para etapa ${step.num}: ${step.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: isActive
                      ? 'var(--accent-gold)'
                      : isCompleted
                      ? 'var(--color-success)'
                      : 'var(--bg-tertiary)',
                    color: isActive ? '#000' : '#fff',
                    border: isActive
                      ? '3px solid rgba(212, 175, 55, 0.3)'
                      : isCompleted
                      ? '2px solid var(--color-success)'
                      : '2px solid var(--border-subtle)',
                    boxShadow: isActive ? '0 0 16px rgba(212, 175, 55, 0.4)' : 'none',
                    marginBottom: '0.5rem',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.num}
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive
                      ? 'var(--accent-gold)'
                      : isCompleted
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {step.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MOBILE PROGRESS INDICATOR (Visible on mobile/compact screens) */}
      <div className="mobile-stepper">
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-gold)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {currentStep}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Etapa {currentStep} de {ONBOARDING_STEPS.length}
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {currentStepItem.title}
                </strong>
              </div>
            </div>

            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '5px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--accent-gold)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-stepper {
            display: block !important;
          }
          .mobile-stepper {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
