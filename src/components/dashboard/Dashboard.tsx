import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Gift, Plus, ChevronRight, Loader, Receipt, XCircle } from 'lucide-react';
import { useOrdens } from '../../context/OrdensContext';
import { useOrcamentos } from '../../context/OrcamentosContext';
import { formatarMoeda, formatarData, formatarNumeroOS, classeStatus, classeStatusOrcamento } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useStatusConexao } from '../../hooks/useStatusConexao';
import { BriefingDiario } from './BriefingDiario';

export function Dashboard() {
  const navigate = useNavigate();
  const { ordens, itensFila } = useOrdens();
  const { orcamentos } = useOrcamentos();
  const { usuario } = useAuth();
  const online = useStatusConexao();

  const stats = {
    total:       ordens.length,
    aguardando:  ordens.filter(o => o.status === 'Aguardando Pagamento').length,
    gratuidade:  ordens.filter(o => o.status === 'Gratuidade').length,
    pagas:       ordens.filter(o => o.status === 'Pago').length,
    receita:     ordens.filter(o => o.status === 'Pago').reduce((s, o) => s + o.valor, 0),
    taxas:       ordens.filter(o => o.status === 'Pago').reduce((s, o) => s + (o.taxaPFTotal || 0), 0),
    receitaTotal: ordens.reduce((s, o) => s + o.valor, 0),
  };

  const lucroReal = stats.receita - stats.taxas;

  const orcStats = {
    total:       orcamentos.length,
    pendente:    orcamentos.filter(o => o.status === 'Pendente').length,
    aprovado:    orcamentos.filter(o => o.status === 'Aprovado').length,
    recusado:    orcamentos.filter(o => o.status === 'Recusado').length,
  };

  const recentes = [...ordens].slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <BriefingDiario />
      {/* ── Saudação ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Olá{usuario ? `, ${usuario.nome.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={online ? 'dot-online' : 'dot-offline'} />
          <span className={`text-xs font-medium ${online ? 'text-brand-green' : 'text-red-400'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
          {itensFila > 0 && (
            <span className="ml-2 badge badge-andamento">
              <Loader size={10} className="animate-spin" />
              {itensFila} pendente{itensFila > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Cards de Estatísticas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          titulo="Total de OS"
          valor={stats.total}
          icone={<FileText size={20} className="text-brand-blue-light" />}
          cor="blue"
          onClick={() => navigate('/ordens')}
        />
        <StatCard
          titulo="Aguardando"
          valor={stats.aguardando}
          icone={<Clock size={20} className="text-yellow-400" />}
          cor="yellow"
          onClick={() => navigate('/ordens')}
        />
        <StatCard
          titulo="Pagas"
          valor={stats.pagas}
          icone={<CheckCircle size={20} className="text-brand-green" />}
          cor="green"
          onClick={() => navigate('/ordens')}
        />
        <StatCard
          titulo="Gratuidades"
          valor={stats.gratuidade}
          icone={<Gift size={20} className="text-brand-blue-light" />}
          cor="blue"
          onClick={() => navigate('/ordens')}
        />
      </div>

      {/* ── Banner de Receita e Lucro ── */}
      <div className="card bg-gradient-to-br from-brand-dark-3 to-brand-dark-2 border border-brand-dark-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="flex flex-col md:flex-row items-stretch gap-6 relative z-10">
          {/* Lucro Real - Principal */}
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Lucro Real Estimado (Líquido)</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-white">{formatarMoeda(lucroReal)}</p>
              <span className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                {stats.receita > 0 ? ((lucroReal / stats.receita) * 100).toFixed(0) : 0}% de margem
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">Reflete o faturamento das OS pagas menos as taxas da PF cadastradas.</p>
          </div>

          <div className="hidden md:block w-px bg-brand-dark-5" />

          {/* Breakdown Lateral */}
          <div className="grid grid-cols-2 md:block gap-4 md:space-y-4 min-w-[180px]">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Faturamento Bruto</p>
              <p className="text-lg font-bold text-brand-green-light">{formatarMoeda(stats.receita)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Taxas PF</p>
              <p className="text-lg font-bold text-yellow-500/80">{formatarMoeda(stats.taxas)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Resumo de Orçamentos ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt size={18} className="text-yellow-500" />
            Resumo de Orçamentos
          </h2>
          <button onClick={() => navigate('/orcamentos')} className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors">
            Ver orçamentos →
          </button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            titulo="Total Emitidos"
            valor={orcStats.total}
            icone={<Receipt size={20} className="text-brand-blue-light" />}
            cor="blue"
            onClick={() => navigate('/orcamentos')}
          />
          <StatCard
            titulo="Aguardando Aprovação"
            valor={orcStats.pendente}
            icone={<Clock size={20} className="text-yellow-400" />}
            cor="yellow"
            onClick={() => navigate('/orcamentos')}
          />
          <StatCard
            titulo="Aprovados (Convertidos)"
            valor={orcStats.aprovado}
            icone={<CheckCircle size={20} className="text-brand-green" />}
            cor="green"
            onClick={() => navigate('/orcamentos')}
          />
          <StatCard
            titulo="Recusados"
            valor={orcStats.recusado}
            icone={<XCircle size={20} className="text-red-400" />}
            cor="red"
            onClick={() => navigate('/orcamentos')}
          />
        </div>
      </div>

      {/* ── Ordens Recentes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Ordens Recentes</h2>
          <button onClick={() => navigate('/ordens')} className="text-sm text-brand-blue-light hover:text-white transition-colors">
            Ver todas →
          </button>
        </div>

        {recentes.length === 0 ? (
          <div className="card text-center py-10">
            <FileText size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">Nenhuma OS criada ainda</p>
            <button onClick={() => navigate('/ordens/nova')} className="btn-primary mx-auto">
              <Plus size={16} />
              Criar primeira OS
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentes.map(ordem => (
              <div
                key={ordem.id}
                onClick={() => navigate(`/ordens/${ordem.id}`)}
                className="card-hover flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-12 text-center">
                  <p className="text-xs text-gray-500 leading-none">OS</p>
                  <p className="text-sm font-bold text-white">#{String(ordem.numero).padStart(4, '0')}</p>
                </div>
                <div className="w-px h-8 bg-brand-dark-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{ordem.nomeCliente}</p>
                  <p className="text-xs text-gray-400">{formatarData(ordem.criadoEm)}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-green">{formatarMoeda(ordem.valor)}</span>
                  <span className={classeStatus(ordem.status)}>{ordem.status}</span>
                  <ChevronRight size={14} className="text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Botão de Nova OS ── */}
      <button
        onClick={() => navigate('/ordens/nova')}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full btn-primary shadow-2xl shadow-brand-blue/30 text-xl z-30"
        id="fab-nova-os"
        title="Nova OS"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

function StatCard({
  titulo, valor, icone, cor, onClick, grande = false,
}: {
  titulo: string;
  valor: string | number;
  icone: React.ReactNode;
  cor: 'blue' | 'green' | 'yellow' | 'red';
  onClick?: () => void;
  grande?: boolean;
}) {
  const cores = {
    blue:    'bg-brand-blue/10 border-brand-blue/20',
    green:   'bg-brand-green/10 border-brand-green/20',
    yellow:  'bg-yellow-500/10 border-yellow-500/20',
    red:     'bg-red-500/10 border-red-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`card ${cores[cor]} ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''} transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>{icone}</div>
        {onClick && <ChevronRight size={14} className="text-gray-600" />}
      </div>
      <p className={`font-black text-white ${grande ? 'text-xl' : 'text-3xl'}`}>{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{titulo}</p>
    </div>
  );
}
