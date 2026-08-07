import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Send, ShieldCheck, ChevronRight, FileText, Landmark, Compass, HelpCircle } from 'lucide-react';
import { supabase } from '../db/supabase';

// Lista estruturada dos serviços categorizados
const CATEGORIAS_SERVICOS = [
  {
    id: 'cr_clube',
    titulo: 'Certificado de Registro (CR) & Clube',
    icone: Landmark,
    cor: 'text-brand-blue',
    bg: 'bg-brand-blue/10',
    servicos: [
      { id: 'concessao_cr', nome: 'Concessão de CR (Atirador desportivo, caçador e colecionador)' },
      { id: 'progressao_nivel', nome: 'Progressão de nível para atirador desportivo' },
      { id: 'filiacao_clube', nome: 'Filiação a um clube de tiro e caça' }
    ]
  },
  {
    id: 'armas_trafego',
    titulo: 'Armas & Tráfego (Exército / SIGMA)',
    icone: Compass,
    cor: 'text-brand-green',
    bg: 'bg-brand-green/10',
    servicos: [
      { id: 'registro_arma', nome: 'Registro de arma de fogo' },
      { id: 'renovacao_craf', nome: 'Renovação de CRAF' },
      { id: 'transferencia_proprietario', nome: 'Transferência de proprietário de arma de fogo' },
      { id: 'mudanca_acervo', nome: 'Mudança de acervo' },
      { id: 'solicitacao_gt', nome: 'Solicitação de guia de tráfego (GT)' }
    ]
  },
  {
    id: 'enderecos',
    titulo: 'Endereços de Acervo',
    icone: FileText,
    cor: 'text-purple-400',
    bg: 'bg-purple-500/10',
    servicos: [
      { id: 'atualizacao_endereco', nome: 'Atualização de endereço' },
      { id: 'atualizacao_endereco_acervo', nome: 'Atualização de endereço de acervo' },
      { id: 'inclusao_segundo_endereco', nome: 'Inclusão de segundo endereço de acervo' }
    ]
  },
  {
    id: 'ibama',
    titulo: 'Documentos do IBAMA',
    icone: ShieldCheck,
    cor: 'text-orange-400',
    bg: 'bg-orange-500/10',
    servicos: [
      { id: 'cr_ibama', nome: 'Emissão do Certificado de regularidade (CR) IBAMA' },
      { id: 'manejo_javali', nome: 'Autorização de manejo de fauna exótica invasora (JAVALI)' },
      { id: 'acesso_propriedade', nome: 'Emissão de autorização de acesso a propriedade rural' }
    ]
  }
];

