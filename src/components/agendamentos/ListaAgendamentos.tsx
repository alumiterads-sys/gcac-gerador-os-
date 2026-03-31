import React, { useState } from 'react';
import { useAgendamentos } from '../../context/AgendamentosContext';
import { CardAgendamento } from './CardAgendamento';
import { FormularioAgendamento } from './FormularioAgendamento';
import { ModalConfirmacaoAgendamento } from './ModalConfirmacaoAgendamento';
import { Plus, Search, Calendar, Filter, X, ArrowLeft } from 'lucide-react';
import { Agendamento, TipoAgendamento } from '../../types';

export function ListaAgendamentos() {
  const { agendamentos, estaCarregando } = useAgendamentos();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoAgendamento | 'Todos'>('Todos');
  const [modo, setModo] = useState<'lista' | 'novo' | 'editar'>('lista');
  const [agendamentoEditando, setAgendamentoEditando] = useState<Agendamento | null>(null);
  const [agendamentoVisualizando, setAgendamentoVisualizando] = useState<Agendamento | null>(null);

  const agendamentosFiltrados = agendamentos.filter(a => {
    const matchBusca = a.clienteNome.toLowerCase().includes(busca.toLowerCase()) || 
                       a.clienteCPF.includes(busca);
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
        <button 
          onClick={() => { setAgendamentoEditando(null); setModo('novo'); }}
          className="btn-primary shadow-lg shadow-brand-blue/20 w-full sm:w-auto px-6 py-3 h-auto"
        >
          <Plus size={20} /> Novo Agendamento
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-brand-dark-2 p-4 rounded-2xl border border-brand-dark-5 shadow-lg shadow-black/20">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..."
            className="input pl-10 h-12 bg-brand-dark-3 border-transparent"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto h-12">
          <Filter size={16} className="text-gray-500" />
          <div className="flex bg-brand-dark-3 p-1 rounded-xl border border-brand-dark-5 flex-1 md:flex-none">
            {(['Todos', 'Psicológico', 'Tiro'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${
                  filtroTipo === t 
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20' 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agendamentosFiltrados.map(a => (
            <CardAgendamento 
              key={a.id} 
              agendamento={a} 
              onEdit={a => { setAgendamentoEditando(a); setModo('editar'); }}
              onView={a => setAgendamentoVisualizando(a)}
            />
          ))}
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
