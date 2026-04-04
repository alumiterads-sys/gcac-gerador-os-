import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Search,
  User,
  Key,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { useOrdens } from '../../context/OrdensContext';
import { formatarMoeda, formatarNumeroOS } from '../../utils/formatters';

export function RotinaDiaria() {
  const navigate = useNavigate();
  const { ordens, atualizarGruServico, atualizarStatusServico } = useOrdens();

  // 1. Filtro: Conferência na PF (Protocolados)
  const conferenciasPF = useMemo(() => {
    return ordens.filter(o => 
      o.servicos?.some(s => s.statusExecucao === 'Protocolado — Ag. PF')
    ).map(o => ({
      ...o,
      servicosProtocolados: o.servicos.filter(s => s.statusExecucao === 'Protocolado — Ag. PF')
    }));
  }, [ordens]);

  // 2. Filtro: Pendências de GRU
  const pendenciasGRU = useMemo(() => {
    return ordens.filter(o => 
      o.servicos?.some(s => (s.taxaPF || 0) > 0 && !s.pagoGRU)
    ).map(o => ({
      ...o,
      servicosSemGRU: o.servicos.filter(s => (s.taxaPF || 0) > 0 && !s.pagoGRU)
    }));
  }, [ordens]);

  const copiarParaTransferencia = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto);
    // Aqui poderíamos ter um toast, mas vamos manter simples por agora
  };

  const handleConcluirServico = async (ordemId: string, servicoId: string) => {
    if (confirm('Deseja marcar este serviço como CONCLUÍDO?')) {
      await atualizarStatusServico(ordemId, servicoId, 'Concluído');
    }
  };

  const handlePagarGRU = async (ordemId: string, servicoId: string) => {
    await atualizarGruServico(ordemId, servicoId, true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck className="text-brand-blue" />
          Rotina Diária de Acompanhamento
        </h1>
        <p className="text-gray-400 text-sm">Central de ações rápidas para processos protocolados e taxas pendentes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Seção 1: Conferência na PF */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-brand-blue-light uppercase tracking-widest flex items-center gap-2">
              <Search size={16} />
              Conferir na PF ({conferenciasPF.length})
            </h2>
          </div>

          <div className="space-y-3">
            {conferenciasPF.length === 0 ? (
              <div className="card py-10 text-center text-gray-500 text-sm italic">
                Nenhum processo aguardando resposta da PF no momento.
              </div>
            ) : (
              conferenciasPF.map(o => (
                <div key={o.id} className="card bg-brand-dark-3/50 border-brand-dark-5 hover:border-brand-blue/30 transition-all p-4 space-y-4 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">#{formatarNumeroOS(o.numero)}</p>
                      <h3 className="text-sm font-bold text-white group-hover:text-brand-blue-light transition-colors">{o.nomeCliente}</h3>
                    </div>
                    <button 
                      onClick={() => navigate(`/ordens/${o.id}`)}
                      className="p-1.5 text-gray-500 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>

                  {/* Dados para Cópia */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-brand-dark-4 p-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <User size={12} className="text-gray-500 shrink-0" />
                        <span className="text-[11px] font-mono text-gray-300 truncate">{o.cpf}</span>
                      </div>
                      <button 
                        onClick={() => copiarParaTransferencia(o.cpf, 'CPF')}
                        className="p-1 text-brand-blue hover:text-brand-blue-light transition-all"
                        title="Copiar CPF"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-brand-dark-4 p-2 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Key size={12} className="text-gray-500 shrink-0" />
                        <span className="text-[11px] font-mono text-gray-300 truncate">{o.senhaGov || 'Sem senha'}</span>
                      </div>
                      <button 
                        onClick={() => copiarParaTransferencia(o.senhaGov, 'Senha Gov')}
                        className="p-1 text-brand-blue hover:text-brand-blue-light transition-all"
                        disabled={!o.senhaGov}
                        title="Copiar Senha"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Serviços Protocolados */}
                  <div className="space-y-2">
                    {o.servicosProtocolados.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-brand-blue/5 p-2 rounded-lg border border-brand-blue/10">
                        <span className="text-[11px] font-bold text-brand-blue-light">{s.nome}</span>
                        <button 
                          onClick={() => handleConcluirServico(o.id, s.id)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-brand-green/20 text-brand-green hover:bg-brand-green text-[10px] font-black uppercase rounded transition-all"
                        >
                          <CheckCircle size={12} />
                          Deferido (Concluir)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seção 2: Pendências de GRU */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard size={16} />
              Pagar Taxas GRU ({pendenciasGRU.length})
            </h2>
          </div>

          <div className="space-y-3">
            {pendenciasGRU.length === 0 ? (
              <div className="card py-10 text-center text-gray-500 text-sm italic">
                Nenhuma taxa GRU pendente de pagamento.
              </div>
            ) : (
              pendenciasGRU.map(o => (
                <div key={o.id} className="card bg-brand-dark-3/50 border-brand-dark-5 hover:border-orange-500/30 transition-all p-4 space-y-3 group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">#{formatarNumeroOS(o.numero)}</p>
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{o.nomeCliente}</h3>
                    </div>
                    <button 
                      onClick={() => navigate(`/ordens/${o.id}`)}
                      className="p-1.5 text-gray-500 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {o.servicosSemGRU.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-orange-500/5 p-2 rounded-lg border border-orange-500/10">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-orange-400">{s.nome}</span>
                          <span className="text-[10px] text-gray-500 font-bold">{formatarMoeda(s.taxaPF || 0)}</span>
                        </div>
                        <button 
                          onClick={() => handlePagarGRU(o.id, s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-dark-5 text-gray-300 hover:text-white hover:bg-brand-green/80 text-[10px] font-black uppercase rounded-lg transition-all border border-white/5"
                        >
                          Marcar como Pago
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
