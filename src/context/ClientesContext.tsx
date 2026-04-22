import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Cliente, Arma, GuiaTrafego, AutorizacaoManejo } from '../types';
import { supabase } from '../db/supabase';

interface ClientesContextType {
  clientes: Cliente[];
  criarCliente: (dados: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<string>;
  atualizarCliente: (id: string, dados: Partial<Cliente>) => Promise<void>;
  deletarCliente: (id: string) => Promise<void>;
  buscarCliente: (id: string) => Promise<Cliente | undefined>;
  buscarClientePorNomeExato: (nome: string) => Promise<Cliente | undefined>;
  clubesRegistrados: string[];
  
  // Gestão de Armas
  buscarArmas: (clienteId: string) => Promise<Arma[]>;
  salvarArma: (arma: Omit<Arma, 'id' | 'criadoEm'>) => Promise<void>;
  deletarArma: (id: string) => Promise<void>;
  
  // Gestão de GTs
  buscarGts: (armaId: string) => Promise<GuiaTrafego[]>;
  salvarGt: (gt: Omit<GuiaTrafego, 'id' | 'criadoEm'>) => Promise<void>;
  deletarGt: (id: string) => Promise<void>;
  
  // Gestão de Manejo
  buscarManejos: (clienteId: string) => Promise<AutorizacaoManejo[]>;
  salvarManejo: (manejo: Omit<AutorizacaoManejo, 'id' | 'criadoEm'>) => Promise<void>;
  deletarManejo: (id: string) => Promise<void>;
}

const ClientesContext = createContext<ClientesContextType | null>(null);

const mapFromDB = (row: any): Cliente => ({
  id: row.id,
  nome: row.nome,
  cpf: row.cpf,
  contato: row.contato,
  senhaGov: row.senha_gov || '',
  filiadoProTiro: row.filiado_pro_tiro,
  clubeFiliado: row.clube_filiado || '',
  observacoes: row.observacoes || '',
  endereco: row.endereco || '',
  numeroCr: row.numero_cr || '',
  vencimentoCr: row.vencimento_cr || '',
  vencimentoCrIbama: row.vencimento_cr_ibama || '',
  criadoEm: row.criado_em,
  atualizadoEm: row.atualizado_em,
});

const mapToDB = (dados: any) => {
  const payload: any = {};
  if (dados.nome !== undefined) payload.nome = String(dados.nome).toUpperCase();
  if (dados.cpf !== undefined) payload.cpf = dados.cpf;
  if (dados.contato !== undefined) payload.contato = dados.contato;
  if (dados.senhaGov !== undefined) payload.senha_gov = dados.senhaGov;
  if (dados.filiadoProTiro !== undefined) payload.filiado_pro_tiro = dados.filiadoProTiro;
  if (dados.clubeFiliado !== undefined) payload.clube_filiado = dados.clubeFiliado;
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;
  if (dados.endereco !== undefined) payload.endereco = dados.endereco;
  if (dados.numeroCr !== undefined) payload.numero_cr = dados.numeroCr;
  if (dados.vencimentoCr !== undefined) payload.vencimento_cr = dados.vencimentoCr || null;
  if (dados.vencimentoCrIbama !== undefined) payload.vencimento_cr_ibama = dados.vencimentoCrIbama || null;
  return payload;
};

export function ClientesProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const carregarClientes = useCallback(async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar clientes no supabase:', error);
      return;
    }
    
    setClientes(data.map(mapFromDB));
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const criarCliente = useCallback(async (
    dados: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>
  ): Promise<string> => {
    const { data, error } = await supabase
      .from('clientes')
      .insert([mapToDB(dados)])
      .select()
      .single();

    if (error) throw error;
    await carregarClientes();
    return data.id;
  }, [carregarClientes]);

  const atualizarCliente = useCallback(async (id: string, dados: Partial<Cliente>) => {
    const { error } = await supabase
      .from('clientes')
      .update({ ...mapToDB(dados), atualizado_em: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await carregarClientes();
  }, [carregarClientes]);

  const deletarCliente = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await carregarClientes();
  }, [carregarClientes]);

