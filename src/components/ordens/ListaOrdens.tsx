import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight, FileText, X, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useOrdens } from '../../context/OrdensContext';
import { useServicos } from '../../context/ServicosContext';
import { StatusOS, StatusExecucaoServico } from '../../types';
import { formatarMoeda, formatarData, formatarNumeroOS, classeStatus, classeStatusExecucao, iconeStatusExecucao, obterResumoExecucao } from '../../utils/formatters';
import { DialogConfirmacao } from '../common/DialogConfirmacao';
import { Notificacao, useNotificacao } from '../common/Notificacao';

const STATUS_FILTROS: { label: string; valor: StatusOS }[] = [
  { label: 'Aguardando Pagamento', valor: 'Aguardando Pagamento' },
  { label: 'Parciais',            valor: 'Parcialmente Pago' },
  { label: 'Gratuidades',         valor: 'Gratuidade' },
  { label: 'Pagas',               valor: 'Pago' },
];

const STATUS_EXEC_FILTROS: { label: string; valor: StatusExecucaoServico }[] = [
  { label: 'Não Iniciado',        valor: 'Não Iniciado' },
  { label: 'Iniciado',            valor: 'Iniciado — Montando Processo' },
  { label: 'Agd Documentos',      valor: 'Aguardando Documentos' },
  { label: 'Protocolado',         valor: 'Protocolado — Ag. PF' },
  { label: 'Concluídos',          valor: 'Concluído' },
];

