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
  Bell,
  Shield,
  FileText,
  Users,
  Play,
  ArrowUpDown,
  Upload
} from 'lucide-react';
import { Notificacao, useNotificacao } from '../common/Notificacao';

interface ConfigItem {
  id: string;
  chave: string;
  valor: string;
  descricao: string;
  grupo: string;
}

// Mapeamento dinâmico de ícones Lucide para a visualização dos cards
const IconePreview = ({ nome, className = "text-brand-blue" }: { nome: string; className?: string }) => {
  const upper = nome.toUpperCase();
  if (upper.includes('BELL')) return <Bell className={className} size={18} />;
  if (upper.includes('SHIELD')) return <Shield className={className} size={18} />;
  if (upper.includes('FILE') || upper.includes('TEXT')) return <FileText className={className} size={18} />;
  if (upper.includes('USER')) return <Users className={className} size={18} />;
  return <Sparkles className={className} size={18} />;
};

const RenderVideoPlayer = ({ url }: { url: string }) => {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500 gap-1 py-8 bg-brand-dark-4 border border-brand-dark-5 rounded-lg aspect-video">
        <Video size={32} />
        <span className="text-[10px] uppercase font-bold tracking-wider">Nenhum vídeo configurado</span>
      </div>
    );
  }

  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');

  if (isYoutube) {
    // Converter URL normal do YouTube para URL de embed se necessário
    let embedUrl = url;
    if (url.includes('watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    return (
      <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-brand-dark-5 bg-black">
        <iframe
          src={embedUrl}
          title="Video Player"
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-brand-dark-5 bg-black flex items-center justify-center">
      <video
        src={url}
        controls
        preload="metadata"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export function EditorSitePortal() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null);
  const [abaSite, setAbaSite] = useState<'hero' | 'video' | 'recursos' | 'planos' | 'faq'>('hero');
  const { estado: notif, mostrar, fechar } = useNotificacao();
  const [enviandoVideo, setEnviandoVideo] = useState(false);

  // Estados locais para campos individuais (Hero e Vídeo)
  const [heroTitulo, setHeroTitulo] = useState('');
  const [heroSubtitulo, setHeroSubtitulo] = useState('');
  const [heroCtaTexto, setHeroCtaTexto] = useState('');
  
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [videoTitulo, setVideoTitulo] = useState('');
  const [videoDescricao, setVideoDescricao] = useState('');

  // Estados locais para JSONs estruturados (Rascunhos em tempo real)
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

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
      mostrar('erro', 'Por favor, selecione um arquivo de vídeo no formato MP4 (.mp4).');
      return;
    }

    setEnviandoVideo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `site-assets/video_institucional_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('documentos-clientes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('documentos-clientes')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      setHeroVideoUrl(publicUrl);
      
      await salvarCampoSimples('hero_video_url', publicUrl);
      
      mostrar('sucesso', 'Vídeo enviado e salvo com sucesso!');
    } catch (err: any) {
      console.error('Erro ao enviar vídeo:', err);
      mostrar('erro', err.message || 'Falha ao enviar o vídeo.');
    } finally {
      setEnviandoVideo(false);
    }
  };

  // Helper para obter valores salvos atualmente (do banco de dados)
  const getSalvo = (chave: string, fallback: string = '') => {
    const item = configs.find(c => c.chave === chave);
    return item ? item.valor : fallback;
  };

  const getSalvoJson = (chave: string) => {
    try {
      const raw = getSalvo(chave);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
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
            abaSite === 'hero' ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <Layout size={14} /> Banner Hero (Principal)
        </button>
        <button
          onClick={() => setAbaSite('video')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'video' ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <Video size={14} /> Vídeo Institucional
        </button>
        <button
          onClick={() => setAbaSite('recursos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'recursos' ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <Sliders size={14} /> Cards de Recursos
        </button>
        <button
          onClick={() => setAbaSite('planos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'planos' ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign size={14} /> Planos e Preços
        </button>
        <button
          onClick={() => setAbaSite('faq')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase ${
            abaSite === 'faq' ? 'bg-brand-blue text-white shadow-lg' : 'bg-brand-dark-4 text-gray-400 hover:text-white'
          }`}
        >
          <HelpCircle size={14} /> FAQs (Perguntas Frequentes)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO ESQUERDO: CONTROLES / FORMULÁRIO */}
        <div className="lg:col-span-5 space-y-6 bg-brand-dark-3/30 border border-brand-dark-5/80 p-5 rounded-2xl">
          
          {/* BANNER HERO FORM */}
          {abaSite === 'hero' && (
            <div className="space-y-5 animate-fade-in">
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

          {/* VÍDEO INSTITUCIONAL FORM */}
          {abaSite === 'video' && (
            <div className="space-y-5 animate-fade-in">
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

              <div className="space-y-4 p-4 bg-brand-dark-3/30 border border-brand-dark-5 rounded-xl">
                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-blue-light uppercase tracking-wide">Opção 1: Fazer Upload de Vídeo (.mp4)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-brand-dark-4 border border-brand-dark-5 p-3 rounded-lg">
                    <label className={`btn-secondary py-2 px-4 cursor-pointer inline-flex items-center gap-2 text-xs w-full sm:w-auto justify-center bg-brand-dark-3 hover:bg-brand-dark-5 border border-brand-dark-5 text-white rounded font-bold transition-all ${enviandoVideo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {enviandoVideo ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Escolher Vídeo .mp4
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/mp4"
                        className="hidden"
                        onChange={handleUploadVideo}
                        disabled={enviandoVideo}
                      />
                    </label>
                    <div className="flex-1 text-left">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Formato aceito: MP4 (.mp4)</p>
                      <p className="text-[9px] text-gray-500 leading-normal">
                        O vídeo será carregado no Supabase Storage e o link público gerado será salvo automaticamente como URL do vídeo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-brand-dark-5"></div>
                  <span className="flex-shrink mx-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">OU</span>
                  <div className="flex-grow border-t border-brand-dark-5"></div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-brand-blue-light uppercase tracking-wide">Opção 2: URL de Vídeo Externo (YouTube ou Link Direto)</label>
                  <input 
                    type="text"
                    value={heroVideoUrl}
                    onChange={e => setHeroVideoUrl(e.target.value)}
                    className="input w-full text-sm font-mono"
                    placeholder="Ex: https://www.youtube.com/embed/XXXXXX ou link direto mp4"
                    disabled={enviandoVideo}
                  />
                  <span className="text-[10px] text-gray-500 font-bold block pt-1 uppercase">
                    IMPORTANTE: Se usar YouTube, cole o link de incorporação (embed) para funcionamento correto.
                  </span>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => salvarCampoSimples('hero_video_url', heroVideoUrl)}
                      disabled={salvandoChave === 'hero_video_url' || enviandoVideo}
                      className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 font-bold"
                    >
                      {salvandoChave === 'hero_video_url' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Salvar Link do Vídeo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARDS DE RECURSOS FORM */}
          {abaSite === 'recursos' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-brand-dark-5">
                <p className="text-[10px] text-brand-blue font-black uppercase tracking-wider">Edição dos Cards de Recursos</p>
                <button
                  onClick={handleAddRecurso}
                  className="text-brand-blue-light hover:text-white text-xs flex items-center gap-1 font-bold uppercase"
                >
                  <Plus size={14} /> Adicionar Card
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {recursos.map((item, idx) => (
                  <div key={idx} className="bg-brand-dark-4 border border-brand-dark-5 p-4 rounded-xl relative space-y-3">
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

              <div className="pt-3 border-t border-brand-dark-5 flex justify-end">
                <button
                  onClick={() => salvarListaJson('recursos_json', recursos)}
                  disabled={salvandoChave === 'recursos_json'}
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider"
                >
                  {salvandoChave === 'recursos_json' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar Lista de Cards
                </button>
              </div>
            </div>
          )}

          {/* FAQS FORM */}
          {abaSite === 'faq' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-brand-dark-5">
                <p className="text-[10px] text-brand-blue font-black uppercase tracking-wider">Edição do FAQ</p>
                <button
                  onClick={handleAddFaq}
                  className="text-brand-blue-light hover:text-white text-xs flex items-center gap-1 font-bold uppercase"
                >
                  <Plus size={14} /> Adicionar Pergunta
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {faq.map((item, idx) => (
                  <div key={idx} className="bg-brand-dark-4 border border-brand-dark-5 p-4 rounded-xl relative space-y-3">
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

              <div className="pt-3 border-t border-brand-dark-5 flex justify-end">
                <button
                  onClick={() => salvarListaJson('faq_json', faq)}
                  disabled={salvandoChave === 'faq_json'}
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider"
                >
                  {salvandoChave === 'faq_json' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar Lista FAQ
                </button>
              </div>
            </div>
          )}

          {/* PLANOS E PREÇOS FORM */}
          {abaSite === 'planos' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-brand-dark-5">
                <p className="text-[10px] text-brand-blue font-black uppercase tracking-wider">Edição dos Planos</p>
                <button
                  onClick={handleAddPlano}
                  className="text-brand-blue-light hover:text-white text-xs flex items-center gap-1 font-bold uppercase"
                >
                  <Plus size={14} /> Adicionar Plano
                </button>
              </div>

              <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                {planos.map((item, idx) => (
                  <div key={idx} className="bg-brand-dark-4 border border-brand-dark-5 p-4 rounded-xl relative space-y-3">
                    <button
                      onClick={() => handleRemovePlano(idx)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remover Plano"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Nome do Plano</label>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={e => handleEditPlano(idx, 'nome', e.target.value)}
                        className="input w-full text-xs font-bold uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Preço</label>
                        <input
                          type="text"
                          value={item.preco}
                          onChange={e => handleEditPlano(idx, 'preco', e.target.value)}
                          className="input w-full text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase">Período</label>
                        <input
                          type="text"
                          value={item.periodo}
                          onChange={e => handleEditPlano(idx, 'periodo', e.target.value)}
                          className="input w-full text-xs"
                          placeholder="mês / ano / único"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Link do Botão (Checkout)</label>
                      <input
                        type="text"
                        value={item.cta_link}
                        onChange={e => handleEditPlano(idx, 'cta_link', e.target.value)}
                        className="input w-full text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id={`destaque-${idx}`}
                        checked={item.destaque}
                        onChange={e => handleEditPlano(idx, 'destaque', e.target.checked)}
                        className="rounded border-brand-dark-5 bg-brand-dark-3 text-brand-blue focus:ring-0 w-3.5 h-3.5"
                      />
                      <label htmlFor={`destaque-${idx}`} className="text-[10px] text-gray-300 font-bold uppercase cursor-pointer select-none">Destaque visual (Planos em Destaque)</label>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-brand-dark-5/50">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-brand-blue uppercase">Características</label>
                        <button
                          type="button"
                          onClick={() => handleAddPlanoCaracteristica(idx)}
                          className="text-brand-blue-light hover:text-white text-[10px] flex items-center gap-0.5 font-bold uppercase"
                        >
                          <Plus size={10} /> Adicionar
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {item.caracteristicas.map((char, charIdx) => (
                          <div key={charIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={char}
                              onChange={e => handleEditPlanoCaracteristica(idx, charIdx, e.target.value)}
                              className="input w-full text-xs py-0.5 px-2"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePlanoCaracteristica(idx, charIdx)}
                              className="text-gray-500 hover:text-red-400 p-0.5"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-brand-dark-5 flex justify-end">
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

        {/* LADO DIREITO: CARDS VISUAIS DE PREVIEW EM TEMPO REAL */}
        <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-4 bg-brand-dark-3/10 border border-dashed border-brand-dark-5 p-5 rounded-2xl">
          
          {/* PAINEL 1: COMO ESTÁ ATUALMENTE NO SITE (Salvo no Banco) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-brand-dark-5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Como está atualmente no site (Salvo)</h4>
            </div>

            {/* PREVIEW HERO SALVO */}
            {abaSite === 'hero' && (
              <div className="bg-brand-dark-2 border border-brand-dark-5 rounded-xl p-6 text-center space-y-3 relative overflow-hidden">
                <div className="absolute top-2 left-2 bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded text-[8px] font-bold">LIVE</div>
                <h1 className="text-sm font-black text-white uppercase tracking-tight leading-snug max-w-md mx-auto">
                  {getSalvo('hero_titulo', 'Sem Título')}
                </h1>
                <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                  {getSalvo('hero_subtitulo', 'Sem Descrição')}
                </p>
                <div className="pt-2">
                  <button className="bg-brand-blue text-white px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow shadow-brand-blue/30">
                    {getSalvo('hero_cta_texto', 'CTA')}
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW VÍDEO SALVO */}
            {abaSite === 'video' && (
              <div className="bg-brand-dark-2 border border-brand-dark-5 rounded-xl p-5 text-center space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-white uppercase">{getSalvo('video_titulo', 'Sem Título')}</h3>
                  <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed">{getSalvo('video_descricao', 'Sem Descrição')}</p>
                </div>
                <div className="max-w-sm mx-auto overflow-hidden">
                  <RenderVideoPlayer url={getSalvo('hero_video_url')} />
                  <span className="block text-[8px] font-mono text-gray-500 truncate mt-2 text-left">
                    {getSalvo('hero_video_url')}
                  </span>
                </div>
              </div>
            )}

            {/* PREVIEW RECURSOS SALVO */}
            {abaSite === 'recursos' && (
              <div className="bg-brand-dark-2 border border-brand-dark-5 rounded-xl p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {getSalvoJson('recursos_json').map((item: any, idx: number) => (
                    <div key={idx} className="bg-brand-dark-3/60 border border-brand-dark-5/50 p-3 rounded-lg flex items-start gap-2.5">
                      <div className="p-1.5 bg-brand-blue/10 border border-brand-blue/20 rounded-lg text-brand-blue">
                        <IconePreview nome={item.icone} />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-white uppercase leading-none">{item.titulo}</h4>
                        <p className="text-[9px] text-gray-400 mt-1 leading-normal">{item.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PREVIEW FAQ SALVO */}
            {abaSite === 'faq' && (
              <div className="bg-brand-dark-2 border border-brand-dark-5 rounded-xl p-4 space-y-2">
                {getSalvoJson('faq_json').map((item: any, idx: number) => (
                  <div key={idx} className="bg-brand-dark-3/40 border border-brand-dark-5/40 p-2.5 rounded-lg space-y-1">
                    <p className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                      <HelpCircle size={10} className="text-brand-blue" />
                      {item.pergunta}
                    </p>
                    <p className="text-[9px] text-gray-400 leading-normal pl-4">{item.resposta}</p>
                  </div>
                ))}
              </div>
            )}

            {/* PREVIEW PLANOS SALVO */}
            {abaSite === 'planos' && (
              <div className="bg-brand-dark-2 border border-brand-dark-5 rounded-xl p-5 space-y-3">
                <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
                  {getSalvoJson('planos_json').map((item: any, idx: number) => (
                    <div key={idx} className={`border rounded-xl p-4 min-w-[160px] flex-1 relative flex flex-col justify-between ${
                      item.destaque 
                        ? 'border-brand-blue bg-brand-blue/5 shadow shadow-brand-blue/10' 
                        : 'border-brand-dark-5 bg-brand-dark-3/50'
                    }`}>
                      {item.destaque && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow">Destaque</span>}
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">{item.nome}</h4>
                        <div className="text-center">
                          <span className="text-xs text-gray-500 font-bold">R$</span>
                          <span className="text-lg font-black text-white">{item.preco}</span>
                          <span className="text-[8px] text-gray-500 font-bold block">/{item.periodo}</span>
                        </div>
                        <ul className="space-y-1 pt-1 border-t border-brand-dark-5/40">
                          {item.caracteristicas?.map((char: string, c: number) => (
                            <li key={c} className="text-[8px] text-gray-400 flex items-center gap-1">
                              <span className="text-brand-blue">✓</span>
                              <span className="truncate" title={char}>{char}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-3">
                        <button className={`w-full py-1 rounded text-[8px] font-bold uppercase tracking-wider ${item.destaque ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-300 border border-brand-dark-5 hover:text-white'}`}>Selecionar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* PAINEL 2: COMO FICARÁ NO SITE (Edição em Tempo Real) */}
          <div className="space-y-2 pt-2 border-t border-brand-dark-5 border-dashed">
            <div className="flex items-center gap-2 pb-1 border-b border-brand-dark-5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-blue animate-pulse" />
              <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Como ficará no site (Rascunho)</h4>
            </div>

            {/* PREVIEW HERO RASCUNHO */}
            {abaSite === 'hero' && (
              <div className="bg-brand-dark-2 border border-brand-blue/30 rounded-xl p-6 text-center space-y-3 relative overflow-hidden bg-gradient-to-br from-brand-dark-2 to-brand-dark-3 shadow-lg shadow-brand-blue/5">
                <div className="absolute top-2 left-2 bg-brand-blue/20 text-brand-blue-light px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">Rascunho</div>
                <h1 className="text-sm font-black text-white uppercase tracking-tight leading-snug max-w-md mx-auto">
                  {heroTitulo || <span className="text-gray-600 italic">Digite o título...</span>}
                </h1>
                <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                  {heroSubtitulo || <span className="text-gray-600 italic">Digite o subtítulo...</span>}
                </p>
                <div className="pt-2">
                  <button className="bg-brand-blue text-white px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-md shadow-brand-blue/30 hover:scale-105 transition-all">
                    {heroCtaTexto || 'CTA'}
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW VÍDEO RASCUNHO */}
            {abaSite === 'video' && (
              <div className="bg-brand-dark-2 border border-brand-blue/30 rounded-xl p-5 text-center space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-white uppercase">{videoTitulo || <span className="text-gray-600 italic">Digite o título...</span>}</h3>
                  <p className="text-[10px] text-gray-400 max-w-md mx-auto leading-relaxed">{videoDescricao || <span className="text-gray-600 italic">Digite a descrição...</span>}</p>
                </div>
                <div className="max-w-sm mx-auto overflow-hidden">
                  <RenderVideoPlayer url={heroVideoUrl} />
                  <span className="block text-[8px] font-mono text-brand-blue-light truncate mt-2 font-bold text-left">
                    {heroVideoUrl || 'Nenhum link configurado'}
                  </span>
                </div>
              </div>
            )}

            {/* PREVIEW RECURSOS RASCUNHO */}
            {abaSite === 'recursos' && (
              <div className="bg-brand-dark-2 border border-brand-blue/30 rounded-xl p-5 space-y-3">
                {recursos.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-4 uppercase font-bold">Nenhum card cadastrado no rascunho.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {recursos.map((item, idx) => (
                      <div key={idx} className="bg-brand-dark-3 border border-brand-dark-5 p-3 rounded-lg flex items-start gap-2.5 hover:border-brand-blue/30 transition-colors">
                        <div className="p-1.5 bg-brand-blue/15 border border-brand-blue/30 rounded-lg text-brand-blue-light shadow-sm">
                          <IconePreview nome={item.icone} className="text-brand-blue-light" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[10px] font-bold text-white uppercase leading-none truncate">{item.titulo || <span className="text-gray-600 italic">Título...</span>}</h4>
                          <p className="text-[9px] text-gray-400 mt-1 leading-normal line-clamp-2">{item.descricao || <span className="text-gray-600 italic">Descrição...</span>}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PREVIEW FAQ RASCUNHO */}
            {abaSite === 'faq' && (
              <div className="bg-brand-dark-2 border border-brand-blue/30 rounded-xl p-4 space-y-2">
                {faq.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-4 uppercase font-bold">Nenhuma pergunta cadastrada no rascunho.</p>
                ) : (
                  faq.map((item, idx) => (
                    <div key={idx} className="bg-brand-dark-3 border border-brand-dark-5 p-2.5 rounded-lg space-y-1 hover:border-brand-blue/30 transition-colors">
                      <p className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                        <HelpCircle size={10} className="text-brand-blue-light" />
                        {item.pergunta || <span className="text-gray-600 italic">Escreva a pergunta...</span>}
                      </p>
                      <p className="text-[9px] text-gray-400 leading-normal pl-4">{item.resposta || <span className="text-gray-600 italic">Escreva a resposta...</span>}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PREVIEW PLANOS RASCUNHO */}
            {abaSite === 'planos' && (
              <div className="bg-brand-dark-2 border border-brand-blue/30 rounded-xl p-5 space-y-3">
                {planos.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-4 uppercase font-bold">Nenhum plano cadastrado no rascunho.</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
                    {planos.map((item, idx) => (
                      <div key={idx} className={`border rounded-xl p-4 min-w-[160px] flex-1 relative flex flex-col justify-between transition-all ${
                        item.destaque 
                          ? 'border-brand-blue bg-brand-blue/10 shadow-lg shadow-brand-blue/15 scale-102' 
                          : 'border-brand-dark-5 bg-brand-dark-3'
                      }`}>
                        {item.destaque && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-lg">Destaque</span>}
                        <div className="space-y-2">
                          <h4 className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center">{item.nome || <span className="text-gray-600 italic">Nome...</span>}</h4>
                          <div className="text-center">
                            <span className="text-xs text-brand-blue-light font-bold">R$</span>
                            <span className="text-lg font-black text-white">{item.preco || '0.00'}</span>
                            <span className="text-[8px] text-gray-500 font-bold block">/{item.periodo}</span>
                          </div>
                          <ul className="space-y-1 pt-1 border-t border-brand-dark-5/50">
                            {item.caracteristicas?.map((char: string, c: number) => (
                              <li key={c} className="text-[8px] text-gray-400 flex items-center gap-1">
                                <span className="text-brand-blue-light">✓</span>
                                <span className="truncate" title={char}>{char}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-3">
                          <button className={`w-full py-1 rounded text-[8px] font-bold uppercase tracking-wider shadow ${item.destaque ? 'bg-brand-blue text-white' : 'bg-brand-dark-4 text-gray-300 border border-brand-dark-5 hover:text-white'}`}>Selecionar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
