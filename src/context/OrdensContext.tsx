import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { OrdemDeServico, StatusOS, FormaPagamento, CanalAtendimento } from '../types';
import { supabase } from '../db/supabase';
import { sincronizarOrdem } from '../services/driveSync';
import { useAuth } from './AuthContext';
import { useStatusConexao } from '../hooks/useStatusConexao';

interface OrdensContextType {
  ordens: OrdemDeServico[];
  totalPendentes: number;
  criarOrdem: (dados: Omit<OrdemDeServico, 'id' | 'numero' | 'criadoEm' | 'atualizadoEm' | 'driveArquivoJsonId' | 'drivePdfId' | 'ultimaSincronizacao' | 'pendenteSincronizacao'>) => Promise<string>;
  atualizarOrdem: (id: string, dados: Partial<OrdemDeServico>) => Promise<void>;
  atualizarStatusServico: (ordemId: string, servicoId: string, novoStatus: any) => Promise<void>;
  atualizarGruServico: (ordemId: string, servicoId: string, pago: boolean) => Promise<void>;
  deletarOrdem: (id: string) => Promise<void>;
  buscarOrdem: (id: string) => Promise<OrdemDeServico | undefined>;
  registrarPagamento: (ordemId: string, valor: number, metodo: FormaPagamento) => Promise<void>;
  removerPagamento: (ordemId: string, pagamentoId: string) => Promise<void>;
  itensFila: number; 
}

const OrdensContext = createContext<OrdensContextType | null>(null);

const mapFromDB = (row: any): OrdemDeServico => ({
  id: row.id,
  numero: parseInt(row.numero, 10), // BigSerial vem como texto no JS
  nomeCliente: row.nome_cliente,
  contato: row.contato,
  cpf: row.cpf,
  senhaGov: row.senha_gov || '',
  filiadoProTiro: row.filiado_pro_tiro,
  clubeFiliado: row.clube_filiado || '',
  servicos: row.servicos || [],
  valor: row.valor,
  valorPago: row.valor_pago || 0,
  historicoPagamentos: row.historico_pagamentos || [],
  formaPagamento: row.forma_pagamento as FormaPagamento,
  status: row.status as StatusOS,
  taxaPFTotal: row.taxa_pf_total || 0,
  canalAtendimento: row.canal_atendimento as CanalAtendimento | null,
  observacaoContato: row.observacao_contato || '',
  observacoes: row.observacoes || '',
  protocolo: row.protocolo || '',
  migrado: row.migrado || false,
  driveArquivoJsonId: row.drive_arquivo_json_id || null,
  drivePdfId: row.drive_pdf_id || null,
  ultimaSincronizacao: row.ultima_sincronizacao || null,
  pendenteSincronizacao: row.pendente_sincronizacao,
  criadoEm: row.criado_em,
  atualizadoEm: row.atualizado_em,
});

const mapToDB = (dados: any) => {
  const payload: any = {};
  if (dados.nomeCliente !== undefined) payload.nome_cliente = String(dados.nomeCliente).toUpperCase();
  if (dados.contato !== undefined) payload.contato = dados.contato;
  if (dados.cpf !== undefined) payload.cpf = dados.cpf;
  if (dados.senhaGov !== undefined) payload.senha_gov = dados.senhaGov;
  if (dados.filiadoProTiro !== undefined) payload.filiado_pro_tiro = dados.filiadoProTiro;
  if (dados.clubeFiliado !== undefined) payload.clube_filiado = dados.clubeFiliado;
  if (dados.servicos !== undefined) payload.servicos = dados.servicos;
  if (dados.valor !== undefined) payload.valor = dados.valor;
  if (dados.valorPago !== undefined) payload.valor_pago = dados.valorPago;
  if (dados.historicoPagamentos !== undefined) payload.historico_pagamentos = dados.historicoPagamentos;
  if (dados.formaPagamento !== undefined) payload.forma_pagamento = dados.formaPagamento;
  if (dados.status !== undefined) payload.status = dados.status;
  if (dados.canalAtendimento !== undefined) payload.canal_atendimento = dados.canalAtendimento;
  if (dados.observacaoContato !== undefined) payload.observacao_contato = dados.observacaoContato;
  if (dados.observacoes !== undefined) payload.observacoes = dados.observacoes;
  if (dados.protocolo !== undefined) payload.protocolo = dados.protocolo;
  if (dados.migrado !== undefined) payload.migrado = dados.migrado;
  if (dados.taxaPFTotal !== undefined) payload.taxa_pf_total = dados.taxaPFTotal;
  
  if (dados.driveArquivoJsonId !== undefined) payload.drive_arquivo_json_id = dados.driveArquivoJsonId;
  if (dados.drivePdfId !== undefined) payload.drive_pdf_id = dados.drivePdfId;
  if (dados.ultimaSincronizacao !== undefined) payload.ultima_sincronizacao = dados.ultimaSincronizacao;
  if (dados.pendenteSincronizacao !== undefined) payload.pendente_sincronizacao = dados.pendenteSincronizacao;
  
  return payload;
};

