'use client';

import React, { useEffect, useCallback } from 'react';
import { AdvertiserMedia } from '@/types/app.types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryLightboxProps {
  mediaList: AdvertiserMedia[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function GalleryLightbox({
  mediaList,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(mediaList.length - 1);
    }
  }, [currentIndex, mediaList.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < mediaList.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0);
    }
  }, [currentIndex, mediaList.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || mediaList.length === 0) return null;

  const currentMedia = mediaList[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de fotos em tela cheia"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff',
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {currentIndex + 1} de {mediaList.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          aria-label="Fechar visualizador de fotos"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentMedia && (
          <img
            src={currentMedia.storage_path}
            alt={`Foto ${currentIndex + 1} de ${mediaList.length} do anunciante`}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-2xl)',
            }}
          />
        )}
      </div>

      {/* Controls: Prev & Next */}
      {mediaList.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
            aria-label="Próxima foto"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </div>
  );
}
