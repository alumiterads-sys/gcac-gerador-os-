import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Agendamento, TipoAgendamento, LocalLaudo, ProfissionalLaudo } from '../types';
import { supabase } from '../db/supabase';
import { useAuth } from './AuthContext';
import { useNotificacoesSistema } from './NotificacoesSistemaContext';

interface AgendamentosContextType {
  agendamentos: Agendamento[];
  estaCarregando: boolean;
  criarAgendamento: (dados: Omit<Agendamento, 'id' | 'confirmado' | 'criadoEm'>) => Promise<string>;
  atualizarAgendamento: (id: string, dados: Partial<Agendamento>) => Promise<void>;
  deletarAgendamento: (id: string) => Promise<void>;
  confirmarAgendamento: (id: string, confirmado: boolean) => Promise<void>;
  confirmarAgendamentoColaborador: (id: string, confirmado: boolean) => Promise<void>;
  finalizarLaudo: (id: string) => Promise<void>;
  buscarAgendamentoPorCPF: (cpf: string, tipo?: TipoAgendamento) => Agendamento | undefined;

  // Locais
  locais: LocalLaudo[];
  carregarLocais: () => Promise<void>;
  criarLocal: (dados: Omit<LocalLaudo, 'id' | 'empresaId' | 'criadoEm'>) => Promise<string>;
  atualizarLocal: (id: string, dados: Partial<LocalLaudo>) => Promise<void>;
  deletarLocal: (id: string) => Promise<void>;

  // Profissionais
  profissionais: ProfissionalLaudo[];
  carregarProfissionais: () => Promise<void>;
  criarProfissional: (dados: Omit<ProfissionalLaudo, 'id' | 'empresaId' | 'criadoEm'>) => Promise<string>;
  atualizarProfissional: (id: string, dados: Partial<ProfissionalLaudo>) => Promise<void>;
  deletarProfissional: (id: string) => Promise<void>;
}

const AgendamentosContext = createContext<AgendamentosContextType | null>(null);

const mapFromDB = (row: any): Agendamento => ({
  id: row.id,
  tipo: row.tipo as TipoAgendamento,
  clienteNome: row.cliente_nome,
  clienteCPF: row.cliente_cpf,
  clienteContato: row.cliente_contato,
  clienteEndereco: row.cliente_endereco,
  arma: row.arma,
  data: row.data,
  horario: row.horario,
  local: row.local,
  profissional: row.profissional,
  valor: parseFloat(row.valor),
  dataPsicologico: row.data_psicologico || undefined,
  horarioPsicologico: row.horario_psicologico || undefined,
  confirmado: row.confirmado,
  confirmadoColaborador: row.confirmado_instrutor,
  despachante: row.despachante || 'GCAC / Guilherme',
  usuarioId: row.usuario_id,
  status: row.status || 'pendente',
  criadoEm: row.criado_em,
});

const mapToDB = (dados: any) => {
  const payload: any = {};
  if (dados.tipo !== undefined) payload.tipo = dados.tipo;
  if (dados.clienteNome !== undefined) payload.cliente_nome = String(dados.clienteNome).toUpperCase();
  if (dados.clienteCPF !== undefined) payload.cliente_cpf = dados.clienteCPF;
  if (dados.clienteContato !== undefined) payload.cliente_contato = dados.clienteContato;
  if (dados.clienteEndereco !== undefined) payload.cliente_endereco = dados.clienteEndereco;
  if (dados.arma !== undefined) payload.arma = dados.arma;
  if (dados.data !== undefined) payload.data = dados.data;
  if (dados.horario !== undefined) payload.horario = dados.horario;
  if (dados.local !== undefined) payload.local = dados.local;
  if (dados.profissional !== undefined) payload.profissional = dados.profissional;
  if (dados.valor !== undefined) payload.valor = dados.valor;
  if (dados.dataPsicologico !== undefined) payload.data_psicologico = dados.dataPsicologico || null;
  if (dados.horarioPsicologico !== undefined) payload.horario_psicologico = dados.horarioPsicologico || null;
  if (dados.confirmado !== undefined) payload.confirmado = dados.confirmado;
  if (dados.confirmadoColaborador !== undefined) payload.confirmado_instrutor = dados.confirmadoColaborador;
  if (dados.despachante !== undefined) payload.despachante = dados.despachante;
  if (dados.usuarioId !== undefined) payload.usuario_id = dados.usuarioId;
  if (dados.status !== undefined) payload.status = dados.status;
  return payload;
};

// Mapeadores Locais
const mapLocalFromDB = (row: any): LocalLaudo => ({
  id: row.id,
  empresaId: row.empresa_id,
  nome: row.nome,
  ativo: row.ativo,
  criadoEm: row.criado_em,
});