  const buscarCliente = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return mapFromDB(data);
  }, []);

  const buscarClientePorNomeExato = useCallback(async (nome: string) => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .ilike('nome', nome)
      .limit(1)
      .single();

    if (error || !data) return undefined;
    return mapFromDB(data);
  }, []);

  const clubesRegistrados = React.useMemo(() => {
    const todosClubes = clientes
      .map(c => c.clubeFiliado)
      .filter(c => c && c.trim().length > 0 && c.toUpperCase() !== 'NÃO RELATADO');
    
    return Array.from(new Set(todosClubes.map(c => c.toUpperCase()))).sort();
  }, [clientes]);

  // --- Gestão de Armas ---
  const buscarArmas = useCallback(async (clienteId: string) => {
    const { data, error } = await supabase
      .from('armas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('modelo', { ascending: true });
    
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      clienteId: row.cliente_id,
      modelo: row.modelo,
      calibre: row.calibre,
      fabricante: row.fabricante,
      numeroSerie: row.numero_serie,
      numeroSigma: row.numero_sigma,
      acervo: row.acervo,
      vencimentoCraf: row.vencimento_craf,
      criadoEm: row.criado_em
    }));
  }, []);

  const salvarArma = useCallback(async (dados: Omit<Arma, 'id' | 'criadoEm'>) => {
    const { error } = await supabase
      .from('armas')
      .insert([{
        cliente_id: dados.clienteId,
        modelo: dados.modelo,
        calibre: dados.calibre,
        fabricante: dados.fabricante,
        numero_serie: dados.numeroSerie,
        numero_sigma: dados.numeroSigma,
        acervo: dados.acervo,
        vencimento_craf: dados.vencimentoCraf || null
      }]);
    if (error) throw error;
  }, []);

  const deletarArma = useCallback(async (id: string) => {
    const { error } = await supabase.from('armas').delete().eq('id', id);
    if (error) throw error;
  }, []);

  // --- Gestão de GTs ---
  const buscarGts = useCallback(async (armaId: string) => {
    const { data, error } = await supabase
      .from('guias_trafego')
      .select('*')
      .eq('arma_id', armaId)
      .order('vencimento', { ascending: true });
    
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      armaId: row.arma_id,
      tipo: row.tipo,
      vencimento: row.vencimento,
      destino: row.destino,
      criadoEm: row.criado_em
    }));
  }, []);

  const salvarGt = useCallback(async (dados: Omit<GuiaTrafego, 'id' | 'criadoEm'>) => {
    const { error } = await supabase
      .from('guias_trafego')
      .insert([{
        arma_id: dados.armaId,
        tipo: dados.tipo,
        vencimento: dados.vencimento,
        destino: dados.destino
      }]);
    if (error) throw error;
  }, []);

  const deletarGt = useCallback(async (id: string) => {
    const { error } = await supabase.from('guias_trafego').delete().eq('id', id);
    if (error) throw error;
  }, []);

  // --- Gestão de Manejo ---
  const buscarManejos = useCallback(async (clienteId: string) => {
    const { data, error } = await supabase
      .from('autorizacoes_manejo')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('vencimento', { ascending: true });
    
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      clienteId: row.cliente_id,
      numeroCar: row.numero_car,
      nomeFazenda: row.nome_fazenda,
      nomeProprietario: row.nome_proprietario,
      cidade: row.cidade,
      vencimento: row.vencimento,
      criadoEm: row.criado_em
    }));
  }, []);

  const salvarManejo = useCallback(async (dados: Omit<AutorizacaoManejo, 'id' | 'criadoEm'>) => {
    const { error } = await supabase
      .from('autorizacoes_manejo')
      .insert([{
        cliente_id: dados.clienteId,
        numero_car: dados.numeroCar,
        nome_fazenda: dados.nomeFazenda,
        nome_proprietario: dados.nomeProprietario,
        cidade: dados.cidade,
        vencimento: dados.vencimento
      }]);
    if (error) throw error;
  }, []);

  const deletarManejo = useCallback(async (id: string) => {
    const { error } = await supabase.from('autorizacoes_manejo').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return (
    <ClientesContext.Provider value={{
      clientes,
      criarCliente,
      atualizarCliente,
      deletarCliente,
      buscarCliente,
      buscarClientePorNomeExato,
      clubesRegistrados,
      buscarArmas,
      salvarArma,
      deletarArma,
      buscarGts,
      salvarGt,
      deletarGt,
      buscarManejos,
      salvarManejo,
      deletarManejo
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
