import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ aberto, onFechar, titulo, children, tamanho = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onFechar]);

  if (!aberto) return null;

  const tamanhos = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onFechar}
      />

      {/* Modal */}
      <div
        ref={ref}
        className={`relative w-full ${tamanhos[tamanho]} bg-brand-dark-3 border border-brand-dark-5 rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-dark-5">
          <h2 className="text-lg font-bold text-white">{titulo}</h2>
          <button
            onClick={onFechar}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-brand-dark-5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
