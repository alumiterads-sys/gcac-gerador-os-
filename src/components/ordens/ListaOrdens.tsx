import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight, FileText } from 'lucide-react';
import { useOrdens } from '../../context/OrdensContext';
import { StatusOS } from '../../types';
import { formatarMoeda, formatarData, formatarNumeroOS, classeStatus, classeStatusExecucao, iconeStatusExecucao, obterResumoExecucao } from '../../utils/formatters';

const STATUS_FILTROS: { label: string; valor: StatusOS | 'Todos' }[] = [
  { label: 'Todas',              valor: 'Todos' },
  { label: 'Aguardando',         valor: 'Aguardando Pagamento' },
  { label: 'Gratuidade',         valor: 'Gratuidade' },
  { label: 'Pagas',              valor: 'Pago' },
];

export function ListaOrdens() {
  const navigate = useNavigate();
  const { ordens } = useOrdens();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusOS | 'Todos'>('Todos');

  const ordensFiltradas = ordens.filter(o => {
    const matchBusca = !busca || [o.nomeCliente, o.cpf, o.servicos ? o.servicos.map(s => s.nome).join(' ') : (o as any).servico, String(o.numero)]
      .some(v => v.toLowerCase().includes(busca.toLowerCase()));
    const matchStatus = filtroStatus === 'Todos' || o.status === filtroStatus;
    return matchBusca && matchStatus;
  });

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

      {/* ── Busca e Filtros ── */}
      <div className="card space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar por nome, CPF, número ou serviço..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTROS.map(({ label, valor }) => (
            <button
              key={valor}
              onClick={() => setFiltroStatus(valor)}
              className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
                filtroStatus === valor
                  ? 'bg-brand-blue text-white'
                  : 'bg-brand-dark-5 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      {ordensFiltradas.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-full bg-brand-dark-5 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-400 font-medium">Nenhuma OS encontrada</p>
          <p className="text-sm text-gray-500 mt-1">
            {busca || filtroStatus !== 'Todos'
              ? 'Tente ajustar os filtros de busca'
              : 'Clique em "Nova OS" para criar a primeira ordem'}
          </p>
          {!busca && filtroStatus === 'Todos' && (
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
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-brand-dark-5 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate leading-tight">{ordem.nomeCliente}</p>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">{ordem.servicos ? ordem.servicos.map((s: any) => s.nome).join(', ') : (ordem as any).servico}</p>
                
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
              <div className="flex-shrink-0 text-right space-y-1">
                <p className="text-sm font-bold text-brand-green">{formatarMoeda(ordem.valor)}</p>
                <span className={classeStatus(ordem.status)}>{ordem.status}</span>
              </div>

              {/* Seta */}
              <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
