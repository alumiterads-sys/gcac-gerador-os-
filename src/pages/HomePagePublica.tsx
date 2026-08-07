import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Smartphone, Award, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function HomePagePublica() {
  const navigate = useNavigate();
  const { estaAutenticado } = useAuth();

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col relative overflow-hidden">
      
      {/* Luzes de Fundo (Neon Glows) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-blue/10 blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-brand-green/5 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-blue/5 blur-[150px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-brand-dark-5/50 bg-brand-dark-2/40 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/usar no site/LOGO PORTAL SEM FRASE.png" 
              alt="Portal G CAC Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <span className="text-lg font-black tracking-wider text-white">PORTAL G CAC</span>
              <span className="block text-[9px] text-brand-green font-bold tracking-widest uppercase">Gestão & Documentos</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">O Aplicativo</button>
            <button onClick={() => navigate('/solicitar-servico')} className="hover:text-white transition-colors">Serviços de Despachante</button>
            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Preços</button>
          </nav>

          <div className="flex items-center gap-4">
            {estaAutenticado ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue-light border border-brand-blue/30 px-5 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md hover:shadow-glow-blue"
              >
                Acessar Painel
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="bg-white hover:bg-gray-100 text-brand-dark px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all shadow-md active:scale-95"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 max-w-7xl mx-auto w-full">
        
        {/* Banner Principal */}
        <div className="text-center max-w-3xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue-light text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles size={12} />
            Bem-vindo ao Portal G CAC
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 uppercase leading-none">
            A Solução Completa para o{' '}
            <span className="bg-gradient-to-r from-brand-blue-light to-brand-green bg-clip-text text-transparent">
              Mundo do Tiro
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl leading-relaxed">
            Unimos tecnologia inteligente para a gestão do seu acervo pessoal com o suporte de assessoria documental do despachante bélico mais rápido do mercado.
          </p>
        </div>

        {/* Pilares Lado a Lado (Split) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl items-stretch">
          
          {/* Pilar 1: O Aplicativo */}
          <div className="flex flex-col justify-between bg-brand-dark-2/40 border border-brand-dark-5/50 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl hover:border-brand-blue/30 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full pointer-events-none group-hover:bg-brand-blue/10 transition-colors" />
            
            <div>
              {/* Header do Card */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 p-2 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                  <img 
                    src="/usar no site/LOGO PORTAL SEM FRASE.png" 
                    alt="Logo App" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Aplicativo Portal G CAC</h2>
                  <p className="text-brand-blue-light font-bold text-xs uppercase tracking-wider">Sistema de Gestão Pessoal</p>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Gerencie seus documentos com controle offline-first. Ideal para atiradores que querem organizar seu próprio acervo e monitorar prazos de forma inteligente.
              </p>

              {/* Benefícios */}
              <ul className="space-y-3.5 mb-8">
                <li className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Smartphone className="text-brand-blue flex-shrink-0 mt-0.5" size={14} />
                  <span>Alertas automáticos de vencimento de CR, CRAF e GT no celular.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Shield className="text-brand-blue flex-shrink-0 mt-0.5" size={14} />
                  <span>Cadastro ilimitado de armas, guias e autorizações de manejo.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Award className="text-brand-blue flex-shrink-0 mt-0.5" size={14} />
                  <span>Ficha cadastral automática e exportação de dados para Excel e PDF.</span>
                </li>
              </ul>
            </div>

            {/* Ações */}
            <div className="space-y-3 mt-auto">
              <button 
                onClick={() => navigate('/cadastro')}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-glow-blue flex items-center justify-center gap-2"
              >
                Assinar Aplicativo / Cadastrar
                <ArrowRight size={14} />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-brand-dark-3/50 hover:bg-brand-dark-3 border border-brand-dark-5 hover:border-brand-blue/30 text-gray-300 hover:text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Já tenho conta (Entrar)
              </button>
            </div>
          </div>

          {/* Pilar 2: O Escritório de Despachante */}
          <div className="flex flex-col justify-between bg-brand-dark-2/40 border border-brand-dark-5/50 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl hover:border-brand-green/30 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-bl-full pointer-events-none group-hover:bg-brand-green/10 transition-colors" />

            <div>
              {/* Header do Card */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 p-2 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                  <img 
                    src="/usar no site/DESPACHANTE BÉLICO.png" 
                    alt="Logo Despachante" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">GCAC Despachante Bélico</h2>
                  <p className="text-brand-green font-bold text-xs uppercase tracking-wider">Assessoria Documental Completa</p>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Deixe a burocracia com a nossa equipe de especialistas. Realizamos o acompanhamento e entrada em processos junto ao Exército (SIGMA) e IBAMA.
              </p>

              {/* Benefícios */}
              <ul className="space-y-3.5 mb-8">
                <li className="flex items-start gap-2.5 text-xs text-gray-400">
                  <UserCheck className="text-brand-green flex-shrink-0 mt-0.5" size={14} />
                  <span>Emissão de CR de Atirador, Caçador, Colecionador e filiações.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Shield className="text-brand-green flex-shrink-0 mt-0.5" size={14} />
                  <span>Registro, renovação de CRAF, guias de tráfego (GT) e transferências.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-gray-400">
                  <Award className="text-brand-green flex-shrink-0 mt-0.5" size={14} />
                  <span>Documentação completa para IBAMA (manejo e acesso rural).</span>
                </li>
              </ul>
            </div>

            {/* Ação */}
            <div className="mt-auto">
              <button 
                onClick={() => navigate('/solicitar-servico')}
                className="w-full bg-brand-green hover:bg-green-500 text-brand-dark font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-glow-green flex items-center justify-center gap-2"
              >
                Solicitar Atendimento Online
                <ArrowRight size={14} />
              </button>
              <div className="text-center mt-3.5">
                <a 
                  href="https://wa.me/5564999959865"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-brand-green underline transition-colors"
                >
                  Falar no WhatsApp Comercial: (64) 9.9995-9865
                </a>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-brand-dark-5/50 text-center text-xs text-gray-500 relative z-10 bg-brand-dark-2/10">
        <p>Portal G CAC & GCAC Despachante Bélico © {new Date().getFullYear()} — Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
