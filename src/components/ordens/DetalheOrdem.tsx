import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, FileDown, Printer, Cloud, CloudOff, CheckCircle, MessageCircle, Users, Phone, Mail, HelpCircle } from 'lucide-react';
import { OrdemDeServico, CanalAtendimento } from '../../types';
import { useOrdens } from '../../context/OrdensContext';
import { useAuth } from '../../context/AuthContext';
import { baixarPdf, imprimirPdf } from '../../services/geradorPdf';
import { sincronizarOrdem } from '../../services/driveSync';
import { DialogConfirmacao } from '../common/DialogConfirmacao';
import { Notificacao, useNotificacao } from '../common/Notificacao';
import { formatarMoeda, formatarData, formatarDataHora, formatarNumeroOS, classeStatus } from '../../utils/formatters';

interface DetalheOrdemProps {
  ordem: OrdemDeServico;
}

export function DetalheOrdem({ ordem }: DetalheOrdemProps) {
  const navigate = useNavigate();
  const { deletarOrdem } = useOrdens();
  const { estaAutenticado } = useAuth();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [confirmandoDelete, setConfirmandoDelete] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

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
        <span className={classeStatus(ordem.status)}>{ordem.status}</span>
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
        <h3 className="text-sm font-bold text-brand-green-light uppercase tracking-wider mb-4">Descrição do Serviço</h3>
        
        {ordem.servicos && ordem.servicos.length > 0 ? (
          <div className="space-y-3">
            {ordem.servicos.map((serv) => (
              <div key={serv.id} className="bg-brand-dark-4 rounded-lg p-4 border border-brand-dark-5">
                <p className="font-bold text-white text-base mb-1">• {serv.nome}</p>
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
          <div className="bg-brand-dark-4 rounded-lg p-4 border border-brand-dark-5">
            <p className="text-xs text-gray-500 mb-1">FORMA DE PAGAMENTO</p>
            <p className="text-lg font-bold text-white">{ordem.formaPagamento}</p>
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
