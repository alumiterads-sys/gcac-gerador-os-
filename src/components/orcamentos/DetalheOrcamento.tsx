import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, MessageCircle, FileDown, ArrowLeft, Edit2, CheckCircle, Smartphone, User, DollarSign, Calendar, ChevronRight
} from 'lucide-react';
import { Orcamento } from '../../types';
import { formatarMoeda, formatarDataHora, classeStatusOrcamento } from '../../utils/formatters';
import { baixarPdfOrcamento } from '../../services/geradorPdfOrcamento';
import { useOrdens } from '../../context/OrdensContext';
import { useOrcamentos } from '../../context/OrcamentosContext';
import { Notificacao, useNotificacao } from '../common/Notificacao';

interface DetalheOrcamentoProps {
  orcamento: Orcamento;
}

export function DetalheOrcamento({ orcamento }: DetalheOrcamentoProps) {
  const navigate = useNavigate();
  const { criarOrdem } = useOrdens();
  const { atualizarOrcamento } = useOrcamentos();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [convertendo, setConvertendo] = useState(false);

  const enviarParaWhatsApp = () => {
    // Retira caracteres não numéricos do telefone
    const numeroLimpo = orcamento.contato.replace(/\D/g, '');
    
    let mensagem = `* GCAC | Despachante Bélico *\n_Orçamento ORC-${String(orcamento.numero).padStart(4, '0')}_\n\n`;
    mensagem += `Olá, *${orcamento.nomeCliente}*!\n`;
    mensagem += `Segue o resumo do seu orçamento:\n\n`;
    
    orcamento.servicos.forEach(s => {
      mensagem += `🔹 *${s.nome}*\n`;
      if (s.detalhes) mensagem += `   ${s.detalhes}\n`;
      mensagem += `   _Valor: ${formatarMoeda(s.valor)}_\n\n`;
    });
    
    mensagem += `🧾 *Valor Total Previsto:* ${formatarMoeda(orcamento.valorTotal)}\n\n`;
    
    if (orcamento.observacoes) {
      mensagem += `⚠️ *Observações:*\n${orcamento.observacoes}\n\n`;
    }
    
    mensagem += `Qualquer dúvida, estou à disposição!`;

    const textoCodificado = encodeURIComponent(mensagem);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const linkZAP = isMobile
      ? `whatsapp://send?phone=55${numeroLimpo}&text=${textoCodificado}`
      : `https://web.whatsapp.com/send?phone=55${numeroLimpo}&text=${textoCodificado}`;
    
    window.open(linkZAP, '_blank');
  };

  const converterEmOS = async () => {
    if (!window.confirm('Tem certeza que deseja converter este orçamento em uma Ordem de Serviço?')) return;
    
    setConvertendo(true);
    try {
      // Cria a O.S. usando os dados do orçamento
      const osId = await criarOrdem({
        nomeCliente: orcamento.nomeCliente,
        contato: orcamento.contato,
        cpf: orcamento.cpf,
        senhaGov: '', // Precisará ser preenchido na O.S
        filiadoProTiro: false,
        clubeFiliado: '',
        servicos: orcamento.servicos.map(s => ({
          id: s.id,
          nome: s.nome,
          detalhes: s.detalhes
        })),
        valor: orcamento.valorTotal,
        formaPagamento: 'PIX', // Padrão
        status: 'Aguardando Pagamento',
        canalAtendimento: 'WhatsApp',
        observacaoContato: 'Convertido do ORC-' + String(orcamento.numero).padStart(4, '0'),
        observacoes: orcamento.observacoes || ''
      });

      // Atualiza o status do orçamento para "Aprovado"
      await atualizarOrcamento(orcamento.id, { status: 'Aprovado' });

      mostrar('sucesso', 'Sucesso! Orçamento convertido em O.S.');
      
      // Manda para a página de edição/detalhe da nova O.S
      setTimeout(() => {
        navigate(`/ordens/${osId}/editar`);
      }, 1500);

    } catch (err) {
      console.error(err);
      mostrar('erro', 'Erro ao tentar converter. Tente novamente.');
      setConvertendo(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      <Notificacao {...notif} onFechar={fechar} />

      {/* ── Navbar Topo ── */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-brand-dark pb-4 border-b border-brand-dark-5">
        <button onClick={() => navigate('/orcamentos')} className="btn-ghost px-2 gap-1 text-sm">
          <ArrowLeft size={16} /> Voltar
        </button>
        <button onClick={() => navigate(`/orcamentos/${orcamento.id}/editar`)} className="btn-primary py-1.5 px-3 text-sm">
          <Edit2 size={14} /> Editar Orçamento
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* ── Coluna Esquerda: Dados Principais ── */}
        <div className="flex-1 space-y-6">
          
          {/* Header OS / Status */}
          <div className="card text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-dark-3 to-brand-dark-4 border-t-4 border-t-yellow-500">
            <div>
              <p className="text-gray-400 font-medium text-sm flex items-center justify-center sm:justify-start gap-1">
                <FileText size={14} />
                Orçamento de Serviço
              </p>
              <h1 className="text-3xl font-black text-white mt-1">
                #{String(orcamento.numero).padStart(4, '0')}
              </h1>
            </div>

            <div className="space-y-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold block sm:inline-block ${classeStatusOrcamento(orcamento.status)}`}>
                {orcamento.status.toUpperCase()}
              </span>
              <p className="text-xs text-gray-500 font-medium flex items-center justify-center sm:justify-start gap-1">
                <Calendar size={12} /> Exibido em: {formatarDataHora(orcamento.criadoEm)}
              </p>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-brand-blue-light border-b border-brand-dark-5 pb-2 flex items-center gap-2">
              <User size={16} /> Informações do Cliente
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">Nome Completo</p>
                <p className="text-sm font-medium text-white break-words">{orcamento.nomeCliente}</p>
              </div>
              {orcamento.cpf && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">CPF</p>
                  <p className="text-sm font-medium text-white">{orcamento.cpf}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-gray-500 mb-0.5">Contato / WhatsApp</p>
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <Smartphone size={14} className="text-green-500" />
                  {orcamento.contato}
                </p>
              </div>
            </div>
          </div>

          {/* Serviços e Valores */}
          <div className="card space-y-4 border-l-4 border-l-brand-green">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <FileDown size={18} className="text-brand-green" /> 
              Serviços Previstos
            </h3>
            
            <div className="divide-y divide-brand-dark-5 border border-brand-dark-5 rounded-lg overflow-hidden">
              {orcamento.servicos.map((serv, i) => (
                <div key={i} className="p-4 bg-brand-dark-3/50 flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{serv.nome}</p>
                    {serv.detalhes && (
                      <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{serv.detalhes}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-500 uppercase">Valor</p>
                    <p className="text-brand-green font-bold bg-brand-green/10 px-2 py-0.5 rounded text-sm mt-0.5 inline-block sm:block">
                      {formatarMoeda(serv.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <div className="text-right p-4 bg-brand-dark-3 border border-brand-dark-5 rounded-xl w-full sm:w-auto">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total do Orçamento</p>
                <p className="text-2xl font-black text-brand-green">{formatarMoeda(orcamento.valorTotal)}</p>
              </div>
            </div>
            
            {orcamento.observacoes && (
              <div className="pt-2">
                <div className="bg-brand-dark-4/50 border border-brand-dark-5 p-3 rounded-lg flex gap-3">
                  <MessageCircle size={16} className="text-brand-blue-light flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-300 uppercase underline decoration-brand-dark-5 underline-offset-4 mb-2">Observações GERAIS</p>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{orcamento.observacoes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Coluna Direita: Ações ── */}
        <div className="md:w-80 flex-shrink-0 space-y-4">
          <div className="card sticky top-20 shadow-xl shadow-black/40">
            <h3 className="text-sm font-bold text-white border-b border-brand-dark-5 pb-3 mb-4 flex items-center gap-2">
              <ChevronRight size={16} className="text-brand-blue" />
              Ações Rápidas
            </h3>
            
            <div className="space-y-2">
              {/* WhatsApp Button */}
              <button onClick={enviarParaWhatsApp} className="btn w-full bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366] hover:text-white transition-all justify-start relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <MessageCircle size={18} className="relative z-10" />
                <span className="relative z-10 font-bold">Enviar por WhatsApp</span>
              </button>

              {/* Botão PDF */}
              <button 
                onClick={() => baixarPdfOrcamento(orcamento)}
                className="btn-ghost w-full justify-start border-gray-700 hover:border-brand-blue hover:text-brand-blue-light"
              >
                <FileDown size={18} />
                Baixar PDF
              </button>

              <hr className="border-brand-dark-5 my-4" />

              {/* Botão Converter OS */}
              <div className="pt-2">
                <p className="text-xs text-center text-gray-400 mb-2">Cliente aprovou o serviço?</p>
                <button 
                  onClick={converterEmOS}
                  disabled={convertendo || orcamento.status === 'Aprovado'}
                  className={`btn w-full justify-center transition-all ${
                    orcamento.status === 'Aprovado' 
                    ? 'opacity-50 cursor-not-allowed bg-brand-dark-4 text-gray-500'
                    : 'bg-brand-blue text-white hover:bg-brand-blue-light shadow-[0_0_15px_rgba(45,141,224,0.3)]'
                  }`}
                >
                  {convertendo ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Convertendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {orcamento.status === 'Aprovado' ? 'Já Convertido' : 'Converter em Ordem de Serviço'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