const mapLocalToDB = (dados: Partial<LocalLaudo>) => {
  const payload: any = {};
  if (dados.nome !== undefined) payload.nome = String(dados.nome).toUpperCase();
  if (dados.ativo !== undefined) payload.ativo = dados.ativo;
  return payload;
};

// Mapeadores Profissionais
const mapProfissionalFromDB = (row: any): ProfissionalLaudo => ({
  id: row.id,
  empresaId: row.empresa_id,
  nome: row.nome,
  tipo: row.tipo as 'Tiro' | 'Psicológico',
  locaisIds: row.locais_ids || [],
  ativo: row.ativo,
  criadoEm: row.criado_em,
});

const mapProfissionalToDB = (dados: Partial<ProfissionalLaudo>) => {
  const payload: any = {};
  if (dados.nome !== undefined) payload.nome = String(dados.nome).toUpperCase();
  if (dados.tipo !== undefined) payload.tipo = dados.tipo;
  if (dados.locaisIds !== undefined) payload.locais_ids = dados.locaisIds;
  if (dados.ativo !== undefined) payload.ativo = dados.ativo;
  return payload;
};

export function AgendamentosProvider({ children }: { children: React.ReactNode }) {
  const { usuario, estaAutenticado } = useAuth();
  const { enviarNotificacao } = useNotificacoesSistema();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [locais, setLocais] = useState<LocalLaudo[]>([]);
  const [profissionais, setProfissionais] = useState<ProfissionalLaudo[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);

  // ─── Métodos de Agendamentos ─────────────────────────────────────────────

  const carregarAgendamentos = useCallback(async () => {
    if (!estaAutenticado || !usuario?.empresaId) return;
    
    setEstaCarregando(true);
    let query = supabase
      .from('agendamentos')
      .select('*')
      .eq('empresa_id', usuario.empresaId)
      .order('data', { ascending: false });
    
    if (usuario?.role === 'colaborador') {
      query = query.eq('usuario_id', usuario.id);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setAgendamentos(data.map(mapFromDB));
    }
    setEstaCarregando(false);
  }, [estaAutenticado, usuario]);

  // ─── Métodos de Locais ───────────────────────────────────────────────────

  const carregarLocais = useCallback(async () => {
    if (!estaAutenticado || !usuario?.empresaId) return;
    const { data, error } = await supabase
      .from('locais_laudos')
      .select('*')
      .eq('empresa_id', usuario.empresaId)
      .order('nome', { ascending: true });
    if (!error && data) {
      setLocais(data.map(mapLocalFromDB));
    }
  }, [estaAutenticado, usuario]);

  // ─── Métodos de Profissionais ────────────────────────────────────────────

  const carregarProfissionais = useCallback(async () => {
    if (!estaAutenticado || !usuario?.empresaId) return;
    const { data, error } = await supabase
      .from('profissionais_laudos')
      .select('*')
      .eq('empresa_id', usuario.empresaId)
      .order('nome', { ascending: true });
    if (!error && data) {
      setProfissionais(data.map(mapProfissionalFromDB));
    }
  }, [estaAutenticado, usuario]);

  // Effects iniciais
  useEffect(() => {
    carregarAgendamentos();
    carregarLocais();
    carregarProfissionais();
  }, [carregarAgendamentos, carregarLocais, carregarProfissionais]);

  const criarAgendamento = useCallback(async (
    dados: Omit<Agendamento, 'id' | 'confirmado' | 'criadoEm'>
  ): Promise<string> => {
    if (!usuario?.empresaId) throw new Error('Usuário não autenticado');
    const payload = {
      ...mapToDB(dados),
      usuario_id: usuario?.id,
      status: 'pendente',
      confirmado: false,
      empresa_id: usuario.empresaId
    };

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Erro Supabase ao criar agendamento:', error);
      throw error;
    }
    
    if (!data) throw new Error('Falha ao criar agendamento: nenhum dado retornado');
    
    if (usuario?.role === 'colaborador' && dados.despachante === 'GCAC / Guilherme') {
      enviarNotificacao({
        titulo: 'Novo Agendamento por Colaborador',
        mensagem: `${usuario.nome} agendou um laudo para ${dados.clienteNome} no dia ${dados.data.split('-').reverse().join('/')}.`,
        tipo: 'sucesso'
      }).then();
    }

    await carregarAgendamentos();
    return data.id;
  }, [carregarAgendamentos, usuario, enviarNotificacao]);

  const atualizarAgendamento = useCallback(async (id: string, dados: Partial<Agendamento>) => {
    const { error } = await supabase
      .from('agendamentos')
      .update(mapToDB(dados))
      .eq('id', id);

    if (error) throw error;

    if (usuario?.role === 'colaborador' && dados.despachante === 'GCAC / Guilherme') {
      enviarNotificacao({
        titulo: 'Agendamento Atualizado',
        mensagem: `${usuario?.nome || 'Um colaborador'} atualizou o agendamento de ${dados.clienteNome || 'um cliente'}.`,
        tipo: 'info'
      }).then();
    }

    await carregarAgendamentos();
  }, [carregarAgendamentos, usuario?.role, enviarNotificacao]);

  const deletarAgendamento = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await carregarAgendamentos();
  }, [carregarAgendamentos]);

  const confirmarAgendamento = useCallback(async (id: string, confirmado: boolean) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ confirmado })
      .eq('id', id);

    if (error) throw error;
    await carregarAgendamentos();
  }, [carregarAgendamentos]);

  const confirmarAgendamentoColaborador = useCallback(async (id: string, confirmado: boolean) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ confirmado_instrutor: confirmado })
      .eq('id', id);

    if (error) throw error;
    await carregarAgendamentos();
  }, [carregarAgendamentos]);

  const finalizarLaudo = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'realizado' })
      .eq('id', id);

    if (error) throw error;
    await carregarAgendamentos();
  }, [carregarAgendamentos]);

  const buscarAgendamentoPorCPF = useCallback((cpf: string, tipo?: TipoAgendamento) => {
    return agendamentos.find(a => 
      a.clienteCPF === cpf && (!tipo || a.tipo === tipo)
    );
  }, [agendamentos]);

  // CRUD Locais
  const criarLocal = useCallback(async (dados: Omit<LocalLaudo, 'id' | 'empresaId' | 'criadoEm'>): Promise<string> => {
    if (!usuario?.empresaId) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase
      .from('locais_laudos')
      .insert([{ ...mapLocalToDB(dados), empresa_id: usuario.empresaId }])
      .select()
      .single();
    if (error) throw error;
    await carregarLocais();
    return data.id;
  }, [carregarLocais, usuario]);

  const atualizarLocal = useCallback(async (id: string, dados: Partial<LocalLaudo>) => {
    const { error } = await supabase
      .from('locais_laudos')
      .update(mapLocalToDB(dados))
      .eq('id', id);
    if (error) throw error;
    await carregarLocais();
    await carregarProfissionais();
  }, [carregarLocais, carregarProfissionais]);

  const deletarLocal = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('locais_laudos')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await carregarLocais();
    await carregarProfissionais();
  }, [carregarLocais, carregarProfissionais]);

  // CRUD Profissionais
  const criarProfissional = useCallback(async (dados: Omit<ProfissionalLaudo, 'id' | 'empresaId' | 'criadoEm'>): Promise<string> => {
    if (!usuario?.empresaId) throw new Error('Usuário não autenticado');
    const { data, error } = await supabase
      .from('profissionais_laudos')
      .insert([{ ...mapProfissionalToDB(dados), empresa_id: usuario.empresaId }])
      .select()
      .single();
    if (error) throw error;
    await carregarProfissionais();
    return data.id;
  }, [carregarProfissionais, usuario]);

  const atualizarProfissional = useCallback(async (id: string, dados: Partial<ProfissionalLaudo>) => {
    const { error } = await supabase
      .from('profissionais_laudos')
      .update(mapProfissionalToDB(dados))
      .eq('id', id);
    if (error) throw error;
    await carregarProfissionais();
  }, [carregarProfissionais]);

  const deletarProfissional = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('profissionais_laudos')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await carregarProfissionais();
  }, [carregarProfissionais]);

  return (
    <AgendamentosContext.Provider value={{
      agendamentos,
      estaCarregando,
      criarAgendamento,
      atualizarAgendamento,
      deletarAgendamento,
      confirmarAgendamento,
      confirmarAgendamentoColaborador,
      finalizarLaudo,
      buscarAgendamentoPorCPF,
      
      // Locais
      locais,
      carregarLocais,
      criarLocal,
      atualizarLocal,
      deletarLocal,

      // Profissionais
      profissionais,
      carregarProfissionais,
      criarProfissional,
      atualizarProfissional,
      deletarProfissional
    }}>
      {children}
    </AgendamentosContext.Provider>
  );
}

export function useAgendamentos(): AgendamentosContextType {
  const ctx = useContext(AgendamentosContext);
  if (!ctx) throw new Error('useAgendamentos deve ser usado dentro de AgendamentosProvider');
  return ctx;
}