export function SolicitarServicoPage() {
  const navigate = useNavigate();
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [detalhes, setDetalhes] = useState('');

  // Estados do processo
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  // Máscara para CPF (999.999.999-99)
  const aplicarMascaraCPF = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 3) formatted = `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length > 6) formatted = `${formatted.slice(0, 7)}.${clean.slice(6)}`;
    if (clean.length > 9) formatted = `${formatted.slice(0, 11)}-${clean.slice(9, 11)}`;
    setCpf(formatted.slice(0, 14));
  };

  // Máscara para WhatsApp ((99) 99999-9999)
  const aplicarMascaraWhats = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length > 7) formatted = `${formatted.slice(0, 10)}-${clean.slice(7, 11)}`;
    setWhatsapp(formatted.slice(0, 15));
  };

  // Lógica de seleção do checkbox
  const handleToggleServico = (id: string) => {
    setServicosSelecionados(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Encontrar o nome legível dos serviços selecionados
  const obterNomesServicosSelecionados = () => {
    const nomes: string[] = [];
    CATEGORIAS_SERVICOS.forEach(cat => {
      cat.servicos.forEach(serv => {
        if (servicosSelecionados.includes(serv.id)) {
          nomes.push(serv.nome);
        }
      });
    });
    return nomes;
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (servicosSelecionados.length === 0) {
      setErro('Por favor, selecione pelo menos um serviço da lista ao lado.');
      return;
    }
    if (!nome || !cpf || !whatsapp || !email) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setCarregando(true);
    setErro('');

    const nomesServicos = obterNomesServicosSelecionados();

    try {
      // 1. Salvar no Supabase
      const { error: dbError } = await supabase
        .from('solicitacoes_servico')
        .insert([{
          nome,
          cpf,
          email,
          contato: whatsapp,
          servicos_selecionados: nomesServicos,
          detalhes: detalhes || null,
          empresa_id: '00000000-0000-0000-0000-000000000001' // ID do escritório principal
        }]);

      if (dbError) throw dbError;

      // 2. Se salvou no banco, preparar para abrir o WhatsApp
      setSucesso(true);
      setCarregando(false);

      // Criar mensagem do WhatsApp formatada
      const listaText = nomesServicos.map(n => `• ${n}`).join('\n');
      const msgText = `Olá! Solicitei atendimento de despachante pelo Portal GCAC.\n\n` +
                      `*Meus Dados:*\n` +
                      `Nome: ${nome}\n` +
                      `CPF: ${cpf}\n` +
                      `E-mail: ${email}\n` +
                      `WhatsApp: ${whatsapp}\n\n` +
                      `*Serviço(s) solicitado(s):*\n${listaText}\n\n` +
                      (detalhes ? `*Observações:* ${detalhes}\n\n` : '') +
                      `Aguardo o retorno para darmos início ao processo. Obrigado!`;

      const encodedMsg = encodeURIComponent(msgText);
      const urlWhats = `https://wa.me/5564999959865?text=${encodedMsg}`;

      // Abrir aba do WhatsApp após um breve intervalo para o usuário visualizar o sucesso
      setTimeout(() => {
        window.open(urlWhats, '_blank');
      }, 1500);

    } catch (err: any) {
      console.error('Erro ao enviar solicitação:', err);
      setErro('Erro ao registrar solicitação. Por favor, tente novamente ou fale conosco diretamente.');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col relative overflow-hidden">
      
      {/* Glows de Fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 right-0 w-80 h-80 rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute -bottom-40 left-0 w-96 h-96 rounded-full bg-brand-blue/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="border-b border-brand-dark-5/50 bg-brand-dark-2/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            Voltar para Home
          </button>
          
          <div className="flex items-center gap-3">
            <img 
              src="/usar no site/DESPACHANTE BÉLICO.png" 
              alt="GCAC Despachante Logo" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <span className="text-sm font-black tracking-wider block">GCAC DESPACHANTE BÉLICO</span>
              <span className="block text-[8px] text-brand-green font-bold tracking-widest uppercase">Assessoria Documental Especializada</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {sucesso ? (
          <div className="col-span-12 max-w-xl mx-auto text-center py-16 px-6 bg-brand-dark-2/50 border border-brand-green/30 rounded-3xl backdrop-blur-md shadow-glow-green animate-scale-up">
            <div className="h-16 w-16 bg-brand-green/20 border border-brand-green text-brand-green rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Solicitação Enviada!</h2>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Obrigado, <strong>{nome}</strong>! Sua solicitação de serviços foi registrada com sucesso em nossa base de dados.
            </p>
            <div className="p-4 bg-brand-dark rounded-2xl border border-brand-dark-5 mb-6 text-xs text-left space-y-2 text-gray-400">
              <p>📍 O escritório <strong>GCAC Despachante Bélico</strong> recebeu seu chamado de atendimento.</p>
              <p>💬 Estamos te redirecionando para o nosso **WhatsApp Comercial** para iniciar a conversa.</p>
            </div>
            <button 
              onClick={() => window.open(`https://wa.me/5564999959865`, '_blank')}
              className="bg-brand-green hover:bg-green-500 text-brand-dark font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Falar no WhatsApp Manualmente
            </button>
          </div>
        ) : (
          <>
            {/* Lado Esquerdo: Cards de Seleção de Serviços (Cols 1-7) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Solicitar Atendimento</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Selecione abaixo quais serviços de despachante você precisa. Você pode escolher mais de um.
                </p>
              </div>

              <div className="space-y-6">
                {CATEGORIAS_SERVICOS.map((categoria) => {
                  const IconeComponent = categoria.icone;
                  return (
                    <div key={categoria.id} className="bg-brand-dark-2/40 border border-brand-dark-5/50 rounded-2xl p-5 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-4 border-b border-brand-dark-5/50 pb-3">
                        <div className={`p-2 rounded-xl ${categoria.bg} ${categoria.cor}`}>
                          <IconeComponent size={20} />
                        </div>
                        <h2 className="font-bold text-base text-white">{categoria.titulo}</h2>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {categoria.servicos.map((servico) => {
                          const selecionado = servicosSelecionados.includes(servico.id);
                          return (
                            <label 
                              key={servico.id}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all ${
                                selecionado 
                                  ? 'bg-brand-dark-3 border-brand-green/40 text-white shadow-sm' 
                                  : 'bg-brand-dark/20 border-brand-dark-5/50 text-gray-400 hover:border-brand-dark-5 hover:text-gray-300'
                              }`}
                            >
                              <input 
                                type="checkbox"
                                checked={selecionado}
                                onChange={() => handleToggleServico(servico.id)}
                                className="hidden"
                              />
                              <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                selecionado ? 'bg-brand-green border-brand-green text-brand-dark' : 'border-brand-dark-5 bg-brand-dark-3'
                              }`}>
                                {selecionado && <Check size={14} strokeWidth={3} />}
                              </div>
                              <span className="leading-tight select-none">{servico.nome}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lado Direito: Formulário de Contato (Cols 8-12) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-brand-dark-2/60 border border-brand-dark-5/60 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" />
                  Seus Dados de Contato
                </h2>

                {erro && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-center">
                    <p className="text-xs text-red-400 font-semibold">{erro}</p>
                  </div>
                )}

                {servicosSelecionados.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-brand-dark-5 rounded-2xl bg-brand-dark-3/30">
                    <HelpCircle className="mx-auto text-gray-500 mb-2.5" size={28} />
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Aguardando Seleção</p>
                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                      Selecione um ou mais serviços de despachante na lista ao lado para desbloquear o preenchimento do formulário.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleEnviar} className="space-y-4">
                    {/* Resumo da seleção */}
                    <div className="p-3 bg-brand-dark-3/50 border border-brand-dark-5 rounded-xl text-[11px]">
                      <span className="text-gray-500 uppercase font-black tracking-wider block mb-1.5">
                        Serviço(s) selecionado(s) ({servicosSelecionados.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {obterNomesServicosSelecionados().map((nome, i) => (
                          <span key={i} className="bg-brand-green/10 border border-brand-green/20 text-brand-green px-2 py-0.5 rounded font-medium block truncate max-w-xs">
                            {nome}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">Nome Completo *</label>
                      <input 
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">CPF *</label>
                        <input 
                          type="text"
                          required
                          value={cpf}
                          onChange={(e) => aplicarMascaraCPF(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">WhatsApp *</label>
                        <input 
                          type="text"
                          required
                          value={whatsapp}
                          onChange={(e) => aplicarMascaraWhats(e.target.value)}
                          placeholder="(64) 99999-9999"
                          className="w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">E-mail *</label>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: joao@email.com"
                        className="w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1">Observações / Detalhes (Opcional)</label>
                      <textarea 
                        value={detalhes}
                        onChange={(e) => setDetalhes(e.target.value)}
                        placeholder="Ex: Gostaria de parcelar o valor / Quero registrar 2 pistolas / Outros detalhes."
                        rows={3}
                        className="w-full bg-brand-dark-3 border border-brand-dark-5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-blue resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={carregando}
                      className="w-full bg-brand-green hover:bg-green-500 disabled:opacity-50 text-brand-dark font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-glow-green flex items-center justify-center gap-2 mt-2"
                    >
                      {carregando ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Confirmar e Chamar no WhatsApp
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-brand-dark-5/50 text-center text-xs text-gray-500 relative z-10 bg-brand-dark-2/10">
        <p>GCAC Despachante Bélico © {new Date().getFullYear()} — Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
