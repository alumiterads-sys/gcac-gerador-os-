import React, { createContext, useContext, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { Cliente } from '../types';
import { db } from '../db/database';

interface ClientesContextType {
  clientes: Cliente[];
  criarCliente: (dados: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<string>;
  atualizarCliente: (id: string, dados: Partial<Cliente>) => Promise<void>;
  deletarCliente: (id: string) => Promise<void>;
  buscarCliente: (id: string) => Promise<Cliente | undefined>;
  buscarClientePorNomeExato: (nome: string) => Promise<Cliente | undefined>;
}

const ClientesContext = createContext<ClientesContextType | null>(null);

export function ClientesProvider({ children }: { children: React.ReactNode }) {
  const clientes = useLiveQuery(
    () => db.clientes.orderBy('nome').toArray(),
    [],
    []
  ) ?? [];

  const criarCliente = useCallback(async (
    dados: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>
  ): Promise<string> => {
    const id = uuidv4();
    const agora = new Date().toISOString();

    const novoCliente: Cliente = {
      ...dados,
      id,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await db.clientes.add(novoCliente);
    return id;
  }, []);

  const atualizarCliente = useCallback(async (id: string, dados: Partial<Cliente>) => {
    await db.clientes.update(id, {
      ...dados,
      atualizadoEm: new Date().toISOString(),
    });
  }, []);

  const deletarCliente = useCallback(async (id: string) => {
    await db.clientes.delete(id);
  }, []);

  const buscarCliente = useCallback(async (id: string) => {
    return await db.clientes.get(id);
  }, []);

  const buscarClientePorNomeExato = useCallback(async (nome: string) => {
    const todos = await db.clientes.toArray();
    return todos.find(c => c.nome.toLowerCase() === nome.toLowerCase());
  }, []);

  return (
    <ClientesContext.Provider value={{
      clientes,
      criarCliente,
      atualizarCliente,
      deletarCliente,
      buscarCliente,
      buscarClientePorNomeExato,
    }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes(): ClientesContextType {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error('useClientes deve ser usado dentro de ClientesProvider');
  return ctx;
}
