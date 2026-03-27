import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DialogConfirmacaoProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  tipo?: 'perigo' | 'aviso';
}

export function DialogConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  tipo = 'perigo',
}: DialogConfirmacaoProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative w-full max-w-sm bg-brand-dark-3 border border-brand-dark-5 rounded-2xl shadow-2xl p-6 animate-slide-up">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${tipo === 'perigo' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle size={28} className={tipo === 'perigo' ? 'text-red-400' : 'text-yellow-400'} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{titulo}</h3>
            <p className="text-sm text-gray-400">{mensagem}</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onCancelar} className="btn-ghost flex-1">
              {textoBotaoCancelar}
            </button>
            <button
              onClick={onConfirmar}
              className={`btn flex-1 text-white ${tipo === 'perigo' ? 'bg-red-600 hover:bg-red-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
            >
              {textoBotaoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
