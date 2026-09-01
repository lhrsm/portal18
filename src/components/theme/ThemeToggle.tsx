'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemePreference } from '@/components/theme/ThemeProvider';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'dropdown' | 'inline';
}

export function ThemeToggle({ variant = 'dropdown' }: ThemeToggleProps) {
  const { themePreference, resolvedTheme, setThemePreference, isHydrated } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <Sun size={15} /> },
    { value: 'dark', label: 'Escuro', icon: <Moon size={15} /> },
    { value: 'system', label: 'Sistema', icon: <Monitor size={15} /> },
  ];

  if (variant === 'inline') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Tema Visual
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
          {options.map((opt) => {
            const isSelected = isHydrated && themePreference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setThemePreference(opt.value)}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.35rem', 
                  padding: '0.5rem', 
                  fontSize: '0.8rem',
                  minHeight: '44px'
                }}
                aria-pressed={isSelected}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const currentIcon = !isHydrated 
    ? <Moon size={16} /> 
    : resolvedTheme === 'dark' 
      ? <Moon size={16} color="var(--accent-gold)" /> 
      : <Sun size={16} color="var(--accent-gold)" />;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alterar tema visual"
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.45rem 0.65rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          minWidth: '44px',
          minHeight: '44px',
          justifyContent: 'center',
          transition: 'all var(--transition-fast)',
        }}
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Opções de tema"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '0.35rem',
            minWidth: '140px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          {options.map((opt) => {
            const isSelected = isHydrated && themePreference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  setThemePreference(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: isSelected ? 700 : 500,
                  minHeight: '36px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} color="var(--accent-gold)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
