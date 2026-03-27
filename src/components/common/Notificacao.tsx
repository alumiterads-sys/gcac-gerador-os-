import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type TipoNotificacao = 'sucesso' | 'erro' | 'aviso' | 'info';

interface NotificacaoProps {
  tipo: TipoNotificacao;
  mensagem: string;
  visivel: boolean;
  onFechar: () => void;
  duracao?: number;
}

export function Notificacao({ tipo, mensagem, visivel, onFechar, duracao = 4000 }: NotificacaoProps) {
  useEffect(() => {
    if (visivel && duracao > 0) {
      const timer = setTimeout(onFechar, duracao);
      return () => clearTimeout(timer);
    }
  }, [visivel, duracao, onFechar]);

  if (!visivel) return null;

  const configs = {
    sucesso: { icone: CheckCircle, bg: 'bg-brand-green/20 border-brand-green/40', texto: 'text-brand-green-light', iconeCor: 'text-brand-green' },
    erro:    { icone: XCircle,     bg: 'bg-red-500/20 border-red-500/40',           texto: 'text-red-300',          iconeCor: 'text-red-400' },
    aviso:   { icone: AlertTriangle,bg: 'bg-yellow-500/20 border-yellow-500/40',   texto: 'text-yellow-300',       iconeCor: 'text-yellow-400' },
    info:    { icone: Info,         bg: 'bg-brand-blue/20 border-brand-blue/40',    texto: 'text-blue-300',         iconeCor: 'text-brand-blue-light' },
  };

  const { icone: Icone, bg, texto, iconeCor } = configs[tipo];

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-xl border ${bg} shadow-2xl animate-slide-up max-w-sm`}>
      <Icone size={20} className={`${iconeCor} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm font-medium ${texto} flex-1`}>{mensagem}</p>
      <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

// Hook para usar notificações facilmente
import { useState, useCallback } from 'react';

export function useNotificacao() {
  const [estado, setEstado] = useState<{
    visivel: boolean;
    tipo: TipoNotificacao;
    mensagem: string;
  }>({ visivel: false, tipo: 'info', mensagem: '' });

  const mostrar = useCallback((tipo: TipoNotificacao, mensagem: string) => {
    setEstado({ visivel: true, tipo, mensagem });
  }, []);

  const fechar = useCallback(() => {
    setEstado(e => ({ ...e, visivel: false }));
  }, []);

  return { estado, mostrar, fechar };
}
