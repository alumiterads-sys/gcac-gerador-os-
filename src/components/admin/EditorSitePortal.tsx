import React, { useState, useEffect } from 'react';
import { supabase } from '../../db/supabase';
import { 
  Save, 
  HelpCircle, 
  Trash2, 
  Plus, 
  Video, 
  Sliders, 
  DollarSign, 
  Layout, 
  Check, 
  Loader2, 
  AlertCircle,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Notificacao, useNotificacao } from '../common/Notificacao';

interface ConfigItem {
  id: string;
  chave: string;
  valor: string;
  descricao: string;
  grupo: string;
}

export function EditorSitePortal() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null);
  const [abaSite, setAbaSite] = useState<'hero' | 'video' | 'recursos' | 'planos' | 'faq'>('hero');
  const { estado: notif, mostrar, fechar } = useNotificacao();

  // Estados locais para campos individuais (Hero e Vídeo)
  const [heroTitulo, setHeroTitulo] = useState('');
  const [heroSubtitulo, setHeroSubtitulo] = useState('');
  const [heroCtaTexto, setHeroCtaTexto] = useState('');
  
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [videoTitulo, setVideoTitulo] = useState('');
  const [videoDescricao, setVideoDescricao] = useState('');

  // Estados locais para JSONs estruturados
  const [recursos, setRecursos] = useState<Array<{ titulo: string; descricao: string; icone: string }>>([]);
  const [planos, setPlanos] = useState<Array<{ nome: string; preco: string; periodo: string; destaque: boolean; caracteristicas: string[]; cta_link: string }>>([]);
  const [faq, setFaq] = useState<Array<{ pergunta: string; resposta: string }>>([]);

  const carregarConfigs = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('conteudo_site')
        .select('*')
        .order('chave', { ascending: true });

      if (error) throw error;
      if (data) {
        setConfigs(data);
        
        // Mapear campos simples
        const map = new Map(data.map(item => [item.chave, item.valor]));
        setHeroTitulo(map.get('hero_titulo') || '');
        setHeroSubtitulo(map.get('hero_subtitulo') || '');
        setHeroCtaTexto(map.get('hero_cta_texto') || '');
        setHeroVideoUrl(map.get('hero_video_url') || '');
        setVideoTitulo(map.get('video_titulo') || '');
        setVideoDescricao(map.get('video_descricao') || '');

        // Mapear JSONs
        try {
          const recRaw = map.get('recursos_json');
          setRecursos(recRaw ? JSON.parse(recRaw) : []);
        } catch { setRecursos([]); }

        try {
          const planRaw = map.get('planos_json');
          setPlanos(planRaw ? JSON.parse(planRaw) : []);
        } catch { setPlanos([]); }

        try {
          const faqRaw = map.get('faq_json');
          setFaq(faqRaw ? JSON.parse(faqRaw) : []);
        } catch { setFaq([]); }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do site:', err);
      mostrar('erro', 'Erro ao carregar dados de configuração do site.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarConfigs();
  }, []);

  const salvarCampoSimples = async (chave: string, valor: string) => {
    setSalvandoChave(chave);
    try {
      const { error } = await supabase
        .from('conteudo_site')
        .update({ valor, atualizado_em: new Date().toISOString() })
        .eq('chave', chave);

      if (error) throw error;
      mostrar('sucesso', 'Configuração atualizada com sucesso!');
      await carregarConfigs();
    } catch (err: any) {
      console.error('Erro ao salvar configuração:', err);
      mostrar('erro', err.message || 'Erro ao atualizar.');
    } finally {
      setSalvandoChave(null);
    }
  };

  const salvarListaJson = async (chave: string, lista: any) => {
    setSalvandoChave(chave);
    try {
      const { error } = await supabase
        .from('conteudo_site')
        .update({ 
          valor: JSON.stringify(lista, null, 2), 
          atualizado_em: new Date().toISOString() 
        })
        .eq('chave', chave);

      if (error) throw error;
      mostrar('sucesso', 'Lista de conteúdo salva com sucesso!');
      await carregarConfigs();
    } catch (err: any) {
      console.error('Erro ao salvar lista JSON:', err);
      mostrar('erro', err.message || 'Erro ao salvar alterações.');
    } finally {
      setSalvandoChave(null);
    }
  };

  // Funções Auxiliares: Recursos
  const handleAddRecurso = () => {
    setRecursos([...recursos, { titulo: 'Novo Recurso', descricao: 'Descrição rápida do recurso.', icone: 'Shield' }]);
  };
  const handleRemoveRecurso = (idx: number) => {
    setRecursos(recursos.filter((_, i) => i !== idx));
  };
  const handleEditRecurso = (idx: number, campo: string, val: string) => {
    setRecursos(recursos.map((item, i) => i === idx ? { ...item, [campo]: val } : item));
  };

  // Funções Auxiliares: FAQ
  const handleAddFaq = () => {
    setFaq([...faq, { pergunta: 'Nova Pergunta?', resposta: 'Escreva a resposta aqui.' }]);
  };
  const handleRemoveFaq = (idx: number) => {
    setFaq(faq.filter((_, i) => i !== idx));
  };
  const handleEditFaq = (idx: number, campo: string, val: string) => {
    setFaq(faq.map((item, i) => i === idx ? { ...item, [campo]: val } : item));
  };

  // Funções Auxiliares: Planos
  const handleAddPlano = () => {
    setPlanos([...planos, { nome: 'Novo Plano', preco: '0.00', periodo: 'mês', destaque: false, caracteristicas: ['Nova característica'], cta_link: '#contato' }]);
  };
  const handleRemovePlano = (idx: number) => {
    setPlanos(planos.filter((_, i) => i !== idx));
  };
  const handleEditPlano = (idx: number, campo: string, val: any) => {
    setPlanos(planos.map((item, i) => i === idx ? { ...item, [campo]: val } : item));
  };
  const handleEditPlanoCaracteristica = (planoIdx: number, charIdx: number, val: string) => {
    setPlanos(planos.map((plano, i) => {
      if (i !== planoIdx) return plano;
      const novasChars = plano.caracteristicas.map((char, c) => c === charIdx ? val : char);
      return { ...plano, caracteristicas: novasChars };
    }));
  };
  const handleAddPlanoCaracteristica = (planoIdx: number) => {
    setPlanos(planos.map((plano, i) => {
      if (i !== planoIdx) return plano;
      return { ...plano, caracteristicas: [...plano.caracteristicas, 'Nova característica'] };
    }));
  };
  const handleRemovePlanoCaracteristica = (planoIdx: number, charIdx: number) => {
    setPlanos(planos.map((plano, i) => {
      if (i !== planoIdx) return plano;
      return { ...plano, caracteristicas: plano.caracteristicas.filter((_, c) => c !== charIdx) };
    }));
  };

  if (carregando && configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 size={32} className="animate-spin text-brand-blue" />
        <p className="text-xs text-gray-500 uppercase font-black">Carregando configurações do site...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Notificacao {...notif} onFechar={fechar} />

      {/* Menu Interno */}
      <div className="flex flex-wrap gap-2 border-b border-brand-dark-5 pb-3">
        <button
          onClick={() => setAbaSite('hero')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'hero' ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <Layout size={14} /> Banner Hero (Principal)
        </button>
        <button
          onClick={() => setAbaSite('video')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'video' ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <Video size={14} /> Vídeo Institucional
        </button>
        <button
          onClick={() => setAbaSite('recursos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'recursos' ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <Sliders size={14} /> Cards de Recursos
        </button>
        <button
          onClick={() => setAbaSite('planos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'planos' ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign size={14} /> Planos e Preços
        </button>
        <button
          onClick={() => setAbaSite('faq')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'faq' ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <HelpCircle size={14} /> FAQs (Perguntas Frequentes)
        </button>
      </div>

      {/* ABA: BANNER HERO */}
      {abaSite === 'hero' && (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Título Principal</label>
            <input 
              type="text"
              value={heroTitulo}
              onChange={e => setHeroTitulo(e.target.value)}
              className="input w-full font-bold text-sm"
              placeholder="Ex: Gestão Inteligente de Documentos"
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarCampoSimples('hero_titulo', heroTitulo)}
                disabled={salvandoChave === 'hero_titulo'}
                className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {salvandoChave === 'hero_titulo' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar Título
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Subtítulo / Descrição</label>
            <textarea
              value={heroSubtitulo}
              onChange={e => setHeroSubtitulo(e.target.value)}
              rows={4}
              className="input w-full text-sm resize-none"
              placeholder="Descreva o produto..."
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarCampoSimples('hero_subtitulo', heroSubtitulo)}
                disabled={salvandoChave === 'hero_subtitulo'}
                className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {salvandoChave === 'hero_subtitulo' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar Subtítulo
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Texto do Botão CTA (Chamada de Ação)</label>
            <input 
              type="text"
              value={heroCtaTexto}
              onChange={e => setHeroCtaTexto(e.target.value)}
              className="input w-full text-sm font-bold"
              placeholder="Ex: Testar Grátis"
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarCampoSimples('hero_cta_texto', heroCtaTexto)}
                disabled={salvandoChave === 'hero_cta_texto'}
                className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {salvandoChave === 'hero_cta_texto' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar Texto do Botão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA: VÍDEO INSTITUCIONAL */}
      {abaSite === 'video' && (
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Título da Seção de Vídeo</label>
            <input 
              type="text"
              value={videoTitulo}
              onChange={e => setVideoTitulo(e.target.value)}
              className="input w-full font-bold text-sm"
              placeholder="Ex: Assista à Demonstração"
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarCampoSimples('video_titulo', videoTitulo)}
                disabled={salvandoChave === 'video_titulo'}
                className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {salvandoChave === 'video_titulo' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar Título
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Descrição do Vídeo</label>
            <textarea
              value={videoDescricao}
              onChange={e => setVideoDescricao(e.target.value)}
              rows={3}
              className="input w-full text-sm resize-none"
              placeholder="Descreva o que o visitante aprenderá..."
            />
            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarCampoSimples('video_descricao', videoDescricao)}
                disabled={salvandoChave === 'video_descricao'}
                className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {salvandoChave === 'video_descricao' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar Descrição
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide">URL do Vídeo (Youtube Embed Link)</label>
            <input 
              type="text"
              value={heroVideoUrl}
              onChange={e => setHeroVideoUrl(e.target.value)}
              className="input w-full text-sm font-mono"
              placeholder="Ex: https://www.youtube.com/embed/XXXXXX"
            />
            <span className="text-[10px] text-gray-500 font-bold block pt-1 uppercase">IMPORTANTE: Cole o link de incorporação (embed), não o link normal do vídeo.</span>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarCampoSimples('hero_video_url', heroVideoUrl)}
                disabled={salvandoChave === 'hero_video_url'}
                className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
              >
                {salvandoChave === 'hero_video_url' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar Link do Vídeo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA: CARDS DE RECURSOS */}
      {abaSite === 'recursos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400 font-medium uppercase">Gerencie os recursos em destaque exibidos no site</p>
            <button
              onClick={handleAddRecurso}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
            >
              <Plus size={14} /> Adicionar Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recursos.map((item, idx) => (
              <div key={idx} className="bg-brand-dark-3 border border-brand-dark-5 p-4 rounded-2xl relative space-y-3">
                <button
                  onClick={() => handleRemoveRecurso(idx)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Título do Card</label>
                  <input
                    type="text"
                    value={item.titulo}
                    onChange={e => handleEditRecurso(idx, 'titulo', e.target.value)}
                    className="input w-full text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Ícone (Nome do Lucide Icon)</label>
                  <input
                    type="text"
                    value={item.icone}
                    onChange={e => handleEditRecurso(idx, 'icone', e.target.value)}
                    className="input w-full text-xs font-mono"
                    placeholder="Ex: Bell, Shield, FileText, Users"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Descrição do Recurso</label>
                  <textarea
                    value={item.descricao}
                    onChange={e => handleEditRecurso(idx, 'descricao', e.target.value)}
                    className="input w-full text-xs resize-none"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-dark-5">
            <button
              onClick={() => salvarListaJson('recursos_json', recursos)}
              disabled={salvandoChave === 'recursos_json'}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider"
            >
              {salvandoChave === 'recursos_json' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar Alterações de Cards
            </button>
          </div>
        </div>
      )}

      {/* ABA: DUVIDAS FREQUENTES */}
      {abaSite === 'faq' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400 font-medium uppercase">Configure as perguntas e respostas frequentes</p>
            <button
              onClick={handleAddFaq}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
            >
              <Plus size={14} /> Adicionar Pergunta
            </button>
          </div>

          <div className="space-y-4">
            {faq.map((item, idx) => (
              <div key={idx} className="bg-brand-dark-3 border border-brand-dark-5 p-4 rounded-2xl relative space-y-3">
                <button
                  onClick={() => handleRemoveFaq(idx)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Pergunta</label>
                  <input
                    type="text"
                    value={item.pergunta}
                    onChange={e => handleEditFaq(idx, 'pergunta', e.target.value)}
                    className="input w-full text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase">Resposta</label>
                  <textarea
                    value={item.resposta}
                    onChange={e => handleEditFaq(idx, 'resposta', e.target.value)}
                    className="input w-full text-xs resize-none"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-dark-5">
            <button
              onClick={() => salvarListaJson('faq_json', faq)}
              disabled={salvandoChave === 'faq_json'}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider"
            >
              {salvandoChave === 'faq_json' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar Alterações de FAQ
            </button>
          </div>
        </div>
      )}

      {/* ABA: PLANOS E PRECOS */}
      {abaSite === 'planos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400 font-medium uppercase">Gerencie os planos cadastrados e preços exibidos</p>
            <button
              onClick={handleAddPlano}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold"
            >
              <Plus size={14} /> Adicionar Plano
            </button>
          </div>

          <div className="space-y-6">
            {planos.map((item, idx) => (
              <div key={idx} className="bg-brand-dark-3 border border-brand-dark-5 p-5 rounded-2xl relative space-y-4">
                <button
                  onClick={() => handleRemovePlano(idx)}
                  className="absolute top-5 right-5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remover Plano"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Nome do Plano</label>
                    <input
                      type="text"
                      value={item.nome}
                      onChange={e => handleEditPlano(idx, 'nome', e.target.value)}
                      className="input w-full text-xs font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Preço (Ex: 19.90)</label>
                    <input
                      type="text"
                      value={item.preco}
                      onChange={e => handleEditPlano(idx, 'preco', e.target.value)}
                      className="input w-full text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Período de Cobrança</label>
                    <input
                      type="text"
                      value={item.periodo}
                      onChange={e => handleEditPlano(idx, 'periodo', e.target.value)}
                      className="input w-full text-xs"
                      placeholder="mês / ano / único"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Link de Checkout / Contato</label>
                    <input
                      type="text"
                      value={item.cta_link}
                      onChange={e => handleEditPlano(idx, 'cta_link', e.target.value)}
                      className="input w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`destaque-${idx}`}
                    checked={item.destaque}
                    onChange={e => handleEditPlano(idx, 'destaque', e.target.checked)}
                    className="rounded border-brand-dark-5 bg-brand-dark-4 text-brand-blue focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor={`destaque-${idx}`} className="text-xs text-gray-300 font-bold uppercase cursor-pointer select-none">Destaque visual do Plano (Mais Vendido)</label>
                </div>

                {/* Características do Plano */}
                <div className="space-y-2 pt-2 border-t border-brand-dark-5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-brand-blue uppercase tracking-wider">Características inclusas</label>
                    <button
                      type="button"
                      onClick={() => handleAddPlanoCaracteristica(idx)}
                      className="text-brand-blue-light hover:text-white text-xs flex items-center gap-1 font-bold"
                    >
                      <Plus size={12} /> Adicionar Recurso
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {item.caracteristicas.map((char, charIdx) => (
                      <div key={charIdx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={char}
                          onChange={e => handleEditPlanoCaracteristica(idx, charIdx, e.target.value)}
                          className="input w-full text-xs py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePlanoCaracteristica(idx, charIdx)}
                          className="text-gray-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-brand-dark-5">
            <button
              onClick={() => salvarListaJson('planos_json', planos)}
              disabled={salvandoChave === 'planos_json'}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider"
            >
              {salvandoChave === 'planos_json' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar Alterações de Planos
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
