import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../db/supabase';
import { useOrdens } from '../../context/OrdensContext';
import { useOrcamentos } from '../../context/OrcamentosContext';
import { useRecibos } from '../../context/RecibosContext';
import { isSameMonth, parseISO } from 'date-fns';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Receipt, 
  ClipboardCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import { formatarMoeda } from '../../utils/formatters';

interface RelatorioEquipeProps {
  dataFiltro: Date;
}

interface Usuario {
  id: string;
  nome: string;
}

export function RelatorioEquipe({ dataFiltro }: RelatorioEquipeProps) {
  const { ordens } = useOrdens();
  const { orcamentos } = useOrcamentos();
  const { recibos } = useRecibos();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<string>('Todos');

  useEffect(() => {
    const carregarUsuarios = async () => {
      const { data } = await supabase
        .from('usuarios_autorizados')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (data) setUsuarios(data);
    };
    carregarUsuarios();
  }, []);

  const stats = useMemo(() => {
    // Filtro por Mês
    const filtrosMes = {
      ordens: ordens.filter(o => isSameMonth(parseISO(o.criadoEm), dataFiltro)),
      orcamentos: orcamentos.filter(o => isSameMonth(parseISO(o.criadoEm), dataFiltro)),
      recibos: recibos.filter(r => isSameMonth(parseISO(r.criadoEm), dataFiltro)),
    };

    // Filtro por Colaborador (se selecionado)
    const filtrarPorNome = (lista: any[], campo: string) => {
      if (colaboradorSelecionado === 'Todos') return lista;
      return lista.filter(item => item[campo] === colaboradorSelecionado);
    };

    const osEmitidas = filtrarPorNome(filtrosMes.ordens, 'criadoPorNome');
    const osConcluidas = filtrarPorNome(filtrosMes.ordens, 'concluidoPorNome').filter(o => o.status === 'Pago');
    const orcamentosGerados = filtrarPorNome(filtrosMes.orcamentos, 'criadoPorNome');
    const recibosGerados = filtrarPorNome(filtrosMes.recibos, 'criadoPorNome');

    const volumeFinanceiro = osEmitidas.reduce((acc, o) => acc + (o.valor || 0), 0);
    const volumeConcluido = osConcluidas.reduce((acc, o) => acc + (o.valor || 0), 0);

    return {
      osEmitidas: osEmitidas.length,
      osConcluidas: osConcluidas.length,
      orcamentosGerados: orcamentosGerados.length,
      recibosGerados: recibosGerados.length,
      volumeFinanceiro,
      volumeConcluido
    };
  }, [ordens, orcamentos, recibos, dataFiltro, colaboradorSelecionado]);

  return (
    <div className="space-y-6">
      {/* Filtro de Colaborador */}
      <div className="flex items-center gap-3 bg-brand-dark-3 p-4 rounded-2xl border border-brand-dark-5">
        <Users size={20} className="text-brand-blue-light" />
        <div className="flex-1">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Filtrar por Colaborador</label>
          <select 
            className="bg-transparent text-white font-bold text-sm outline-none w-full cursor-pointer"
            value={colaboradorSelecionado}
            onChange={(e) => setColaboradorSelecionado(e.target.value)}
          >
            <option value="Todos" className="bg-brand-dark-2">Todos os Colaboradores</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.nome} className="bg-brand-dark-2">{u.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<FileText size={24} />} 
          label="OS Emitidas" 
          value={stats.osEmitidas} 
          subValue={`Vol: ${formatarMoeda(stats.volumeFinanceiro)}`}
          color="blue"
        />
        <StatCard 
          icon={<ClipboardCheck size={24} />} 
          label="OS Concluídas" 
          value={stats.osConcluidas} 
          subValue={`Vol: ${formatarMoeda(stats.volumeConcluido)}`}
          color="green"
        />
        <StatCard 
          icon={<Award size={24} />} 
          label="Orçamentos" 
          value={stats.orcamentosGerados} 
          color="purple"
        />
        <StatCard 
          icon={<Receipt size={24} />} 
          label="Recibos Emitidos" 
          value={stats.recibosGerados} 
          color="orange"
        />
      </div>

      {/* Comparativo Visual */}
      <div className="card border-dashed border-brand-dark-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-blue-light" />
            Funil de Conversão (Mês Selecionado)
          </h3>
          <span className="text-[10px] bg-brand-dark-4 px-2 py-1 rounded text-gray-400 font-bold uppercase tracking-wider">Métricas de Equipe</span>
        </div>

        <div className="space-y-4">
          <ProgressBar label="Emissão vs Conclusão" current={stats.osConcluidas} total={stats.osEmitidas} color="bg-brand-green" />
          <ProgressBar label="Orçamentos vs OS Geradas" current={stats.osEmitidas} total={stats.orcamentosGerados} color="bg-brand-blue" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color }: any) {
  const colors: any = {
    blue:   'text-brand-blue-light bg-brand-blue/10 border-brand-blue/20',
    green:  'text-brand-green bg-brand-green/10 border-brand-green/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
  };

  return (
    <div className={`card ${colors[color]} border transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-white">{value}</p>
            {subValue && <span className="text-[9px] text-gray-500 font-bold">{subValue}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, current, total, color }: any) {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-bold text-gray-400">{label}</span>
        <span className="text-xs font-black text-white">{percentage}%</span>
      </div>
      <div className="h-2 bg-brand-dark-5 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <div 
          className={`h-full ${color} transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
        <span>{current} concluídos</span>
        <span>{total} total</span>
      </div>
    </div>
  );
}
