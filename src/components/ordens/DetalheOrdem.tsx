import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, FileDown, Printer, Cloud, CloudOff, CheckCircle, MessageCircle, Users, Phone, Mail, HelpCircle, ChevronDown } from 'lucide-react';
import { 
  OrdemDeServico, CanalAtendimento, STATUS_EXECUCAO_SERVICO, 
  StatusExecucaoServico, StatusOS, FormaPagamento, STATUS_OS, FORMAS_PAGAMENTO 
} from '../../types';
import { useOrdens } from '../../context/OrdensContext';
import { useAuth } from '../../context/AuthContext';
import { baixarPdf, imprimirPdf } from '../../services/geradorPdf';
import { sincronizarOrdem } from '../../services/driveSync';
import { DialogConfirmacao } from '../common/DialogConfirmacao';
import { Notificacao, useNotificacao } from '../common/Notificacao';
import { formatarMoeda, formatarData, formatarDataHora, formatarNumeroOS, classeStatus, classeStatusExecucao, iconeStatusExecucao, calcularProgressoServicos } from '../../utils/formatters';

interface DetalheOrdemProps {
  ordem: OrdemDeServico;
}

export function DetalheOrdem({ ordem }: DetalheOrdemProps) {
  const navigate = useNavigate();
  const { deletarOrdem, atualizarStatusServico, atualizarOrdem, atualizarGruServico } = useOrdens();
  const { estaAutenticado } = useAuth();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [confirmandoDelete, setConfirmandoDelete] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [statusAberto, setStatusAberto] = useState<string | null>(null);
  const [dropdownPagoAberto, setDropdownPagoAberto] = useState(false);
  const [dropdownFormaAberto, setDropdownFormaAberto] = useState(false);

  const servicos = ordem.servicos || [];
  const totalServicos = servicos.length;
  const servicosConcluidos = servicos.filter(s => s.statusExecucao === 'Concluído').length;
  const progresso = calcularProgressoServicos(servicos);

  const handleBaixarPdf = async () => {
    setGerandoPdf(true);
    try {
      await baixarPdf(ordem);
      mostrar('sucesso', 'PDF gerado e baixado com sucesso!');
    } catch {
      mostrar('erro', 'Erro ao gerar o PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleImprimir = async () => {
    setImprimindo(true);
    try {
      await imprimirPdf(ordem);
    } catch {
      mostrar('erro', 'Erro ao abrir a impressão.');
    } finally {
      setImprimindo(false);
    }
  };

  const handleSincronizar = async () => {
    if (!estaAutenticado) {
      mostrar('aviso', 'Faça login com o Google para sincronizar com o Drive.');
      return;
    }
    setSincronizando(true);
    try {
      const ok = await sincronizarOrdem(ordem);
      if (ok) {
        mostrar('sucesso', 'OS sincronizada com o Google Drive com sucesso!');
      } else {
        mostrar('erro', 'Falha na sincronização. Verifique sua conexão ou o login Google.');
      }
    } finally {
      setSincronizando(false);
    }
  };

  const handleDeletar = async () => {
    await deletarOrdem(ordem.id);
    navigate('/ordens');
  };

  const handleMudarStatus = async (servicoId: string, novoStatus: StatusExecucaoServico) => {
    try {
      await atualizarStatusServico(ordem.id, servicoId, novoStatus);
      setStatusAberto(null);
    } catch {
      mostrar('erro', 'Erro ao atualizar o status do serviço.');
    }
  };

  const handleMudarStatusOS = async (novoStatus: StatusOS) => {
    try {
      const dados: Partial<OrdemDeServico> = { status: novoStatus };
      if (novoStatus === 'Aguardando Pagamento') dados.formaPagamento = 'Pendente';
      if (novoStatus === 'Gratuidade') dados.formaPagamento = 'A Combinar';
      
      await atualizarOrdem(ordem.id, dados);
      setDropdownPagoAberto(false);
      mostrar('sucesso', 'Status da OS atualizado!');
    } catch {
      mostrar('erro', 'Erro ao atualizar o status da OS.');
    }
  };

  const handleMudarFormaPagamento = async (novaForma: FormaPagamento) => {
    try {
      await atualizarOrdem(ordem.id, { formaPagamento: novaForma });
      setDropdownFormaAberto(false);
      mostrar('sucesso', 'Forma de pagamento atualizada!');
    } catch {
      mostrar('erro', 'Erro ao atualizar a forma de pagamento.');
    }
  };

  const handleToggleGru = async (servicoId: string, pagoAtual: boolean) => {
    try {
      await atualizarGruServico(ordem.id, servicoId, !pagoAtual);
      mostrar('sucesso', `Status da GRU atualizado para ${!pagoAtual ? 'Paga' : 'Pendente'}`);
    } catch {
      mostrar('erro', 'Erro ao atualizar o status da GRU.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{formatarNumeroOS(ordem.numero)}</h1>
            <p className="text-sm text-gray-400">Criado em {formatarData(ordem.criadoEm)}</p>
          </div>
        </div>
        
        {/* Dropdown Status de Pagamento */}
        <div className="relative">
          <button 
            onClick={() => setDropdownPagoAberto(!dropdownPagoAberto)}
            className={`${classeStatus(ordem.status)} cursor-pointer flex items-center gap-2 hover:brightness-110 transition-all`}
          >
            {ordem.status}
            <ChevronDown size={14} className={`transition-transform ${dropdownPagoAberto ? 'rotate-180' : ''}`} />
          </button>

          {dropdownPagoAberto && (
            <div className="absolute right-0 top-full mt-1 z-30 w-48 bg-brand-dark-2 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden py-1 animate-scale-up">
              {STATUS_OS.map(s => (
                <button
                  key={s}
                  onClick={() => handleMudarStatusOS(s)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                    ordem.status === s 
                      ? 'bg-brand-blue/20 text-brand-blue-light' 
                      : 'text-gray-400 hover:bg-brand-dark-5 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Ações ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button onClick={handleBaixarPdf} disabled={gerandoPdf} className="btn-ghost btn-sm justify-center">
          <FileDown size={15} />
          {gerandoPdf ? 'Gerando...' : 'Baixar PDF'}
        </button>
        <button onClick={handleImprimir} disabled={imprimindo} className="btn-ghost btn-sm justify-center">
          <Printer size={15} />
          {imprimindo ? 'Abrindo...' : 'Imprimir'}
        </button>
        <button onClick={() => navigate(`/ordens/${ordem.id}/editar`)} className="btn-ghost btn-sm justify-center">
          <Edit size={15} />
          Editar
        </button>
        <button onClick={() => setConfirmandoDelete(true)} className="btn btn-sm bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/30 justify-center">
          <Trash2 size={15} />
          Excluir
        </button>
      </div>

      {/* ── Status de Sync ── */}
      <div className="card flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {ordem.ultimaSincronizacao ? (
            <>
              <CheckCircle size={18} className="text-brand-green" />
              <div>
                <p className="text-sm font-medium text-white">Sincronizado com o Google Drive</p>
                <p className="text-xs text-gray-400">Último sync: {formatarDataHora(ordem.ultimaSincronizacao)}</p>
              </div>
            </>
          ) : (
            <>
              <CloudOff size={18} className="text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Aguardando sincronização</p>
                <p className="text-xs text-gray-400">Sincronize manualmente ou aguarde conexão</p>
              </div>
            </>
          )}
        </div>
        <button onClick={handleSincronizar} disabled={sincronizando} className="btn-ghost btn-sm">
          <Cloud size={14} />
          {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {/* ── Dados do Cliente ── */}
      <div className="card">
        <h3 className="text-sm font-bold text-brand-blue-light uppercase tracking-wider mb-4">Dados do Cliente</h3>
        <dl className="space-y-3">
          <CampoDetalhe rotulo="Nome" valor={ordem.nomeCliente} />
          <CampoDetalhe rotulo="CPF" valor={ordem.cpf} />
          <CampoDetalhe rotulo="Contato" valor={ordem.contato} />
          <CampoDetalhe rotulo="Senha GOV.br" valor={ordem.senhaGov} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
              {ordem.filiadoProTiro ? 'Pró-Tiro' : 'Clube Filiado'}
            </dt>
            <dd>
              {ordem.filiadoProTiro
                ? <span className="text-sm font-semibold text-brand-green-light">✓ Filiado Pró-Tiro</span>
                : <span className="text-sm text-gray-200">{ordem.clubeFiliado || 'Não informado'}</span>
              }
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Serviço ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-brand-green-light uppercase tracking-wider">Descrição do Serviço</h3>
          <span className="text-xs font-bold text-gray-400 bg-brand-dark-4 px-2 py-1 rounded">
            {servicosConcluidos} / {totalServicos} Concluídos
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2.5 bg-brand-dark-4 rounded-full overflow-hidden border border-brand-dark-5 shadow-inner">
            <div 
              className={`h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(109,190,69,0.3)] ${
                progresso === 100 ? 'bg-brand-green' : 'bg-brand-blue'
              }`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <span className={`text-xs font-black min-w-[32px] text-right ${progresso === 100 ? 'text-brand-green' : 'text-brand-blue-light'}`}>
            {progresso}%
          </span>
        </div>
        
        {servicos && servicos.length > 0 ? (
          <div className="space-y-3">
            {servicos.map((serv) => (
              <div key={serv.id} className="bg-brand-dark-4 rounded-lg p-4 border border-brand-dark-5 relative">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex flex-col items-start gap-1">
                    <p className="font-bold text-white text-base leading-tight">• {serv.nome}</p>
                    
                    {/* Selo de GRU */}
                    {(serv.taxaPF || 0) > 0 && (
                      <button
                        onClick={() => handleToggleGru(serv.id, !!serv.pagoGRU)}
                        className={`text-[9px] font-black px-2 py-0.5 rounded border transition-all uppercase tracking-widest flex items-center gap-1 ${
                          serv.pagoGRU 
                            ? 'bg-brand-green/10 text-brand-green border-brand-green/20 hover:bg-brand-green/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                        title={serv.pagoGRU ? 'Clique para marcar como Pendente' : 'Clique para marcar como Paga'}
                      >
                        {serv.pagoGRU ? (
                          <><span>✅</span> GRU PAGA</>
                        ) : (
                          <><span>❌</span> GRU PENDENTE</>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de status */}
                  <div className="relative flex-shrink-0">
                    <button 
                      onClick={() => setStatusAberto(statusAberto === serv.id ? null : serv.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-wider ${classeStatusExecucao(serv.statusExecucao)}`}
                    >
                      <span>{iconeStatusExecucao(serv.statusExecucao)}</span>
                      <span>{serv.statusExecucao || 'Não Iniciado'}</span>
                      <ChevronDown size={12} className={`transition-transform ${statusAberto === serv.id ? 'rotate-180' : ''}`} />
                    </button>

                    {statusAberto === serv.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-brand-dark-2 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden py-1 animate-scale-up">
                        {STATUS_EXECUCAO_SERVICO.map(s => (
                          <button
                            key={s}
                            onClick={() => handleMudarStatus(serv.id, s)}
                            className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors flex items-center gap-2 ${
                              serv.statusExecucao === s 
                                ? 'bg-brand-blue/20 text-brand-blue-light' 
                                : 'text-gray-400 hover:bg-brand-dark-5 hover:text-white'
                            }`}
                          >
                            <span className="text-sm">{iconeStatusExecucao(s)}</span>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {serv.detalhes.trim() && (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap pl-4 border-l-2 border-brand-dark-5 mt-2">
                    {serv.detalhes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed bg-brand-dark-4 rounded-lg p-4 border border-brand-dark-5">
            {/* Fallback caso antiga O.S. tenha texto legado */}
            {(ordem as any).servico || 'Nenhum serviço registrado.'}
          </p>
        )}
      </div>

      {/* ── Valor e Pagamento ── */}
      <div className="card">
        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4">Valores e Pagamento</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-dark-4 rounded-lg p-4 border border-brand-dark-5">
            <p className="text-xs text-gray-500 mb-1">VALOR</p>
            <p className="text-2xl font-bold text-brand-green">{formatarMoeda(ordem.valor)}</p>
          </div>
          <div className="bg-brand-dark-4 rounded-lg p-4 border border-brand-dark-5 relative">
            <p className="text-xs text-gray-500 mb-1">FORMA DE PAGAMENTO</p>
            
            <button 
              onClick={() => setDropdownFormaAberto(!dropdownFormaAberto)}
              className="group flex items-center gap-2 text-lg font-bold text-white hover:text-brand-blue-light transition-colors text-left"
            >
              {ordem.formaPagamento}
              <ChevronDown size={16} className={`text-gray-500 group-hover:text-brand-blue-light transition-all ${dropdownFormaAberto ? 'rotate-180' : ''}`} />
            </button>

            {dropdownFormaAberto && (
              <div className="absolute left-0 bottom-full mb-1 z-30 w-52 bg-brand-dark-2 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden py-1 animate-scale-up">
                {FORMAS_PAGAMENTO.map(f => (
                  <button
                    key={f}
                    onClick={() => handleMudarFormaPagamento(f)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                      ordem.formaPagamento === f 
                        ? 'bg-brand-blue/20 text-brand-blue-light' 
                        : 'text-gray-400 hover:bg-brand-dark-5 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Observações ── */}
      {ordem.observacoes && (
        <div className="card">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Observações</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{ordem.observacoes}</p>
        </div>
      )}

      {/* ── Canal de Atendimento ── */}
      {(ordem.canalAtendimento || ordem.observacaoContato) && (
        <div className="card">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Canal de Atendimento</h3>
          <div className="flex flex-col gap-2">
            {ordem.canalAtendimento && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold w-fit ${
                ordem.canalAtendimento === 'WhatsApp'   ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : ordem.canalAtendimento === 'Presencial' ? 'bg-brand-blue/20 text-brand-blue-light border border-brand-blue/30'
              : ordem.canalAtendimento === 'Ligação'    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : ordem.canalAtendimento === 'E-mail'     ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              :                                           'bg-brand-metal/20 text-gray-300 border border-brand-metal/30'
              }`}>
                <CanalIcone canal={ordem.canalAtendimento} />
                {ordem.canalAtendimento}
              </div>
            )}
            {ordem.observacaoContato && (
              <p className="text-sm text-gray-300">{ordem.observacaoContato}</p>
            )}
          </div>
        </div>
      )}

      <Notificacao {...notif} onFechar={fechar} />
      <DialogConfirmacao
        aberto={confirmandoDelete}
        titulo="Excluir Ordem de Serviço"
        mensagem={`Tem certeza que deseja excluir a ${formatarNumeroOS(ordem.numero)}? Esta ação não pode ser desfeita.`}
        textoBotaoConfirmar="Sim, excluir"
        onConfirmar={handleDeletar}
        onCancelar={() => setConfirmandoDelete(false)}
      />
    </div>
  );
}

function CanalIcone({ canal }: { canal: CanalAtendimento }) {
  switch (canal) {
    case 'WhatsApp':   return <MessageCircle size={14} />;
    case 'Presencial': return <Users size={14} />;
    case 'Ligação':    return <Phone size={14} />;
    case 'E-mail':     return <Mail size={14} />;
    default:           return <HelpCircle size={14} />;
  }
}

function CampoDetalhe({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">{rotulo}</dt>
      <dd className="text-sm text-gray-200 font-medium">{valor || '—'}</dd>
    </div>
  );
}
