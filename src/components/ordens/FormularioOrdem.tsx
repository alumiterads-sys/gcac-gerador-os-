import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, X, Eye, EyeOff, MessageCircle, Users, Phone, Search,
  Mail, HelpCircle, CheckCircle, ChevronDown, List, Trash2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  OrdemDeServico, STATUS_OS, FORMAS_PAGAMENTO, CANAIS_ATENDIMENTO,
  FormaPagamento, StatusOS, CanalAtendimento, ServicoConfig, StatusExecucaoServico,
  STATUS_EXECUCAO_SERVICO
} from '../../types';
import { useOrdens } from '../../context/OrdensContext';
import { useClientes } from '../../context/ClientesContext';
import { useServicos } from '../../context/ServicosContext';
import { Cliente } from '../../types';
import { Notificacao, useNotificacao } from '../common/Notificacao';
import { classeStatusExecucao, iconeStatusExecucao } from '../../utils/formatters';

interface FormularioOrdemProps {
  ordemExistente?: OrdemDeServico;
}

const ICONES_CANAL: Record<CanalAtendimento, React.ReactNode> = {
  'WhatsApp':   <MessageCircle size={14} />,
  'Presencial': <Users size={14} />,
  'Ligação':    <Phone size={14} />,
  'E-mail':     <Mail size={14} />,
  'Outro':      <HelpCircle size={14} />,
};

// Cores dos botões de status de pagamento
const ESTILO_STATUS: Record<StatusOS, string> = {
  'Aguardando Pagamento': 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300',
  'Gratuidade':           'bg-brand-blue/30 border-brand-blue/60 text-brand-blue-light',
  'Pago':                 'bg-brand-green/30 border-brand-green/60 text-brand-green-light',
};

