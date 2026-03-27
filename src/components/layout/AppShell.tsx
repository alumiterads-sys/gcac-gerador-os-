import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar, NavegacaoInferior } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useStatusConexao } from '../../hooks/useStatusConexao';
import { useOrdens } from '../../context/OrdensContext';
import { sincronizarPendentes } from '../../services/driveSync';

export function AppShell() {
  const { estaAutenticado } = useAuth();
  const { itensFila } = useOrdens();
  const online = useStatusConexao();
  const [jaSincronizou, setJaSincronizou] = React.useState(false);

  // Auto-sync quando volta a ficar online com itens pendentes
  React.useEffect(() => {
    if (online && estaAutenticado && itensFila > 0 && !jaSincronizou) {
      setJaSincronizou(true);
      sincronizarPendentes().finally(() => {
        setTimeout(() => setJaSincronizou(false), 30000);
      });
    }
    if (!online) setJaSincronizou(false);
  }, [online, estaAutenticado, itensFila]);

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Sidebar — visível apenas em sm+ */}
      <div className="hidden sm:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        {/* Banner offline */}
        {!online && (
          <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-2 text-center">
            <p className="text-xs text-yellow-300 font-medium">
              ⚠️ Modo offline — suas alterações serão sincronizadas ao reconectar
            </p>
          </div>
        )}

        <div className="p-4 sm:p-6 pb-24 sm:pb-6">
          <Outlet />
        </div>
      </main>

      {/* Navegação inferior — apenas mobile */}
      <NavegacaoInferior />
    </div>
  );
}
