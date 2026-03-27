import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, X, Users, CheckCircle, ChevronDown, List, Trash2
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Orcamento, StatusOrcamento, ATALHOS_SERVICO } from '../../types';
import { useOrcamentos } from '../../context/OrcamentosContext';
import { useClientes } from '../../context/ClientesContext';
import { Cliente } from '../../types';
import { Notificacao, useNotificacao } from '../common/Notificacao';
import { formatarMoeda } from '../../utils/formatters';

interface FormularioOrcamentoProps {
  orcamentoExistente?: Orcamento;
}

// ── Dropdown de serviços (Simplificado) ──────────────────────────────────────────────────
function SeletorServico({ onSelecionar }: { onSelecionar: (s: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  const handleSelecionar = (servico: string) => {
    onSelecionar(servico);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-dark-5 border border-brand-dark-5 hover:border-brand-blue/40 hover:bg-brand-blue/10 text-gray-300 hover:text-brand-blue-light text-sm font-medium transition-all"
      >
        <List size={14} />
        Adicionar serviço
        <ChevronDown size={13} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-brand-dark-2 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="max-h-64 overflow-y-auto">
            {ATALHOS_SERVICO.map((servico, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelecionar(servico)}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-brand-blue/20 hover:text-white transition-colors border-b border-brand-dark-5/50 last:border-0"
              >
                {servico}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Formulário Principal ─────────────────────────────────────────────────
export function FormularioOrcamento({ orcamentoExistente }: FormularioOrcamentoProps) {
  const navigate = useNavigate();
  const { criarOrcamento, atualizarOrcamento } = useOrcamentos();
  const { clientes } = useClientes();
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [salvando, setSalvando] = useState(false);
  const [focoNome, setFocoNome] = useState(false);

  const [form, setForm] = useState({
    nomeCliente:       orcamentoExistente?.nomeCliente       ?? '',
    contato:           orcamentoExistente?.contato           ?? '',
    cpf:               orcamentoExistente?.cpf               ?? '',
    servicos:          orcamentoExistente?.servicos          ?? [],
    valorTotal:        orcamentoExistente?.valorTotal        ?? 0,
    status:            (orcamentoExistente?.status           ?? 'Pendente') as StatusOrcamento,
    observacoes:       orcamentoExistente?.observacoes       ?? '',
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  const atualizar = (campo: keyof typeof form, valor: any) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErros(e => { const novo = { ...e }; delete novo[campo]; return novo; });
  };

  const selecionarCliente = (c: Cliente) => {
    setForm(f => ({
      ...f,
      nomeCliente: c.nome,
      cpf: c.cpf,
      contato: c.contato
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

  const adicionarServico = (nomeServico: string) => {
    setForm(f => ({
      ...f,
      servicos: [
        ...f.servicos,
        { id: uuidv4(), nome: nomeServico, detalhes: '', valor: 0 }
      ]
    }));
    setErros(e => { const n = { ...e }; delete n['servicos']; return n; });
  };

  const atualizarValorServico = (id: string, textoValor: string) => {
    const limpo = textoValor.replace(/[^\d,]/g, '').replace(',', '.');
    const valorNumerico = parseFloat(limpo) || 0;
    
    setForm(f => {
      const novosServicos = f.servicos.map(s => s.id === id ? { ...s, valor: valorNumerico } : s);
      const novoTotal = novosServicos.reduce((acc, s) => acc + s.valor, 0);
      return { ...f, servicos: novosServicos, valorTotal: novoTotal };
    });
  };

  const atualizarDetalhesServico = (id: string, texto: string) => {
    setForm(f => ({
      ...f,
      servicos: f.servicos.map(s => s.id === id ? { ...s, detalhes: texto } : s)
    }));
  };

  const removerServico = (id: string) => {
    setForm(f => {
      const novosServicos = f.servicos.filter(s => s.id !== id);
      const novoTotal = novosServicos.reduce((acc, s) => acc + s.valor, 0);
      return { ...f, servicos: novosServicos, valorTotal: novoTotal };
    });
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.nomeCliente.trim()) e.nomeCliente = 'Nome é obrigatório';
    if (!form.contato.trim())     e.contato     = 'Contato é obrigatório';
    if (form.servicos.length === 0) e.servicos  = 'Adicione pelo menos um serviço';
    
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
        servicos:          form.servicos.map(s => ({ ...s, detalhes: s.detalhes.trim() })),
        valorTotal:        form.valorTotal,
        status:            form.status,
        observacoes:       form.observacoes.trim(),
      };

      if (orcamentoExistente) {
        await atualizarOrcamento(orcamentoExistente.id, dados);
        mostrar('sucesso', 'Orçamento atualizado com sucesso!');
        setTimeout(() => navigate(`/orcamentos/${orcamentoExistente.id}`), 1200);
      } else {
        const id = await criarOrcamento(dados);
        mostrar('sucesso', 'Orçamento criado com sucesso!');
        setTimeout(() => navigate(`/orcamentos/${id}`), 1200);
      }
    } catch {
      mostrar('erro', 'Erro ao salvar o orçamento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-20">
      {/* ── 1. Dados do Cliente ── */}
      <div className="card">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-blue/30 text-brand-blue-light text-xs flex items-center justify-center font-bold">1</span>
          Dados do Cliente
        </h3>
        <div className="space-y-4">
          <div className="relative">
            <label className="label label-required">Nome Completo</label>
            <input type="text" className={`input ${erros.nomeCliente ? 'input-error' : ''}`}
              placeholder="Nome completo do cliente" value={form.nomeCliente}
              onChange={e => atualizar('nomeCliente', e.target.value)}
              onFocus={() => setFocoNome(true)}
              onBlur={() => setTimeout(() => setFocoNome(false), 200)}
            />
            {erros.nomeCliente && <p className="text-red-400 text-xs mt-1">{erros.nomeCliente}</p>}
            
            {focoNome && clientesSugeridos.length > 0 && (
              <div className="absolute left-0 top-[70px] z-50 w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-2 border-b border-brand-dark-5 bg-brand-dark-4">
                  <p className="text-xs text-brand-blue-light px-1 font-semibold flex items-center gap-1.5"><Users size={12}/> Sugestões de clientes cadastrados</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label label-required">Contato (Telefone / WhatsApp)</label>
              <input type="tel" className={`input ${erros.contato ? 'input-error' : ''}`}
                placeholder="(00) 00000-0000" value={form.contato}
                onChange={e => handleTelefone(e.target.value)} />
              {erros.contato && <p className="text-red-400 text-xs mt-1">{erros.contato}</p>}
            </div>
            <div>
              <label className="label">CPF <span className="text-xs text-gray-500 font-normal">(Opcional)</span></label>
              <input type="text" className="input"
                placeholder="000.000.000-00" value={form.cpf}
                onChange={e => handleCPF(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Serviços e Valores ── */}
      <div className="card border-l-4 border-l-brand-green">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-green/30 text-brand-green-light text-xs flex items-center justify-center font-bold">2</span>
            Serviços do Orçamento
          </h3>
          <SeletorServico onSelecionar={adicionarServico} />
        </div>
        {erros.servicos && <p className="text-red-400 text-xs mt-1 mb-3">{erros.servicos}</p>}

        {form.servicos.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-brand-dark-5 rounded-xl">
            <List size={24} className="text-brand-dark-5 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Adicione os serviços para compor o orçamento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {form.servicos.map((serv) => (
              <div key={serv.id} className="relative bg-brand-dark-4 border border-brand-dark-5 p-4 rounded-xl animate-scale-up grid grid-cols-1 md:grid-cols-[1fr,150px] gap-4">
                <button
                  type="button"
                  onClick={() => removerServico(serv.id)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-red-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="pr-6">
                  <h4 className="text-sm font-bold text-brand-blue-light mb-2">
                    {serv.nome}
                  </h4>
                  <textarea
                    className="input text-sm resize-none bg-brand-dark-3 border-transparent focus:border-brand-blue/30 h-10 py-2.5"
                    placeholder="Detalhes adicionais do serviço..."
                    value={serv.detalhes}
                    onChange={e => atualizarDetalhesServico(serv.id, e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col justify-end">
                  <label className="text-xs font-semibold text-gray-400 mb-1">Valor Unitário</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-green/70 text-sm font-medium">R$</span>
                    <input type="text" inputMode="decimal"
                      className="input pl-9 border-brand-green/20 focus:border-brand-green focus:ring-1 focus:ring-brand-green/30 font-bold"
                      placeholder="0,00" 
                      value={serv.valor === 0 ? '' : String(serv.valor).replace('.', ',')}
                      onChange={e => atualizarValorServico(serv.id, e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Resumo e Status ── */}
      <div className="card bg-gradient-to-br from-brand-dark-3 to-brand-dark-4 border-t-4 border-t-yellow-500">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-yellow-500/30 text-yellow-400 text-xs flex items-center justify-center font-bold">3</span>
          Resumo e Status
        </h3>
        
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center p-4 bg-brand-dark-2 rounded-xl border border-brand-dark-5 mb-5">
          <div>
            <p className="text-sm font-medium text-gray-400">Valor Total do Orçamento</p>
            <p className="text-3xl font-black text-brand-green">{formatarMoeda(form.valorTotal)}</p>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="text-sm font-medium text-gray-400 block mb-2 text-left md:text-right">Status Atual</label>
            <div className="flex gap-2">
              {['Pendente', 'Aprovado', 'Recusado'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => atualizar('status', s)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                    form.status === s 
                    ? s === 'Aprovado' ? 'bg-brand-green/20 text-brand-green border-brand-green/50'
                      : s === 'Recusado' ? 'bg-red-500/20 text-red-400 border-red-500/50'
                      : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'
                    : 'bg-brand-dark-5 text-gray-400 border-transparent hover:bg-brand-dark-4'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Observações extras (Inclusas no orçamento final)</label>
          <textarea className="input resize-none h-24" placeholder="Ex: Prazo de validade 15 dias. Pagamento em até 3x no cartão..."
            value={form.observacoes}
            onChange={e => atualizar('observacoes', e.target.value)} />
        </div>
      </div>

      {/* ── Botões Abaixo ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark-2 border-t border-brand-dark-5 z-40 sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1 py-3 text-base">
            <X size={18} />Cancelar
          </button>
          <button type="submit" disabled={salvando} className="btn-primary flex-1 py-3 text-base bg-brand-green border-brand-green/60 hover:bg-brand-green/90 text-white shadow-[0_0_15px_rgba(109,190,69,0.3)]">
            <Save size={18} />
            {salvando ? 'Salvando...' : orcamentoExistente ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
          </button>
        </div>
      </div>

      <Notificacao {...notif} onFechar={fechar} />
    </form>
  );
}
