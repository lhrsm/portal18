'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { advancedSearchService } from '@/services/search/advancedSearchService';
import { AutocompleteResult, AutocompleteSuggestion } from '@/services/search/types';
import { Search, MapPin, Tag, User, X, Loader2 } from 'lucide-react';

export interface AdvancedSearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function AdvancedSearchBar({
  initialQuery = '',
  placeholder = 'Buscar por nome, cidade ou categoria...',
  onSearch,
  className,
}: AdvancedSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<AutocompleteResult>({ cities: [], categories: [], advertisers: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Flattened list of suggestions for keyboard navigation
  const flatSuggestions: AutocompleteSuggestion[] = [
    ...suggestions.cities,
    ...suggestions.categories,
    ...suggestions.advertisers,
  ];

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initial query
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Debounced Autocomplete
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions({ cities: [], categories: [], advertisers: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await advancedSearchService.autocomplete(query, 6);
        setSuggestions(res);
        const hasResults = res.cities.length > 0 || res.categories.length > 0 || res.advertisers.length > 0;
        setIsOpen(hasResults);
        setActiveIndex(-1);
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    if (onSearch) {
      onSearch(query.trim());
    } else {
      router.push(`/explorar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = (item: AutocompleteSuggestion) => {
    setIsOpen(false);
    if (item.type === 'city') {
      router.push(`/explorar?cidade=${encodeURIComponent(item.slug)}`);
    } else if (item.type === 'category') {
      router.push(`/explorar?categoria=${encodeURIComponent(item.slug)}`);
    } else if (item.type === 'advertiser') {
      setQuery(item.stage_name || item.name || '');
      router.push(`/explorar?q=${encodeURIComponent(item.stage_name || item.name || '')}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flatSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < flatSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatSuggestions.length) {
        handleSelectSuggestion(flatSuggestions[activeIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-hidden="true"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </span>

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
            aria-label={placeholder}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && flatSuggestions.length > 0 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="input"
            style={{
              height: '46px',
              paddingLeft: '2.6rem',
              paddingRight: query ? '2.5rem' : '1rem',
              width: '100%',
              fontSize: '0.95rem',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Limpar texto de busca"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                zIndex: 2,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: '46px', minWidth: '80px', fontWeight: 700, padding: '0 1.25rem' }}
        >
          Buscar
        </button>
      </form>

      {/* Autocomplete Dropdown Listbox */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 9999,
            maxHeight: '340px',
            overflowY: 'auto',
          }}
        >
          {/* Cities Section */}
          {suggestions.cities.length > 0 && (
            <div>
              <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cidades
              </div>
              {suggestions.cities.map((city, idx) => {
                const globalIdx = idx;
                const isSelected = activeIndex === globalIdx;
                return (
                  <div
                    key={`city-${city.id}`}
                    id={`${listboxId}-option-${globalIdx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSuggestion(city)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <MapPin size={14} color="var(--accent-gold)" />
                    <span><strong>{city.name}</strong>, {city.state_code}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Categories Section */}
          {suggestions.categories.length > 0 && (
            <div>
              <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Categorias
              </div>
              {suggestions.categories.map((cat, idx) => {
                const globalIdx = suggestions.cities.length + idx;
                const isSelected = activeIndex === globalIdx;
                return (
                  <div
                    key={`cat-${cat.id}`}
                    id={`${listboxId}-option-${globalIdx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSuggestion(cat)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Tag size={14} color="var(--accent-gold)" />
                    <span>Categoria: <strong>{cat.name}</strong></span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Advertisers Section */}
          {suggestions.advertisers.length > 0 && (
            <div>
              <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Anunciantes
              </div>
              {suggestions.advertisers.map((adv, idx) => {
                const globalIdx = suggestions.cities.length + suggestions.categories.length + idx;
                const isSelected = activeIndex === globalIdx;
                return (
                  <div
                    key={`adv-${adv.id}`}
                    id={`${listboxId}-option-${globalIdx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectSuggestion(adv)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <User size={14} color="var(--accent-gold)" />
                    <span><strong>{adv.stage_name}</strong> {adv.city_name ? `(${adv.city_name}, ${adv.state_code})` : ''}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
