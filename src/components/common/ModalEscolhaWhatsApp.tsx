import React from 'react';
import { X, MessageCircle, Globe, Monitor } from 'lucide-react';

interface ModalEscolhaWhatsAppProps {
  aberto: boolean;
  onFechar: () => void;
  telefone: string;
  mensagem: string;
}

export function ModalEscolhaWhatsApp({ aberto, onFechar, telefone, mensagem }: ModalEscolhaWhatsAppProps) {
  if (!aberto) return null;

  const telefoneLimpo = telefone.replace(/\D/g, '');
  // Adiciona 55 se não tiver código do país
  const foneFinal = telefoneLimpo.length <= 11 ? `55${telefoneLimpo}` : telefoneLimpo;
  const textoCodificado = encodeURIComponent(mensagem);

  const abrirWeb = () => {
    window.open(`https://web.whatsapp.com/send?phone=${foneFinal}&text=${textoCodificado}`, '_blank');
    onFechar();
  };

  const abrirApp = () => {
    // whatsapp:// funciona para Desktop e Business Desktop
    window.open(`whatsapp://send?phone=${foneFinal}&text=${textoCodificado}`, '_blank');
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-brand-dark-2 w-full max-w-sm rounded-2xl border border-brand-dark-5 p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue" />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-brand-blue/10 p-2.5 rounded-xl border border-brand-blue/20">
              <MessageCircle size={24} className="text-brand-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Enviar WhatsApp</h2>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none mt-1">Escolha como abrir</p>
            </div>
          </div>
          <button 
            onClick={onFechar}
            className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={abrirApp}
            className="w-full flex items-center gap-4 p-4 bg-brand-dark-3 border border-brand-dark-5 rounded-xl hover:border-brand-blue/50 hover:bg-brand-blue/5 transition-all group"
          >
            <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform">
              <Monitor size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white uppercase tracking-tight">Aplicativo Desktop</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">WhatsApp Business / Desktop</p>
            </div>
          </button>

          <button
            onClick={abrirWeb}
            className="w-full flex items-center gap-4 p-4 bg-brand-dark-3 border border-brand-dark-5 rounded-xl hover:border-brand-green/50 hover:bg-brand-green/5 transition-all group"
          >
            <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
              <Globe size={24} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white uppercase tracking-tight">WhatsApp Web</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Abrir no Navegador</p>
            </div>
          </button>
        </div>

        <p className="text-center text-[9px] text-gray-600 font-bold uppercase mt-6 tracking-tighter">
          O texto será enviado automaticamente após a escolha.
        </p>
      </div>
    </div>
  );
}
