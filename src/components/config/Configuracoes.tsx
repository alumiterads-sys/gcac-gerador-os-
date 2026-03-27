import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStatusConexao } from '../../hooks/useStatusConexao';
import { useOrdens } from '../../context/OrdensContext';
import { useServicos } from '../../context/ServicosContext';
import { sincronizarPendentes } from '../../services/driveSync';
import { LogOut, Cloud, RefreshCw, User, Wifi, WifiOff, ShieldCheck, Plus, Settings2, Edit2, Trash2, BadgeDollarSign } from 'lucide-react';
import { Notificacao, useNotificacao } from '../common/Notificacao';
import { ModalServico } from './ModalServico';
import { formatarMoeda } from '../../utils/formatters';
import { ServicoConfig } from '../../types';

export function Configuracoes() {
  const { usuario, logout } = useAuth();
  const { ordens } = useOrdens();
  const { servicos, deletarServico } = useServicos();
  const itensFila = ordens.filter(o => o.pendenteSincronizacao).length;
  
  const online = useStatusConexao();
  const navigate = useNavigate();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [sincronizando, setSincronizando] = useState(false);
  
  // Controle de Modal de Serviços
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<ServicoConfig | null>(null);

  const handleSincronizarTudo = async () => {
    if (!online || !usuario) {
      mostrar('aviso', 'Você precisa estar online e logado para sincronizar.');
      return;
    }
    setSincronizando(true);
    try {
      const { ok, erro } = await sincronizarPendentes();
      if (erro === 0) {
        mostrar('sucesso', `${ok} OS enviadas pro Google Drive com sucesso!`);
      } else {
        mostrar('aviso', `${ok} sincronizadas, ${erro} com falha.`);
      }
    } finally {
      setSincronizando(false);
    }
  };

  const handleExcluirServico = async (s: ServicoConfig) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${s.nome}"?`)) {
      try {
        await deletarServico(s.id);
        mostrar('sucesso', 'Serviço excluído com sucesso.');
      } catch {
        mostrar('erro', 'Erro ao excluir serviço.');
      }
    }
  };

  const abrirNovoServico = () => {
    setServicoEditando(null);
    setModalAberto(true);
  };

  const abrirEditarServico = (s: ServicoConfig) => {
    setServicoEditando(s);
    setModalAberto(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Configurações e Serviços</h1>

      {/* ── Gerenciador de Serviços ── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Settings2 size={14} />
            Gerenciar Serviços e Taxas
          </h2>
          <button onClick={abrirNovoServico} className="btn-primary btn-sm px-3">
            <Plus size={14} /> Novo Serviço
          </button>
        </div>

        {servicos.length === 0 ? (
          <div className="text-center py-8 bg-brand-dark-4 border border-brand-dark-5 rounded-xl">
            <p className="text-sm text-gray-500">Nenhum serviço cadastrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500 text-xs uppercase bg-brand-dark-3/50">
                <tr>
                  <th className="px-3 py-2 font-bold">Serviço</th>
                  <th className="px-3 py-2 font-bold whitespace-nowrap">Preço Padrão</th>
                  <th className="px-3 py-2 font-bold text-brand-blue-light">Filiado</th>
                  <th className="px-3 py-2 font-bold text-yellow-500/80">Taxa PF</th>
                  <th className="px-3 py-2 font-bold text-brand-blue-light/80">Lucro Real</th>
                  <th className="px-3 py-2 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark-5">
                {servicos.map(s => (
                  <tr key={s.id} className="hover:bg-brand-dark-4 transition-colors">
                    <td className="px-3 py-3 font-medium text-white min-w-[180px] leading-tight py-4">{s.nome}</td>
                    <td className="px-3 py-3 text-brand-green font-bold">{formatarMoeda(s.valorPadrao)}</td>
                    <td className="px-3 py-3 text-brand-blue-light font-bold">{formatarMoeda(s.valorFiliado || 0)}</td>
                    <td className="px-3 py-3 text-yellow-400/80">{formatarMoeda(s.taxaPF)}</td>
                    <td className="px-3 py-3 text-brand-blue-light/90 font-semibold">{formatarMoeda(s.valorPadrao - s.taxaPF)}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => abrirEditarServico(s)} className="p-1.5 text-gray-400 hover:text-brand-blue-light">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleExcluirServico(s)} className="p-1.5 text-gray-400 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="bg-brand-dark-4 rounded-lg p-3 flex gap-2 border border-brand-dark-5">
          <BadgeDollarSign size={16} className="text-brand-green/70 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Configure o **Valor de Venda** sugerido e a **Taxa PF** interna. O valor da taxa será subtraído do bruto no Painel para mostrar seu **Lucro Real**.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* ── Conta Google ── */}
        <div className="card space-y-4 h-fit">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <User size={14} />
            Conta Google
          </h2>

          {usuario ? (
            <div className="flex items-center gap-3">
              <img src={usuario.fotoPerfil} alt={usuario.nome} className="w-10 h-10 rounded-full border border-brand-blue/30" />
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-white truncate">{usuario.nome}</p>
                <p className="text-xs text-gray-400 truncate">{usuario.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhuma conta conectada</p>
          )}

          <div className={`flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg ${
            online ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                   : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {online ? <Wifi size={10} /> : <WifiOff size={10} />}
            {online ? 'Online' : 'Offline'}
          </div>

          {usuario && (
            <button onClick={logout} className="btn-danger btn-sm w-full justify-center">
              <LogOut size={14} /> Sair
            </button>
          )}
        </div>

        {/* ── Sincronização ── */}
        <div className="card space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Cloud size={14} />
            Backup Drive
          </h2>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-brand-dark-4 rounded-lg p-2.5">
              <p className="text-xl font-black text-white">{ordens.length}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">Total OS</p>
            </div>
            <div className="bg-brand-dark-4 rounded-lg p-2.5">
              <p className="text-xl font-black text-yellow-400">{itensFila}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">Pendentes</p>
            </div>
          </div>

          <button
            onClick={handleSincronizarTudo}
            disabled={sincronizando || !online || !usuario || itensFila === 0}
            className="btn-primary w-full justify-center btn-sm"
          >
            <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
            {sincronizando ? 'Sincronizando...' : 'Fazer Backup'}
          </button>

          <p className="text-[10px] text-gray-600 flex items-start gap-1.5">
            <ShieldCheck size={10} className="text-brand-green shrink-0 mt-0.5" />
            Backup automático ativo via GCAC_OS_Sync/
          </p>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-600 pb-2 uppercase tracking-widest">
        v3.0 — Gestão Financeira Completa
      </div>

      <ModalServico 
        aberto={modalAberto} 
        fechar={() => setModalAberto(false)} 
        servicoParaEditar={servicoEditando} 
      />
      <Notificacao {...notif} onFechar={fechar} />
    </div>
  );
}
