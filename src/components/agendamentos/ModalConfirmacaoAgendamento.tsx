import React from 'react';
import { Agendamento } from '../../types';
import { gerarTextoAgendamento } from '../../utils/agendamentoFormatador';
import { X, Copy, Share2, FileText, Printer, Check, Trash2 } from 'lucide-react';
import { baixarPdfAgendamento } from '../../services/geradorPdfAgendamento';
import { useAgendamentos } from '../../context/AgendamentosContext';
import { ModalEscolhaWhatsApp } from '../common/ModalEscolhaWhatsApp';

interface ModalConfirmacaoAgendamentoProps {
  agendamento: Agendamento;
  onClose: () => void;
}

export function ModalConfirmacaoAgendamento({ agendamento, onClose }: ModalConfirmacaoAgendamentoProps) {
  const { deletarAgendamento } = useAgendamentos();
  const [copiado, setCopiado] = React.useState(false);
  const [modalWhatsAppAberto, setModalWhatsAppAberto] = React.useState(false);
  const texto = gerarTextoAgendamento(agendamento);

  const handleCopiar = () => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleWhatsApp = () => {
    setModalWhatsAppAberto(true);
  };

  const handlePDF = async () => {
    try {
      await baixarPdfAgendamento(agendamento);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Falha ao gerar o PDF. Tente novamente.');
    }
  };

  const handleImprimir = () => {
    // Para imprimir, abrimos o PDF em uma nova aba e deixamos o navegador gerenciar
    handlePDF();
  };

  const handleDeletar = async () => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deletarAgendamento(agendamento.id);
        onClose();
      } catch (error) {
        console.error('Erro ao deletar agendamento:', error);
        alert('Falha ao excluir o agendamento.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark-2 border border-brand-dark-5 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-brand-dark-5 flex justify-between items-center bg-brand-dark-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Share2 size={20} className="text-brand-blue" />
            Enviar Confirmação
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Resumo para WhatsApp
              </label>
              <button 
                onClick={handleCopiar}
                className="flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:text-brand-blue-light uppercase transition-colors"
              >
                {copiado ? (
                  <>
                    <Check size={12} className="text-brand-green" /> 
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> 
                    Copiar Texto
                  </>
                )}
              </button>
            </div>
            <div className="relative group">
              <pre className="bg-brand-dark-1 border border-brand-dark-5 p-4 rounded-xl text-white text-[11px] font-mono whitespace-pre-wrap h-64 overflow-y-auto custom-scrollbar">
                {texto}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-green hover:bg-green-600 text-brand-dark-1 font-bold rounded-xl transition-all shadow-lg shadow-brand-green/10"
            >
              <Share2 size={20} />
              WhatsApp
            </button>
            <button 
              onClick={handlePDF}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-blue hover:bg-brand-blue-light text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-blue/10"
            >
              <FileText size={20} />
              Gerar PDF
            </button>
            <button 
              onClick={handleImprimir}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl transition-all"
            >
              <Printer size={20} />
              Imprimir Confirmação
            </button>
            <button 
              onClick={handleDeletar}
              className="sm:col-span-2 flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-xl transition-all text-xs"
            >
              <Trash2 size={16} />
              Excluir Agendamento
            </button>
          </div>
        </div>
      </div>

      <ModalEscolhaWhatsApp 
        aberto={modalWhatsAppAberto}
        onFechar={() => setModalWhatsAppAberto(false)}
        telefone={agendamento.clienteContato}
        mensagem={texto}
      />
    </div>
  );
}
