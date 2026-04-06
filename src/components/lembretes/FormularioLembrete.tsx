import React, { useState } from 'react';
import { X, Calendar, Clock, AlertCircle, User } from 'lucide-react';
import { useLembretes } from '../../context/LembretesContext';
import { useClientes } from '../../context/ClientesContext';
import { Modal } from '../common/Modal';

interface FormularioLembreteProps {
  aberto: boolean;
  onClose: () => void;
  lembreteEdicao?: any;
}

export function FormularioLembrete({ aberto, onClose, lembreteEdicao }: FormularioLembreteProps) {
  const { criarLembrete, atualizarLembrete } = useLembretes();
  const { clientes } = useClientes();
  
  const [titulo, setTitulo] = useState(lembreteEdicao?.titulo || '');
  const [descricao, setDescricao] = useState(lembreteEdicao?.descricao || '');
  const [data, setData] = useState(lembreteEdicao?.data || new Date(Date.now() + 86400000).toISOString().split('T')[0]); // Default: Amanhã
  const [horario, setHorario] = useState(lembreteEdicao?.horario || '');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>(lembreteEdicao?.prioridade || 'media');
  const [clienteId, setClienteId] = useState(lembreteEdicao?.clienteId || '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !data) return;

    setEnviando(true);
    try {
      const clienteNome = clientes.find(c => c.id === clienteId)?.nome;
      
      const dados = {
        titulo,
        descricao,
        data,
        horario: horario || undefined,
        prioridade,
        clienteId: clienteId || undefined,
        clienteNome
      };

      if (lembreteEdicao) {
        await atualizarLembrete(lembreteEdicao.id, dados);
      } else {
        await criarLembrete(dados);
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar lembrete:', error);
      setErro(error.message || 'Erro ao salvar. Verifique sua conexão.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal aberto={aberto} onFechar={onClose} titulo={lembreteEdicao ? 'Editar Tarefa' : 'Nova Tarefa / Lembrete'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle size={14} />
            {erro}
          </div>
        )}
        {/* Título */}
        <div>
          <label className="label text-[10px] uppercase tracking-widest font-black text-gray-500 mb-1">O que precisa ser feito? *</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Ex: Mandar mensagem para o João"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="label text-[10px] uppercase tracking-widest font-black text-gray-500 mb-1">Detalhes (Opcional)</label>
          <textarea
            className="input w-full min-h-[80px] py-2"
            placeholder="Alguma observação importante..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Data */}
          <div>
            <label className="label text-[10px] uppercase tracking-widest font-black text-gray-500 mb-1 flex items-center gap-1">
              <Calendar size={10} /> Quando?
            </label>
            <input
              type="date"
              className="input w-full"
              value={data}
              onChange={e => setData(e.target.value)}
              required
            />
          </div>

          {/* Horário */}
          <div>
            <label className="label text-[10px] uppercase tracking-widest font-black text-gray-500 mb-1 flex items-center gap-1">
              <Clock size={10} /> Horário?
            </label>
            <input
              type="time"
              className="input w-full"
              value={horario}
              onChange={e => setHorario(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Prioridade */}
          <div>
            <label className="label text-[10px] uppercase tracking-widest font-black text-gray-500 mb-1 flex items-center gap-1">
              <AlertCircle size={10} /> Prioridade
            </label>
            <select
              className="input w-full"
              value={prioridade}
              onChange={e => setPrioridade(e.target.value as any)}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta 🔥</option>
            </select>
          </div>

          {/* Cliente vinculado */}
          <div>
            <label className="label text-[10px] uppercase tracking-widest font-black text-gray-500 mb-1 flex items-center gap-1">
              <User size={10} /> Vincular Cliente?
            </label>
            <select
              className="input w-full"
              value={clienteId}
              onChange={e => setClienteId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-dark-5 mt-6">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={enviando}>
            {enviando ? 'Salvando...' : lembreteEdicao ? 'Salvar Alterações' : 'Agendar Tarefa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