// ── Dropdown de serviços ──────────────────────────────────────────────────
function SeletorServico({ onSelecionar }: { onSelecionar: (s: ServicoConfig) => void }) {
  const navigate = useNavigate();
  const { servicos } = useServicos();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setBusca('');
    }
  }, [aberto]);

  const handleSelecionar = (servico: ServicoConfig) => {
    onSelecionar(servico);
  };

  const servicosFiltrados = servicos.filter(s => 
    s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="btn-selecionar-servico"
        onClick={() => setAberto(a => !a)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-dark-5 border border-brand-dark-5 hover:border-brand-blue/40 hover:bg-brand-blue/10 text-gray-300 hover:text-brand-blue-light text-sm font-medium transition-all"
      >
        <List size={14} />
        Selecionar serviço
        <ChevronDown size={13} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-brand-dark-2 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-brand-dark-5 bg-brand-dark-3">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                ref={inputRef}
                type="text"
                className="w-full bg-brand-dark-4 border border-brand-dark-5 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue/50 transition-all font-medium"
                placeholder="Pesquisar serviço..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {servicosFiltrados.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500 mb-2">
                  {busca ? 'Nenhum serviço encontrado.' : 'Nenhum serviço cadastrado.'}
                </p>
                {!busca && (
                  <button
                    type="button"
                    onClick={() => navigate('/configuracoes')}
                    className="text-xs text-brand-blue-light hover:underline"
                  >
                    Cadastrar em Configurações
                  </button>
                )}
              </div>
            ) : (
              servicosFiltrados.map((servico) => (
                <button
                  key={servico.id}
                  type="button"
                  onClick={() => handleSelecionar(servico)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-brand-blue/20 hover:text-white transition-colors border-b border-brand-dark-5/50 last:border-0"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="pr-2 leading-relaxed">{servico.nome}</span>
                    <span className="text-[10px] bg-brand-dark-4 px-1.5 py-0.5 rounded text-brand-green flex-shrink-0 mt-0.5">
                      R$ {servico.valorPadrao.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Formulário Principal ─────────────────────────────────────────────────
export function FormularioOrdem({ ordemExistente }: FormularioOrdemProps) {
  const navigate = useNavigate();
  const { criarOrdem, atualizarOrdem } = useOrdens();
  const { clientes, criarCliente, atualizarCliente, buscarClientePorNomeExato, clubesRegistrados } = useClientes();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [salvando, setSalvando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [focoNome, setFocoNome] = useState(false);
  const [focoClube, setFocoClube] = useState(false);

  const [form, setForm] = useState({
    nomeCliente:       ordemExistente?.nomeCliente       ?? '',
    contato:           ordemExistente?.contato           ?? '',
    cpf:               ordemExistente?.cpf               ?? '',
    senhaGov:          ordemExistente?.senhaGov          ?? '',
    filiadoProTiro:    ordemExistente?.filiadoProTiro     ?? true,
    clubeFiliado:      ordemExistente?.clubeFiliado       ?? '',
    servicos:          ordemExistente?.servicos          ?? [],
    valor:             ordemExistente?.valor             ?? 0,
    valorTexto:        ordemExistente ? String(ordemExistente.valor).replace('.', ',') : '',
    formaPagamento:    (ordemExistente?.formaPagamento   ?? 'Pendente') as FormaPagamento,
    status:            (ordemExistente?.status           ?? 'Aguardando Pagamento') as StatusOS,
    canalAtendimento:  (ordemExistente?.canalAtendimento ?? null) as CanalAtendimento | null,
    observacaoContato: ordemExistente?.observacaoContato ?? '',
    observacoes:       ordemExistente?.observacoes       ?? '',
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  const atualizar = (campo: string, valor: string | number | boolean | null) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErros(e => { const novo = { ...e }; delete novo[campo]; return novo; });
  };

  const selecionarCliente = (c: Cliente) => {
    setForm(f => ({
      ...f,
      nomeCliente: c.nome,
      cpf: c.cpf,
      contato: c.contato,
      senhaGov: c.senhaGov,
      filiadoProTiro: c.filiadoProTiro,
      clubeFiliado: c.clubeFiliado
    }));
    setFocoNome(false);
  };

  const clientesSugeridos = clientes.filter(c => 
    c.nome.toLowerCase().includes(form.nomeCliente.toLowerCase()) && 
    form.nomeCliente.length > 0 && 
    c.nome.toLowerCase() !== form.nomeCliente.toLowerCase()
  );

  const handleCPF = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 11);
    const f = n.replace(/(\d{3})(\d)/, '$1.$2')
               .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
               .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    atualizar('cpf', f);
  };

  const handleTelefone = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 11);
    const f = n.length <= 10
      ? n.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      : n.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    atualizar('contato', f);
  };

  const handleValor = (v: string) => {
    const limpo = v.replace(/[^\d,]/g, '').replace(',', '.');
    atualizar('valorTexto', v.replace(/[^\d,]/g, ''));
    atualizar('valor', parseFloat(limpo) || 0);
  };

  const adicionarServico = (serv: ServicoConfig) => {
    // Escolhe o valor baseado no status de filiado
    const valorAplicado = form.filiadoProTiro ? (serv.valorFiliado || serv.valorPadrao) : serv.valorPadrao;

    const novosServicos = [
      ...form.servicos,
      { 
        id: uuidv4(), 
        nome: serv.nome, 
        detalhes: '', 
        taxaPF: serv.taxaPF, 
        valor: valorAplicado, 
        statusExecucao: 'Não Iniciado' as StatusExecucaoServico, 
        pagoGRU: false,
        categoria: serv.categoria || 'Honorário'
      }
    ];
    
    // Auto-preenchimento: recalcula o total somando todos os valores individuais
    const novoValor = novosServicos.reduce((acc: number, s: any) => acc + (s.valor || 0), 0);
    
    setForm(f => ({
      ...f,
      servicos: novosServicos,
      valor: novoValor,
      valorTexto: novoValor.toFixed(2).replace('.', ',')
    }));
    setErros(e => { const n = { ...e }; delete n['servicos']; delete n['valor']; return n; });
  };

  const atualizarDetalhesServico = (id: string, texto: string) => {
    setForm(f => ({
      ...f,
      servicos: f.servicos.map((s: any) => s.id === id ? { ...s, detalhes: texto } : s)
    }));
  };

  const atualizarValorServico = (id: string, novoValor: number) => {
    const novosServicosResource = (form.servicos as any[]).map((s: any) => s.id === id ? { ...s, valor: novoValor } : s);
    const totalNovo = novosServicosResource.reduce((acc: number, s: any) => acc + (s.valor || 0), 0);
    setForm(f => ({
      ...f,
      servicos: novosServicosResource,
      valor: totalNovo,
      valorTexto: totalNovo.toFixed(2).replace('.', ',')
    }));
    setErros(e => { const n = { ...e }; delete n['valor']; return n; });
  };

  const atualizarStatusServicoExec = (id: string, novoStatus: StatusExecucaoServico) => {
    setForm(f => ({
      ...f,
      servicos: (f.servicos as any[]).map((s: any) => s.id === id ? { ...s, statusExecucao: novoStatus } : s)
    }));
  };

  const atualizarGruServico = (id: string, pago: boolean) => {
    setForm(f => ({
      ...f,
      servicos: (f.servicos as any[]).map((s: any) => s.id === id ? { ...s, pagoGRU: pago } : s)
    }));
  };

  const removerServico = (id: string) => {
    const novosServicos = (form.servicos as any[]).filter((s: any) => s.id !== id);
    const totalNovo = novosServicos.reduce((acc: number, s: any) => acc + (s.valor || 0), 0);
    setForm(f => ({
      ...f,
      servicos: novosServicos,
      valor: totalNovo,
      valorTexto: totalNovo > 0 ? totalNovo.toFixed(2).replace('.', ',') : ''
    }));
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nomeCliente.trim()) e.nomeCliente = 'Nome é obrigatório';
    if (!form.contato.trim())     e.contato     = 'Contato é obrigatório';
    if (!form.cpf.trim())         e.cpf         = 'CPF é obrigatório';
    if (form.servicos.length === 0) e.servicos  = 'Adicione pelo menos um serviço';
    if (form.valor <= 0 && form.status !== 'Gratuidade')
                                  e.valor       = 'Informe o valor ou selecione "Gratuidade"';
    if (!form.filiadoProTiro && !form.clubeFiliado.trim())
                                  e.clubeFiliado = 'Informe o clube ao qual é filiado';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) { mostrar('erro', 'Corrija os campos destacados antes de salvar.'); return; }
    setSalvando(true);
    try {
      const dados = {
        nomeCliente:       form.nomeCliente.trim(),
        contato:           form.contato.trim(),
        cpf:               form.cpf.trim(),
        senhaGov:          form.senhaGov.trim(),
        filiadoProTiro:    form.filiadoProTiro,
        clubeFiliado:      form.filiadoProTiro ? '' : form.clubeFiliado.trim(),
        servicos:          (form.servicos as any[]).map((s: any) => ({ ...s, detalhes: (s.detalhes || '').trim() })),
        valor:             form.valor,
        taxaPFTotal:       (form.servicos as any[]).reduce((acc: number, s: any) => acc + (s.taxaPF || 0), 0),
        formaPagamento:    form.formaPagamento,
        status:            form.status,
        canalAtendimento:  form.canalAtendimento,
        observacaoContato: form.observacaoContato.trim(),
        observacoes:       form.observacoes.trim(),
      };

      // Salvamento silencioso do Cliente na agenda
      try {
        const clienteExistente = await buscarClientePorNomeExato(dados.nomeCliente);
        const payloadCli = {
          nome: dados.nomeCliente,
          cpf: dados.cpf,
          contato: dados.contato,
          senhaGov: dados.senhaGov,
          filiadoProTiro: dados.filiadoProTiro,
          clubeFiliado: dados.clubeFiliado
        };
        if (clienteExistente) {
          await atualizarCliente(clienteExistente.id, payloadCli);
        } else {
          await criarCliente(payloadCli);
        }
      } catch (err) {
        console.error('Erro silencioso ao salvar/atualizar cliente na agenda', err);
      }

      if (ordemExistente) {
        await atualizarOrdem(ordemExistente.id, dados);
        mostrar('sucesso', 'Ordem de Serviço atualizada com sucesso!');
        setTimeout(() => navigate(`/ordens/${ordemExistente.id}`), 1200);
      } else {
        const id = await criarOrdem(dados);
        mostrar('sucesso', 'Ordem de Serviço criada com sucesso!');
        setTimeout(() => navigate(`/ordens/${id}`), 1200);
      }
    } catch {
      mostrar('erro', 'Erro ao salvar a OS. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">

      {/* ── 1. Dados do Cliente ── */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-blue/30 text-brand-blue-light text-xs flex items-center justify-center font-bold">1</span>
          Dados do Cliente
        </h3>
        <div className="space-y-4">

          {/* Nome */}
          <div className="relative">
            <label className="label label-required">Nome Completo</label>
            <input id="campo-nome" type="text" className={`input uppercase ${erros.nomeCliente ? 'input-error' : ''}`}
              placeholder="Nome completo do cliente" value={form.nomeCliente}
              onChange={e => atualizar('nomeCliente', e.target.value.toUpperCase())}
              onFocus={() => setFocoNome(true)}
              onBlur={() => setTimeout(() => setFocoNome(false), 200)}
            />
            {erros.nomeCliente && <p className="text-red-400 text-xs mt-1">{erros.nomeCliente}</p>}
            
            {/* Dropdown de Autocomplete */}
            {focoNome && clientesSugeridos.length > 0 && (
              <div className="absolute left-0 top-[70px] z-50 w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-2 border-b border-brand-dark-5 bg-brand-dark-4">
                  <p className="text-xs text-brand-blue-light px-1 font-semibold flex items-center gap-1.5"><Users size={12}/> Sugestões da sua lista</p>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {clientesSugeridos.map(c => (
                    <div
                      key={c.id}
                      onClick={() => selecionarCliente(c)}
                      className="px-3 py-2 border-b border-brand-dark-5 hover:bg-brand-blue/20 cursor-pointer transition-colors"
                    >
                      <p className="text-sm font-bold text-white">{c.nome}</p>
                      <p className="text-xs text-gray-400">CPF: {c.cpf} | Tel: {c.contato}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contato + CPF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label label-required">Contato (Telefone / WhatsApp)</label>
              <input id="campo-contato" type="tel" className={`input ${erros.contato ? 'input-error' : ''}`}
                placeholder="(00) 00000-0000" value={form.contato}
                onChange={e => handleTelefone(e.target.value)} />
              {erros.contato && <p className="text-red-400 text-xs mt-1">{erros.contato}</p>}
            </div>
            <div>
              <label className="label label-required">CPF</label>
              <input id="campo-cpf" type="text" className={`input ${erros.cpf ? 'input-error' : ''}`}
                placeholder="000.000.000-00" value={form.cpf}
                onChange={e => handleCPF(e.target.value)} />
              {erros.cpf && <p className="text-red-400 text-xs mt-1">{erros.cpf}</p>}
            </div>
          </div>

          {/* Senha GOV */}
          <div>
            <label className="label">
              Senha GOV.br
              <span className="ml-2 text-xs text-brand-metal font-normal">🔒 uso interno</span>
            </label>
            <div className="relative">
              <input id="campo-senha-gov" type={mostrarSenha ? 'text' : 'password'}
                className="input pr-12" placeholder="Senha de acesso ao Gov.br"
                value={form.senhaGov} onChange={e => atualizar('senhaGov', e.target.value)} />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Filiado Pró-Tiro */}
          <div className="bg-brand-dark-4 rounded-xl p-4 border border-brand-dark-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Filiado Pró-Tiro?</p>
                <p className="text-xs text-gray-500 mt-0.5">Clube de Tiro e Caça Pró-Tiro, Jataí-GO</p>
              </div>
              {/* Toggle Sim / Não */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => atualizar('filiadoProTiro', true)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    form.filiadoProTiro
                      ? 'bg-brand-green/30 border-brand-green/60 text-brand-green-light'
                      : 'bg-brand-dark-5 border-brand-dark-5 text-gray-400 hover:border-brand-metal'
                  }`}
                >
                  {form.filiadoProTiro && <CheckCircle size={13} />}
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => atualizar('filiadoProTiro', false)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    !form.filiadoProTiro
                      ? 'bg-red-500/30 border-red-500/60 text-red-300'
                      : 'bg-brand-dark-5 border-brand-dark-5 text-gray-400 hover:border-brand-metal'
                  }`}
                >
                  {!form.filiadoProTiro && <X size={13} />}
                  Não
                </button>
              </div>
            </div>

            {/* Campo clube — aparece apenas se Não */}
            {!form.filiadoProTiro && (
              <div className="mt-3 pt-3 border-t border-brand-dark-5 animate-fade-in relative">
                <label className="label label-required">Qual clube é filiado?</label>
                <input
                  type="text"
                  className={`input uppercase ${erros.clubeFiliado ? 'input-error' : ''}`}
                  placeholder="Nome do clube de tiro onde é filiado..."
                  value={form.clubeFiliado}
                  onChange={e => atualizar('clubeFiliado', e.target.value.toUpperCase())}
                  onFocus={() => setFocoClube(true)}
                  onBlur={() => setTimeout(() => setFocoClube(false), 200)}
                />
                {erros.clubeFiliado && <p className="text-red-400 text-xs mt-1">{erros.clubeFiliado}</p>}

                {focoClube && clubesRegistrados.length > 0 && (
                  <div className="absolute left-0 top-[75px] z-50 w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    <div className="max-h-40 overflow-y-auto">
                      {clubesRegistrados
                        .filter(c => c.includes(form.clubeFiliado.toUpperCase()) || form.clubeFiliado === '')
                        .map(clube => (
                          <div
                            key={clube}
                            onClick={() => atualizar('clubeFiliado', clube)}
                            className="px-4 py-2.5 border-b border-brand-dark-5 hover:bg-brand-blue/20 cursor-pointer transition-colors text-sm text-white font-medium"
                          >
                            {clube}
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Descrição do Serviço ── */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-green/30 text-brand-green-light text-xs flex items-center justify-center font-bold">2</span>
          Descrição do Serviço
        </h3>

        {/* Dropdown de serviços */}
        <div className="mb-4">
          <SeletorServico onSelecionar={adicionarServico} />
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">💡 Clique para puxar o bloquinho (aceita múltiplos cliques seguidos)</p>
          {erros.servicos && <p className="text-red-400 text-xs mt-1">{erros.servicos}</p>}
        </div>

        {/* Lista de Blocos de Serviço */}
        <div className="space-y-4">
            {form.servicos.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-brand-dark-5 rounded-xl">
                <List size={24} className="text-brand-dark-5 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum serviço adicionado ainda.</p>
              </div>
            ) : (
              (form.servicos as any[]).map((serv: any, index: number) => (
                <div key={serv.id} className="relative bg-brand-dark-4 border border-brand-dark-5 p-4 rounded-xl animate-scale-up">
                  <button
                    type="button"
                    onClick={() => removerServico(serv.id)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remover Serviço"
                >
                  <Trash2 size={16} />
                </button>

                {/* Cabeçalho do card: nome + valor + status */}
                <div className="flex flex-col gap-3 mb-3 pr-8">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-brand-dark-5 text-gray-400 text-xs flex items-center justify-center font-bold flex-shrink-0">{index + 1}</span>
                    <h4 className="text-sm font-bold text-white flex-1 min-w-0 truncate">{serv.nome}</h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-gray-500 font-medium">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-20 text-right bg-brand-dark-3 border border-brand-dark-5 focus:border-brand-blue/50 rounded-lg px-2 py-1 text-sm font-bold text-brand-green-light outline-none transition-colors"
                        value={serv.valor ?? 0}
                        onChange={e => atualizarValorServico(serv.id, parseFloat(e.target.value) || 0)}
                        title="Editar valor deste serviço"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status Operacional:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_EXECUCAO_SERVICO.map((status: StatusExecucaoServico) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => atualizarStatusServicoExec(serv.id, status)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                            serv.statusExecucao === status
                              ? classeStatusExecucao(status)
                              : 'bg-brand-dark-3 border-brand-dark-5 text-gray-500 hover:border-brand-metal'
                          }`}
                          title={status}
                        >
                          <span>{iconeStatusExecucao(status)}</span>
                          <span className={serv.statusExecucao === status ? 'inline' : 'hidden sm:inline'}>
                            {status === 'Iniciado — Montando Processo' ? 'Iniciado' : 
                             status === 'Aguardando Documentos' ? 'Ag. Docs' :
                             status === 'Protocolado — Ag. PF' ? 'Protocolado' :
                             status === 'Não Iniciado' ? 'Não Iniciado' : status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Controle de GRU */}
                {(serv.taxaPF || 0) > 0 && (
                  <div className="mb-3 flex items-center gap-3 bg-brand-dark-3/50 p-2 rounded-lg border border-brand-dark-5/50">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-brand-dark-5 bg-brand-dark-4 text-brand-blue focus:ring-brand-blue/30"
                        checked={serv.pagoGRU || false}
                        onChange={e => atualizarGruServico(serv.id, e.target.checked)}
                      />
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">GRU (Taxa PF) - JÁ ESTÁ PAGA?</span>
                    </label>
                    {serv.pagoGRU ? (
                      <span className="text-[10px] font-black text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20 uppercase tracking-widest">Paga</span>
                    ) : (
                      <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20 uppercase tracking-widest">Pendente</span>
                    )}
                  </div>
                )}

                <textarea
                  className="input resize-none bg-brand-dark-3 border-transparent focus:border-brand-blue/30"
                  placeholder="Detalhes adicionais (opcional)... ex: num. de série, endereço..."
                  rows={2}
                  value={serv.detalhes}
                  onChange={e => atualizarDetalhesServico(serv.id, e.target.value)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 3. Valor e Pagamento ── */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-400 text-xs flex items-center justify-center font-bold">3</span>
          Valor e Pagamento
        </h3>
        {/* Resumo de Custos Informacional */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="p-2 bg-brand-dark-3 rounded border border-brand-dark-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Honorários</p>
            <p className="text-sm font-bold text-white">{formatarMoeda(form.servicos.filter(s => s.categoria !== 'Laudo').reduce((acc, s) => acc + (s.valor || 0), 0))}</p>
          </div>
          <div className="p-2 bg-brand-dark-3 rounded border border-brand-dark-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Laudos</p>
            <p className="text-sm font-bold text-white">{formatarMoeda(form.servicos.filter(s => s.categoria === 'Laudo').reduce((acc, s) => acc + (s.valor || 0), 0))}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Valor Final Sugerido (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">R$</span>
              <input id="campo-valor" type="text" inputMode="decimal"
                className={`input pl-9 ${erros.valor ? 'input-error' : ''}`}
                placeholder="0,00" value={form.valorTexto}
                onChange={e => handleValor(e.target.value)}
                disabled={form.status === 'Gratuidade'} />
            </div>
            {erros.valor && <p className="text-red-400 text-xs mt-1">{erros.valor}</p>}
          </div>
          <div>
            <label className="label label-required">Forma de Pagamento</label>
            <select id="campo-pagamento" className="select" value={form.formaPagamento}
              onChange={e => atualizar('formaPagamento', e.target.value as FormaPagamento)}
              disabled={form.status === 'Gratuidade'}>
              {FORMAS_PAGAMENTO.map((f: string) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Status de pagamento — 3 opções */}
        <div>
          <label className="label">Status do Pagamento</label>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OS.map((s: any) => (
              <button key={s} type="button"
                onClick={() => {
                  atualizar('status', s);
                  if (s === 'Aguardando Pagamento') {
                    atualizar('formaPagamento', 'Pendente');
                  }
                  if (s === 'Gratuidade') {
                    atualizar('valor', 0);
                    atualizar('valorTexto', '');
                    atualizar('formaPagamento', 'A Combinar');
                  }
                }}
                className={`py-2.5 px-2 rounded-lg text-sm font-semibold border transition-all text-center ${
                  form.status === s
                    ? ESTILO_STATUS[s as StatusOS]
                    : 'bg-brand-dark-4 border-brand-dark-5 text-gray-400 hover:border-brand-metal'
                }`}>
                {s}
              </button>
            ))}
          </div>
          {form.status === 'Gratuidade' && (
            <p className="text-xs text-brand-blue-light mt-2">
              💡 Gratuidade selecionada — valor zerado automaticamente
            </p>
          )}
        </div>
      </div>

      {/* ── 4. Canal de Atendimento ── */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-metal/30 text-brand-metal-light text-xs flex items-center justify-center font-bold">4</span>
          Canal de Atendimento
          <span className="text-xs text-gray-500 font-normal ml-1">— como o cliente entrou em contato?</span>
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {CANAIS_ATENDIMENTO.map((canal: string) => (
            <button key={canal} type="button"
              onClick={() => atualizar('canalAtendimento', form.canalAtendimento === canal ? null : canal as CanalAtendimento)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                form.canalAtendimento === canal
                  ? canal === 'WhatsApp'   ? 'bg-green-500/30 border-green-500/60 text-green-300'
                  : canal === 'Presencial' ? 'bg-brand-blue/30 border-brand-blue/60 text-brand-blue-light'
                  : canal === 'Ligação'    ? 'bg-purple-500/30 border-purple-500/60 text-purple-300'
                  : canal === 'E-mail'     ? 'bg-orange-500/30 border-orange-500/60 text-orange-300'
                  :                         'bg-brand-metal/30 border-brand-metal/60 text-gray-300'
                  : 'bg-brand-dark-4 border-brand-dark-5 text-gray-400 hover:border-brand-metal hover:text-gray-200'
              }`}>
              {ICONES_CANAL[canal as CanalAtendimento]}
              {canal}
            </button>
          ))}
        </div>

        <div>
          <label className="label">Observação do contato <span className="text-gray-500 font-normal text-xs">(opcional)</span></label>
          <input type="text" className="input"
            placeholder={
              form.canalAtendimento === 'WhatsApp'   ? 'Ex: confirmou via grupo, às 14h...'
            : form.canalAtendimento === 'Presencial' ? 'Ex: veio ao escritório, assinou contrato...'
            : form.canalAtendimento === 'Ligação'    ? 'Ex: ligou às 10h, confirmou o serviço...'
            : form.canalAtendimento === 'E-mail'     ? 'Ex: enviou documentos por e-mail...'
            : 'Detalhes sobre como o contato foi realizado...'
            }
            value={form.observacaoContato}
            onChange={e => atualizar('observacaoContato', e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="label">Observações gerais <span className="text-gray-500 font-normal text-xs">(opcional)</span></label>
          <textarea className="input resize-none" placeholder="Outras anotações relevantes para esta OS..."
            rows={3} value={form.observacoes}
            onChange={e => atualizar('observacoes', e.target.value)} />
        </div>
      </div>

      {/* ── Botões ── */}
      <div className="flex gap-3 pb-4">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">
          <X size={16} />Cancelar
        </button>
        <button type="submit" disabled={salvando} className="btn-primary flex-1">
          <Save size={16} />
          {salvando ? 'Salvando...' : ordemExistente ? 'Atualizar OS' : 'Criar OS'}
        </button>
      </div>

      <Notificacao {...notif} onFechar={fechar} />
    </form>
  );
}
