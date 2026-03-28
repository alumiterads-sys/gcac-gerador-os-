import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Recibo } from '../types';
import { supabase } from '../db/supabase';

interface RecibosContextType {
  recibos: Recibo[];
  criarRecibo: (dados: Omit<Recibo, 'id' | 'numero' | 'criadoEm'>) => Promise<string>;
  deletarRecibo: (id: string) => Promise<void>;
  buscarRecibo: (id: string) => Promise<Recibo | undefined>;
}

const RecibosContext = createContext<RecibosContextType | null>(null);

const mapFromDB = (row: any): Recibo => ({
  id: row.id,
  numero: parseInt(row.numero, 10),
  clienteNome: row.cliente_nome,
  clienteCPF: row.cliente_cpf,
  servicos: row.servicos || [],
  valorTotal: row.valor_total,
  ordemId: row.ordem_id || undefined,
  formaPagamento: row.forma_pagamento || 'PIX',
  observacoes: row.observacoes || '',
  emitenteNome: row.emitente_nome,
  emitenteCNPJ: row.emitente_cnpj,
  criadoEm: row.criado_em,
});

const mapToDB = (dados: any) => ({
  cliente_nome: dados.clienteNome.toUpperCase(),
  cliente_cpf: dados.clienteCPF,
  servicos: dados.servicos,
  valor_total: dados.valorTotal,
  ordem_id: dados.ordemId || null,
  forma_pagamento: dados.formaPagamento,
  observacoes: dados.observacoes,
  emitente_nome: dados.emitenteNome,
  emitente_cnpj: dados.emitenteCNPJ,
});

export function RecibosProvider({ children }: { children: React.ReactNode }) {
  const [recibos, setRecibos] = useState<Recibo[]>([]);

  const carregarRecibos = useCallback(async () => {
    const { data, error } = await supabase
      .from('recibos')
      .select('*')
      .order('numero', { ascending: false });
    
    if (!error && data) {
      setRecibos(data.map(mapFromDB));
    }
  }, []);

  useEffect(() => {
    carregarRecibos();
  }, [carregarRecibos]);

  const criarRecibo = useCallback(async (
    dados: Omit<Recibo, 'id' | 'numero' | 'criadoEm'>
  ): Promise<string> => {
    const { data, error } = await supabase
      .from('recibos')
      .insert([mapToDB(dados)])
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao criar recibo');
    
    await carregarRecibos();
    return data.id;
  }, [carregarRecibos]);

  const deletarRecibo = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('recibos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await carregarRecibos();
  }, [carregarRecibos]);

  const buscarRecibo = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('recibos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return mapFromDB(data);
  }, []);

  return (
    <RecibosContext.Provider value={{
      recibos,
      criarRecibo,
      deletarRecibo,
      buscarRecibo,
    }}>
      {children}
    </RecibosContext.Provider>
  );
}

export function useRecibos(): RecibosContextType {
  const ctx = useContext(RecibosContext);
  if (!ctx) throw new Error('useRecibos deve ser usado dentro de RecibosProvider');
  return ctx;
}
