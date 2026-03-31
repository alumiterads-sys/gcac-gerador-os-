import React, { useState, useEffect } from 'react';
import { supabase } from '../../db/supabase';
import { Perfil } from '../../types';
import { 
  UserPlus, Search, Shield, ShieldOff, MessageCircle, 
  CheckCircle2, AlertCircle, Phone, Mail, Fingerprint, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function GestaoInstrutores() {
  const navigate = useNavigate();
  const [instrutores, setInstrutores] = useState<Perfil[]>([]);
  const [estaCarregando, setEstaCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [exibirModal, setExibirModal] = useState(false);
  
  const [novoInstrutor, setNovoInstrutor] = useState({
    nome: '',
    email: '',
    cpf: '',
    contato: '',
  });

  useEffect(() => {
    carregarInstrutores();
  }, []);

  async function carregarInstrutores() {
    setEstaCarregando(true);
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('role', 'instrutor')
      .order('nome');
    
    if (!error && data) {
      setInstrutores(data.map(row => ({
        id: row.id,
        nome: row.nome,
        email: row.email,
        cpf: row.cpf,
        contato: row.contato,
        role: row.role,
        ativo: row.ativo,
        statusPagamento: row.status_pagamento,
        criadoEm: row.criado_em
      })));
    }
    setEstaCarregando(false);
  }

  async function handleToggleAtivo(id: string, statusAtual: boolean) {
    const { error } = await supabase
      .from('perfis')
      .update({ ativo: !statusAtual })
      .eq('id', id);
    
    if (!error) carregarInstrutores();
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    // Como usamos login Google, o 'id' (sub) será preenchido no primeiro login.
    // Por enquanto, cadastramos com um ID temporário ou apenas o e-mail.
    // Opcional: Gerar um ID aleatório se for necessário para a PK.
    const { error } = await supabase
      .from('perfis')
      .insert([{
        id: `pendente_${Date.now()}`,
        ...novoInstrutor,
        role: 'instrutor',
        ativo: true,
        status_pagamento: 'em_dia'
      }]);
    
    if (!error) {
      setExibirModal(false);
      setNovoInstrutor({ nome: '', email: '', cpf: '', contato: '' });
      carregarInstrutores();
    } else {
      alert('Erro ao cadastrar: ' + error.message);
    }
  }

  const instrutoresFiltrados = instrutores.filter(i => 
    i.nome.toLowerCase().includes(busca.toLowerCase()) || 
    i.email.toLowerCase().includes(busca.toLowerCase()) ||
    i.cpf?.includes(busca)
  );

  const enviarCobranca = (instrutor: Perfil) => {
    const mensagem = encodeURIComponent(
      `Olá ${instrutor.nome}! Passando para lembrar sobre a mensalidade do sistema GCAC. \n\nVencimento: Dia 10 \nStatus: ${instrutor.statusPagamento === 'em_dia' ? 'Regular' : 'Pendente'} \n\nQualquer dúvida, estou à disposição!`
    );
    window.open(`https://wa.me/55${instrutor.contato?.replace(/\D/g, '')}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-brand-blue" size={28} />
            Gestão de Instrutores
          </h1>
          <p className="text-gray-500 text-sm mt-1">Controle de acessos, faturamento e produtividade</p>
        </div>
        <button 
          onClick={() => setExibirModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={20} /> Novo Instrutor
        </button>
      </div>

      <div className="bg-brand-dark-2 p-4 rounded-2xl border border-brand-dark-5 shadow-lg">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou CPF..."
            className="input pl-10 bg-brand-dark-3"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
      </div>

      {estaCarregando ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instrutoresFiltrados.map(instrutor => (
            <div key={instrutor.id} className="bg-brand-dark-2 border border-brand-dark-5 rounded-xl p-5 hover:border-brand-blue/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${instrutor.ativo ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-800 text-gray-500'}`}>
                    {instrutor.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{instrutor.nome}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-black">
                      <span className={`w-2 h-2 rounded-full ${instrutor.ativo ? 'bg-brand-green' : 'bg-red-500'}`} />
                      {instrutor.ativo ? 'Acesso Ativo' : 'Acesso Suspenso'}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleToggleAtivo(instrutor.id, instrutor.ativo)}
                  title={instrutor.ativo ? 'Suspender Acesso' : 'Reativar Acesso'}
                  className={`p-2 rounded-lg transition-colors ${instrutor.ativo ? 'text-red-400 hover:bg-red-400/10' : 'text-brand-green hover:bg-brand-green/10'}`}
                >
                  {instrutor.ativo ? <ShieldOff size={20} /> : <Shield size={20} />}
                </button>
              </div>

              <div className="space-y-2 mb-4 border-t border-brand-dark-5 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail size={14} className="text-brand-blue" /> {instrutor.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Fingerprint size={14} className="text-brand-blue" /> CPF: {instrutor.cpf}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone size={14} className="text-brand-blue" /> {instrutor.contato}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-brand-dark-5 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Faturamento</span>
                  <div className="flex items-center gap-2 mt-1">
                    {instrutor.statusPagamento === 'em_dia' ? (
                      <span className="flex items-center gap-1 text-brand-green text-xs font-bold bg-brand-green/10 px-2 py-1 rounded">
                        <CheckCircle2 size={12} /> EM DIA
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-400 text-xs font-bold bg-orange-400/10 px-2 py-1 rounded">
                        <AlertCircle size={12} /> PENDENTE
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => enviarCobranca(instrutor)}
                    className="p-2.5 bg-brand-dark-3 text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl transition-all border border-brand-blue/20"
                    title="Enviar Cobrança WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button 
                    onClick={() => navigate(`/agendamentos?instrutorId=${instrutor.id}`)}
                    className="p-2.5 bg-brand-dark-3 text-gray-400 hover:text-white rounded-xl transition-all border border-brand-dark-5"
                    title="Ver Agenda"
                  >
                    <Calendar size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro */}
      {exibirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-dark-2 w-full max-w-md rounded-2xl border border-brand-dark-5 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-6">Cadastrar Novo Instrutor</h2>
            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                <input 
                  type="text" required 
                  className="input h-11"
                  value={novoInstrutor.nome}
                  onChange={e => setNovoInstrutor({...novoInstrutor, nome: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">E-mail (Google)</label>
                  <input 
                    type="email" required
                    className="input h-11"
                    value={novoInstrutor.email}
                    onChange={e => setNovoInstrutor({...novoInstrutor, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp</label>
                  <input 
                    type="text" required
                    placeholder="(00) 00000-0000"
                    className="input h-11"
                    value={novoInstrutor.contato}
                    onChange={e => setNovoInstrutor({...novoInstrutor, contato: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
                <input 
                  type="text" required
                  placeholder="000.000.000-00"
                  className="input h-11"
                  value={novoInstrutor.cpf}
                  onChange={e => setNovoInstrutor({...novoInstrutor, cpf: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setExibirModal(false)}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
