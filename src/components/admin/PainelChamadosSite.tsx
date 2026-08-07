import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../db/supabase';
import { useClientes } from '../../context/ClientesContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  UserPlus,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Notificacao, useNotificacao } from '../common/Notificacao';

interface Chamado {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  contato: string;
  servicos_selecionados: string[];
  detalhes: string | null;
  status: 'pendente' | 'em_atendimento' | 'finalizado' | 'cancelado';
  empresa_id: string;
  criado_em: string;
}

export function PainelChamadosSite() {
  const { usuario } = useAuth();
  const { clientes, criarCliente } = useClientes();
  const { estado: notif, mostrar, fechar } = useNotificacao();

  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const carregarChamados = useCallback(async () => {
    if (!usuario?.empresaId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_servico')
        .select('*')
        .eq('empresa_id', usuario.empresaId)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setChamados(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar chamados:', err);
      mostrar({ tipo: 'erro', mensagem: 'Falha ao carregar chamados do site.' });
    } finally {
      setCarregando(false);
    }
  }, [usuario, mostrar]);

  // Realtime subscription to receive website leads instantly
  useEffect(() => {
    carregarChamados();

    if (usuario?.empresaId) {
      const channel = supabase
        .channel('realtime-chamados')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'solicitacoes_servico',
            filter: `empresa_id=eq.${usuario.empresaId}`
          },
          () => {
            carregarChamados();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [usuario, carregarChamados]);

  // Quick Action to update status of the ticket
  const handleAlterarStatus = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_servico')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      
      setChamados(prev => prev.map(c => c.id === id ? { ...c, status: novoStatus as any } : c));
      mostrar({ tipo: 'sucesso', mensagem: `Status atualizado para ${novoStatus.replace('_', ' ')}.` });
    } catch (err) {
      console.error('Erro ao alterar status do chamado:', err);
      mostrar({ tipo: 'erro', mensagem: 'Falha ao atualizar status do chamado.' });
    }
  };

  // Convert Lead to System Client with 1 click
  const handleConverterCliente = async (chamado: Chamado) => {
    setProcessandoId(chamado.id);
    try {
      // 1. Validar se CPF já está cadastrado no sistema
      const cleanCpf = chamado.cpf.replace(/\D/g, '');
      const jaExiste = clientes.some(c => c.cpf && c.cpf.replace(/\D/g, '') === cleanCpf);
      
      if (jaExiste) {
        mostrar({ tipo: 'erro', mensagem: 'Este CPF já está cadastrado em sua lista de clientes.' });
        setProcessandoId(null);
        return;
      }

      // 2. Criar cliente no banco via contexto
      await criarCliente({
        nome: chamado.nome.toUpperCase(),
        cpf: chamado.cpf,
        contato: chamado.contato,
        email: chamado.email.toLowerCase(),
        senhaGov: '',
        filiadoProTiro: false,
        clubeFiliado: '',
        observacoes: `CLIENTE CADASTRADO VIA SITE: Serviços solicitados:\n${chamado.servicos_selecionados.map(s => `- ${s}`).join('\n')}`,
        endereco: ''
      });

      // 3. Atualizar status do chamado para "em_atendimento"
      await handleAlterarStatus(chamado.id, 'em_atendimento');
      
      mostrar({ tipo: 'sucesso', mensagem: `Cliente ${chamado.nome} cadastrado e vinculado com sucesso!` });
    } catch (err: any) {
      console.error('Erro ao converter chamado em cliente:', err);
      mostrar({ 
        tipo: 'erro', 
        mensagem: err.message || 'Erro ao converter chamado em cliente. Verifique se o CPF é válido.' 
      });
    } finally {
      setProcessandoId(null);
    }
  };

  // Filtrar chamados
  const chamadosFiltrados = chamados.filter(c => {
    const atendeStatus = filtroStatus === 'todos' || c.status === filtroStatus;
    const atendeBusca = busca === '' || 
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpf.includes(busca) ||
      c.servicos_selecionados.some(s => s.toLowerCase().includes(busca.toLowerCase()));
    return atendeStatus && atendeBusca;
  });

  // Métricas
  const total = chamados.length;
  const pendentes = chamados.filter(c => c.status === 'pendente').length;
  const emAtendimento = chamados.filter(c => c.status === 'em_atendimento').length;
  const finalizados = chamados.filter(c => c.status === 'finalizado').length;

  return (
    <div className="space-y-6">
      
      <Notificacao estado={notif} onClose={fechar} />

      {/* Top Banner de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-brand-dark-3 border border-brand-dark-5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Geral</span>
            <span className="text-xl sm:text-2xl font-black text-white">{total}</span>
          </div>
          <div className="p-2 rounded-xl bg-gray-500/10 text-gray-400">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-brand-dark-3 border border-brand-dark-5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wider block">Pendentes</span>
            <span className="text-xl sm:text-2xl font-black text-yellow-400">{pendentes}</span>
          </div>
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-brand-dark-3 border border-brand-dark-5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-blue-light font-bold uppercase tracking-wider block">Em Atendimento</span>
            <span className="text-xl sm:text-2xl font-black text-brand-blue-light">{emAtendimento}</span>
          </div>
          <div className="p-2 rounded-xl bg-brand-blue/10 text-brand-blue-light">
            <MessageSquare size={20} />
          </div>
        </div>

        <div className="bg-brand-dark-3 border border-brand-dark-5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-green font-bold uppercase tracking-wider block">Finalizados</span>
            <span className="text-xl sm:text-2xl font-black text-brand-green">{finalizados}</span>
          </div>
          <div className="p-2 rounded-xl bg-brand-green/10 text-brand-green">
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Controles de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-dark-3 border border-brand-dark-5 rounded-2xl p-4">
        
        {/* Filtros em Abas */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'pendente', label: 'Pendente' },
            { id: 'em_atendimento', label: 'Em Atendimento' },
            { id: 'finalizado', label: 'Finalizado' },
            { id: 'cancelado', label: 'Cancelado' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroStatus(f.id)}
              className={`px-4 py-2 rounded-xl text-xs uppercase font-bold tracking-wider transition-all ${
                filtroStatus === f.id
                  ? 'bg-brand-blue/10 border border-brand-blue/30 text-brand-blue-light'
                  : 'bg-brand-dark hover:bg-brand-dark-2 text-gray-500 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou serviço..."
            className="w-full bg-brand-dark border border-brand-dark-5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue"
          />
        </div>
      </div>

      {/* Listagem de Chamados */}
      {carregando ? (
        <div className="py-24 text-center">
          <Loader2 className="animate-spin text-brand-blue mx-auto mb-4" size={32} />
          <p className="text-sm text-gray-500">Buscando solicitações do site...</p>
        </div>
      ) : chamadosFiltrados.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-brand-dark-5 rounded-2xl bg-brand-dark-3/10">
          <AlertCircle className="text-gray-500 mx-auto mb-3" size={36} />
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Nenhum chamado encontrado</p>
          <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
            Não há solicitações de serviços registradas do site que atendam aos filtros definidos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chamadosFiltrados.map((chamado) => {
            
            // Verificar se o chamado já existe cadastrado como Cliente no sistema
            const cleanCpf = chamado.cpf.replace(/\D/g, '');
            const clienteExistente = clientes.find(
              c => c.cpf && c.cpf.replace(/\D/g, '') === cleanCpf
            );

            // Formatação do status
            const statusStyle = {
              pendente: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
              em_atendimento: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue-light',
              finalizado: 'bg-brand-green/10 border-brand-green/20 text-brand-green',
              cancelado: 'bg-red-500/10 border-red-500/20 text-red-400'
            }[chamado.status];

            return (
              <div 
                key={chamado.id} 
                className="bg-brand-dark-3 border border-brand-dark-5 rounded-2xl p-5 flex flex-col justify-between hover:border-brand-dark-5/80 transition-all shadow-md"
              >
                <div>
                  
                  {/* Linha Superior: Data e Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(chamado.criado_em).toLocaleString('pt-BR')}
                    </span>

                    <div className="flex items-center gap-2">
                      {clienteExistente && (
                        <span className="bg-brand-green/10 border border-brand-green/20 text-brand-green text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wide">
                          Já é Cliente
                        </span>
                      )}
                      
                      {/* Dropdown de status simplificado */}
                      <div className="relative group">
                        <button className={`flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusStyle}`}>
                          {chamado.status.replace('_', ' ')}
                          <ChevronDown size={10} />
                        </button>
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-brand-dark border border-brand-dark-5 rounded-xl py-1.5 shadow-2xl z-20 w-40">
                          {['pendente', 'em_atendimento', 'finalizado', 'cancelado'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleAlterarStatus(chamado.id, st)}
                              className="w-full text-left px-3.5 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-brand-dark-2 uppercase tracking-wider"
                            >
                              {st.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nome e Info de Contato */}
                  <div className="mb-4">
                    <h3 className="font-bold text-base text-white uppercase tracking-tight">{chamado.nome}</h3>
                    <p className="text-xs text-gray-500 font-medium">CPF: {chamado.cpf}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-gray-400">
                      <a 
                        href={`https://wa.me/55${chamado.contato.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-brand-green transition-colors"
                      >
                        <Phone size={13} className="text-brand-green" />
                        {chamado.contato}
                      </a>
                      <a 
                        href={`mailto:${chamado.email}`}
                        className="flex items-center gap-1.5 hover:text-brand-blue-light transition-colors"
                      >
                        <Mail size={13} className="text-brand-blue-light" />
                        {chamado.email}
                      </a>
                    </div>
                  </div>

                  {/* Serviços Selecionados */}
                  <div className="mb-4">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Serviços Solicitados:</span>
                    <div className="flex flex-wrap gap-1">
                      {chamado.servicos_selecionados.map((s, idx) => (
                        <span key={idx} className="bg-brand-dark border border-brand-dark-5 text-gray-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Observações do Cliente */}
                  {chamado.detalhes && (
                    <div className="p-3 bg-brand-dark/30 border border-brand-dark-5 rounded-xl text-xs text-gray-400 italic mb-4 leading-relaxed">
                      "{chamado.detalhes}"
                    </div>
                  )}

                </div>

                {/* Linha de Ação Inferior */}
                <div className="border-t border-brand-dark-5/50 pt-4 mt-2 flex items-center justify-between">
                  {clienteExistente ? (
                    <a
                      href={`/clientes/${clienteExistente.id}`}
                      className="text-xs font-bold text-brand-blue-light hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      Ver perfil do cliente
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleConverterCliente(chamado)}
                      disabled={processandoId === chamado.id}
                      className="bg-brand-blue hover:bg-brand-blue-light disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
                    >
                      {processandoId === chamado.id ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          Cadastrar como Cliente
                        </>
                      )}
                    </button>
                  )}

                  {/* Atendimento no WhatsApp */}
                  <a
                    href={`https://wa.me/55${chamado.contato.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${chamado.nome}, recebemos sua solicitação de despachante bélico pelo Portal GCAC e gostaríamos de dar andamento.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-[#25D366] hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Iniciar no Whats
                    <ArrowRight size={12} />
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
