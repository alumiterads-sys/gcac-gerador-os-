import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Orcamento, StatusOrcamento } from '../types';
import { supabase } from '../db/supabase';
import { useAuth } from './AuthContext';

interface OrcamentosContextType {
  orcamentos: Orcamento[];
  criarOrcamento: (dados: Omit<Orcamento, 'id' | 'numero' | 'criadoEm' | 'atualizadoEm'>) => Promise<string>;
  atualizarOrcamento: (id: string, dados: Partial<Orcamento>) => Promise<void>;
  deletarOrcamento: (id: string) => Promise<void>;
  buscarOrcamento: (id: string) => Promise<Orcamento | undefined>;
}

const OrcamentosContext = createContext<OrcamentosContextType | null>(null);

const mapFromDB = (row: any): Orcamento => ({
  id: row.id,
  numero: parseInt(row.numero, 10),
  nomeCliente: row.nome_cliente,
  contato: row.contato,
  cpf: row.cpf || '',
  senhaGov: row.senha_gov || '',
  servicos: row.servicos || [],
  valorTotal: row.valor_total,
  observacoes: row.observacoes || '',
  status: row.status as StatusOrcamento,
  convertidoOsId: row.convertido_os_id || undefined,
  taxaPFTotal: row.taxa_pf_total || 0,
  criadoEm: row.criado_em,
  atualizadoEm: row.atualizado_em,
});

const mapToDB = (dados: any) => {
  const payload: any = {};
  if (dados.nomeCliente !== undefined) payload.nome_cliente = String(dados.nomeCliente).toUpperCase();
  if (dados.contato !== undefined) payload.contato = dados.contato;
  if (dados.cpf !== undefined) payload.cpf = dados.cpf;
  if (dados.senhaGov !== undefined) payload.senha_gov = dados.senhaGov;
  if (dados.servicos !== undefined) payload.servicos = dados.servicos;
  if (dados.valorTotal !== undefined) payload.valor_total = dados.valorTotal;
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;
  if (dados.status !== undefined) payload.status = dados.status;
  if (dados.convertidoOsId !== undefined) payload.convertido_os_id = dados.convertidoOsId;
  if (dados.taxaPFTotal !== undefined) payload.taxa_pf_total = dados.taxaPFTotal;
  
  return payload;
};

export function OrcamentosProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);

  const carregarOrcamentos = useCallback(async () => {
    if (!usuario) return;
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .order('numero', { ascending: false });
    
    if (!error && data) {
      setOrcamentos(data.map(mapFromDB));
    }
  }, [usuario]);

  useEffect(() => {
    carregarOrcamentos();
  }, [carregarOrcamentos]);

  const criarOrcamento = useCallback(async (
    dados: Omit<Orcamento, 'id' | 'numero' | 'criadoEm' | 'atualizadoEm'>
  ): Promise<string> => {
    if (!usuario) throw new Error('Usuário não autenticado');

    const payloadNovo = {
      ...mapToDB(dados),
      usuario_id: usuario.id
    };

    const { data, error } = await supabase
      .from('orcamentos')
      .insert([payloadNovo])
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao criar orçamento');
    const orcamentoCriado = mapFromDB(data);

    await carregarOrcamentos();

    return orcamentoCriado.id;
  }, [usuario, carregarOrcamentos]);

  const atualizarOrcamento = useCallback(async (id: string, dados: Partial<Orcamento>) => {
    const { error } = await supabase
      .from('orcamentos')
      .update({
        ...mapToDB(dados),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    await carregarOrcamentos();
  }, [carregarOrcamentos]);

  const deletarOrcamento = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await carregarOrcamentos();
  }, [carregarOrcamentos]);

  const buscarOrcamento = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return mapFromDB(data);
  }, []);

  return (
    <OrcamentosContext.Provider value={{
      orcamentos,
      criarOrcamento,
      atualizarOrcamento,
      deletarOrcamento,
      buscarOrcamento,
    }}>
      {children}
    </OrcamentosContext.Provider>
  );
}

export function useOrcamentos(): OrcamentosContextType {
  const ctx = useContext(OrcamentosContext);
  if (!ctx) throw new Error('useOrcamentos deve ser usado dentro de OrcamentosProvider');
  return ctx;
}
