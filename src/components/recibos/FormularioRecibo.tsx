import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, X, Receipt, CheckCircle, ChevronDown, List, 
  Trash2, User, FileText, Search, CreditCard 
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useRecibos } from '../../context/RecibosContext';
import { useOrdens } from '../../context/OrdensContext';
import { useClientes } from '../../context/ClientesContext';
import { useServicos } from '../../context/ServicosContext';
import { OrdemDeServico, Recibo, Cliente, ServicoConfig } from '../../types';
import { Notificacao, useNotificacao } from '../common/Notificacao';
import { formatarMoeda } from '../../utils/formatters';

// Configurações do Emitente
const EMITENTE = {
  nome: 'GCAC DESPACHANTE BÉLICO', // Substitua pelo nome fantasia se necessário
  cnpj: '63.820.168/0001-63'
};

export function FormularioRecibo() {
  const navigate = useNavigate();
  const { criarRecibo } = useRecibos();
  const { ordens, atualizarOrdem } = useOrdens();
  const { clientes } = useClientes();
  const { servicos: servicosCadastrados } = useServicos();
  const { estado: notif, mostrar, fechar } = useNotificacao();

  const [cenario, setCenario] = useState<'os' | 'manual'>('os');
  const [salvando, setSalvando] = useState(false);
  const [focoCliente, setFocoCliente] = useState(false);

  const [form, setForm] = useState({
    clienteNome: '',
    clienteCPF: '',
    servicos: [] as any[],
    valorTotal: 0,
    ordemId: '',
    observacoes: ''
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  const atualizar = (campo: string, valor: any) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErros(e => { const novo = { ...e }; delete novo[campo]; return novo; });
  };

  // --- Cenário 1: Seleção de OS ---
  const ordensDisponiveis = ordens.filter(o => o.status === 'Aguardando Pagamento' || o.status === 'Pago');

  const selecionarOS = (id: string) => {
    const os = ordens.find(o => o.id === id);
    if (os) {
      setForm({
        clienteNome: os.nomeCliente,
        clienteCPF: os.cpf,
        servicos: os.servicos.map(s => ({
          id: uuidv4(),
          nome: s.nome,
          valor: s.valor || 0,
          detalhes: s.detalhes
        })),
        valorTotal: os.valor,
        ordemId: os.id,
        observacoes: os.observacoes
      });
    }
  };

  // --- Cenário 2: Manual ---
  const handleCPF = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 14);
    if (n.length <= 11) {
      const f = n.replace(/(\d{3})(\d)/, '$1.$2')
                   .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                   .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
      atualizar('clienteCPF', f);
    } else {
      const f = n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      atualizar('clienteCPF', f);
    }
  };

  const adicionarServico = (serv: ServicoConfig) => {
    const novosServicos = [
      ...form.servicos,
      { id: uuidv4(), nome: serv.nome, valor: serv.valorPadrao, detalhes: '' }
    ];
    const novoTotal = novosServicos.reduce((acc, s) => acc + s.valor, 0);
    setForm(f => ({ ...f, servicos: novosServicos, valorTotal: novoTotal }));
  };

  const removerServico = (id: string) => {
    const novosServicos = form.servicos.filter(s => s.id !== id);
    const novoTotal = novosServicos.reduce((acc, s) => acc + s.valor, 0);
    setForm(f => ({ ...f, servicos: novosServicos, valorTotal: novoTotal }));
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.clienteNome.trim()) e.clienteNome = 'Nome é obrigatório';
    if (!form.clienteCPF.trim()) e.clienteCPF = 'CPF/CNPJ é obrigatório';
    if (form.servicos.length === 0) e.servicos = 'Adicione pelo menos um serviço';
    if (form.valorTotal <= 0) e.valorTotal = 'O valor total deve ser maior que zero';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);

    try {
      const id = await criarRecibo({
        ...form,
        emitenteNome: EMITENTE.nome,
        emitenteCNPJ: EMITENTE.cnpj
      });

      // Se for vinculado a uma OS, perguntar e atualizar status
      if (form.ordemId) {
        const os = ordens.find(o => o.id === form.ordemId);
        if (os && os.status !== 'Pago') {
          if (confirm('Deseja marcar a Ordem de Serviço vinculada como "PAGO" automaticamente?')) {
            await atualizarOrdem(form.ordemId, { status: 'Pago' });
          }
        }
      }

      mostrar('sucesso', 'Recibo emitido com sucesso!');
      setTimeout(() => navigate(`/recibos/${id}`), 1200);
    } catch {
      mostrar('erro', 'Erro ao salvar o recibo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Seletor de Cenário */}
      <div className="flex p-1 bg-brand-dark-4 rounded-xl border border-brand-dark-5">
        <button
          onClick={() => { setCenario('os'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
            cenario === 'os' ? 'bg-brand-blue/30 text-brand-blue-light border border-brand-blue/30' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText size={16} /> Emitir de uma OS
        </button>
        <button
          onClick={() => { setCenario('manual'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all ${
            cenario === 'manual' ? 'bg-brand-green/30 text-brand-green-light border border-brand-green/30' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Receipt size={16} /> Emissão Livre
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Cliente */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-brand-blue-light" />
            Dados do Cliente
          </h3>

          <div className="space-y-4">
            {cenario === 'os' ? (
              <div>
                <label className="label label-required">Selecione a Ordem de Serviço</label>
                <select 
                  className={`select ${erros.ordemId ? 'border-red-500' : ''}`}
                  value={form.ordemId}
                  onChange={e => selecionarOS(e.target.value)}
                >
                  <option value="">Selecione uma OS pendente ou paga...</option>
                  {ordensDisponiveis.map(o => (
                    <option key={o.id} value={o.id}>
                      OS-{String(o.numero).padStart(4, '0')} — {o.nomeCliente} ({formatarMoeda(o.valor)}) {o.status === 'Pago' ? '✅' : ''}
                    </option>
                  ))}
                </select>
                {erros.ordemId && <p className="text-red-400 text-xs mt-1">{erros.ordemId}</p>}
                {ordensDisponiveis.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-2">Nenhuma OS com status "Aguardando Pagamento" ou "Pago" encontrada.</p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="label label-required">Nome do Cliente</label>
                  <input
                    type="text"
                    className={`input uppercase ${erros.clienteNome ? 'input-error' : ''}`}
                    placeholder="Nome completo ou Razão Social"
                    value={form.clienteNome}
                    onChange={e => atualizar('clienteNome', e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="label label-required">CPF ou CNPJ</label>
                  <input
                    type="text"
                    className={`input ${erros.clienteCPF ? 'input-error' : ''}`}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={form.clienteCPF}
                    onChange={e => handleCPF(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Serviços */}
        <div className="card">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <List size={18} className="text-brand-green-light" />
            Descrição dos Serviços
          </h3>

          {cenario === 'manual' && (
            <div className="mb-4">
              <SeletorServicoRapido onSelecionar={adicionarServico} servicos={servicosCadastrados} />
            </div>
          )}

          <div className="space-y-3">
            {form.servicos.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-brand-dark-5 rounded-xl text-gray-500 text-sm">
                Nenhum serviço adicionado.
              </div>
            ) : (
              form.servicos.map((s, index) => (
                <div key={s.id} className="p-3 bg-brand-dark-4 border border-brand-dark-5 rounded-lg flex items-center justify-between gap-4 animate-scale-up">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{s.nome}</p>
                    <p className="text-xs text-brand-green-light font-bold">{formatarMoeda(s.valor)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerServico(s.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-brand-dark-5 flex justify-between items-center">
            <span className="text-sm text-gray-400">Total do Recibo:</span>
            <span className="text-xl font-black text-brand-green-light">{formatarMoeda(form.valorTotal)}</span>
          </div>
        </div>

        {/* Observações */}
        <div className="card">
          <label className="label">Observações (opcional)</label>
          <textarea
            className="input resize-none"
            placeholder="Ex: Referente a parcela 1/2, desconto aplicado, etc..."
            rows={3}
            value={form.observacoes}
            onChange={e => atualizar('observacoes', e.target.value)}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost flex-1">
            <X size={16} /> Cancelar
          </button>
          <button type="submit" disabled={salvando} className="btn-primary flex-1">
            <Save size={16} />
            {salvando ? 'Emitindo...' : 'Emitir Recibo'}
          </button>
        </div>
      </form>

      <Notificacao {...notif} onFechar={fechar} />
    </div>
  );
}

// Sub-componente Seletor de Serviço Rápido
function SeletorServicoRapido({ onSelecionar, servicos }: { onSelecionar: (s: ServicoConfig) => void, servicos: ServicoConfig[] }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-dark-5 border border-brand-dark-5 hover:border-brand-blue/40 text-gray-300 text-xs font-bold transition-all"
      >
        <List size={14} /> Selecionar Serviço do Catálogo
        <ChevronDown size={14} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-brand-dark-2 border border-brand-dark-5 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-fade-in">
          {servicos.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onSelecionar(s); setAberto(false); }}
              className="w-full text-left px-3 py-2.5 text-xs text-gray-200 hover:bg-brand-blue/20 transition-colors border-b border-brand-dark-5/50 last:border-0 flex justify-between items-center"
            >
              <span>{s.nome}</span>
              <span className="text-brand-green font-bold">{formatarMoeda(s.valorPadrao)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
