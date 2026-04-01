import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgendamentos } from '../../context/AgendamentosContext';
import { useAuth } from '../../context/AuthContext';
import { CardAgendamento } from './CardAgendamento';
import { FormularioAgendamento } from './FormularioAgendamento';
import { ModalConfirmacaoAgendamento } from './ModalConfirmacaoAgendamento';
import { Plus, Search, Calendar, ArrowLeft } from 'lucide-react';
import { Agendamento, TipoAgendamento } from '../../types';

export function ListaAgendamentos() {
  const { usuario } = useAuth();
  const location = useLocation();
  const { agendamentos, estaCarregando } = useAgendamentos();
  
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'pendente' | 'realizado'>('pendente');
  const [filtroTipo, setFiltroTipo] = useState<TipoAgendamento | 'Todos'>('Todos');
  const [modo, setModo] = useState<'lista' | 'novo' | 'editar'>('lista');
  const [agendamentoEditando, setAgendamentoEditando] = useState<Agendamento | null>(null);
  const [agendamentoVisualizando, setAgendamentoVisualizando] = useState<Agendamento | null>(null);
  
  // Se vier do perfil do cliente, abre o formulário automático
  useEffect(() => {
    const state = location.state as { clientePreDefinido?: any };
    if (state?.clientePreDefinido) {
      setModo('novo');
    }
  }, [location]);

  const agendamentosFiltrados = (agendamentos || []).filter(a => {
    const matchBusca = a.clienteNome.toLowerCase().includes(busca.toLowerCase()) || 
                       a.clienteCPF.includes(busca);
    
    if (a.status !== statusFiltro) return false;

    const matchTipo = filtroTipo === 'Todos' || a.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  if (modo === 'novo' || modo === 'editar') {
    return (
      <div className="max-w-2xl mx-auto py-2">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setModo('lista')}
            className="p-3 bg-brand-dark-3 text-gray-400 hover:text-white hover:bg-brand-dark-4 rounded-xl transition-all border border-brand-dark-5"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              {modo === 'novo' ? 'Novo Agendamento' : 'Editar Agendamento'}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5 font-medium uppercase tracking-wider">
              {modo === 'novo' ? 'Preencha os detalhes do laudo' : 'Atualize as informações do agendamento'}
            </p>
          </div>
        </div>
        <FormularioAgendamento 
          agendamentoExistente={agendamentoEditando || undefined}
          onSuccess={() => setModo('lista')}
          onCancel={() => setModo('lista')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-brand-blue" size={28} />
            Agendamentos de Laudos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seus laudos e facilite a comunicação com clientes</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setAgendamentoEditando(null); setModo('novo'); }}
            className="btn-primary shadow-lg shadow-brand-blue/20 px-6 py-3 h-12 flex items-center gap-2"
          >
            <Plus size={20} /> Novo Agendamento
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex bg-brand-dark-2 p-1 rounded-2xl border border-brand-dark-5 w-fit">
          <button 
            onClick={() => setStatusFiltro('pendente')}
            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all ${
              statusFiltro === 'pendente' 
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Agendamentos
          </button>
          <button 
            onClick={() => setStatusFiltro('realizado')}
            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all ${
              statusFiltro === 'realizado' 
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Histórico
          </button>
        </div>
        
        <div className="relative flex-1 w-full flex items-center bg-brand-dark-2 p-1 rounded-2xl border border-brand-dark-5 shadow-lg">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..."
              className="input pl-10 h-11 bg-transparent border-none"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 pr-2">
            <div className="w-[1px] h-6 bg-brand-dark-5 mx-2" />
            {(['Todos', 'Psicológico', 'Tiro'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase transition-all ${
                  filtroTipo === t 
                    ? 'bg-brand-dark-4 text-brand-blue-light border border-brand-blue/20' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {estaCarregando ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium animate-pulse">Carregando agendamentos...</p>
        </div>
      ) : agendamentosFiltrados.length === 0 ? (
        <div className="bg-brand-dark-2 border-2 border-brand-dark-5 border-dashed rounded-3xl py-24 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 bg-brand-dark-3 rounded-full flex items-center justify-center mb-6 border border-brand-dark-5">
            <Calendar size={32} className="text-gray-600" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Nenhum agendamento encontrado</h3>
          <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
            {busca || filtroTipo !== 'Todos' 
              ? 'Não encontramos nenhum registro para os filtros aplicados.' 
              : 'Você ainda não registrou nenhum agendamento de laudo. Comece agora para manter o controle total.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Coluna: Laudos de Tiro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="w-2 h-6 bg-orange-500 rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Laudo de Tiro</h2>
              <span className="ml-auto bg-brand-dark-3 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 border border-brand-dark-5">
                {agendamentosFiltrados.filter(a => a.tipo === 'Tiro').length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agendamentosFiltrados.filter(a => a.tipo === 'Tiro').map(a => (
                <CardAgendamento 
                  key={a.id} 
                  agendamento={a} 
                  onEdit={a => { setAgendamentoEditando(a); setModo('editar'); }}
                  onView={a => setAgendamentoVisualizando(a)}
                />
              ))}
              {agendamentosFiltrados.filter(a => a.tipo === 'Tiro').length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-brand-dark-2/50 border border-dashed border-brand-dark-5 rounded-2xl">
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-tighter">Sem agendamentos de tiro</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna: Laudos Psicológicos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="w-2 h-6 bg-purple-500 rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Laudo Psicológico</h2>
              <span className="ml-auto bg-brand-dark-3 px-2 py-0.5 rounded text-[10px] font-bold text-gray-500 border border-brand-dark-5">
                {agendamentosFiltrados.filter(a => a.tipo === 'Psicológico').length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agendamentosFiltrados.filter(a => a.tipo === 'Psicológico').map(a => (
                <CardAgendamento 
                  key={a.id} 
                  agendamento={a} 
                  onEdit={a => { setAgendamentoEditando(a); setModo('editar'); }}
                  onView={a => setAgendamentoVisualizando(a)}
                />
              ))}
              {agendamentosFiltrados.filter(a => a.tipo === 'Psicológico').length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-brand-dark-2/50 border border-dashed border-brand-dark-5 rounded-2xl">
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-tighter">Sem agendamentos psicológicos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {agendamentoVisualizando && (
        <ModalConfirmacaoAgendamento 
          agendamento={agendamentoVisualizando} 
          onClose={() => setAgendamentoVisualizando(null)} 
        />
      )}
    </div>
  );
}
