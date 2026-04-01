import React from 'react';
import { Agendamento } from '../../types';
import { formatarDataParaWhatsApp } from '../../utils/agendamentoFormatador';
import { MapPin, User, Phone, Crosshair, Calendar, Clock, CheckCircle, Circle, Trash2, Edit2, Eye, Users } from 'lucide-react';
import { useAgendamentos } from '../../context/AgendamentosContext';
import { useAuth } from '../../context/AuthContext';

interface CardAgendamentoProps {
  agendamento: Agendamento;
  onEdit: (a: Agendamento) => void;
  onView: (a: Agendamento) => void;
}

export function CardAgendamento({ agendamento, onEdit, onView }: CardAgendamentoProps) {
  const { usuario } = useAuth();
  const { confirmarAgendamento, finalizarLaudo, deletarAgendamento } = useAgendamentos();

  const handleToggleConfirmar = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmarAgendamento(agendamento.id, !agendamento.confirmado);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      deletarAgendamento(agendamento.id);
    }
  };

  return (
    <div 
      onClick={() => onView(agendamento)}
      className={`bg-brand-dark-2 border p-3 rounded-xl cursor-pointer transition-all hover:border-brand-blue/50 ${
        agendamento.confirmado ? 'border-brand-green/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]' : 'border-brand-dark-5'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
            agendamento.tipo === 'Psicológico' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {agendamento.tipo}
          </div>
          {agendamento.confirmado ? (
            <span className="flex items-center gap-1 text-brand-green text-[9px] font-bold">
              <CheckCircle size={10} /> OK
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-500 text-[9px] font-bold">
              <Circle size={10} /> AG.
            </span>
          ) }
        </div>
        
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={handleToggleConfirmar} className={`p-1 rounded-lg ${agendamento.confirmado ? 'text-brand-green' : 'text-gray-500'}`}>
            <CheckCircle size={14} />
          </button>
          <button onClick={() => onEdit(agendamento)} className="p-1 text-gray-400 hover:text-white">
            <Edit2 size={13} />
          </button>
          <button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mb-2">
        <h3 className="font-bold text-white text-sm truncate leading-tight">{agendamento.clienteNome}</h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
          <span className="flex items-center gap-1"><Calendar size={10} className="text-brand-blue" /> {formatarDataParaWhatsApp(agendamento.data).split(' ')[0]}</span>
          <span className="flex items-center gap-1"><Clock size={10} className="text-brand-blue" /> {agendamento.horario}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] border-t border-brand-dark-5/50 pt-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={10} className="text-brand-blue flex-shrink-0" />
          <span className="text-gray-400 truncate">{agendamento.local}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <User size={10} className="text-brand-blue flex-shrink-0" />
          <span className="text-gray-400 truncate">{agendamento.profissional}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Crosshair size={10} className="text-brand-blue flex-shrink-0" />
          <span className="text-gray-400 truncate">{agendamento.arma}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <Users size={10} className="text-brand-green flex-shrink-0" />
          <span className="text-gray-400 truncate text-[9px] uppercase">{agendamento.despachante}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-brand-dark-3 -mx-3 -mb-3 p-2 rounded-b-xl border-t border-brand-dark-5">
        <span className="text-brand-blue-light font-black text-xs">
          {agendamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>

        <div className="flex gap-2">
          {agendamento.status === 'pendente' && (
            <button 
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Marcar este laudo como realizado?')) finalizarLaudo(agendamento.id); }}
              className="px-2 py-1 bg-brand-green/20 text-brand-green-light border border-brand-green/30 rounded text-[9px] font-black uppercase hover:bg-brand-green/30 transition-all"
            >
              Finalizar
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onView(agendamento); }}
            className="text-[9px] text-brand-blue hover:text-brand-blue-light font-black uppercase"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
