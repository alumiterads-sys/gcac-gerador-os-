-- ==========================================================
-- MIGRAÇÃO: CRIAÇÃO DA TABELA CONTEUDO_SITE (CMS)
-- ==========================================================
-- Cria a tabela para armazenar as configurações dinâmicas da landing page do site.

CREATE TABLE IF NOT EXISTS public.conteudo_site (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao VARCHAR(255),
    grupo VARCHAR(50) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Desativar RLS para permitir leitura pública da Landing Page e escrita controlada pelo App
ALTER TABLE public.conteudo_site DISABLE ROW LEVEL SECURITY;

-- SEED DE DADOS INICIAIS
INSERT INTO public.conteudo_site (chave, valor, descricao, grupo) VALUES
('hero_titulo', 'Gestão Inteligente de Documentos para Atiradores e Despachantes', 'Título principal do banner superior', 'hero'),
('hero_subtitulo', 'Controle seus prazos de CR, CRAF, GT, laudos e manejos do Ibama com alertas automáticos e relatórios completos na palma da sua mão.', 'Subtítulo do banner superior', 'hero'),
('hero_cta_texto', 'Experimentar Grátis', 'Texto do botão de chamada principal', 'hero'),
('hero_video_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Link do vídeo de demonstração do Youtube', 'video'),
('video_titulo', 'Conheça o Portal G CAC por dentro', 'Título da seção do vídeo', 'video'),
('video_descricao', 'Assista ao vídeo e veja como a nossa plataforma pode simplificar o seu dia a dia controlando os vencimentos dos seus documentos de forma totalmente automatizada.', 'Descrição da seção do vídeo', 'video'),
('recursos_json', '[
  {"titulo": "Alertas no Celular", "descricao": "Receba notificações diretas sobre prazos de vencimento de CR, CRAF e GT.", "icone": "Bell"},
  {"titulo": "Acervo Ilimitado", "descricao": "Cadastre todas as suas armas, guias e autorizações de manejo sem qualquer limite de armazenamento.", "icone": "Shield"},
  {"titulo": "Relatórios e Exportações", "descricao": "Exporte seu acervo e ficha cadastral para formatos Excel e PDF com apenas um clique.", "icone": "FileText"},
  {"titulo": "Integração Despachante", "descricao": "Vincule-se ao seu despachante parceiro para que eles auxiliem a monitorar seus prazos.", "icone": "Users"}
]', 'Lista de recursos exibidos em formato de cards', 'recursos'),
('planos_json', '[
  {"nome": "CAC INDIVIDUAL", "preco": "19.90", "periodo": "mês", "destaque": false, "caracteristicas": ["Acervo de armas ilimitado", "Controle de vencimentos automático", "Notificações na tela do celular", "Ficha técnica e exportação PDF"], "cta_link": "#cadastro"},
  {"nome": "DESPACHANTE B2B", "preco": "149.90", "periodo": "mês", "destaque": true, "caracteristicas": ["Painel de controle para múltiplos clientes", "Gestão de ordens de serviço e taxas", "Faturamento e controle financeiro integrado", "Envio de convites automáticos para atiradores"], "cta_link": "mailto:comercial@portalgcac.com.br"}
]', 'Configurações dos planos e tabelas de preços', 'planos'),
('faq_json', '[
  {"pergunta": "Como funcionam os alertas de vencimento?", "resposta": "O sistema monitora as datas de vencimento cadastradas e envia alertas na plataforma e no seu dispositivo em intervalos regulares antes do vencimento."},
  {"pergunta": "O Portal G CAC é seguro?", "resposta": "Sim. Todos os dados são armazenados na nuvem de forma criptografada e você tem controle total de quem pode acessar seus documentos."},
  {"pergunta": "Posso vincular meu despachante?", "resposta": "Sim. Você pode vincular opcionalmente sua conta ao seu despachante parceiro para que ele o ajude a gerenciar seus documentos e processos."}
]', 'Perguntas frequentes da landing page', 'faq')
ON CONFLICT (chave) DO NOTHING;
