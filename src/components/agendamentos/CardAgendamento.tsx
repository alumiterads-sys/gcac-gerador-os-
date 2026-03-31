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
      className={`bg-brand-dark-2 border p-4 rounded-xl cursor-pointer transition-all hover:border-brand-blue/50 ${
        agendamento.confirmado ? 'border-brand-green/30 shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)]' : 'border-brand-dark-5'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
              agendamento.tipo === 'Psicológico' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {agendamento.tipo}
            </div>
            {agendamento.confirmado ? (
              <span className="flex items-center gap-1 text-brand-green text-[10px] font-bold">
                <CheckCircle size={12} /> CLIENTE OK
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-500 text-[10px] font-bold">
                <Circle size={12} /> AG. CLIENTE
              </span>
            ) }
            {agendamento.status === 'realizado' && (
              <span className="flex items-center gap-1 text-brand-blue-light text-[10px] font-black bg-brand-blue/10 px-2 py-1 rounded border border-brand-blue/20">
                <CheckCircle size={12} /> REALIZADO
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={handleToggleConfirmar}
            title={agendamento.confirmado ? "Marcar como pendente" : "Confirmar agendamento"}
            className={`p-1.5 rounded-lg transition-colors ${
              agendamento.confirmado ? 'text-brand-green hover:bg-brand-green/10' : 'text-gray-500 hover:bg-gray-700'
            }`}
          >
            <CheckCircle size={18} />
          </button>
          <button 
            onClick={() => onEdit(agendamento)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Editar agendamento"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
            title="Excluir agendamento"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <h3 className="font-bold text-white text-lg mb-1 truncate">{agendamento.clienteNome}</h3>
      <p className="text-gray-400 text-xs mb-4 flex items-center gap-1">
        <Phone size={12} className="text-brand-blue" /> {agendamento.clienteContato}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-brand-dark-3 p-2 rounded-lg border border-brand-dark-5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
            <Calendar size={10} /> Data
          </p>
          <p className="text-white text-xs font-medium">{formatarDataParaWhatsApp(agendamento.data).split(' ')[0]}</p>
        </div>
        <div className="bg-brand-dark-3 p-2 rounded-lg border border-brand-dark-5">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
            <Clock size={10} /> Horário
          </p>
          <p className="text-white text-xs font-medium">{agendamento.horario}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2 text-xs">
          <MapPin size={14} className="text-brand-blue flex-shrink-0 mt-0.5" />
          <span className="text-gray-300 line-clamp-1">{agendamento.local}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <User size={14} className="text-brand-blue flex-shrink-0" />
          <span className="text-gray-300">{agendamento.profissional}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Crosshair size={14} className="text-brand-blue flex-shrink-0" />
          <span className="text-gray-300">Arma: {agendamento.arma}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs border-t border-brand-dark-5 pt-2 mt-1">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-brand-green flex-shrink-0" />
            <span className="text-gray-300 text-[10px] font-bold uppercase tracking-tight">Despacho: {agendamento.despachante}</span>
          </div>
          {agendamento.enviadoPF && (
            <div className="flex items-center gap-1 bg-brand-blue/10 text-brand-blue-light px-1.5 py-0.5 rounded border border-brand-blue/20 animate-pulse">
              <CheckCircle size={10} />
              <span className="text-[8px] font-black uppercase">PF OK</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-brand-dark-5 flex justify-between items-center">
        <span className="text-brand-blue-light font-bold">
          {agendamento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>

        <div className="flex gap-2">
          {agendamento.status === 'pendente' && (
            <button 
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Marcar este laudo como realizado? Ele irá para o histórico.')) finalizarLaudo(agendamento.id); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand-green/20 text-brand-green-light border border-brand-green/30 rounded-lg text-[10px] font-black hover:bg-brand-green/30 transition-all"
            >
              <CheckCircle size={14} /> FINALIZAR
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onView(agendamento); }}
            className="text-[10px] text-brand-blue hover:text-brand-blue-light font-bold uppercase tracking-wider transition-colors px-2"
          >
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
}