export function OrdensProvider({ children }: { children: React.ReactNode }) {
  const { estaAutenticado } = useAuth();
  const online = useStatusConexao();
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);

  const carregarOrdens = useCallback(async () => {
    const { data, error } = await supabase
      .from('ordens')
      .select('*')
      .order('numero', { ascending: false });
    
    if (!error && data) {
      setOrdens(data.map(mapFromDB));
    }
  }, []);

  useEffect(() => {
    carregarOrdens();
  }, [carregarOrdens]);

  const totalPendentes = ordens.filter(o => o.status === 'Aguardando Pagamento').length;

  const criarOrdem = useCallback(async (
    dados: Omit<OrdemDeServico, 'id' | 'numero' | 'criadoEm' | 'atualizadoEm' | 'driveArquivoJsonId' | 'drivePdfId' | 'ultimaSincronizacao' | 'pendenteSincronizacao'>
  ): Promise<string> => {
    
    const payloadNovo = {
      ...mapToDB(dados),
      pendente_sincronizacao: true
    };

    const { data, error } = await supabase
      .from('ordens')
      .insert([payloadNovo])
      .select()
      .single();

    if (error || !data) throw error || new Error('Falha ao criar OS');
    const ordemCriada = mapFromDB(data);

    await carregarOrdens();

    if (online && estaAutenticado) {
      // Dispara backup do Drive silenciosamente no background (assincrono sem travar)
      sincronizarOrdem(ordemCriada).catch(console.error);
    }

    return ordemCriada.id;
  }, [online, estaAutenticado, carregarOrdens]);

  const atualizarOrdem = useCallback(async (id: string, dados: Partial<OrdemDeServico>) => {
    const { data, error } = await supabase
      .from('ordens')
      .update({
        ...mapToDB(dados),
        pendente_sincronizacao: true,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    await carregarOrdens();

    if (online && estaAutenticado && data) {
      sincronizarOrdem(mapFromDB(data)).catch(console.error);
    }
  }, [online, estaAutenticado, carregarOrdens]);

  const atualizarStatusServico = useCallback(async (ordemId: string, servicoId: string, novoStatus: any) => {
    const ordem = ordens.find(o => o.id === ordemId);
    if (!ordem) return;

    const novosServicos = ordem.servicos.map(s => 
      s.id === servicoId ? { ...s, statusExecucao: novoStatus } : s
    );

    await atualizarOrdem(ordemId, { servicos: novosServicos });
  }, [ordens, atualizarOrdem]);
  const atualizarGruServico = useCallback(async (ordemId: string, servicoId: string, pago: boolean) => {
    const ordem = ordens.find(o => o.id === ordemId);
    if (!ordem) return;

    const novosServicos = ordem.servicos.map(s => 
      s.id === servicoId ? { ...s, pagoGRU: pago } : s
    );

    await atualizarOrdem(ordemId, { servicos: novosServicos });
  }, [ordens, atualizarOrdem]);

  const deletarOrdem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('ordens')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await carregarOrdens();
  }, [carregarOrdens]);
  const buscarOrdem = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('ordens')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return mapFromDB(data);
  }, []);

  const registrarPagamento = useCallback(async (ordemId: string, valor: number, metodo: FormaPagamento) => {
    const ordem = ordens.find(o => o.id === ordemId);
    if (!ordem) return;
    
    // ... (rest of registrarPagamento is fine, but I'll add removerPagamento below)

    const novoPagamento = {
      id: crypto.randomUUID(),
      valor,
      metodo,
      data: new Date().toISOString()
    };

    const novoHistorico = [...(ordem.historicoPagamentos || []), novoPagamento];
    const novoValorPago = novoHistorico.reduce((acc, p) => acc + p.valor, 0);
    
    let novoStatus: StatusOS = ordem.status;
    if (novoValorPago >= ordem.valor) {
      novoStatus = 'Pago';
    } else if (novoValorPago > 0) {
      novoStatus = 'Parcialmente Pago';
    } else {
      novoStatus = 'Aguardando Pagamento';
    }

    await atualizarOrdem(ordemId, {
      valorPago: novoValorPago,
      historicoPagamentos: novoHistorico,
      status: novoStatus,
      formaPagamento: metodo // Atualiza forma principal com o último método
    });
  }, [ordens, atualizarOrdem]);

  const removerPagamento = useCallback(async (ordemId: string, pagamentoId: string) => {
    const ordem = ordens.find(o => o.id === ordemId);
    if (!ordem) return;

    const novoHistorico = (ordem.historicoPagamentos || []).filter(p => p.id !== pagamentoId);
    const novoValorPago = novoHistorico.reduce((acc, p) => acc + p.valor, 0);
    
    let novoStatus: StatusOS = 'Aguardando Pagamento';
    if (novoValorPago >= ordem.valor) {
      novoStatus = 'Pago';
    } else if (novoValorPago > 0) {
      novoStatus = 'Parcialmente Pago';
    }

    await atualizarOrdem(ordemId, {
      valorPago: novoValorPago,
      historicoPagamentos: novoHistorico,
      status: novoStatus
    });
  }, [ordens, atualizarOrdem]);

  return (
    <OrdensContext.Provider value={{
      ordens,
      totalPendentes,
      criarOrdem,
      atualizarOrdem,
      atualizarStatusServico,
      atualizarGruServico,
      deletarOrdem,
      buscarOrdem,
      registrarPagamento,
      removerPagamento,
      itensFila: 0,
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
