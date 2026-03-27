import React, { createContext, useContext, useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { OrdemDeServico, StatusOS, FormaPagamento } from '../types';
import { db, proximoNumeroOS, adicionarNaFilaSync } from '../db/database';
import { sincronizarOrdem } from '../services/driveSync';
import { useAuth } from './AuthContext';
import { useStatusConexao } from '../hooks/useStatusConexao';

interface OrdensContextType {
  ordens: OrdemDeServico[];
  totalPendentes: number;
  criarOrdem: (dados: Omit<OrdemDeServico, 'id' | 'numero' | 'criadoEm' | 'atualizadoEm' | 'driveArquivoJsonId' | 'drivePdfId' | 'ultimaSincronizacao' | 'pendenteSincronizacao'>) => Promise<string>;
  atualizarOrdem: (id: string, dados: Partial<OrdemDeServico>) => Promise<void>;
  deletarOrdem: (id: string) => Promise<void>;
  buscarOrdem: (id: string) => Promise<OrdemDeServico | undefined>;
  itensFila: number;
}

const OrdensContext = createContext<OrdensContextType | null>(null);

export function OrdensProvider({ children }: { children: React.ReactNode }) {
  const { estaAutenticado } = useAuth();
  const online = useStatusConexao();
  const [itensFila, setItensFila] = useState(0);

  const ordens = useLiveQuery(
    () => db.ordensDeServico.orderBy('numero').reverse().toArray(),
    [],
    []
  ) ?? [];

  const totalPendentes = ordens.filter(o => o.status === 'Aguardando Pagamento').length;

  // Atualizar contagem da fila
  useLiveQuery(async () => {
    const count = await db.filaDeSincronizacao.count();
    setItensFila(count);
  }, []);

  const criarOrdem = useCallback(async (
    dados: Omit<OrdemDeServico, 'id' | 'numero' | 'criadoEm' | 'atualizadoEm' | 'driveArquivoJsonId' | 'drivePdfId' | 'ultimaSincronizacao' | 'pendenteSincronizacao'>
  ): Promise<string> => {
    const id = uuidv4();
    const numero = await proximoNumeroOS();
    const agora = new Date().toISOString();

    const novaOrdem: OrdemDeServico = {
      ...dados,
      id,
      numero,
      driveArquivoJsonId: null,
      drivePdfId: null,
      ultimaSincronizacao: null,
      pendenteSincronizacao: true,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await db.ordensDeServico.add(novaOrdem);

    if (online && estaAutenticado) {
      sincronizarOrdem(novaOrdem).catch(() => {
        adicionarNaFilaSync(id, 'criar');
      });
    } else {
      await adicionarNaFilaSync(id, 'criar');
    }

    return id;
  }, [online, estaAutenticado]);

  const atualizarOrdem = useCallback(async (id: string, dados: Partial<OrdemDeServico>) => {
    await db.ordensDeServico.update(id, {
      ...dados,
      pendenteSincronizacao: true,
      atualizadoEm: new Date().toISOString(),
    });

    const ordemAtualizada = await db.ordensDeServico.get(id);

    if (online && estaAutenticado && ordemAtualizada) {
      sincronizarOrdem(ordemAtualizada).catch(() => {
        adicionarNaFilaSync(id, 'atualizar');
      });
    } else {
      await adicionarNaFilaSync(id, 'atualizar');
    }
  }, [online, estaAutenticado]);

  const deletarOrdem = useCallback(async (id: string) => {
    await db.ordensDeServico.delete(id);
    await db.filaDeSincronizacao.where('ordemId').equals(id).delete();
  }, []);

  const buscarOrdem = useCallback(async (id: string) => {
    return db.ordensDeServico.get(id);
  }, []);

  return (
    <OrdensContext.Provider value={{
      ordens,
      totalPendentes,
      criarOrdem,
      atualizarOrdem,
      deletarOrdem,
      buscarOrdem,
      itensFila,
    }}>
      {children}
    </OrdensContext.Provider>
  );
}

export function useOrdens(): OrdensContextType {
  const ctx = useContext(OrdensContext);
  if (!ctx) throw new Error('useOrdens deve ser usado dentro de OrdensProvider');
  return ctx;
}
