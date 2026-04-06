import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Plus, Clock, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useLembretes } from '../../context/LembretesContext';
import { formatarData } from '../../utils/formatters';

export function WidgetLembretes() {
  const navigate = useNavigate();
  const { lembretes, marcarConcluido } = useLembretes();
  
  const hoje = new Date().toISOString().split('T')[0];
  const tarefasHoje = lembretes
    .filter(l => l.data === hoje && !l.concluido)
    .slice(0, 4);

  const totalHoje = lembretes.filter(l => l.data === hoje && !l.concluido).length;

  if (totalHoje === 0) return null;

  return (
    <div className="card bg-brand-dark-3/30 border-brand-blue/20 hover:border-brand-blue/40 transition-all group p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/20 flex items-center justify-center text-brand-blue-light">
            <ListTodo size={18} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Tarefas para Hoje</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{totalHoje} pendentes</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/agenda')}
          className="p-1 px-2 text-[10px] font-black uppercase text-brand-blue-light hover:text-white transition-colors flex items-center gap-1"
        >
          Ver Agenda <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-2">
        {tarefasHoje.map(l => (
          <div key={l.id} className="flex items-center justify-between bg-brand-dark-4 p-2.5 rounded-xl border border-white/5 hover:border-brand-blue/30 transition-all group/item">
            <div className="flex items-center gap-3 overflow-hidden">
              <button 
                onClick={() => marcarConcluido(l.id, true)}
                className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-gray-600 hover:border-brand-green hover:text-brand-green transition-all shrink-0"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-brand-green opacity-0 group-hover/item:opacity-30" />
              </button>
              <div className="truncate">
                <p className="text-[11px] font-bold text-white truncate">{l.titulo}</p>
                {l.horario && <p className="text-[9px] text-gray-500 font-bold">{l.horario}</p>}
              </div>
            </div>
            {l.prioridade === 'alta' && <AlertCircle size={12} className="text-red-500 animate-pulse shrink-0" />}
          </div>
        ))}
        {totalHoje > 4 && (
          <p className="text-[10px] text-center text-gray-500 pt-2">+ {totalHoje - 4} outras tarefas agendadas</p>
        )}
      </div>

      <button 
        onClick={() => navigate('/agenda')}
        className="w-full mt-4 py-2 bg-brand-blue/10 border border-brand-blue/20 rounded-xl text-[10px] font-black uppercase text-brand-blue-light hover:bg-brand-blue hover:text-white transition-all shadow-lg"
      >
        Acessar Agenda Completa
      </button>
    </div>
  );
}
