'use client';

import React, { useState, useEffect, useRef } from 'react';
import { publicProfilesService } from '@/services/publicProfilesService';
import { MapPin, Search, X } from 'lucide-react';

export interface CityAutocompleteProps {
  onSelectCity: (city: { cityName: string; citySlug: string; stateCode: string; stateSlug: string } | null) => void;
  initialValue?: string;
  placeholder?: string;
}

export function CityAutocomplete({
  onSelectCity,
  initialValue = '',
  placeholder = 'Buscar cidade (ex: Salvador, São Paulo)...',
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await publicProfilesService.searchCitiesAutocomplete(query, 8);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Error in city autocomplete:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: { name: string; slug: string; state_code: string; state_slug: string }) => {
    const formatted = `${item.name}, ${item.state_code}`;
    setQuery(formatted);
    setIsOpen(false);
    onSelectCity({
      cityName: item.name,
      citySlug: item.slug,
      stateCode: item.state_code,
      stateSlug: item.state_slug,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onSelectCity(null);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div className="input-group">
        <span className="input-icon-left">
          <MapPin size={18} color="var(--accent-gold)" />
        </span>
        <input
          type="text"
          className="input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          style={{ paddingLeft: '2.5rem', paddingRight: query ? '2.5rem' : '1rem' }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
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
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((city) => (
            <div
              key={city.id}
              onClick={() => handleSelect(city)}
              style={{
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <MapPin size={14} color="var(--accent-gold)" />
              <span><strong>{city.name}</strong>, {city.state_code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