export function ListaOrdens() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ordens, deletarOrdem } = useOrdens();
  const { servicos } = useServicos();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [busca, setBusca] = useState('');
  const [filtrosStatus, setFiltrosStatus] = useState<StatusOS[]>([]);
  const [filtrosStatusExec, setFiltrosStatusExec] = useState<StatusExecucaoServico[]>([]);
  const [filtrosServico, setFiltrosServico] = useState<string[]>([]);
  const [filtroGru, setFiltroGru] = useState<'Todos' | 'Pagas' | 'Pendentes'>('Todos');
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null);
  const [expandirFiltros, setExpandirFiltros] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'ativas' | 'concluidas'>('ativas');

  const isConcluida = (o: any) => {
    // Uma OS é considerada concluída se:
    // 1. O status financeiro for 'Pago' ou 'Gratuidade'
    // 2. TODOS os serviços dentro dela tiverem status 'Concluído'
    const financeiraConcluida = o.status === 'Pago' || o.status === 'Gratuidade';
    const execucaoConcluida = (o.servicos || []).every((s: any) => s.statusExecucao === 'Concluído');
    return financeiraConcluida && execucaoConcluida;
  };

  const handleDeletar = async () => {
    if (!confirmandoDelete) return;
    try {
      await deletarOrdem(confirmandoDelete);
      setConfirmandoDelete(null);
      mostrar('sucesso', 'Ordem de serviço excluída com sucesso.');
    } catch (error) {
      console.error(error);
      mostrar('erro', 'Falha ao excluir a O.S.');
    }
  };

  useEffect(() => {
    const state = location.state as { filtroStatusExecucao?: StatusExecucaoServico };
    if (state?.filtroStatusExecucao) {
      setFiltrosStatusExec([state.filtroStatusExecucao]);
      // Limpar o estado para evitar comportamentos inesperados ao recarregar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const ordensFiltradas = ordens.filter(o => {
    // Primeiro filtro: Aba Ativa vs Concluída
    const statusConclusao = isConcluida(o);
    if (abaAtiva === 'ativas' && statusConclusao) return false;
    if (abaAtiva === 'concluidas' && !statusConclusao) return false;

    const matchBusca = !busca || [o.nomeCliente, o.cpf, o.servicos ? o.servicos.map(s => s.nome).join(' ') : (o as any).servico, String(o.numero)]
      .some(v => v.toLowerCase().includes(busca.toLowerCase()));
    
    const matchStatus = filtrosStatus.length === 0 || filtrosStatus.includes(o.status);
    const matchStatusExec = filtrosStatusExec.length === 0 || 
      (o.servicos && o.servicos.some((s: any) => filtrosStatusExec.includes(s.statusExecucao || 'Não Iniciado')));
    
    const matchServico = filtrosServico.length === 0 || 
      (o.servicos && o.servicos.some((s: any) => filtrosServico.includes(s.nome)));
    
    // Filtro GRU
    let matchGru = true;
    const servicosComTaxa = (o.servicos || []).filter((s: any) => (s.taxaPF || 0) > 0);
    if (filtroGru !== 'Todos') {
      if (servicosComTaxa.length === 0) {
        matchGru = (filtroGru === 'Pagas'); // OS sem taxas são consideradas "limpas/pagas"
      } else {
        const todasPagas = servicosComTaxa.every((s: any) => s.pagoGRU === true);
        matchGru = (filtroGru === 'Pagas') ? todasPagas : !todasPagas;
      }
    }
    
    return matchBusca && matchStatus && matchStatusExec && matchGru && matchServico;
  });

  const toggleFiltroStatus = (val: StatusOS) => {
    setFiltrosStatus(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleFiltroStatusExec = (val: StatusExecucaoServico) => {
    setFiltrosStatusExec(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };
  
  const toggleFiltroServico = (val: string) => {
    setFiltrosServico(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const limparFiltros = () => {
    setFiltrosStatus([]);
    setFiltrosStatusExec([]);
    setFiltrosServico([]);
    setFiltroGru('Todos');
    setBusca('');
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-sm text-gray-400">{ordens.length} total • {ordensFiltradas.length} exibidas</p>
        </div>
        <button
          id="btn-nova-os"
          onClick={() => navigate('/ordens/nova')}
          className="btn-primary"
        >
          <Plus size={16} />
          Nova OS
        </button>
      </div>

      {/* ── Seletor de Abas ── */}
      <div className="flex gap-1 p-1 bg-brand-dark-3 border border-brand-dark-5 rounded-xl w-fit">
        <button 
          onClick={() => setAbaAtiva('ativas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            abaAtiva === 'ativas' ? 'bg-brand-blue text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Clock size={14} />
          Em Aberto
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${abaAtiva === 'ativas' ? 'bg-white/20' : 'bg-brand-dark-5'}`}>
            {ordens.filter(o => !isConcluida(o)).length}
          </span>
        </button>
        <button 
          onClick={() => setAbaAtiva('concluidas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${
            abaAtiva === 'concluidas' ? 'bg-brand-blue text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <CheckCircle size={14} />
          Histórico / Concluídas
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${abaAtiva === 'concluidas' ? 'bg-white/20' : 'bg-brand-dark-5'}`}>
            {ordens.filter(o => isConcluida(o)).length}
          </span>
        </button>
      </div>

      {/* ── Busca e Filtros ── */}
      <div className="card space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Buscar por nome, CPF, número ou serviço..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <button
            onClick={() => setExpandirFiltros(!expandirFiltros)}
            className={`px-4 flex items-center gap-2 rounded-xl border transition-all ${
              expandirFiltros || filtrosStatus.length > 0 || filtrosStatusExec.length > 0 || filtrosServico.length > 0 || filtroGru !== 'Todos'
                ? 'bg-brand-blue/10 border-brand-blue text-brand-blue-light'
                : 'bg-brand-dark-5 border-brand-dark-5 text-gray-400'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {(filtrosStatus.length + filtrosStatusExec.length + filtrosServico.length + (filtroGru !== 'Todos' ? 1 : 0)) > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-blue text-white text-[10px] flex items-center justify-center font-bold">
                {filtrosStatus.length + filtrosStatusExec.length + filtrosServico.length + (filtroGru !== 'Todos' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {(expandirFiltros || filtrosStatus.length > 0 || filtrosStatusExec.length > 0 || filtrosServico.length > 0 || filtroGru !== 'Todos') && (
          <div className="pt-4 border-t border-brand-dark-5 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Status Pagamento */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                  Pagamento
                  {filtrosStatus.length > 0 && <button onClick={() => setFiltrosStatus([])} className="text-brand-blue hover:text-white transition-colors">Limpar</button>}
                </p>
                <div className="flex flex-col gap-2">
                  {STATUS_FILTROS.map(({ label, valor }) => (
                    <label key={valor} className="flex items-center gap-3 group cursor-pointer">
                      <div 
                        onClick={() => toggleFiltroStatus(valor)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          filtrosStatus.includes(valor) ? 'bg-brand-blue border-brand-blue' : 'bg-brand-dark-5 border-brand-dark-5 group-hover:border-brand-metal'
                        }`}
                      >
                        {filtrosStatus.includes(valor) && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${filtrosStatus.includes(valor) ? 'text-brand-blue-light' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Execução */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                  Execução / Operacional
                  {filtrosStatusExec.length > 0 && <button onClick={() => setFiltrosStatusExec([])} className="text-brand-blue hover:text-white transition-colors">Limpar</button>}
                </p>
                <div className="flex flex-col gap-2">
                  {STATUS_EXEC_FILTROS.map(({ label, valor }) => (
                    <label key={valor} className="flex items-center gap-3 group cursor-pointer">
                      <div 
                        onClick={() => toggleFiltroStatusExec(valor)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          filtrosStatusExec.includes(valor) ? 'bg-brand-blue border-brand-blue' : 'bg-brand-dark-5 border-brand-dark-5 group-hover:border-brand-metal'
                        }`}
                      >
                        {filtrosStatusExec.includes(valor) && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${filtrosStatusExec.includes(valor) ? 'text-brand-blue-light' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status GRU */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Status da GRU (Taxa PF)
                </p>
                <div className="flex flex-col gap-2">
                  {['Todos', 'Pagas', 'Pendentes'].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 group cursor-pointer">
                      <input
                        type="radio"
                        name="filtroGru"
                        className="hidden"
                        checked={filtroGru === opt}
                        onChange={() => setFiltroGru(opt as any)}
                      />
                      <div 
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          filtroGru === opt ? 'bg-brand-blue border-brand-blue' : 'bg-brand-dark-5 border-brand-dark-5 group-hover:border-brand-metal'
                        }`}
                      >
                        {filtroGru === opt && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${filtroGru === opt ? 'text-brand-blue-light' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
                
                <div className="pt-4 mt-2">
                  <button 
                    onClick={limparFiltros}
                    className="text-[10px] font-bold text-red-400/70 hover:text-red-400 underline underline-offset-4 uppercase tracking-wider transition-all"
                  >
                    Resetar Todos os Filtros
                  </button>
                </div>
              </div>

              {/* Serviços */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                  Serviços
                  {filtrosServico.length > 0 && (
                    <button onClick={() => setFiltrosServico([])} className="text-brand-blue hover:text-white transition-colors">Limpar</button>
                  )}
                </p>
                <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-dark-5 scrollbar-track-transparent">
                  {servicos.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 group cursor-pointer">
                      <div 
                        onClick={() => toggleFiltroServico(s.nome)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                          filtrosServico.includes(s.nome) ? 'bg-brand-blue border-brand-blue' : 'bg-brand-dark-5 border-brand-dark-5 group-hover:border-brand-metal'
                        }`}
                      >
                        {filtrosServico.includes(s.nome) && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className={`text-xs font-semibold truncate transition-colors ${filtrosServico.includes(s.nome) ? 'text-brand-blue-light' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {s.nome}
                      </span>
                    </label>
                  ))}
                  {servicos.length === 0 && (
                    <p className="text-[10px] text-gray-600 italic">Nenhum serviço configurado</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Lista ── */}
      {ordensFiltradas.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-full bg-brand-dark-5 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-400 font-medium">Nenhuma OS encontrada</p>
          <p className="text-sm text-gray-500 mt-1">
            {busca || filtrosStatus.length > 0 || filtrosStatusExec.length > 0 || filtroGru !== 'Todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Clique em "Nova OS" para criar a primeira ordem'}
          </p>
          {!busca && filtrosStatus.length === 0 && filtrosStatusExec.length === 0 && filtroGru === 'Todos' && (
            <button onClick={() => navigate('/ordens/nova')} className="btn-primary mt-4 mx-auto">
              <Plus size={16} />
              Criar primeira OS
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {ordensFiltradas.map(ordem => (
            <div
              key={ordem.id}
              onClick={() => navigate(`/ordens/${ordem.id}`)}
              className="card-hover flex items-center gap-4"
            >
              {/* Número */}
              <div className="flex-shrink-0 w-14 text-center">
                <p className="text-xs text-gray-500">OS</p>
                <p className="text-base font-bold text-white">#{String(ordem.numero).padStart(4, '0')}</p>
                {ordem.migrado && (
                  <span className="text-[8px] font-black text-brand-blue-light border border-brand-blue/30 px-1 rounded-sm mt-1 inline-block uppercase tracking-tighter shadow-[0_0_5px_rgba(45,141,224,0.1)]">Histórico</span>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-brand-dark-5 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white leading-tight">{ordem.nomeCliente}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{ordem.servicos ? ordem.servicos.map((s: any) => s.nome).join(', ') : (ordem as any).servico}</p>
                
                {/* Status de Execução Compacto */}
                <div className="mt-2 flex flex-col gap-1.5">
                  {ordem.servicos && ordem.servicos.length > 0 ? (
                    (() => {
                      const resumo = obterResumoExecucao(ordem.servicos);
                      if (!resumo) return null;

                      if (resumo.tipo === 'unificado') {
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider w-fit shadow-sm ${resumo.classe}`}>
                            <span>{resumo.icone}</span>
                            <span>{resumo.texto}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-1 w-full max-w-[140px]">
                          <div className="flex items-center justify-between gap-2">
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                              {resumo.texto}
                            </span>
                            <span className="text-[9px] font-bold text-brand-blue-light">{resumo.progresso}%</span>
                          </div>
                          <div className="w-full h-1 bg-brand-dark-5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-brand-blue transition-all duration-500 shadow-[0_0_8px_rgba(45,141,224,0.4)]"
                              style={{ width: `${resumo.progresso}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter italic">Sem serviços</span>
                  )}
                </div>
              </div>

              {/* Valor e Status */}
              <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
                <p className={`text-sm font-bold ${ordem.status === 'Pago' ? 'text-brand-green' : 'text-white'}`}>{formatarMoeda(ordem.valor)}</p>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-sm border ${classeStatus(ordem.status)}`}>
                  {ordem.status}
                </span>
                {ordem.status === 'Parcialmente Pago' && (
                  <p className="text-[8px] font-bold text-orange-400 uppercase">Falta {formatarMoeda(ordem.valor - (ordem.valorPago || 0))}</p>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmandoDelete(ordem.id);
                  }}
                  className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Excluir O.S."
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
      <Notificacao {...notif} onFechar={fechar} />
      
      <DialogConfirmacao
        aberto={!!confirmandoDelete}
        titulo="Excluir Ordem de Serviço"
        mensagem="Tem certeza que deseja excluir esta O.S.? Esta ação não pode ser desfeita."
        textoBotaoConfirmar="Sim, excluir"
        onConfirmar={handleDeletar}
        onCancelar={() => setConfirmandoDelete(null)}
      />
    </div>
  );
}
