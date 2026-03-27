import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStatusConexao } from '../../hooks/useStatusConexao';
import { useOrdens } from '../../context/OrdensContext';
import { sincronizarPendentes, deletarArquivosDrive } from '../../services/driveSync';
import { db } from '../../db/database';
import { LogOut, Cloud, Trash2, RefreshCw, User, Database, Wifi, WifiOff, ShieldCheck } from 'lucide-react';
import { DialogConfirmacao } from '../common/DialogConfirmacao';
import { Notificacao, useNotificacao } from '../common/Notificacao';

export function Configuracoes() {
  const { usuario, logout } = useAuth();
  const { ordens, itensFila } = useOrdens();
  const online = useStatusConexao();
  const navigate = useNavigate();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [confirmandoLimpar, setConfirmandoLimpar] = React.useState(false);
  const [sincronizando, setSincronizando] = React.useState(false);

  const handleSincronizarTudo = async () => {
    if (!online || !usuario) {
      mostrar('aviso', 'Você precisa estar online e logado para sincronizar.');
      return;
    }
    setSincronizando(true);
    try {
      const { ok, erro } = await sincronizarPendentes();
      if (erro === 0) {
        mostrar('sucesso', `${ok} OS sincronizadas com sucesso!`);
      } else {
        mostrar('aviso', `${ok} sincronizadas, ${erro} com falha.`);
      }
    } finally {
      setSincronizando(false);
    }
  };

  const handleLimparDados = async () => {
    await db.ordensDeServico.clear();
    await db.filaDeSincronizacao.clear();
    mostrar('sucesso', 'Dados locais limpos com sucesso.');
    setConfirmandoLimpar(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      {/* ── Conta Google ── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <User size={14} />
          Conta Google
        </h2>

        {usuario ? (
          <div className="flex items-center gap-3">
            <img src={usuario.fotoPerfil} alt={usuario.nome} className="w-12 h-12 rounded-full border-2 border-brand-blue/40" />
            <div className="flex-1">
              <p className="font-semibold text-white">{usuario.nome}</p>
              <p className="text-sm text-gray-400">{usuario.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Nenhuma conta conectada</p>
        )}

        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          online ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                 : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {online ? <Wifi size={12} /> : <WifiOff size={12} />}
          {online ? 'Conectado à internet' : 'Sem conexão com a internet'}
        </div>

        {usuario && (
          <button onClick={logout} className="btn-danger btn-sm w-full justify-center">
            <LogOut size={14} />
            Sair da conta
          </button>
        )}

        {!usuario && (
          <button onClick={() => navigate('/login')} className="btn-primary btn-sm w-full justify-center">
            Fazer login com Google
          </button>
        )}
      </div>

      {/* ── Sincronização ── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Cloud size={14} />
          Google Drive
        </h2>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-brand-dark-4 rounded-lg p-3">
            <p className="text-2xl font-black text-white">{ordens.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total de OS</p>
          </div>
          <div className="bg-brand-dark-4 rounded-lg p-3">
            <p className="text-2xl font-black text-brand-green">{ordens.filter(o => o.ultimaSincronizacao).length}</p>
            <p className="text-xs text-gray-500 mt-1">Sincronizadas</p>
          </div>
          <div className="bg-brand-dark-4 rounded-lg p-3">
            <p className="text-2xl font-black text-yellow-400">{itensFila}</p>
            <p className="text-xs text-gray-500 mt-1">Pendentes</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 flex items-start gap-2">
          <ShieldCheck size={12} className="text-brand-green flex-shrink-0 mt-0.5" />
          Os arquivos são salvos em <strong className="text-gray-300">GCAC_OS_Sync/</strong> no seu Google Drive. Apenas este app acessa essa pasta.
        </p>

        <button
          onClick={handleSincronizarTudo}
          disabled={sincronizando || !online || !usuario || itensFila === 0}
          className="btn-primary w-full justify-center"
        >
          <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
          {sincronizando ? 'Sincronizando...'
            : itensFila === 0 ? 'Tudo sincronizado ✓'
            : `Sincronizar ${itensFila} OS pendente${itensFila > 1 ? 's' : ''}`}
        </button>
      </div>

      {/* ── Dados Locais ── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Database size={14} />
          Dados Locais
        </h2>
        <p className="text-xs text-gray-500">
          O banco local armazena apenas metadados leves (ID, nome, status). Dados pesados são removidos após sincronização com o Drive.
        </p>
        <button
          onClick={() => setConfirmandoLimpar(true)}
          className="btn btn-sm bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/30 w-full justify-center"
        >
          <Trash2 size={14} />
          Limpar todos os dados locais
        </button>
      </div>

      {/* ── Versão ── */}
      <div className="text-center text-xs text-gray-600 pb-4">
        GCAC Gerador de O.S. v1.0 — Uso pessoal
      </div>

      <Notificacao {...notif} onFechar={fechar} />
      <DialogConfirmacao
        aberto={confirmandoLimpar}
        titulo="Limpar dados locais"
        mensagem="Isso irá excluir todos os dados armazenados localmente. Dados já sincronizados no Drive não serão afetados. Continuar?"
        textoBotaoConfirmar="Sim, limpar"
        onConfirmar={handleLimparDados}
        onCancelar={() => setConfirmandoLimpar(false)}
      />
    </div>
  );
}
